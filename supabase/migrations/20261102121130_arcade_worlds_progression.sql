-- Additive progression: shared catalogue, server-checked map unlocks and per-game objectives.
create table public.game_maps (
 game_id uuid not null references public.games(id), key text not null, name text not null,
 map_index integer not null check(map_index between 0 and 2), unlock_metric integer not null check(unlock_metric>=0),
 primary key(game_id,key),unique(game_id,map_index)
);
alter table public.game_maps enable row level security;
revoke all on public.game_maps from public,anon,authenticated;
grant select on public.game_maps to anon,authenticated;
create policy maps_read on public.game_maps for select to anon,authenticated using(true);
insert into public.game_maps(game_id,key,name,map_index,unlock_metric)
select g.id,v.key,v.name,v.idx,v.threshold from public.games g join (values
 ('iss-runner','orbit','Órbita terrestre',0,0),('iss-runner','lunar','Base lunar',1,100),('iss-runner','mars','Frontera roja',2,300),
 ('meteor-dodge','belt','Cinturón exterior',0,0),('meteor-dodge','nebula','Nebulosa violeta',1,250),('meteor-dodge','storm','Tormenta solar',2,600),
 ('iss-docking','training','Puerto de prácticas',0,0),('iss-docking','night','Lado nocturno',1,250),('iss-docking','deep','Estación remota',2,500)
) v(slug,key,name,idx,threshold) on v.slug=g.slug;
insert into public.upgrades(game_id,key,price,max_level)
select g.id,v.key,v.price,v.level from public.games g join (values
 ('meteor-dodge','handling',35,3),('meteor-dodge','barrier',45,2),('meteor-dodge','collector',40,3),
 ('iss-docking','stabilizer',35,3),('iss-docking','tank',40,3),('iss-docking','dampener',50,2)
) v(slug,key,price,level) on v.slug=g.slug;

create table public.game_objectives (
 user_id uuid not null references public.profiles(id) on delete cascade,
 game_id uuid not null references public.games(id), mission_key text not null check(mission_key in ('score','coins','plays')),
 progress integer not null default 0 check(progress>=0),completed_at timestamptz,
 primary key(user_id,game_id,mission_key)
);
create index game_objectives_game_idx on public.game_objectives(game_id);
alter table public.game_objectives enable row level security;
revoke all on public.game_objectives from public,anon,authenticated;
grant select on public.game_objectives to authenticated;
create policy objectives_own on public.game_objectives for select to authenticated using((select auth.uid())=user_id);

create function games_private.start_mapped(p_game text,p_map text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); game public.games; selected public.game_maps; best integer; equipment jsonb; run public.game_sessions; version text;
begin
 if uid is null then raise exception 'Inicia sesión.'; end if;
 if p_game not in ('iss-runner','meteor-dodge','iss-docking') or p_game is null then raise exception 'Juego desconocido.'; end if;
 select * into game from public.games where slug=p_game;
 select * into selected from public.game_maps where game_id=game.id and key=p_map;
 if not found then raise exception 'Mapa desconocido.'; end if;
 perform 1 from public.wallets where user_id=uid for update;
 if exists(select 1 from public.game_sessions where user_id=uid and started_at>now()-interval '3 seconds') then raise exception 'Espera unos segundos antes de comenzar otra misión.'; end if;
 select coalesce(max(case when p_game='iss-runner' then distance else score end),0) into best from public.game_scores where user_id=uid and game_id=game.id and verification_status='replayed';
 if best<selected.unlock_metric then raise exception 'Este mapa todavía está bloqueado.'; end if;
 select coalesce(jsonb_object_agg(u.key,uu.level),'{}') into equipment from public.user_upgrades uu join public.upgrades u on u.id=uu.upgrade_id where uu.user_id=uid and u.game_id=game.id;
 version:=case p_game when 'iss-runner' then 'runner-flight-v2' when 'meteor-dodge' then 'meteor-v1' else 'docking-v1' end;
 insert into public.game_sessions(user_id,game_id,seed,rules_version,loadout) values(uid,game.id,floor(random()*2147483647)::integer,version,equipment||jsonb_build_object('map_index',selected.map_index)) returning * into run;
 return to_jsonb(run);
