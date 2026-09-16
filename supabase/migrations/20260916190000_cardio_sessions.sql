begin;

create table public.gym_cardio_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null check (length(name) between 1 and 120),
  activity text not null check (activity in ('running','cycling','rowing','walking','other')),
  status text not null check (status in ('planned','completed')),
  performed_at timestamptz,
  rounds integer not null check (rounds between 1 and 100),
  phases jsonb not null check (jsonb_typeof(phases) = 'array' and jsonb_array_length(phases) between 1 and 20),
  notes text not null default '' check (length(notes) <= 2000),
  created_at timestamptz not null default now(),
  check (status = 'planned' or performed_at is not null)
);
create index gym_cardio_sessions_owner_created on public.gym_cardio_sessions(user_id, created_at desc, id desc);
alter table public.gym_cardio_sessions enable row level security;
revoke all on public.gym_cardio_sessions from public, anon, authenticated;

create function public.gym_cardio_execute(op text, a jsonb, owner_id uuid default null, token_hash text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid;
  actor_key text := 'web';
  required_scope text;
  grant_row public.gym_agent_grants;
  prior public.gym_agent_requests;
  session_row public.gym_cardio_sessions;
  result jsonb;
  phase jsonb;
  lim integer := least(50, greatest(1, coalesce((a->>'limit')::integer,20)));
begin
  if op not in ('list_cardio_sessions','get_cardio_session','create_cardio_session') then
    raise exception 'unknown_operation';
  end if;
  if token_hash is not null then
    select g.* into grant_row
    from public.gym_agent_grants g
    join public.gym_agent_tokens t on t.grant_id = g.id
    where t.hash = token_hash and t.expires_at > now() and g.revoked_at is null
    for update of g;
    if not found then raise exception 'unauthorized' using errcode = '28000'; end if;
    uid := grant_row.user_id;
    actor_key := grant_row.id::text;
    required_scope := case when op = 'create_cardio_session' then 'plans.write' else 'training.read' end;
    if not required_scope = any(grant_row.scopes) then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    insert into public.gym_agent_rate_limits(bucket) values(actor_key)
      on conflict(bucket) do update set
      count = case when gym_agent_rate_limits.started_at < now() - interval '1 minute' then 1 else gym_agent_rate_limits.count + 1 end,
      started_at = case when gym_agent_rate_limits.started_at < now() - interval '1 minute' then now() else gym_agent_rate_limits.started_at end;
    if (select count from public.gym_agent_rate_limits where bucket = actor_key) > 120 then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;
  else
    uid := owner_id;
    if uid is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  end if;

  if op = 'create_cardio_session' then
    perform pg_advisory_xact_lock(hashtextextended(uid::text || actor_key || (a->>'request_id'), 0));
    select * into prior from public.gym_agent_requests
      where user_id = uid and actor = actor_key and request_id = (a->>'request_id')::uuid;
    if found then
      if prior.operation <> op or prior.payload <> a then
        raise exception 'idempotency_conflict' using errcode = 'PT409';
      end if;
      return prior.result;
    end if;
    if jsonb_typeof(a->'session'->'phases') <> 'array'
       or jsonb_array_length(a->'session'->'phases') not between 1 and 20
       or (a->'session'->>'rounds')::integer not between 1 and 100 then
      raise exception 'invalid_cardio_session';
    end if;
    for phase in select value from jsonb_array_elements(a->'session'->'phases') loop
      if jsonb_typeof(phase) <> 'object'
         or length(phase->>'name') not between 1 and 120
         or (phase->>'duration_seconds')::integer not between 1 and 86400
         or (phase->>'speed_kmh')::numeric <= 0
         or (phase->>'distance_km')::numeric <= 0 then
        raise exception 'invalid_cardio_phase';
      end if;
    end loop;
    insert into public.gym_cardio_sessions(user_id,name,activity,status,performed_at,rounds,phases,notes)
      values(uid,a->'session'->>'name',a->'session'->>'activity',a->'session'->>'status',
        (a->'session'->>'performed_at')::timestamptz,(a->'session'->>'rounds')::integer,
        a->'session'->'phases',a->'session'->>'notes') returning * into session_row;
    result := to_jsonb(session_row) - 'user_id';
    insert into public.gym_agent_requests values(uid,actor_key,(a->>'request_id')::uuid,op,a,result);
  elsif op = 'get_cardio_session' then
    select to_jsonb(s) - 'user_id' into result
      from public.gym_cardio_sessions s where s.id = (a->>'id')::uuid and s.user_id = uid;
    if result is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  else
    select coalesce(jsonb_agg(to_jsonb(x) - 'user_id' order by x.created_at desc, x.id desc),'[]'::jsonb)
      into result from (
        select s.* from public.gym_cardio_sessions s
        where s.user_id = uid and (
          a->>'after' is null or (s.created_at,s.id) < (
            select c.created_at,c.id from public.gym_cardio_sessions c
            where c.id = (a->>'after')::uuid and c.user_id = uid
          )
        )
        order by s.created_at desc,s.id desc limit lim
      ) x;
  end if;
  return result;
end $$;
revoke all on function public.gym_cardio_execute(text,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.gym_cardio_execute(text,jsonb,uuid,text) to service_role;

commit;
