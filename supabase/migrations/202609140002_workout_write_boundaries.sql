-- Add restrictive ownership rules without replacing existing social read policies.
-- Refuse installation when the existing baseline is not protected by RLS.
begin;
do $$ declare t text; begin
 foreach t in array array['workouts','workout_items','sets','exercises'] loop
  if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=t and c.relrowsecurity) then
   raise exception 'RLS baseline missing on %. Audit existing policies before installing.',t;
  end if;
 end loop;
end $$;
create policy gym_workouts_insert_owner on public.workouts as restrictive for insert to authenticated with check (userid=(select auth.uid()));
create policy gym_workouts_update_owner on public.workouts as restrictive for update to authenticated using(userid=(select auth.uid())) with check(userid=(select auth.uid()));
create policy gym_workouts_delete_owner on public.workouts as restrictive for delete to authenticated using(userid=(select auth.uid()));
create policy gym_items_insert_owner on public.workout_items as restrictive for insert to authenticated with check(
 exists(select 1 from public.workouts w where w.id=workout and w.userid=(select auth.uid()) and w.status='active') and
 exists(select 1 from public.exercises e where e.id=exerciseid and (e.public or e.userid=(select auth.uid())))
);
create policy gym_items_update_owner on public.workout_items as restrictive for update to authenticated using(
 exists(select 1 from public.workouts w where w.id=workout and w.userid=(select auth.uid()) and w.status='active')
) with check(
 exists(select 1 from public.workouts w where w.id=workout and w.userid=(select auth.uid()) and w.status='active') and
 exists(select 1 from public.exercises e where e.id=exerciseid and (e.public or e.userid=(select auth.uid())))
);
create policy gym_items_delete_owner on public.workout_items as restrictive for delete to authenticated using(
 exists(select 1 from public.workouts w where w.id=workout and w.userid=(select auth.uid()))
);
create policy gym_sets_insert_owner on public.sets as restrictive for insert to authenticated with check(
 userid=(select auth.uid()) and exists(select 1 from public.workouts w join public.workout_items wi on wi.workout=w.id where w.id=workout_id and wi.id=workout_item_id and w.userid=(select auth.uid()) and w.status='active')
);
create policy gym_sets_update_owner on public.sets as restrictive for update to authenticated using(
 userid=(select auth.uid()) and exists(select 1 from public.workouts w where w.id=workout_id and w.userid=(select auth.uid()) and w.status='active')
) with check(
 userid=(select auth.uid()) and exists(select 1 from public.workouts w join public.workout_items wi on wi.workout=w.id where w.id=workout_id and wi.id=workout_item_id and w.userid=(select auth.uid()) and w.status='active')
);
create policy gym_sets_delete_owner on public.sets as restrictive for delete to authenticated using(
 userid=(select auth.uid()) and exists(select 1 from public.workouts w where w.id=workout_id and w.userid=(select auth.uid()))
);
create policy gym_exercises_insert_private on public.exercises as restrictive for insert to authenticated with check(userid=(select auth.uid()) and not public);
create policy gym_exercises_update_private on public.exercises as restrictive for update to authenticated using(userid=(select auth.uid()) and not public) with check(userid=(select auth.uid()) and not public);
create policy gym_exercises_delete_private on public.exercises as restrictive for delete to authenticated using(userid=(select auth.uid()) and not public);
-- This legacy relation had no RLS. Keep readable public/own metadata,
-- but only allow owners to alter private exercises not used in workouts.
alter table public.exercisemuscles enable row level security;
create policy gym_muscles_read on public.exercisemuscles for select to anon,authenticated using(exists(select 1 from public.exercises e where e.id=exerciseid and (e.public or e.userid=(select auth.uid()))));
create policy gym_muscles_write on public.exercisemuscles for all to authenticated using(exists(select 1 from public.exercises e where e.id=exerciseid and e.userid=(select auth.uid()) and not e.public) and not exists(select 1 from public.workout_items wi where wi.exerciseid=exercisemuscles.exerciseid)) with check(exists(select 1 from public.exercises e where e.id=exerciseid and e.userid=(select auth.uid()) and not e.public) and not exists(select 1 from public.workout_items wi where wi.exerciseid=exercisemuscles.exerciseid));
commit;
