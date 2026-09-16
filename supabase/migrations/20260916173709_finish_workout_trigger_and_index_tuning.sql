-- Finish is one status transition, but the existing 30 challenge triggers also
-- run on the two follow-up updates of total_weight and mainmuscle. Keep the
-- original trigger functions and their finished-INSERT behavior, while running
-- their UPDATE checks only once, on the transition to finished.
--
-- These indexes cover the workout/sets lookups in the finish and challenge
-- functions. Standard CREATE INDEX is intentional here: the current tables are
-- small, while CONCURRENTLY is not reliably supported by the CLI migration
-- pipeline. The single DO statement makes the DDL atomic even if the migration
-- runner does not wrap a file in a transaction. Apply during a quiet window:
-- index builds and trigger DDL briefly block writes.

do $$
declare
  challenge_function text;
  challenge_functions text[] := array[
    'check_back_to_basics_challenge',
    'check_calendar_conqueror_challenge',
    'check_climbing_the_ladder_challenge',
    'check_first_workout_challenge',
    'check_full_body_finisher_challenge',
    'check_galactic_gym_odyssey',
    'check_getting_started_challenge',
    'check_gladiator_gauntlet_challenge',
    'check_hercules_trials_challenge',
    'check_high_five_challenge',
    'check_hulk_out_challenge',
    'check_judgment_day_prep_challenge',
    'check_lunar_lifter_challenge',
    'check_marathon_lifter_challenge',
    'check_mars_marathon_challenge',
    'check_martial_arts_mastery_challenge',
    'check_monday_motivator_challenge',
    'check_multiple_workouts_challenge',
    'check_odyssean_endeavor_challenge',
    'check_pharaohs_pyramid_challenge',
    'check_pyramid_scheme_challenge',
    'check_seven_day_streaker',
    'check_seven_summits_challenge',
    'check_silk_road_runner_challenge',
    'check_stonehenge_strength_challenge',
    'check_time_based_workouts_challenge',
    'check_tzus_versatility_challenge',
    'check_upper_body_expert_challenge',
    'check_versatile_virtuoso_challenge',
    'check_viking_voyage_challenge'
  ];
  original_trigger record;
  trigger_name text;
begin
  perform pg_catalog.set_config('lock_timeout', '5s', true);

  -- Refuse to silently leave a newly added challenge trigger firing on every
  -- update. The observed production baseline contains exactly these 30.
  if (
    select count(*)
    from pg_catalog.pg_trigger t
    where t.tgrelid = 'public.workouts'::pg_catalog.regclass
      and left(t.tgname, 9) = 'tr_check_'
      and not t.tgisinternal
  ) <> array_length(challenge_functions, 1) then
    raise exception 'Unexpected workout challenge trigger count; inspect the live schema before applying';
  end if;

  foreach challenge_function in array challenge_functions loop
    select t.tgname, t.tgtype, t.tgenabled, p.proname, p.pronargs,
           n.nspname as function_schema
    into original_trigger
    from pg_catalog.pg_trigger t
    join pg_catalog.pg_proc p on p.oid = t.tgfoid
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where t.tgrelid = 'public.workouts'::pg_catalog.regclass
      and t.tgname = 'tr_' || challenge_function
      and not t.tgisinternal;

    if not found then
      raise exception 'Missing workout challenge trigger %',
        'tr_' || challenge_function;
    end if;

    if original_trigger.tgtype <> 21
       or original_trigger.tgenabled <> 'O'
       or original_trigger.proname <> challenge_function
       or original_trigger.pronargs <> 0
       or original_trigger.function_schema <> 'public' then
      raise exception 'Unexpected definition for workout challenge trigger %',
        'tr_' || challenge_function;
    end if;

    if exists (
      select 1
      from pg_catalog.pg_trigger t
      where t.tgrelid = 'public.workouts'::pg_catalog.regclass
        and t.tgname = original_trigger.tgname || '_insert'
    ) then
      raise exception 'Workout challenge INSERT trigger % already exists',
        original_trigger.tgname || '_insert';
    end if;
  end loop;

  execute 'create index gym_sets_workout_id_idx on public.sets (workout_id)';
  execute 'create index gym_sets_workout_item_id_idx on public.sets (workout_item_id)';
  execute 'create index gym_workout_items_workout_idx on public.workout_items (workout)';
  execute 'create index gym_workouts_user_status_idx on public.workouts (userid, status)';
  execute 'create index gym_workouts_user_finished_at_idx on public.workouts (userid, finished_at)';

  foreach challenge_function in array challenge_functions loop
    trigger_name := 'tr_' || challenge_function;
    execute format('drop trigger %I on public.workouts', trigger_name);
    execute format(
      'create trigger %I after update of status on public.workouts '
      || 'for each row when (old.status is distinct from ''finished''::public.workout_status '
      || 'and new.status = ''finished''::public.workout_status) '
      || 'execute function public.%I()',
      trigger_name, challenge_function
    );
    execute format(
      'create trigger %I after insert on public.workouts '
      || 'for each row when (new.status = ''finished''::public.workout_status) '
      || 'execute function public.%I()',
      trigger_name || '_insert', challenge_function
    );
  end loop;
end $$;
