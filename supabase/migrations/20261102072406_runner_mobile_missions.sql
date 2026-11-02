-- Versioned flight sessions preserve validation of existing classic runs.
alter table public.game_scores add column rules_version text not null default 'runner-v1';
create index game_scores_mode_ranking_idx on public.game_scores(game_id,rules_version,score desc);
create function games_private.start_flight() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); run jsonb;
begin
 if uid is null then raise exception 'Inicia sesión.'; end if;
 run := games_private.start_run();
 update public.game_sessions set rules_version='runner-flight-v2' where id=(run->>'id')::uuid and user_id=uid;
 return run || jsonb_build_object('rules_version','runner-flight-v2');
end $$;
create function public.start_flight_run() returns jsonb language sql security invoker set search_path='' as $$ select games_private.start_flight(); $$;
revoke all on function games_private.start_flight(),public.start_flight_run() from public,anon;
grant execute on function games_private.start_flight(),public.start_flight_run() to authenticated;

create table public.player_missions (
 user_id uuid not null references public.profiles(id) on delete cascade,
 mission_key text not null check(mission_key in ('distance','coins','flights')),
 progress integer not null default 0 check(progress >= 0), completed_at timestamptz,
 primary key(user_id,mission_key)
);
alter table public.player_missions enable row level security;
revoke all on public.player_missions from public,anon,authenticated;
grant select on public.player_missions to authenticated;
create policy missions_own on public.player_missions for select to authenticated using ((select auth.uid())=user_id);

create function games_private.record_flight_missions() returns trigger language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); version text; run_coins integer;
begin
 if uid is null or uid <> new.user_id then raise exception 'Propietario de misión inválido.'; end if;
 select rules_version into version from public.game_sessions where id=new.session_id and user_id=uid;
 if version <> 'runner-flight-v2' or new.verification_status <> 'replayed' then return new; end if;
 run_coins := greatest(0,(new.score-new.distance)/10);
 insert into public.player_missions(user_id,mission_key,progress) values(uid,'distance',new.distance)
 on conflict(user_id,mission_key) do update set progress=greatest(public.player_missions.progress,excluded.progress);
 insert into public.player_missions(user_id,mission_key,progress) values(uid,'coins',least(20,run_coins))
 on conflict(user_id,mission_key) do update set progress=least(20,public.player_missions.progress+excluded.progress);
 insert into public.player_missions(user_id,mission_key,progress) values(uid,'flights',1)
 on conflict(user_id,mission_key) do update set progress=least(3,public.player_missions.progress+1);
 update public.player_missions set completed_at=now() where user_id=uid and completed_at is null
 and progress >= case mission_key when 'distance' then 100 when 'coins' then 20 else 3 end;
 return new;
end $$;
revoke all on function games_private.record_flight_missions() from public,anon,authenticated;
create trigger on_verified_flight_missions after insert on public.game_scores for each row execute function games_private.record_flight_missions();

create function games_private.assign_score_version() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() <> new.user_id then raise exception 'Propietario de puntuación inválido.'; end if;
 select rules_version into new.rules_version from public.game_sessions where id=new.session_id and user_id=new.user_id;
 if new.rules_version is null then raise exception 'Sesión de puntuación inválida.'; end if;
 return new;
end $$;
revoke all on function games_private.assign_score_version() from public,anon,authenticated;
create trigger on_score_rules_version before insert on public.game_scores for each row execute function games_private.assign_score_version();
