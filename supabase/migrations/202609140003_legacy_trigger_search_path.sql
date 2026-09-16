-- Legacy Kyx triggers use unqualified table names. They inherit the RPC's
-- search_path when a plan creates workouts and sets. Keep public usable while
-- preventing API roles from placing shadow objects in that trusted schema.
begin;
revoke create on schema public from public, anon, authenticated;
alter function public.gym_agent_execute(text,jsonb,uuid,text) set search_path = public, pg_temp;
commit;
