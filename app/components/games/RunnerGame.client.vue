<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, reactive, computed, watch, nextTick } from 'vue'
import GameIcon from './GameIcon.vue'
import UpgradeBay from './UpgradeBay.vue'
import WorldMapSelector from './WorldMapSelector.vue'
import GameLeaderboard from './GameLeaderboard.vue'
import FlightMissions from './FlightMissions.vue'
import PlayerAccount from './PlayerAccount.vue'
import GamePrivacy from './GamePrivacy.vue'
import PendingRunNotice from './PendingRunNotice.vue'
import NextMapGoal from './NextMapGoal.vue'
import type { RunnerController } from '../../games/runner/createGame'
import type { InputEvent } from '#shared/games/runner'
import { advanceMissions, flightMissions, type MissionProgress } from '#shared/games/missions'
const account=useGameAccount()
const progression=useGameProgress('iss-runner')
const shell=ref<HTMLElement>();const canvasHost=ref<HTMLElement>()
const phase=ref<'ready'|'loading'|'playing'|'paused'|'over'>('ready')
const view=ref('hangar')
const stats=reactive({oxygen:55,maxOxygen:55,health:3,coins:0,distance:0,score:0})
const muted=ref(true);const reason=ref('');const errorMessage=ref('');const saveMessage=ref('');const saving=ref(false)
const pending=usePendingGameRun<InputEvent>('iss-runner');const record=pending.record
const guestMissions=ref<MissionProgress>({});const cloudMissions=ref<MissionProgress>({});const missionError=ref('')
const progress=computed(()=>account.session.value?cloudMissions.value:guestMissions.value)
const activeMission=computed(()=>flightMissions.find(m=>(progress.value[m.key]||0)<m.target))
const liveMissionProgress=computed(()=>{const mission=activeMission.value;if(!mission)return 0;const value=mission.key==='distance'?Math.max(progress.value.distance||0,stats.distance):mission.key==='coins'?(progress.value.coins||0)+stats.coins:progress.value.flights||0;return Math.min(mission.target,value)})
const completed=computed(()=>flightMissions.filter(m=>(progress.value[m.key]||0)>=m.target).length)
const best=ref(0);const fullscreen=ref(false)
const input={boosting:false};const pointers=new Set<number>();let keyboardBoost=false
let controller:RunnerController|undefined;let disposed=false;let generation=0;let runId='';let runUser='';let startedAt=0
const tabs=[{key:'hangar',label:'Hangar',icon:'home'},{key:'maps',label:'Mapas',icon:'orbit'},{key:'missions',label:'Misiones',icon:'missions'},{key:'shop',label:'Tienda',icon:'shop'},{key:'ranking',label:'Récords',icon:'trophy'},{key:'settings',label:'Perfil',icon:'gear'}]
function resetInput(){pointers.clear();keyboardBoost=false;input.boosting=false}
function pause(){if(phase.value!=='playing')return;resetInput();phase.value='paused';controller?.pause(true)}
function resume(){if(document.hidden)return;view.value='hangar';phase.value='playing';controller?.pause(false);shell.value?.focus()}
async function openTab(tab:string){if(phase.value==='loading')return;pause();view.value=tab;if(tab==='missions')await loadMissions();await nextTick();shell.value?.querySelector<HTMLElement>('.panel-title')?.focus()}
function press(event:PointerEvent){if(phase.value!=='playing')return;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);pointers.add(event.pointerId);input.boosting=true}
function release(event:PointerEvent){pointers.delete(event.pointerId);input.boosting=keyboardBoost||pointers.size>0}
function keyDown(event:KeyboardEvent){
 if(!shell.value?.contains(document.activeElement)||(event.target as HTMLElement).matches('input,textarea,select'))return
 if(event.code==='Escape'){if(view.value!=='hangar'){view.value='hangar';return}if(phase.value==='playing'){event.preventDefault();pause()}else if(phase.value==='paused'){event.preventDefault();resume()}return}
 if(!['Space','ArrowUp','KeyW'].includes(event.code)||phase.value!=='playing')return
 event.preventDefault();keyboardBoost=true;input.boosting=true
}
function keyUp(event:KeyboardEvent){if(['Space','ArrowUp','KeyW'].includes(event.code)){keyboardBoost=false;input.boosting=pointers.size>0}}
function visibility(){if(document.hidden)pause()}
async function loadMissions(){
 missionError.value=''
 if(!account.session.value){cloudMissions.value={};return}
 const uid=account.session.value.user.id
 try{const{data,error}=await account.getClient()!.from('player_missions').select('mission_key,progress').eq('user_id',uid);if(error)throw error;if(account.session.value?.user.id===uid)cloudMissions.value=Object.fromEntries(data.map(row=>[row.mission_key,row.progress]))}
 catch{missionError.value='No se pudieron cargar tus misiones. Puedes volver a intentarlo.'}
}
async function start(guest=false){
 if(phase.value==='loading'||saving.value)return
 if(record.value){saveMessage.value='Guarda el resultado pendiente o elige continuar sin guardarlo.';return}
 const attempt=++generation;phase.value='loading';view.value='hangar';errorMessage.value='';saveMessage.value=''
 controller?.destroy();controller=undefined;resetInput()
 try{
  await progression.init(guest);if(disposed||attempt!==generation)return;if(record.value){phase.value='ready';return}let seed=crypto.getRandomValues(new Uint32Array(1))[0]!&0x7fffffff;let loadout=progression.guestLoadout();runId='';runUser='';startedAt=Date.now()
  if(disposed||attempt!==generation)return
  const owner=account.session.value?.user.id
  if(owner&&!guest){const{data,error}=await account.getClient()!.rpc('start_mapped_game',{p_game:'iss-runner',p_map:progression.activeMap.value.key});if(error)throw new Error(error.message);if(account.session.value?.user.id!==owner)throw new Error('La cuenta ha cambiado. Inicia otro vuelo.');seed=data.seed;loadout=data.loadout;runId=data.id;runUser=owner}
  const[P,engine]=await Promise.all([import('phaser'),import('../../games/runner/createFlightGame')])
  if(disposed||attempt!==generation||!canvasHost.value)return
  controller=engine.mountFlight(P.default,canvasHost.value,{
   seed,loadout,input,muted:muted.value,
   onReady(){phase.value='playing';shell.value?.focus();if(document.hidden)pause()},
   onStats(state){stats.oxygen=state.oxygen;stats.maxOxygen=state.maxOxygen;stats.health=state.health;stats.coins=state.coins;stats.distance=Math.floor((state.x-90)/10);stats.score=stats.distance+state.coins*10},
   onEnd(result,events,message){
    phase.value='over';reason.value=message;resetInput();best.value=Math.max(best.value,result.distance)
    try{localStorage.setItem('iss-flight-best',String(best.value))}catch{}
    if(runId){pending.queue({runId,events,ticks:result.ticks,userId:runUser,startedAt});void save()}
    else{progression.completeGuest(crypto.randomUUID(),result);guestMissions.value=advanceMissions(guestMissions.value,result);try{localStorage.setItem('iss-flight-guest-missions',JSON.stringify(guestMissions.value))}catch{}saveMessage.value='Vuelo invitado: medallas en este dispositivo; monedas sin guardar en la nube.'}
   },
  })
 }catch(error){if(disposed||attempt!==generation)return;phase.value='ready';errorMessage.value=error instanceof Error?error.message:'No se pudo preparar el vuelo.'}
}
async function save(){
 if(!record.value||saving.value)return
 const current=record.value
 saving.value=true;saveMessage.value='Verificando el vuelo…'
 try{
  if(current.userId!==account.session.value?.user.id)throw new Error('Inicia sesión con la cuenta que comenzó este vuelo.')
  const result=await $fetch<{coins:number}>('/api/games/finish',{method:'POST',headers:{Authorization:`Bearer ${await account.accessToken()}`},body:{runId:current.runId,ticks:current.ticks,events:current.events}})
  pending.complete(current);saveMessage.value=`Vuelo verificado · +${result.coins} monedas en tu cuenta.`;await progression.refresh();await loadMissions()
 }catch(error:any){saveMessage.value=error.data?.statusMessage||error.message||'No se pudo guardar. Reinténtalo.'}finally{saving.value=false}
}
function abandon(){pending.discard();saveMessage.value='Resultado pendiente descartado. Puedes empezar otro vuelo.'}
function reconnect(){if(record.value&&navigator.onLine)void save()}
watch(()=>record.value?.runId,()=>{reconnect()})
function toggleAudio(){muted.value=!muted.value;controller?.muted(muted.value);try{localStorage.setItem('iss-runner-muted',String(muted.value))}catch{}}
async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await shell.value?.requestFullscreen()}catch{errorMessage.value='Este navegador no admite pantalla completa. El juego ya se adapta al tamaño disponible.'}}
function fullscreenChanged(){fullscreen.value=!!document.fullscreenElement}
watch(()=>account.session.value?.user.id,()=>{cloudMissions.value={};void loadMissions()})
onMounted(()=>{
 try{muted.value=localStorage.getItem('iss-runner-muted')!=='false';best.value=Math.max(0,Number(localStorage.getItem('iss-flight-best'))||0);const saved=JSON.parse(localStorage.getItem('iss-flight-guest-missions')||'{}');guestMissions.value=Object.fromEntries(flightMissions.map(m=>[m.key,Math.max(0,Math.min(m.target,Number(saved?.[m.key])||0))]))}catch{}
 progression.init().then(loadMissions).catch(()=>{errorMessage.value='No se pudo cargar la cuenta. Puedes volar como invitado.'})
 window.addEventListener('online',reconnect);window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',pause);document.addEventListener('visibilitychange',visibility);document.addEventListener('fullscreenchange',fullscreenChanged)
})
onBeforeUnmount(()=>{disposed=true;generation++;controller?.destroy();resetInput();window.removeEventListener('online',reconnect);window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('fullscreenchange',fullscreenChanged)})
</script>
<template>
 <section ref="shell" class="runner-shell" :class="{ 'is-playing':phase==='playing' }" tabindex="0" aria-label="ISS Runner: mantén pulsado o usa espacio para volar; suelta para descender." @focusout="event=>{if(!shell?.contains(event.relatedTarget as Node))pause()}">
  <header class="flight-topbar">
   <NuxtLink class="flight-brand" to="/juegos" aria-label="Volver al catálogo"><GameIcon name="orbit" :size="28"/><span>ISS <b>RUNNER</b><small>ORBITAL RUSH</small></span></NuxtLink>
   <span class="wallet-pill"><GameIcon name="coin" :size="19"/>{{ account.session.value ? account.balance.value : phase==='playing'?stats.coins:progression.coins.value }}<small>{{ account.session.value?'':phase==='playing'?'vuelo':'local' }}</small></span>
   <button class="icon-button" :aria-label="phase==='playing'?'Pausar':'Pantalla completa'" @click="phase==='playing'?pause():toggleFullscreen()"><GameIcon :name="phase==='playing'?'pause':'fullscreen'"/></button>
  </header>
  <div class="flight-stage" :class="{ 'menu-open':view!=='hangar' }">
   <PendingRunNotice v-if="record&&phase==='ready'" :busy="saving" :message="saveMessage" @retry="save" @discard="abandon"/><p v-if="pending.warning.value" class="recovery-warning" role="status">{{pending.warning.value}}</p>
   <div ref="canvasHost" class="canvas-host" :aria-hidden="phase!=='playing'" />
   <div v-if="phase==='playing'" class="flight-hud" aria-label="Estado del vuelo"><div><strong>{{ stats.distance }}<small> m</small></strong><span>DISTANCIA</span></div><div class="suit-health" aria-label="Resistencia del traje"><i v-for="heart in 3" :key="heart" :class="{ lost:heart>stats.health }"/></div><div class="air-meter"><span>O₂ {{ Math.ceil(stats.oxygen) }} s</span><meter :value="stats.oxygen" :max="stats.maxOxygen" min="0">{{ Math.ceil(stats.oxygen) }}</meter></div></div>
   <div v-if="phase==='playing'&&activeMission" class="live-mission"><GameIcon name="missions" :size="13"/>{{ activeMission.title }} · {{ liveMissionProgress }}/{{ activeMission.target }}<span v-if="liveMissionProgress>=activeMission.target">✓</span></div><div v-if="phase==='playing'" class="boost-hint">{{ input.boosting?'PROPULSOR ACTIVO':'MANTÉN PULSADO PARA VOLAR' }}</div>
   <button v-if="phase==='playing'" class="flight-touch-area" aria-label="Activar propulsor: mantén pulsado para subir" @pointerdown.prevent="press" @pointerup="release" @pointercancel="release" @lostpointercapture="release" @contextmenu.prevent/>
   <div v-if="view==='hangar'&&phase==='ready'" class="hangar-screen">
    <div class="hangar-heading"><span class="status-tag"><i/> {{progression.activeMap.value.name}} · TODO LISTO</span><h1>ESCAPA DE<br><em>LA ÓRBITA.</em></h1><p>Un dedo. Un propulsor. Todo el espacio.</p></div>
    <div class="pilot-display" aria-hidden="true"><div class="pilot-orbit"/><img src="/games/runner/flight-pilot-preview.png" width="192" height="192" alt=""/><span class="pilot-tag">EXPLORADOR · MK 02</span></div>
    <div class="hangar-bottom"><div class="hangar-stats"><span><GameIcon name="trophy" :size="18"/> Mejor vuelo <b>{{ best }} m</b></span><button @click="openTab('missions')"><GameIcon name="missions" :size="18"/> Misiones <b>{{ completed }}/3</b></button></div><button class="launch-button" @click="start()"><GameIcon name="play"/>COMENZAR VUELO<span>→</span></button><p>Mantén pulsado para subir · Suelta para bajar</p><button v-if="account.session.value" class="guest-link" @click="start(true)">Volar como invitado</button></div>
   </div>
   <div v-if="view==='hangar'&&phase==='loading'" class="flight-overlay"><span class="loading-ring"/><h2>Preparando el despegue</h2><p>Cargando el equipo de vuelo…</p></div>
   <div v-if="view==='hangar'&&phase==='paused'" class="flight-overlay"><span class="status-tag">EN ESPERA</span><h2>Misión en pausa</h2><p>Tómate un respiro. Tu vuelo te espera.</p><button class="launch-button" @click="resume"><GameIcon name="play"/>REANUDAR VUELO</button><button class="secondary-button" @click="openTab('shop')">Visitar la tienda</button></div>
   <div v-if="view==='hangar'&&phase==='over'" class="flight-overlay result-screen"><span class="status-tag">INFORME DE MISIÓN</span><h2>Buen vuelo,<br><em>explorador.</em></h2><p>{{ reason }}</p><div class="result-stats"><div><strong>{{ stats.distance }}<small> m</small></strong><span>DISTANCIA</span></div><div><strong>{{ stats.coins }}</strong><span>MONEDAS</span></div><div><strong>{{ stats.score }}</strong><span>PUNTOS</span></div></div><NextMapGoal game="iss-runner" :best="progression.best.value"/><p v-if="saveMessage" class="save-status" role="status">{{ saveMessage }}</p><button v-if="record" class="secondary-button" :disabled="saving" @click="save">{{ saving?'Verificando…':'Reintentar guardado' }}</button><button v-if="record&&!saving" class="guest-link" @click="abandon">Continuar sin guardar</button><button class="launch-button" :disabled="saving||!!record" @click="start()"><GameIcon name="play"/>VOLVER A VOLAR</button><button class="secondary-button" @click="openTab('missions')">Ver misiones · {{ completed }}/3</button></div>
   <section v-if="view!=='hangar'" class="in-game-panel" :aria-label="tabs.find(tab=>tab.key===view)?.label">
    <div class="panel-top"><span class="status-tag">CENTRO DE OPERACIONES</span><button class="icon-button" aria-label="Volver al hangar" @click="view='hangar'"><GameIcon name="close"/></button></div>
    <h2 class="panel-title" tabindex="-1">{{ view==='shop'?'Prepara tu equipo':view==='maps'?'Explora nuevos mundos':view==='missions'?'Cada vuelo cuenta':view==='ranking'?'La élite orbital':'Tu centro de mando' }}</h2>
    <UpgradeBay v-if="view==='shop'" game="iss-runner"/><WorldMapSelector v-if="view==='maps'" game="iss-runner" :selected="progression.selected.value" :best="progression.best.value" @select="progression.selectMap"/>
    <template v-if="view==='missions'"><FlightMissions :progress="progress" :verified="!!account.session.value"/><p v-if="missionError" role="alert">{{ missionError }}</p></template>
    <GameLeaderboard v-if="view==='ranking'"/>
    <template v-if="view==='settings'"><div class="setting-row"><span>Sonido de la misión</span><button class="secondary-button" :aria-pressed="!muted" @click="toggleAudio">{{ muted?'Activar sonido':'Silenciar' }}</button></div><button class="secondary-button" @click="toggleFullscreen">{{ fullscreen?'Salir de pantalla completa':'Pantalla completa' }}</button><PlayerAccount/><details class="flight-instructions"><summary>Cómo jugar</summary><p>Mantén pulsada la zona de vuelo o la tecla espacio para subir. Suelta para descender. El avance es automático. Cruza entre los emisores, recoge monedas y oxígeno. Escape pausa; al cambiar de pestaña también se pausa.</p><p>Las mejoras se aplican al siguiente vuelo. Las misiones conceden medallas. Como invitado puedes mejorar tu equipo con monedas locales; al entrar en una cuenta se utiliza únicamente su saldo verificado.</p></details><GamePrivacy/></template>
   </section>
  </div>
  <footer class="flight-footer">
   <button v-if="phase==='playing'" class="boost-button" @pointerdown.prevent="press" @pointerup="release" @pointercancel="release" @lostpointercapture="release" @contextmenu.prevent><GameIcon name="rocket"/> MANTÉN PARA VOLAR <span>↑</span></button>
   <nav v-else class="flight-tabs" aria-label="Menú del juego"><button v-for="tab in tabs" :key="tab.key" :class="{active:view===tab.key}" :aria-current="view===tab.key?'page':undefined" :disabled="phase==='loading'" @click="openTab(tab.key)"><GameIcon :name="tab.icon" :size="22"/><span>{{ tab.label }}</span><i v-if="tab.key==='missions'&&completed>0"/></button></nav>
  </footer>
  <div v-if="errorMessage" class="flight-error" role="alert"><p>{{ errorMessage }}</p><button v-if="account.session.value&&phase==='ready'" class="secondary-button" @click="start(true)">Volar como invitado</button><button class="icon-button" aria-label="Cerrar aviso" @click="errorMessage=''"><GameIcon name="close"/></button></div>
 </section>
