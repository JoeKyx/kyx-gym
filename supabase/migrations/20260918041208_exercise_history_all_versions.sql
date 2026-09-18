begin;
set local lock_timeout = '3s';

-- A current search result identifies the whole chain of immutable exercise
-- versions. Each step remains constrained to public or caller-owned exercises.
create function public.gym_exercise_family(root_id bigint, owner_id uuid)
returns table(exercise_id bigint)
language sql stable set search_path = '' as $$
  with recursive family(exercise_id) as (
    select e.id from public.exercises e
      where e.id = root_id and (e.public or e.userid = owner_id)
    union
    select next_exercise.id
      from family f
      join public.gym_exercise_versions v
        on v.old_id = f.exercise_id or v.new_id = f.exercise_id
      join public.exercises next_exercise
        on next_exercise.id = case when v.old_id = f.exercise_id then v.new_id else v.old_id end
      where next_exercise.public or next_exercise.userid = owner_id
  )
  select exercise_id from family;
$$;
revoke all on function public.gym_exercise_family(bigint,uuid) from public,anon,authenticated;
grant execute on function public.gym_exercise_family(bigint,uuid) to service_role;

-- Preserve the existing token, rate limit, scope and ownership checks.
do $migration$
declare
  definition text;
  start_marker text := E'\n elsif op=''exercise_history'' then';
  end_marker text := E'\n elsif op=''get_workout'' then';
  branch_start integer;
  branch_end integer;
  old_branch text;
  new_branch text;
  old_search text;
  new_search text;
begin
  definition := pg_get_functiondef('public.gym_agent_execute(text,jsonb,uuid,text)'::regprocedure);
  branch_start := position(start_marker in definition);
  if branch_start = 0 then raise exception 'Expected exercise_history branch is missing'; end if;
  branch_end := position(end_marker in substring(definition from branch_start + length(start_marker)));
  if branch_end = 0 then raise exception 'Expected get_workout branch is missing'; end if;
  branch_end := branch_start + length(start_marker) + branch_end - 1;
  old_branch := substring(definition from branch_start for branch_end - branch_start);
  if position('limit lim' in old_branch) = 0 or position('wi.exerciseid=(a->>''exercise_id'')::bigint' in old_branch) = 0 then
    raise exception 'Unexpected exercise_history implementation';
  end if;
  new_branch := $branch$
 elsif op='exercise_history' then
  if a ? 'after' and not exists (
    select 1 from public.workout_items cursor_item
    join public.workouts cursor_workout on cursor_workout.id=cursor_item.workout
    where cursor_item.id=(a->>'after')::bigint
      and cursor_item.exerciseid in (select exercise_id from public.gym_exercise_family((a->>'exercise_id')::bigint,uid))
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
      and wi.exerciseid in (select exercise_id from public.gym_exercise_family((a->>'exercise_id')::bigint,uid))
      and exists(select 1 from public.sets s where s.workout_item_id=wi.id and s.userid=uid and s.is_finished)
      and (not(a ? 'after') or
        (coalesce(w.created_at,'-infinity'::timestamptz),wi.id) < (
          select coalesce(cw.created_at,'-infinity'::timestamptz),ci.id
          from public.workout_items ci join public.workouts cw on cw.id=ci.workout
          where ci.id=(a->>'after')::bigint
        ))
    order by w.created_at desc nulls last,wi.id desc
    limit case when a ? 'limit' then lim else null end
  ) x;
$branch$;
  execute substring(definition from 1 for branch_start - 1) || new_branch || substring(definition from branch_end);
  definition := pg_get_functiondef('public.gym_agent_execute(text,jsonb,uuid,text)'::regprocedure);
  old_search := $old$
 elsif op='search_exercises' then
  select coalesce(jsonb_agg(to_jsonb(x)-'userid'),'[]') into result from
   (select e.* from public.exercises e where (e.public or e.userid=uid)
    and e.id>coalesce((a->>'after')::bigint,0) and position(lower(coalesce(a->>'query','')) in lower(e.name))>0
    and not exists(select 1 from public.gym_exercise_versions v where v.old_id=e.id) order by e.id limit lim) x;
$old$;
  new_search := $new$
 elsif op='search_exercises' then
  select coalesce(jsonb_agg(to_jsonb(x)-'userid'),'[]') into result from
   (select e.* from public.exercises e where (e.public or e.userid=uid)
    and e.id>coalesce((a->>'after')::bigint,0)
    and (position(lower(coalesce(a->>'query','')) in lower(e.name))>0
      or exists (
        select 1 from public.gym_exercise_family(e.id,uid) f
        join public.exercises historical on historical.id=f.exercise_id
        where historical.id<>e.id
          and position(lower(coalesce(a->>'query','')) in lower(historical.name))>0
      ))
    and not exists(select 1 from public.gym_exercise_versions v where v.old_id=e.id) order by e.id limit lim) x;
$new$;
  if position(old_search in definition)=0 then raise exception 'Expected search_exercises branch is missing'; end if;
  execute replace(definition,old_search,new_search);
end;
$migration$;

notify pgrst, 'reload schema';
commit;