end $$;
create function public.start_mapped_game(p_game text,p_map text) returns jsonb language sql security invoker set search_path='' as $$ select games_private.start_mapped(p_game,p_map); $$;

create function games_private.purchase_equipment(p_game text,p_key text,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();item public.upgrades;current_level integer;balance integer;cost integer;prior public.wallet_transactions;reason text;
begin
 if uid is null or p_request is null or p_game is null or p_key is null then raise exception 'Solicitud inválida.'; end if;
 reason:='equipment:'||p_game||':'||p_key;
 select currency_balance into balance from public.wallets where user_id=uid for update;
 select * into prior from public.wallet_transactions where user_id=uid and request_id=p_request;
 if found then if prior.reason<>reason then raise exception 'Identificador reutilizado.'; end if;return jsonb_build_object('balance',balance,'duplicate',true);end if;
 select u.* into item from public.upgrades u join public.games g on g.id=u.game_id where g.slug=p_game and u.key=p_key;
 if not found then raise exception 'Mejora desconocida para este juego.'; end if;
 select coalesce((select level from public.user_upgrades where user_id=uid and upgrade_id=item.id),0) into current_level;
 if current_level>=item.max_level then raise exception 'Mejora al máximo.';end if;
 cost:=item.price*(current_level+1);if balance<cost then raise exception 'No tienes suficientes monedas.';end if;
 update public.wallets set currency_balance=currency_balance-cost,updated_at=now() where user_id=uid returning currency_balance into balance;
 insert into public.user_upgrades(user_id,upgrade_id,level) values(uid,item.id,current_level+1) on conflict(user_id,upgrade_id) do update set level=excluded.level;
 insert into public.wallet_transactions(user_id,amount,reason,request_id) values(uid,-cost,reason,p_request);
 return jsonb_build_object('balance',balance,'level',current_level+1,'duplicate',false);
end $$;
create function public.purchase_game_equipment(p_game text,p_key text,p_request uuid) returns jsonb language sql security invoker set search_path='' as $$ select games_private.purchase_equipment(p_game,p_key,p_request); $$;

create function games_private.record_arcade_objectives() returns trigger language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();slug text;target_coins integer;
begin
 if uid is null or uid<>new.user_id then raise exception 'Propietario de misión inválido.';end if;
 if new.rules_version not in ('meteor-v1','docking-v1') or new.verification_status<>'replayed' then return new;end if;
 select g.slug into slug from public.games g where g.id=new.game_id;
 target_coins:=case slug when 'meteor-dodge' then 20 else 40 end;
 insert into public.game_objectives(user_id,game_id,mission_key,progress) values(uid,new.game_id,'score',new.score) on conflict(user_id,game_id,mission_key) do update set progress=greatest(public.game_objectives.progress,excluded.progress);
 insert into public.game_objectives(user_id,game_id,mission_key,progress) values(uid,new.game_id,'coins',least(target_coins,greatest(0,(new.score-new.distance)/10))) on conflict(user_id,game_id,mission_key) do update set progress=least(target_coins,public.game_objectives.progress+excluded.progress);
 insert into public.game_objectives(user_id,game_id,mission_key,progress) values(uid,new.game_id,'plays',1) on conflict(user_id,game_id,mission_key) do update set progress=least(3,public.game_objectives.progress+1);
 update public.game_objectives set completed_at=now() where user_id=uid and game_id=new.game_id and completed_at is null and progress>=case mission_key when 'score' then 250 when 'coins' then target_coins else 3 end;
 return new;
end $$;
revoke all on function games_private.record_arcade_objectives() from public,anon,authenticated;
create trigger on_arcade_objectives after insert on public.game_scores for each row execute function games_private.record_arcade_objectives();
revoke all on function games_private.start_mapped(text,text),public.start_mapped_game(text,text),games_private.purchase_equipment(text,text,uuid),public.purchase_game_equipment(text,text,uuid) from public,anon;
grant execute on function games_private.start_mapped(text,text),public.start_mapped_game(text,text),games_private.purchase_equipment(text,text,uuid),public.purchase_game_equipment(text,text,uuid) to authenticated;
update public.games set status='available' where slug in ('meteor-dodge','iss-docking');