</template>
<style scoped>
.recovery-warning{position:absolute;z-index:7;left:12px;right:12px;bottom:8px;padding:10px;border:1px solid #8b6f42;border-radius:10px;background:#302b20;color:#f2d5a3;font-size:11px;text-align:center;pointer-events:none}
.runner-shell{--flight-mint:#78e0cb;--flight-gold:#f3c67a;position:relative;isolation:isolate;display:flex;flex-direction:column;width:100%;height:100%;min-height:420px;overflow:hidden;background:#0a1828;color:#edf3ef;border:1px solid #30485a;border-radius:26px;box-shadow:0 28px 90px #0006;outline-offset:-4px;font-family:var(--font-sans)}
.flight-topbar{display:flex;align-items:center;gap:14px;padding:14px 20px;background:#0d1d2c;border-bottom:1px solid #294252;z-index:5;flex-shrink:0}.flight-brand{display:flex;align-items:center;gap:9px;color:#78e0cb;font-size:15px;font-weight:400;line-height:1}.flight-brand b{color:#eff4ee}.flight-brand small{display:block;font-size:8px;letter-spacing:.2em;color:#82a1b3;margin-top:6px}.wallet-pill{display:flex;align-items:center;gap:7px;margin-left:auto;padding:9px 13px;border:1px solid #665230;background:#322b20;border-radius:22px;color:#f3c67a;font-weight:800;font-size:14px}.wallet-pill small{font-size:9px;color:#c2ac85}.icon-button{display:inline-flex;align-items:center;justify-content:center;min-width:42px;min-height:42px;background:transparent;border:1px solid #355062;border-radius:13px;color:#c9dee5;cursor:pointer}
.flight-stage{position:relative;flex:1;min-height:0;background:#091529;overflow:hidden}.canvas-host{position:absolute;inset:0}.canvas-host :deep(canvas){display:block}.hangar-screen{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;background:linear-gradient(#06101a25,#06101a33),url('/games/runner/hangar.svg') center center/cover;text-align:center;overflow:hidden}.hangar-heading{z-index:1;padding:24px 14px 0}.status-tag{font-size:9px;letter-spacing:.16em;font-weight:800;color:#88c6c6;display:inline-flex;gap:7px;align-items:center}.status-tag i{width:5px;height:5px;border-radius:50%;background:#80dfbb;box-shadow:0 0 9px #80dfbb}.hangar-heading h1{font-size:clamp(28px,6vw,52px);letter-spacing:-.045em;font-weight:950;font-style:italic;line-height:1.02;margin:16px 0 12px;color:#f4f3e9}.hangar-heading h1 em,.result-screen em{color:var(--flight-mint);font-style:inherit}.hangar-heading p{color:#a5becb;font-size:12px}.pilot-display{position:relative;flex:1;min-height:90px;width:100%;display:flex;align-items:center;justify-content:center}.pilot-display img{position:relative;z-index:1;width:clamp(100px,27vh,200px);height:auto;max-height:100%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 18px 15px #0007);animation:pilot-hover 4s ease-in-out infinite}.pilot-orbit{position:absolute;width:180px;height:180px;border:1px solid #78e0cb20;border-radius:50%;box-shadow:0 0 70px #78e0cb10,inset 0 0 50px #78e0cb08}.pilot-tag{position:absolute;bottom:0;font-size:8px;letter-spacing:.17em;color:#89aebb}.hangar-bottom{width:min(100%,400px);padding:18px 24px 22px;z-index:1}.hangar-stats{display:flex;justify-content:space-between;gap:10px;margin-bottom:18px}.hangar-stats span,.hangar-stats button{display:flex;align-items:center;gap:5px;color:#a3bdc8;font-size:10px}.hangar-stats button{background:none;border:none;cursor:pointer}.hangar-stats b{color:#f1dcab;font-size:12px}.launch-button{width:100%;display:flex;align-items:center;justify-content:center;gap:12px;min-height:56px;padding:14px 18px;background:#78e0cb;color:#0a292d;border:1px solid #b0f9e7;border-bottom:4px solid #379f8f;border-radius:16px;font-size:13px;font-weight:900;letter-spacing:.06em;box-shadow:0 6px 24px #78e0cb15;cursor:pointer}.launch-button span{margin-left:auto;font-size:20px}.launch-button:active{transform:translateY(2px);border-bottom-width:2px}.launch-button:disabled{opacity:.45;cursor:wait}.hangar-bottom>p{margin-top:11px;color:#8fa9b7;font-size:10px}.guest-link{display:block;margin:9px auto 0;padding:7px;background:none;border:none;color:#bad1d9;font-size:11px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.flight-footer{flex-shrink:0;padding:7px 12px max(10px,env(safe-area-inset-bottom));background:#0d1d2c;border-top:1px solid #294252;z-index:5}.flight-tabs{display:flex;justify-content:space-around}.flight-tabs button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-width:43px;min-height:54px;color:#7d9bad;border:0;border-radius:12px;background:transparent;cursor:pointer;font-size:9px;font-family:inherit}.flight-tabs button.active{color:#83e3cc;background:#78e0cb0c}.flight-tabs button i{position:absolute;top:6px;right:8px;background:#f4c577;width:5px;height:5px;border-radius:50%}.flight-tabs button:disabled{opacity:.4}
.flight-hud{position:absolute;left:16px;right:16px;top:16px;z-index:3;display:flex;justify-content:space-between;align-items:center;gap:12px;pointer-events:none}.flight-hud strong{font-size:32px;text-shadow:0 2px 8px #0008;display:block;font-weight:900;line-height:1}.flight-hud strong small{font-size:14px}.flight-hud span{font-size:8px;letter-spacing:.12em;color:#a6c6d1}.suit-health{display:flex;gap:4px}.suit-health i{display:block;width:8px;height:18px;border-radius:3px;background:#78e0cb;transform:skew(-12deg)}.suit-health i.lost{background:#355062}.air-meter{display:flex;flex-direction:column;gap:5px}.air-meter meter{width:82px;height:8px;accent-color:#78e0cb}.flight-touch-area{position:absolute;inset:0;width:100%;height:100%;z-index:2;background:none;border:none;touch-action:none;user-select:none;cursor:pointer}.live-mission{position:absolute;left:16px;bottom:44px;display:flex;align-items:center;gap:6px;border:1px solid #4a655c77;border-radius:20px;padding:7px 10px;background:#0b1c27bb;color:#b1dccb;z-index:3;pointer-events:none;font-size:9px}.live-mission span{color:#f4c879}.boost-hint{position:absolute;bottom:16px;left:0;right:0;text-align:center;font-size:9px;letter-spacing:.18em;color:#a2c4d0;z-index:3;pointer-events:none;text-shadow:0 2px 6px #000}.boost-button{width:100%;display:flex;align-items:center;justify-content:center;gap:12px;min-height:52px;border:1px solid #365f68;border-radius:15px;background:#193a45;color:#9be7d8;font-size:11px;font-weight:900;letter-spacing:.1em;touch-action:none;user-select:none;cursor:pointer}.boost-button:active{background:#326b6b}.boost-button span{font-size:24px;margin-left:auto}.flight-overlay{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:26px max(24px,8%);text-align:center;background:#081727ed;overflow:auto}.flight-overlay h2{font-size:clamp(26px,5vw,42px);letter-spacing:-.035em;line-height:1.08}.flight-overlay>p{font-size:12px;color:#a1bdca;max-width:340px}.flight-overlay .launch-button{max-width:340px}.secondary-button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:10px 16px;background:#1a3448;border:1px solid #36556b;border-radius:12px;color:#d2e4e6;font:600 12px var(--font-sans);cursor:pointer}.result-stats{display:flex;justify-content:space-around;gap:22px;width:100%;padding:20px 4px;border-top:1px solid #2c4558;border-bottom:1px solid #2c4558}.result-stats strong{display:block;color:#f6ca7e;font-size:28px}.result-stats small{font-size:12px}.result-stats span{font-size:8px;letter-spacing:.16em;color:#8aa9b9}.save-status{font-size:11px!important}.loading-ring{width:40px;height:40px;border:2px solid #325363;border-top-color:#78e0cb;border-radius:50%;animation:spin 1s linear infinite}
.in-game-panel{position:absolute;inset:0;z-index:4;background:#0c1d2e;overflow:auto;overscroll-behavior:contain;padding:18px 20px 28px;scrollbar-width:thin}.panel-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.panel-title{font-size:26px;letter-spacing:-.03em;margin:16px 0 24px;outline:none}.in-game-panel :deep(.panel-card){padding:18px;background:#142a3e;border-color:#30495d;box-shadow:none;border-radius:18px}.in-game-panel :deep(.section-title){font-size:20px}.in-game-panel :deep(.shop-grid){grid-template-columns:1fr}.in-game-panel :deep(.glass-card){background:#142b40;border-color:#2b465c}.in-game-panel :deep(.btn){font-size:12px;min-height:42px;padding:10px 12px}.in-game-panel :deep(.btn-primary){background:#78e0cb}.in-game-panel :deep(.text-soft),.in-game-panel :deep(.section-subtitle){font-size:12px;line-height:1.65}.in-game-panel :deep(.shop-grid h3){font-size:15px}.in-game-panel :deep(.shop-grid article){gap:10px}.in-game-panel :deep(.shop-grid article>span){font-size:11px;color:#91b5c2}.in-game-panel :deep(.shop-grid .btn){background:#28534f;border-color:#498078;color:#bbecdb}.setting-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;margin-bottom:14px}.in-game-panel> :deep(section),.in-game-panel>details{margin-top:18px}.flight-instructions{padding:16px;background:#142b40;border-radius:16px;color:#a4bfca;font-size:12px}.flight-instructions summary{cursor:pointer;color:#dfebe9;font-weight:700}.flight-instructions p{color:#a4bfca;margin-top:12px}.flight-error{position:absolute;z-index:10;left:12px;right:12px;bottom:85px;display:flex;align-items:center;gap:10px;padding:14px;background:#422e27;border:1px solid #a3734a;border-radius:16px}.flight-error p{font-size:11px;color:#ffe0ba;flex:1}.flight-error .icon-button{min-width:32px;min-height:32px}.runner-shell :focus-visible{outline:2px solid #f3c67a;outline-offset:3px}.runner-shell:fullscreen{border-radius:0;border:0;max-width:none;height:100dvh}
@keyframes pilot-hover{0%,100%{transform:translateY(-4px) rotate(-3deg)}50%{transform:translateY(7px) rotate(2deg)}}@keyframes spin{to{transform:rotate(360deg)}}
@media(min-width:750px){.hangar-heading{padding-top:32px}.hangar-heading h1{font-size:56px}.pilot-display img{width:180px}.in-game-panel{padding:24px max(28px,10%)}.in-game-panel :deep(.shop-grid){grid-template-columns:repeat(2,minmax(0,1fr))}.hangar-bottom{padding-bottom:26px}.hangar-screen{background-size:cover}.flight-tabs button{min-width:80px}.flight-hud{left:30px;right:30px;top:25px}}
@media(max-height:600px) and (min-width:600px){.runner-shell{min-height:280px}.flight-topbar{padding:6px 16px}.flight-footer{padding:4px 16px}.flight-tabs button{min-height:42px;flex-direction:row;gap:8px}.hangar-heading{position:absolute;left:5%;top:6%;text-align:left;padding:0}.hangar-heading h1{font-size:34px}.pilot-display{position:absolute;right:10%;top:10%;width:35%;height:65%}.pilot-display img{width:130px}.hangar-bottom{position:absolute;left:4%;bottom:3%;width:47%;padding:0 10px}.hangar-stats{margin-bottom:8px}.launch-button{min-height:46px}.hangar-bottom>p{margin-top:5px}.pilot-tag{bottom:-2px}.flight-overlay{gap:10px}.flight-overlay h2{font-size:25px}.result-stats{padding:10px;max-width:400px}.flight-overlay>p{font-size:11px}}
@media(prefers-reduced-motion:reduce){.pilot-display img,.loading-ring{animation:none}}
.flight-overlay{justify-content:flex-start}.flight-overlay>*{flex-shrink:0}.flight-overlay>:first-child{margin-top:auto}.flight-overlay>:last-child{margin-bottom:auto}
</style>
