-- Keep the numeric cursor and response shape; resolve its chronological position
-- only within the caller's own readable workouts. Do not change exercise_history.
begin;
set local lock_timeout='3s';
do $migration$
declare definition text;
 old_branch text := ' elsif op in (''list_workouts'',''exercise_history'') then';
 new_branch text := $branch$
 elsif op='list_workouts' then
  if a ? 'from' and a ? 'to' and (a->>'from')::timestamptz >= (a->>'to')::timestamptz then
   raise exception 'invalid_date_range' using errcode='PT400';
  end if;
  if a ? 'after' and not exists (
   select 1 from public.workouts w where w.id=(a->>'after')::bigint
    and w.userid=uid and w.status in ('active','finished')
  ) then raise exception 'invalid_cursor' using errcode='PT400'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc nulls last,x.id desc),'[]') into result from (
   select w.id,w.name,w.status,w.created_at,w.finished_at,
    (select count(*) from public.sets s where s.workout_id=w.id and s.userid=uid and s.is_finished) as completed_sets,
    (select coalesce(sum(s.weight*s.reps),0) from public.sets s where s.workout_id=w.id and s.userid=uid and s.is_finished) as completed_volume,
    (select max(s.weight) from public.sets s where s.workout_id=w.id and s.userid=uid and s.is_finished) as max_confirmed_weight
   from public.workouts w where w.userid=uid and w.status in ('active','finished')
    and (not(a ? 'from') or w.created_at >= (a->>'from')::timestamptz)
    and (not(a ? 'to') or w.created_at < (a->>'to')::timestamptz)
    and (not(a ? 'after') or
     (coalesce(w.created_at,'-infinity'::timestamptz),w.id) < (
      select coalesce(c.created_at,'-infinity'::timestamptz),c.id from public.workouts c
       where c.id=(a->>'after')::bigint and c.userid=uid and c.status in ('active','finished')
     ))
   order by w.created_at desc nulls last,w.id desc limit lim) x;
 elsif op='exercise_history' then$branch$;
begin
 definition:=pg_get_functiondef('public.gym_agent_execute(text,jsonb,uuid,text)'::regprocedure);
 if position(old_branch in definition)=0 then
  raise exception 'Expected original workout listing branch is missing';
 end if;
 execute replace(definition,old_branch,new_branch);
end;
$migration$;
notify pgrst, 'reload schema';
commit;
