begin;
set local lock_timeout = '3s';

alter table public.sets
  add column effort numeric,
  add constraint sets_effort_range check (effort is null or effort between 0 and 10);

-- The executor is a security-definer function. Keep its existing token, scope,
-- rate-limit and owner checks, changing only the three read projections below.
do $migration$
declare
  definition text;
  before_branch text;
  after_branch text;
  old_actual text;
  new_actual text;
begin
  definition := pg_get_functiondef('public.gym_agent_execute(text,jsonb,uuid,text)'::regprocedure);
  before_branch := $old$
 elsif op='exercise_history' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (
   select w.id,w.name,w.status,w.created_at,w.finished_at,
    (select count(*) from public.sets s where s.workout_id=w.id and s.userid=uid and s.is_finished) as completed_sets,
    (select coalesce(sum(s.weight*s.reps),0) from public.sets s where s.workout_id=w.id and s.userid=uid and s.is_finished) as completed_volume,
    (select max(s.weight) from public.sets s where s.workout_id=w.id and s.userid=uid and s.is_finished) as max_confirmed_weight
   from public.workouts w where w.userid=uid and w.status in ('active','finished') and w.id>coalesce((a->>'after')::bigint,0)
    and exists(select 1 from public.workout_items wi where wi.workout=w.id and wi.exerciseid=(a->>'exercise_id')::bigint)
   order by w.id limit lim) x;
$old$;
  -- The older branch was split from list_workouts in the chronology migration.
  if position(before_branch in definition) = 0 then
    before_branch := $old$
 elsif op='exercise_history' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (
   select w.id,w.name,w.status,w.created_at,w.finished_at,
    (select count(*) from public.sets s where s.workout_id=w.id and s.userid=uid and s.is_finished) as completed_sets,
    (select coalesce(sum(s.weight*s.reps),0) from public.sets s where s.workout_id=w.id and s.userid=uid and s.is_finished) as completed_volume,
    (select max(s.weight) from public.sets s where s.workout_id=w.id and s.userid=uid and s.is_finished) as max_confirmed_weight
   from public.workouts w where w.userid=uid and w.status in ('active','finished') and w.id>coalesce((a->>'after')::bigint,0)
    and (op<>'exercise_history' or exists(select 1 from public.workout_items wi where wi.workout=w.id and wi.exerciseid=(a->>'exercise_id')::bigint))
   order by w.id limit lim) x;
$old$;
  end if;
  if position(before_branch in definition) = 0 then
    raise exception 'Expected exercise_history branch is missing';
  end if;
  after_branch := $new$
 elsif op='exercise_history' then
  if a ? 'after' and not exists (
    select 1 from public.workout_items cursor_item
    join public.workouts cursor_workout on cursor_workout.id=cursor_item.workout
    where cursor_item.id=(a->>'after')::bigint
      and cursor_item.exerciseid=(a->>'exercise_id')::bigint
      and cursor_workout.userid=uid and cursor_workout.status in ('active','finished')
      and exists(select 1 from public.sets cursor_set where cursor_set.workout_item_id=cursor_item.id and cursor_set.userid=uid and cursor_set.is_finished)
  ) then raise exception 'invalid_cursor' using errcode='PT400'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.started_at desc nulls last,x.workout_item_id desc),'[]') into result from (
    select wi.id as workout_item_id,w.id as workout_id,wi.exerciseid as exercise_id,
      w.name as workout_name,w.status as workout_status,w.created_at as started_at,w.finished_at,
      (select coalesce(jsonb_agg(jsonb_build_object(
        'id',s.id,'position',s.position,'type',s.type,'finished_at',s.finished_at,
        'weight',s.weight,'reps',s.reps,'speed',s.speed,'distance',s.distance,'effort',s.effort,
        'target',jsonb_build_object('weight',s.target_weight,'reps',s.target_reps)
      ) order by s.position nulls last,s.id),'[]')
       from public.sets s where s.workout_item_id=wi.id and s.userid=uid and s.is_finished) as sets
    from public.workout_items wi
    join public.workouts w on w.id=wi.workout
    where w.userid=uid and w.status in ('active','finished')
      and wi.exerciseid=(a->>'exercise_id')::bigint
      and exists(select 1 from public.sets s where s.workout_item_id=wi.id and s.userid=uid and s.is_finished)
      and (not(a ? 'after') or
        (coalesce(w.created_at,'-infinity'::timestamptz),wi.id) < (
          select coalesce(cw.created_at,'-infinity'::timestamptz),ci.id
          from public.workout_items ci join public.workouts cw on cw.id=ci.workout
          where ci.id=(a->>'after')::bigint
        ))
    order by w.created_at desc nulls last,wi.id desc limit lim
  ) x;
$new$;
  definition := replace(definition,before_branch,after_branch);

  old_actual := '''speed'',speed,''distance'',distance)';
  new_actual := '''speed'',speed,''distance'',distance,''effort'',effort)';
  if position(old_actual in definition) = 0 then raise exception 'Expected get_workout_sets projection is missing'; end if;
  definition := replace(definition,old_actual,new_actual);
  old_actual := '''speed'',s.speed,''distance'',s.distance)';
  new_actual := '''speed'',s.speed,''distance'',s.distance,''effort'',s.effort)';
  if position(old_actual in definition) = 0 then raise exception 'Expected workout projections are missing'; end if;
  definition := replace(definition,old_actual,new_actual);
  old_actual := '''weight'',s.weight,''reps'',s.reps) else null end) order by ps.item_position';
  new_actual := '''weight'',s.weight,''reps'',s.reps,''effort'',s.effort) else null end) order by ps.item_position';
  if position(old_actual in definition) = 0 then raise exception 'Expected planned set projection is missing'; end if;
  definition := replace(definition,old_actual,new_actual);

  execute definition;
end;
$migration$;

notify pgrst, 'reload schema';
commit;
