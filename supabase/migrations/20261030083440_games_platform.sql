-- ISS Tracker Games: no balances, scores or purchases are writable by clients.
create schema if not exists games_private;
revoke all on schema games_private from public, anon;
grant usage on schema games_private to authenticated;
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
 avatar text not null default 'astronaut', created_at timestamptz not null default now()
);
create table public.games (id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, status text not null check (status in ('available','coming-soon')));
create table public.wallets (user_id uuid primary key references public.profiles(id) on delete cascade, currency_balance integer not null default 0 check (currency_balance >= 0), updated_at timestamptz not null default now());
create table public.upgrades (id uuid primary key default gen_random_uuid(), game_id uuid not null references public.games(id), key text not null, price integer not null check (price > 0), max_level integer not null check (max_level between 1 and 10), unique(game_id,key));
create table public.user_upgrades (user_id uuid not null references public.profiles(id) on delete cascade, upgrade_id uuid not null references public.upgrades(id), level integer not null check (level between 1 and 10), primary key(user_id,upgrade_id));
create table public.game_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 game_id uuid not null references public.games(id), seed integer not null, rules_version text not null default 'runner-v1',
 loadout jsonb not null default '{}', started_at timestamptz not null default now(), finished_at timestamptz, result jsonb
);
create table public.game_scores (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 game_id uuid not null references public.games(id), session_id uuid not null unique references public.game_sessions(id),
 score integer not null check (score >= 0), distance integer not null check (distance >= 0),
 created_at timestamptz not null default now(), verification_status text not null check (verification_status in ('replayed','rejected'))
);
create table public.wallet_transactions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 amount integer not null, reason text not null, request_id uuid not null, created_at timestamptz not null default now(), unique(user_id, request_id)
);
create table games_private.verification_keys (id boolean primary key default true check(id), secret text not null check(length(secret) >= 64));
alter table games_private.verification_keys enable row level security;
revoke all on games_private.verification_keys from public, anon, authenticated;

create index game_sessions_user_started_idx on public.game_sessions(user_id,started_at desc);
create index game_sessions_game_idx on public.game_sessions(game_id);
create index game_scores_ranking_idx on public.game_scores(game_id,score desc,created_at);
create index game_scores_user_idx on public.game_scores(user_id);
create index user_upgrades_upgrade_idx on public.user_upgrades(upgrade_id);
create index wallet_transactions_user_date_idx on public.wallet_transactions(user_id,created_at desc);

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.wallets enable row level security;
alter table public.upgrades enable row level security;
alter table public.user_upgrades enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_scores enable row level security;
alter table public.wallet_transactions enable row level security;
revoke all on public.profiles,public.games,public.wallets,public.upgrades,public.user_upgrades,public.game_sessions,public.game_scores,public.wallet_transactions from anon, authenticated;
grant select on public.profiles,public.games,public.upgrades,public.game_scores to anon,authenticated;
grant select on public.wallets,public.user_upgrades,public.game_sessions,public.wallet_transactions to authenticated;
grant update(username) on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to anon,authenticated using(true);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy games_read on public.games for select to anon,authenticated using(true);
create policy upgrades_read on public.upgrades for select to anon,authenticated using(true);
create policy scores_read on public.game_scores for select to anon,authenticated using(verification_status='replayed');
create policy wallets_own on public.wallets for select to authenticated using((select auth.uid())=user_id);
create policy upgrades_own on public.user_upgrades for select to authenticated using((select auth.uid())=user_id);
create policy sessions_own on public.game_sessions for select to authenticated using((select auth.uid())=user_id);
create policy transactions_own on public.wallet_transactions for select to authenticated using((select auth.uid())=user_id);

insert into public.games(slug,title,status) values ('iss-runner','ISS Runner','available'),('meteor-dodge','Meteor Dodge','coming-soon'),('iss-docking','ISS Docking','coming-soon');
insert into public.upgrades(game_id,key,price,max_level)
select g.id,v.key,v.price,v.max_level from public.games g cross join (values
 ('double-jump',60,1),('magnet',40,1),('shield',50,1),('oxygen',40,3),('multiplier',80,2),('thruster',90,1)
) v(key,price,max_level) where g.slug='iss-runner';

create function games_private.create_player() returns trigger language plpgsql security definer set search_path='' as $$
declare desired text;
begin
 desired := lower(coalesce(new.raw_user_meta_data->>'username','astro_'||substr(replace(new.id::text,'-',''),1,12)));
 if desired !~ '^[a-z0-9_]{3,20}$' then raise exception 'El nombre debe tener entre 3 y 20 letras, números o guiones bajos.'; end if;
 insert into public.profiles(id,username) values(new.id,desired);
 insert into public.wallets(user_id) values(new.id);
 return new;
end $$;
revoke all on function games_private.create_player() from public,anon,authenticated;
create trigger on_games_player_created after insert on auth.users for each row execute function games_private.create_player();
insert into public.profiles(id,username) select id,'astro_'||substr(replace(id::text,'-',''),1,12) from auth.users on conflict(id) do nothing;
insert into public.wallets(user_id) select id from public.profiles on conflict do nothing;

