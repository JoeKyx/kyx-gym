-- Business conflicts are not transient serialization failures. PostgREST may
-- retry SQLSTATE 40001 indefinitely; PT409 is an explicit HTTP 409 response.
begin;
do $migration$
declare definition text;
begin
 definition:=pg_get_functiondef('public.gym_agent_execute(text,jsonb,uuid,text)'::regprocedure);
 if position('errcode=''40001''' in definition)=0 then
  raise exception 'Expected agent conflict branches are missing';
 end if;
 execute replace(definition,'errcode=''40001''','errcode=''PT409''');
end;
$migration$;
notify pgrst, 'reload schema';
commit;
