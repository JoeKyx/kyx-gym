-- Apply only after comparing production schema/trigger behavior with the repository snapshot.
begin;
create table public.gym_agent_clients (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 120),
 redirect_uris jsonb not null, created_at timestamptz not null default now()
);
create table public.gym_agent_grants (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 client_id uuid not null references public.gym_agent_clients(id), scopes text[] not null,
 revoked_at timestamptz, created_at timestamptz not null default now(),
 check(scopes <@ array['training.read','plans.write','exercises.write']::text[])
);
create table public.gym_agent_codes (
 hash text primary key, grant_id uuid not null references public.gym_agent_grants(id),
 challenge text not null, redirect_uri text not null, resource text not null,
 expires_at timestamptz not null default now() + interval '5 minutes'
);
create table public.gym_agent_tokens (
 hash text primary key, refresh_hash text unique not null,
 grant_id uuid not null references public.gym_agent_grants(id), resource text not null,
 expires_at timestamptz not null default now() + interval '1 hour',
 refresh_expires_at timestamptz not null default now() + interval '30 days', rotated_at timestamptz
);
create table public.gym_plans (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 definition jsonb not null, revision integer not null default 1 check(revision > 0),
 workout_id bigint unique references public.workouts(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index gym_plans_owner on public.gym_plans(user_id,id);
create table public.gym_plan_sets (
 plan_id uuid not null references public.gym_plans(id), set_id bigint not null unique,
 item_position integer not null, set_position integer not null, exercise_snapshot jsonb not null,
 target_weight numeric not null, target_reps integer not null,
 primary key(plan_id,item_position,set_position)
);
create table public.gym_training_context (
 user_id uuid primary key references auth.users(id), definition jsonb not null, revision integer not null default 1
);
create table public.gym_workout_feedback (
 workout_id bigint primary key references public.workouts(id), user_id uuid not null references auth.users(id),
 difficulty integer check(difficulty between 1 and 10), note text not null check(length(note)<=2000), revision integer not null default 1
);
create table public.gym_exercise_versions (
 old_id bigint primary key references public.exercises(id), new_id bigint unique not null references public.exercises(id)
);
create table public.gym_agent_rate_limits (bucket text primary key, started_at timestamptz not null default now(), count integer not null default 1);
create table public.gym_agent_requests (
 user_id uuid not null, actor text not null, request_id uuid not null, operation text not null,
 payload jsonb not null, result jsonb not null, primary key(user_id,actor,request_id)
);
-- No direct API access: authentication and mutations go through service-only RPCs.
do $$ declare t text; begin
 foreach t in array array['gym_agent_clients','gym_agent_grants','gym_agent_codes','gym_agent_tokens','gym_plans','gym_plan_sets','gym_training_context','gym_workout_feedback','gym_exercise_versions','gym_agent_requests','gym_agent_rate_limits'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public, anon, authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;

alter table public.sets add column target_weight numeric, add column target_reps integer;
-- Targets can only be set when inserting a planned set; they never change afterward.
create function public.gym_guard_targets() returns trigger language plpgsql set search_path='' as $$
begin
 if new.target_weight is distinct from old.target_weight or new.target_reps is distinct from old.target_reps then
  raise exception 'Immutable targets' using errcode='42501';
 end if;
 return new;
end $$;
create trigger gym_guard_targets before update on public.sets for each row execute function public.gym_guard_targets();
-- Preserve semantics of exercise IDs already used in workouts. Agent edits always copy.
create function public.gym_guard_exercise_history() returns trigger language plpgsql set search_path='' as $$
begin
 if (new.name,new.type,new.description,new.howto,new.categoryid,new.public,new.userid) is distinct from
    (old.name,old.type,old.description,old.howto,old.categoryid,old.public,old.userid)
 and exists(select 1 from public.workout_items where exerciseid=old.id) then
  raise exception 'Referenced exercise is immutable; create a new version' using errcode='42501';
 end if;
 return new;
end $$;
create trigger gym_guard_exercise_history before update on public.exercises for each row execute function public.gym_guard_exercise_history();

-- Only the trusted Next.js backend can call this; never grant to authenticated/anon.
create function public.gym_oauth(op text, a jsonb, owner_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.gym_agent_clients; g public.gym_agent_grants; code public.gym_agent_codes;
 tok public.gym_agent_tokens; result jsonb;
begin
 if op='register' then
  insert into public.gym_agent_rate_limits(bucket) values('registration') on conflict(bucket) do update set count=case when gym_agent_rate_limits.started_at<now()-interval '1 minute' then 1 else gym_agent_rate_limits.count+1 end,started_at=case when gym_agent_rate_limits.started_at<now()-interval '1 minute' then now() else gym_agent_rate_limits.started_at end;
  if (select count from public.gym_agent_rate_limits where bucket='registration')>30 then raise exception 'rate_limited' using errcode='P0001'; end if;
  insert into public.gym_agent_clients(name,redirect_uris) values(a->>'name',a->'redirect_uris') returning * into c;
  return jsonb_build_object('client_id',c.id);
 elsif op='client' then
  select * into strict c from public.gym_agent_clients where id=(a->>'client_id')::uuid;
  if not(c.redirect_uris ? (a->>'redirect_uri')) then raise exception 'invalid_redirect_uri'; end if;
  return jsonb_build_object('name',c.name,'id',c.id);
 elsif op='authorize' then
  if owner_id is null then raise exception 'unauthorized'; end if;
  select * into strict c from public.gym_agent_clients where id=(a->>'client_id')::uuid;
  if not(c.redirect_uris ? (a->>'redirect_uri')) then raise exception 'invalid_redirect_uri'; end if;
  insert into public.gym_agent_grants(user_id,client_id,scopes) values(owner_id,c.id,array(select jsonb_array_elements_text(a->'scopes'))) returning * into g;
  insert into public.gym_agent_codes(hash,grant_id,challenge,redirect_uri,resource)
   values(a->>'code_hash',g.id,a->>'challenge',a->>'redirect_uri',a->>'resource');
  return jsonb_build_object('grant_id',g.id);
 elsif op='exchange' then
  select * into strict code from public.gym_agent_codes where hash=a->>'code_hash' for update;
  if code.expires_at<=now() or code.challenge<>a->>'challenge' or code.redirect_uri<>a->>'redirect_uri' or code.resource<>a->>'resource' then raise exception 'invalid_grant'; end if;
  select * into strict g from public.gym_agent_grants where id=code.grant_id for update;
  if g.revoked_at is not null or g.client_id<>(a->>'client_id')::uuid then raise exception 'invalid_grant'; end if;
  delete from public.gym_agent_codes where hash=code.hash;
 elsif op='refresh' then
  select * into strict tok from public.gym_agent_tokens where refresh_hash=a->>'refresh_hash' for update;
  select * into strict g from public.gym_agent_grants where id=tok.grant_id for update;
  if g.revoked_at is not null or tok.refresh_expires_at<=now() or tok.resource<>a->>'resource' or g.client_id<>(a->>'client_id')::uuid then raise exception 'invalid_grant'; end if;
  if tok.rotated_at is not null then
   update public.gym_agent_grants set revoked_at=now() where id=g.id;
   return '{"error":"invalid_grant"}'::jsonb;
  end if;
  update public.gym_agent_tokens set rotated_at=now(),expires_at=now() where hash=tok.hash;
 else raise exception 'unknown_operation';
 end if;
 insert into public.gym_agent_tokens(hash,refresh_hash,grant_id,resource)
  values(a->>'access_hash',a->>'new_refresh_hash',g.id,a->>'resource');
 return jsonb_build_object('scope',array_to_string(g.scopes,' '));
end $$;
revoke all on function public.gym_oauth(text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.gym_oauth(text,jsonb,uuid) to service_role;

create function public.gym_agent_execute(op text, a jsonb, owner_id uuid default null, token_hash text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid; grant_row public.gym_agent_grants; required_scope text; actor_key text;
 p public.gym_plans; ex public.exercises; old_ex public.exercises; req public.gym_agent_requests;
 result jsonb; wi bigint; wid bigint; sid bigint; item jsonb; target jsonb;
 i integer; j integer; lim integer:=least(50,greatest(1,coalesce((a->>'limit')::integer,20)));
begin
 if token_hash is not null then
  select g.* into grant_row from public.gym_agent_grants g join public.gym_agent_tokens t on t.grant_id=g.id
   where t.hash=token_hash and t.expires_at>now() and g.revoked_at is null for update of g;
  if not found then raise exception 'unauthorized' using errcode='28000'; end if;
  uid:=grant_row.user_id; actor_key:=grant_row.id::text;
  if op<>'introspect' then
   insert into public.gym_agent_rate_limits(bucket) values(actor_key) on conflict(bucket) do update set count=case when gym_agent_rate_limits.started_at<now()-interval '1 minute' then 1 else gym_agent_rate_limits.count+1 end,started_at=case when gym_agent_rate_limits.started_at<now()-interval '1 minute' then now() else gym_agent_rate_limits.started_at end;
   if (select count from public.gym_agent_rate_limits where bucket=actor_key)>120 then raise exception 'rate_limited' using errcode='P0001'; end if;
  end if;
  required_scope:=case
   when op in ('list_workouts','get_workout','get_workout_sets','get_exercise','exercise_metadata','exercise_history','search_exercises','list_plans','get_plan','get_context') then 'training.read'
   when op in ('create_plan','update_plan') then 'plans.write'
   when op in ('create_exercise','update_exercise') then 'exercises.write'
   else null end;
  if op='introspect' then
   if not exists(select 1 from public.gym_agent_tokens where hash=token_hash and resource=a->>'resource') then raise exception 'unauthorized' using errcode='28000'; end if;
   return jsonb_build_object('scopes',grant_row.scopes);
  end if;
  if required_scope is null or not(required_scope=any(grant_row.scopes)) then raise exception 'forbidden' using errcode='42501'; end if;
 else
  uid:=owner_id; actor_key:='web';
  if uid is null then raise exception 'unauthorized' using errcode='28000'; end if;
 end if;
 if a ? 'request_id' then
  perform pg_advisory_xact_lock(hashtextextended(uid::text||actor_key||(a->>'request_id'),0));
  select * into req from public.gym_agent_requests where user_id=uid and gym_agent_requests.actor=actor_key and request_id=(a->>'request_id')::uuid;
  if found then
   if req.operation<>op or req.payload<>a then raise exception 'idempotency_conflict' using errcode='40001'; end if;
   return req.result;
  end if;
 end if;
 if op='list_connections' then
  select coalesce(jsonb_agg(row_to_json(x)),'[]') into result from
   (select g.id,c.name,g.scopes,g.created_at,g.revoked_at from public.gym_agent_grants g join public.gym_agent_clients c on c.id=g.client_id where g.user_id=uid and (a->>'after' is null or g.id>(a->>'after')::uuid) order by g.id limit lim) x;
 elsif op='revoke_connection' then
  update public.gym_agent_grants set revoked_at=now() where id=(a->>'id')::uuid and user_id=uid;
  result:='{"ok":true}';
 elsif op='get_context' then
  select jsonb_build_object('context',definition,'revision',revision) into result from public.gym_training_context where user_id=uid;
 elsif op='save_context' then
  if exists(select 1 from jsonb_array_elements_text(a->'context'->'avoid_exercise_ids') v where not exists(select 1 from public.exercises e where e.id=v.value::bigint and (e.public or e.userid=uid))) then raise exception 'exercise_not_accessible' using errcode='42501'; end if;
  if (a->>'revision')::int=0 then
   insert into public.gym_training_context(user_id,definition) values(uid,a->'context');
  else
   update public.gym_training_context set definition=a->'context',revision=revision+1 where user_id=uid and revision=(a->>'revision')::int;
   if not found then raise exception 'revision_conflict' using errcode='40001'; end if;
  end if;
  select jsonb_build_object('context',definition,'revision',revision) into result from public.gym_training_context where user_id=uid;
 elsif op='get_feedback' then
  select to_jsonb(f) - 'user_id' into result from public.gym_workout_feedback f where workout_id=(a->>'workout_id')::bigint and user_id=uid;
 elsif op='save_feedback' then
  perform 1 from public.workouts where id=(a->>'workout_id')::bigint and userid=uid and status='finished' for update;
  if not found then raise exception 'finished_workout_required' using errcode='42501'; end if;
  if (a->>'revision')::int=0 then
   insert into public.gym_workout_feedback(workout_id,user_id,difficulty,note) values((a->>'workout_id')::bigint,uid,(a->>'difficulty')::int,a->>'note');
  else
   update public.gym_workout_feedback set difficulty=(a->>'difficulty')::int,note=a->>'note',revision=revision+1
    where workout_id=(a->>'workout_id')::bigint and user_id=uid and revision=(a->>'revision')::int;
   if not found then raise exception 'revision_conflict' using errcode='40001'; end if;
  end if;
  select to_jsonb(f)-'user_id' into result from public.gym_workout_feedback f where workout_id=(a->>'workout_id')::bigint;
 elsif op='exercise_metadata' then
  if a->>'kind'='categories' then
   select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (select id,name from public.exercise_categories where id>coalesce((a->>'after')::bigint,0) order by id limit lim) x;
  else
   select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (select id,name from public.muscles where id>coalesce((a->>'after')::bigint,0) order by id limit lim) x;
  end if;
 elsif op='get_exercise' then
  select (to_jsonb(e)-'userid')||jsonb_build_object('previous_version_id',(select old_id from public.gym_exercise_versions where new_id=e.id),'next_version_id',(select new_id from public.gym_exercise_versions where old_id=e.id),'muscle_ids',(select coalesce(jsonb_agg(muscleid),'[]') from public.exercisemuscles where exerciseid=e.id)) into result from public.exercises e where id=(a->>'id')::bigint and (public or userid=uid);
  if result is null then raise exception 'not_found' using errcode='P0002'; end if;
 elsif op='get_workout_sets' then
  perform 1 from public.workouts where id=(a->>'workout_id')::bigint and userid=uid and status in ('active','finished');
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (select id,position,is_finished as confirmed,jsonb_build_object('weight',target_weight,'reps',target_reps) as target,case when is_finished then jsonb_build_object('weight',weight,'reps',reps,'speed',speed,'distance',distance) else null end as actual from public.sets where workout_id=(a->>'workout_id')::bigint and workout_item_id=(a->>'workout_item_id')::bigint and userid=uid and id>coalesce((a->>'after')::bigint,0) order by id limit lim) x;
 elsif op='search_exercises' then
  select coalesce(jsonb_agg(to_jsonb(x)-'userid'),'[]') into result from
   (select e.* from public.exercises e where (e.public or e.userid=uid)
    and e.id>coalesce((a->>'after')::bigint,0) and position(lower(coalesce(a->>'query','')) in lower(e.name))>0
    and not exists(select 1 from public.gym_exercise_versions v where v.old_id=e.id) order by e.id limit lim) x;
 elsif op in ('create_exercise','update_exercise') then
  if op='update_exercise' then
   select * into old_ex from public.exercises where id=(a->>'id')::bigint and userid=uid and not public for update;
   if not found then raise exception 'private_owner_required' using errcode='42501'; end if;
   if exists(select 1 from public.gym_exercise_versions where old_id=old_ex.id) then raise exception 'revision_conflict' using errcode='40001'; end if;
  end if;
  insert into public.exercises(name,description,howto,categoryid,type,public,userid)
   values(a->'exercise'->>'name',a->'exercise'->>'description',a->'exercise'->>'howto',
   (a->'exercise'->>'categoryid')::bigint,(a->'exercise'->>'type')::public.exercise_type,false,uid) returning * into ex;
  insert into public.exercisemuscles(exerciseid,muscleid) select ex.id,value::bigint from jsonb_array_elements_text(a->'exercise'->'muscle_ids') on conflict do nothing;
  if op='update_exercise' then insert into public.gym_exercise_versions values(old_ex.id,ex.id); end if;
  result:=to_jsonb(ex)-'userid';
 elsif op in ('create_plan','update_plan') then
  if op='update_plan' then
   select * into p from public.gym_plans where id=(a->>'id')::uuid and user_id=uid for update;
   if not found then raise exception 'not_found' using errcode='P0002'; end if;
   if p.workout_id is not null then raise exception 'already_started' using errcode='40001'; end if;
   if p.revision<>(a->>'revision')::int then raise exception 'revision_conflict' using errcode='40001'; end if;
  end if;
  if (a->'plan'->>'scheduled_at')::timestamptz <= now() then raise exception 'future_date_required'; end if;
  if jsonb_array_length(a->'plan'->'items') not between 1 and 30 then raise exception 'invalid_plan'; end if;
  for item in select value from jsonb_array_elements(a->'plan'->'items') loop
   select * into ex from public.exercises where id=(item->>'exercise_id')::bigint and (public or userid=uid) for share;
   if not found then raise exception 'exercise_not_accessible' using errcode='42501'; end if;
   if ex.type not in ('weight','other') then raise exception 'plan_targets_require_weight_or_reps_exercise'; end if;
   if jsonb_array_length(item->'sets') not between 1 and 30 then raise exception 'invalid_sets'; end if;
  end loop;
  if op='create_plan' then
   insert into public.gym_plans(user_id,definition) values(uid,a->'plan') returning * into p;
  else
   update public.gym_plans set definition=a->'plan',revision=revision+1,updated_at=now() where id=p.id returning * into p;
  end if;
  result:=to_jsonb(p)-'user_id';
 elsif op='list_plans' then
  select coalesce(jsonb_agg(to_jsonb(x)-'user_id'),'[]') into result from
   (select * from public.gym_plans where user_id=uid and (coalesce(a->>'status','all')='all' or (a->>'status'='pending' and workout_id is null) or (a->>'status'='started' and workout_id is not null)) and (a->>'after' is null or id>(a->>'after')::uuid) order by id limit lim) x;
 elsif op='get_plan' then
  select to_jsonb(x)-'user_id' into result from public.gym_plans x where id=(a->>'id')::uuid and user_id=uid;
  if result is null then raise exception 'not_found' using errcode='P0002'; end if;
 elsif op='start_plan' then
  select * into p from public.gym_plans where id=(a->>'id')::uuid and user_id=uid for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if p.workout_id is not null then return to_jsonb(p)-'user_id'; end if;
  if p.revision<>(a->>'revision')::int then raise exception 'revision_conflict' using errcode='40001'; end if;
  insert into public.workouts(name,status,userid) values(p.definition->>'name','active',uid) returning id into wid;
  i:=0;
  for item in select value from jsonb_array_elements(p.definition->'items') loop
   select * into ex from public.exercises where id=(item->>'exercise_id')::bigint and (public or userid=uid) for share;
   if not found then raise exception 'exercise_not_accessible' using errcode='42501'; end if;
   insert into public.workout_items(exerciseid,position,workout,is_finished) values(ex.id,i,wid,false) returning id into wi;
   j:=0;
   for target in select value from jsonb_array_elements(item->'sets') loop
    insert into public.sets(userid,workout_id,workout_item_id,position,type,is_finished,weight,reps,target_weight,target_reps)
     values(uid,wid,wi,j,'normal',false,null,null,(target->>'weight')::numeric,(target->>'reps')::int) returning id into sid;
    insert into public.gym_plan_sets values(p.id,sid,i,j,to_jsonb(ex),(target->>'weight')::numeric,(target->>'reps')::int);
    j:=j+1;
   end loop;
   i:=i+1;
  end loop;
  update public.gym_plans set workout_id=wid,updated_at=now() where id=p.id returning * into p;
  result:=to_jsonb(p)-'user_id';
 elsif op in ('list_workouts','exercise_history') then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (
   select w.id,w.name,w.status,w.created_at,w.finished_at,
    (select count(*) from public.sets s where s.workout_id=w.id and s.userid=uid and s.is_finished) as completed_sets,
    (select coalesce(sum(s.weight*s.reps),0) from public.sets s where s.workout_id=w.id and s.userid=uid and s.is_finished) as completed_volume,
    (select max(s.weight) from public.sets s where s.workout_id=w.id and s.userid=uid and s.is_finished) as max_confirmed_weight
   from public.workouts w where w.userid=uid and w.status in ('active','finished') and w.id>coalesce((a->>'after')::bigint,0)
    and (op<>'exercise_history' or exists(select 1 from public.workout_items wi where wi.workout=w.id and wi.exerciseid=(a->>'exercise_id')::bigint))
   order by w.id limit lim) x;
 elsif op='get_workout' then
  select to_jsonb(w)-'userid' into result from public.workouts w where w.id=(a->>'id')::bigint and w.userid=uid and w.status in ('active','finished');
  if result is null then raise exception 'not_found' using errcode='P0002'; end if;
  result:= result || jsonb_build_object('items',(
   select coalesce(jsonb_agg(to_jsonb(x) order by x.id),'[]') from (
    select wi.id,wi.exerciseid,wi.position,e.name,e.type,
     (select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'position',s.position,'confirmed',s.is_finished,
      'target',jsonb_build_object('weight',s.target_weight,'reps',s.target_reps),
      'actual',case when s.is_finished then jsonb_build_object('weight',s.weight,'reps',s.reps,'speed',s.speed,'distance',s.distance) else null end,
      'weight_delta',case when s.is_finished then s.weight-s.target_weight else null end,
      'reps_delta',case when s.is_finished then s.reps-s.target_reps else null end) order by s.position),'[]')
      from (select * from public.sets where workout_item_id=wi.id and userid=uid order by id limit 50) s) as sets
    from public.workout_items wi join public.exercises e on e.id=wi.exerciseid where wi.workout=(a->>'id')::bigint and wi.id>coalesce((a->>'after')::bigint,0) order by wi.id limit lim
   ) x), 'feedback',(select to_jsonb(f)-'user_id' from public.gym_workout_feedback f where f.workout_id=(a->>'id')::bigint and f.user_id=uid),
   'planned_sets',(select coalesce(jsonb_agg(jsonb_build_object('set_id',ps.set_id,'exercise_position',ps.item_position,'set_position',ps.set_position,'exercise',ps.exercise_snapshot-'userid','target',jsonb_build_object('weight',ps.target_weight,'reps',ps.target_reps),'confirmed',coalesce(s.is_finished,false),'actual',case when s.is_finished then jsonb_build_object('weight',s.weight,'reps',s.reps) else null end) order by ps.item_position,ps.set_position),'[]') from public.gym_plans gp join public.gym_plan_sets ps on ps.plan_id=gp.id left join public.sets s on s.id=ps.set_id and s.userid=uid where gp.workout_id=(a->>'id')::bigint and gp.user_id=uid),
   'original_plan',(select definition from public.gym_plans where workout_id=(a->>'id')::bigint and user_id=uid));
 else raise exception 'unknown_operation';
 end if;
 if op in ('get_plan','create_plan','update_plan','start_plan') then
  result:=result || jsonb_build_object('exercise_names',(select jsonb_object_agg(e.id::text,e.name) from public.exercises e where (e.public or e.userid=uid) and e.id in (select (value->>'exercise_id')::bigint from jsonb_array_elements(result->'definition'->'items'))));
 end if;
 if a ? 'request_id' then
  insert into public.gym_agent_requests values(uid,actor_key,(a->>'request_id')::uuid,op,a,result);
 end if;
 return result;
end $$;
revoke all on function public.gym_agent_execute(text,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.gym_agent_execute(text,jsonb,uuid,text) to service_role;
commit;