create function games_private.start_run() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); run public.game_sessions; equipment jsonb;
begin
 if uid is null then raise exception 'Inicia sesión.'; end if;
 -- Serialize starts, purchases and rewards for this player.
 perform 1 from public.wallets where user_id=uid for update;
 if exists(select 1 from public.game_sessions where user_id=uid and started_at > now()-interval '3 seconds') then raise exception 'Espera unos segundos antes de iniciar otra partida.'; end if;
 select coalesce(jsonb_object_agg(u.key,uu.level),'{}') into equipment from public.user_upgrades uu join public.upgrades u on u.id=uu.upgrade_id where uu.user_id=uid;
 insert into public.game_sessions(user_id,game_id,seed,loadout) select uid,id,floor(random()*2147483647)::integer,equipment from public.games where slug='iss-runner' returning * into run;
 return to_jsonb(run);
end $$;
create function public.start_game_run() returns jsonb language sql security invoker set search_path='' as $$ select games_private.start_run(); $$;

create function games_private.purchase(p_key text,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); item public.upgrades; current_level integer; balance integer; cost integer; prior public.wallet_transactions;
begin
 if uid is null or p_request is null then raise exception 'Solicitud inválida.'; end if;
 select currency_balance into balance from public.wallets where user_id=uid for update;
 select * into prior from public.wallet_transactions where user_id=uid and request_id=p_request;
 if found then
   if prior.reason <> 'purchase:'||p_key then raise exception 'Identificador de compra reutilizado.'; end if;
   return jsonb_build_object('balance',balance,'duplicate',true);
 end if;
 select u.* into item from public.upgrades u join public.games g on g.id=u.game_id where u.key=p_key and g.slug='iss-runner';
 if not found then raise exception 'Mejora desconocida.'; end if;
 select coalesce((select level from public.user_upgrades where user_id=uid and upgrade_id=item.id),0) into current_level;
 if current_level >= item.max_level then raise exception 'Mejora al máximo.'; end if;
 cost := item.price*(current_level+1);
 if balance < cost then raise exception 'No tienes suficientes monedas.'; end if;
 update public.wallets set currency_balance=currency_balance-cost,updated_at=now() where user_id=uid returning currency_balance into balance;
 insert into public.user_upgrades(user_id,upgrade_id,level) values(uid,item.id,current_level+1) on conflict(user_id,upgrade_id) do update set level=excluded.level;
 insert into public.wallet_transactions(user_id,amount,reason,request_id) values(uid,-cost,'purchase:'||p_key,p_request);
 return jsonb_build_object('balance',balance,'level',current_level+1,'duplicate',false);
end $$;
create function public.purchase_game_upgrade(p_key text,p_request uuid) returns jsonb language sql security invoker set search_path='' as $$ select games_private.purchase(p_key,p_request); $$;

create function games_private.finish_run(p_run uuid,p_score integer,p_coins integer,p_distance integer,p_ticks integer,p_proof text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); run public.game_sessions; signing_key text; expected text; payload text; response jsonb; balance integer;
begin
 if uid is null then raise exception 'Inicia sesión.'; end if;
 perform 1 from public.wallets where user_id=uid for update;
 select * into run from public.game_sessions where id=p_run and user_id=uid for update;
 if not found then raise exception 'Partida desconocida.'; end if;
 if run.finished_at is not null then return run.result; end if;
 if p_score is null or p_coins is null or p_distance is null or p_ticks is null or p_proof is null or p_ticks not between 1 and 36000 or p_coins not between 0 and 20000 or p_distance < 0 or p_score <> p_distance+p_coins*10 then raise exception 'Resultado inválido.'; end if;
 if now()-run.started_at > interval '2 hours' or extract(epoch from now()-run.started_at)+2 < p_ticks/60.0 then raise exception 'Duración de partida inválida.'; end if;
 select secret into signing_key from games_private.verification_keys where id=true;
 if signing_key is null then raise exception 'Validación de partidas sin configurar.'; end if;
 payload := p_run::text||':'||uid::text||':'||p_score||':'||p_coins||':'||p_distance||':'||p_ticks;
 expected := encode(extensions.hmac(convert_to(payload,'UTF8'),convert_to(signing_key,'UTF8'),'sha256'),'hex');
 if expected <> p_proof then raise exception 'Firma del servidor inválida.'; end if;
 insert into public.game_scores(user_id,game_id,session_id,score,distance,verification_status) values(uid,run.game_id,run.id,p_score,p_distance,'replayed');
 update public.wallets set currency_balance=currency_balance+p_coins,updated_at=now() where user_id=uid returning currency_balance into balance;
 insert into public.wallet_transactions(user_id,amount,reason,request_id) values(uid,p_coins,'run:'||run.id,run.id);
 response := jsonb_build_object('score',p_score,'coins',p_coins,'distance',p_distance,'balance',balance,'verified',true);
 update public.game_sessions set finished_at=now(),result=response where id=run.id;
 return response;
end $$;
create function public.finish_game_run(p_run uuid,p_score integer,p_coins integer,p_distance integer,p_ticks integer,p_proof text) returns jsonb language sql security invoker set search_path='' as $$ select games_private.finish_run(p_run,p_score,p_coins,p_distance,p_ticks,p_proof); $$;

revoke all on function games_private.start_run(),games_private.purchase(text,uuid),games_private.finish_run(uuid,integer,integer,integer,integer,text) from public,anon;
revoke all on function public.start_game_run(),public.purchase_game_upgrade(text,uuid),public.finish_game_run(uuid,integer,integer,integer,integer,text) from public,anon;
grant execute on function games_private.start_run(),games_private.purchase(text,uuid),games_private.finish_run(uuid,integer,integer,integer,integer,text) to authenticated;
grant execute on function public.start_game_run(),public.purchase_game_upgrade(text,uuid),public.finish_game_run(uuid,integer,integer,integer,integer,text) to authenticated;
