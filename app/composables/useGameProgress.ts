import { ref, computed, watch } from 'vue'
import { worldMaps, arcadeUpgrades, advanceArcadeMissions, type GameSlug } from '#shared/games/progression'
import { upgradeCatalog } from '#shared/games/config'
import { finiteProgress } from '#shared/games/presentation'
interface GuestProgress {coins:number;levels:Record<string,number>;missions:Record<string,number>;bestScore:number;bestDistance:number;seen:string[]}
function empty():GuestProgress{return{coins:0,levels:{},missions:{},bestScore:0,bestDistance:0,seen:[]}}
export function useGameProgress(game:GameSlug){
 const account=useGameAccount()
 const guest=useState<GuestProgress>(`guest-progress-${game}`,empty)
 const selected=useState(`map-choice-${game}`,()=>worldMaps[game][0]!.key)
 const cloudBest=useState(`verified-best-${game}`,()=>0)
 const missions=useState<Record<string,number>>(`objectives-${game}`,()=>({}))
 const error=ref('');const busy=ref('');const pending=new Map<string,string>()
 const catalog=game==='iss-runner'?upgradeCatalog:arcadeUpgrades[game]
 const mapList=worldMaps[game]
 const best=computed(()=>account.session.value?cloudBest.value:game==='iss-runner'?guest.value.bestDistance:guest.value.bestScore)
 const coins=computed(()=>account.session.value?account.balance.value:guest.value.coins)
 const equipment=computed(()=>account.session.value?account.levels.value:guest.value.levels)
 const objectiveProgress=computed(()=>account.session.value?missions.value:guest.value.missions)
 const activeMap=computed(()=>mapList.find(map=>map.key===selected.value) || mapList[0]!)
 function readGuest(){try{const raw=JSON.parse(localStorage.getItem(`iss-progress-${game}-v1`)||'{}')||{};const number=finiteProgress;return{coins:number(raw.coins),bestScore:number(raw.bestScore),bestDistance:number(raw.bestDistance||(game==='iss-runner'?localStorage.getItem('iss-flight-best'):0)),levels:Object.fromEntries(catalog.map(item=>[item.key,Math.min(item.maxLevel,number(raw.levels?.[item.key]))])),missions:Object.fromEntries(['score','coins','plays'].map(key=>[key,number(raw.missions?.[key])])),seen:Array.isArray(raw.seen)?raw.seen.filter((id:unknown)=>typeof id==='string').slice(-20):[]} as GuestProgress}catch{return{...guest.value,levels:{...guest.value.levels},missions:{...guest.value.missions},seen:[...guest.value.seen]}}}
 function storeGuest(value:GuestProgress){localStorage.setItem(`iss-progress-${game}-v1`,JSON.stringify(value));guest.value=value}
 async function refresh(){
  error.value=''
  if(!account.session.value){cloudBest.value=0;missions.value={};return}
  const uid=account.session.value.user.id;const client=account.getClient()!
  try{
   await account.refresh()
   const{data:g,error:gameError}=await client.from('games').select('id').eq('slug',game).single();if(gameError)throw gameError
   const metric=game==='iss-runner'?'distance':'score'
   const results=await client.from('game_scores').select(metric).eq('user_id',uid).eq('game_id',g.id).eq('verification_status','replayed').order(metric,{ascending:false}).limit(1)
   if(results.error)throw results.error
   let objectiveData:Record<string,number>={}
   if(game!=='iss-runner'){const objectives=await client.from('game_objectives').select('mission_key,progress').eq('user_id',uid).eq('game_id',g.id);if(objectives.error)throw objectives.error;objectiveData=Object.fromEntries(objectives.data.map(row=>[row.mission_key,row.progress]))}
   if(account.session.value?.user.id!==uid)return
   cloudBest.value=Number((results.data?.[0] as any)?.[metric]||0);missions.value=objectiveData
  }catch{error.value='No se pudo cargar la progresión de tu cuenta. Reintenta antes de elegir un mapa nuevo.'}
 }
 async function init(localOnly=false){if(!import.meta.client)return;guest.value=readGuest();if(localOnly)return;await account.init();await refresh();try{const key=localStorage.getItem(`iss-map-choice-${game}-${account.session.value?.user.id||'guest'}`);const stored=mapList.find(map=>map.key===key);if(stored&&stored.unlock<=best.value)selected.value=stored.key}catch{}if(activeMap.value.unlock>best.value)selected.value=mapList[0]!.key}
 function selectMap(key:string){const map=mapList.find(item=>item.key===key);if(!map||map.unlock>best.value)return;selected.value=key;try{localStorage.setItem(`iss-map-choice-${game}-${account.session.value?.user.id||'guest'}`,key)}catch{}}
 function guestLoadout(){const metric=game==='iss-runner'?guest.value.bestDistance:guest.value.bestScore;const map=activeMap.value.unlock<=metric?activeMap.value:mapList[0]!;return{...guest.value.levels,map_index:map.index}}
 function completeGuest(id:string,result:{coins:number;score:number;distance:number}){
  const value=readGuest();if(value.seen.includes(id))return
  value.coins+=result.coins;value.bestScore=Math.max(value.bestScore,result.score);value.bestDistance=Math.max(value.bestDistance,result.distance);value.missions=advanceArcadeMissions(value.missions,result);value.seen=[...value.seen,id].slice(-20)
  try{storeGuest(value)}catch{guest.value=value;error.value='El navegador no permite guardar el progreso en este dispositivo.'}
 }
 async function buy(key:string){
  if(busy.value)return;busy.value=key;error.value=''
  try{
   const item=catalog.find(upgrade=>upgrade.key===key);if(!item)throw new Error('Mejora desconocida.')
   if(account.session.value){
    if(!pending.has(key))pending.set(key,crypto.randomUUID())
    const{error:purchaseError}=await account.getClient()!.rpc('purchase_game_equipment',{p_game:game,p_key:key,p_request:pending.get(key)})
    if(purchaseError){if(purchaseError.code==='P0001')pending.delete(key);throw new Error(purchaseError.message)}
    pending.delete(key);await refresh()
   }else{
    const purchase=()=>{if(account.session.value)throw new Error('La cuenta ha cambiado. Reintenta la compra.');const value=readGuest();const level=value.levels[key]||0;const cost=item.price*(level+1);if(level>=item.maxLevel)throw new Error('Mejora al máximo.');if(value.coins<cost)throw new Error('No tienes suficientes monedas locales.');value.coins-=cost;value.levels[key]=level+1;storeGuest(value)}
    if(navigator.locks)await navigator.locks.request(`iss-purchase-${game}`,purchase);else purchase()
   }
  }catch(cause){error.value=cause instanceof Error?cause.message:'No se pudo completar la compra.'}finally{busy.value=''}
 }
 watch(()=>account.session.value?.user.id,()=>{cloudBest.value=0;missions.value={};selected.value=mapList[0]!.key;void refresh()})
 return{account,game,catalog,mapList,selected,activeMap,best,coins,equipment,objectiveProgress,error,busy,init,refresh,selectMap,guestLoadout,completeGuest,buy}
}
