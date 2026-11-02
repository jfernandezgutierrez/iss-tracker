-- Transactional fixtures: leaves no users, wallets, scores or missions behind.
begin;
select set_config('games_test.uid',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,email,raw_user_meta_data) values(current_setting('games_test.uid')::uuid,'authenticated','authenticated','mobile-qa@example.invalid','{}');
select set_config('request.jwt.claim.sub',current_setting('games_test.uid'),true);
do $$
declare run jsonb; game uuid; uid uuid := auth.uid();
begin
 run := games_private.start_flight();
 assert run->>'rules_version'='runner-flight-v2','Wrong flight version';
 select game_id into game from public.game_sessions where id=(run->>'id')::uuid;
 insert into public.game_scores(user_id,game_id,session_id,score,distance,verification_status) values(uid,game,(run->>'id')::uuid,350,150,'replayed');
 assert (select rules_version='runner-flight-v2' from public.game_scores where session_id=(run->>'id')::uuid),'Score mode not derived';
 assert (select progress=150 and completed_at is not null from public.player_missions where user_id=uid and mission_key='distance'),'Distance mission not updated';
 assert (select progress=20 and completed_at is not null from public.player_missions where user_id=uid and mission_key='coins'),'Coin mission not updated';
 assert (select progress=1 from public.player_missions where user_id=uid and mission_key='flights'),'Flight mission not updated';
 insert into public.game_scores(user_id,game_id,session_id,score,distance,verification_status) values(uid,game,(run->>'id')::uuid,350,150,'replayed') on conflict(session_id) do nothing;
 assert (select progress=1 from public.player_missions where user_id=uid and mission_key='flights'),'Duplicate score incremented mission';
end $$;
set local role authenticated;
do $$
begin
 assert (select count(*)=3 from public.player_missions),'Own missions not readable';
 assert not has_table_privilege('authenticated','public.player_missions','INSERT'),'Mission insert must be forbidden';
 assert not has_table_privilege('authenticated','public.player_missions','UPDATE'),'Mission update must be forbidden';
 assert not has_function_privilege('anon','public.start_flight_run()','EXECUTE'),'Anonymous starts must be forbidden';
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 assert (select count(*)=0 from public.player_missions),'Another player can read private missions';
end $$;
reset role;
rollback;
select 'flight mode, verified mission updates, idempotency and RLS passed; fixtures rolled back' as result;
