import { cleanArcadeLoadout } from './progression'
export type ArcadeMode='meteor-dodge'|'iss-docking'
export const ARCADE_VERSION:Record<ArcadeMode,string>={'meteor-dodge':'meteor-v1','iss-docking':'docking-v1'}
export const ARCADE_TICKS=180*60
export interface ArcadeInput {x:-1|0|1;y:-1|0|1;boost:boolean}
export interface ArcadeEvent extends ArcadeInput {tick:number}
export interface Rock {id:number;x:number;y:number;vx:number;vy:number;radius:number;crystal:boolean}
export interface ArcadeState {
 mode:ArcadeMode;seed:number;tick:number;x:number;y:number;vx:number;vy:number;health:number;coins:number
 rocks:Rock[];spawned:number;shieldUntil:number;shieldReady:number;previousBoost:boolean
 fuel:number;maxFuel:number;range:number;approach:number;travelled:number;dead:boolean;success:boolean;reason:string
 loadout:Record<string,number>;mapIndex:number;precision:number
}
function random(seed:number,n:number){let x=Math.imul(seed^(n+223),1597334677);x=Math.imul(x^x>>>16,3812015801);return((x^x>>>16)>>>0)/4294967296}
export function createArcade(mode:ArcadeMode,seed:number,upgrades:Record<string,number>={}):ArcadeState{
 const loadout=cleanArcadeLoadout(mode,upgrades);const mapIndex=loadout.map_index||0;const maxFuel=100+(loadout.tank||0)*20-mapIndex*12
 return {mode,seed,tick:0,x:mode==='meteor-dodge'?320:75+mapIndex*12,y:mode==='meteor-dodge'?740:-55-mapIndex*10,vx:0,vy:0,health:3,coins:0,rocks:[],spawned:0,shieldUntil:0,shieldReady:0,previousBoost:false,fuel:maxFuel,maxFuel,range:75+mapIndex*15,approach:0,travelled:0,dead:false,success:false,reason:'',loadout,mapIndex,precision:0}
}
export function stepArcade(s:ArcadeState,input:ArcadeInput){
 if(s.dead)return
 s.tick++;const dt=1/60
 if(s.mode==='meteor-dodge'){
  const speed=300*(1+(s.loadout.handling||0)*.12);const diagonal=input.x&&input.y?Math.SQRT1_2:1
  s.x=Math.max(27,Math.min(613,s.x+input.x*speed*dt*diagonal));s.y=Math.max(100,Math.min(850,s.y+input.y*speed*dt*diagonal))
  if(input.boost&&!s.previousBoost&&s.tick>=s.shieldReady){s.shieldUntil=s.tick+120+(s.loadout.barrier||0)*60;s.shieldReady=s.tick+600}
  s.previousBoost=input.boost
  const interval=Math.max(32,84-Math.floor(s.tick/600)*4-s.mapIndex*10)
  if(s.tick===1||s.tick%interval===0){
   const id=s.spawned++;const crystal=id%4===3;const radius=crystal?14:24+random(s.seed,id*3)*20
   s.rocks.push({id,x:45+random(s.seed,id*3+1)*550,y:-55,vx:(random(s.seed,id*3+2)-.5)*65,vy:(crystal?180:170+random(s.seed,id+700)*100)+s.mapIndex*38+Math.min(160,s.tick/100),radius,crystal})
  }
  s.rocks=s.rocks.filter(rock=>rock.y<970)
  for(const rock of s.rocks){
   rock.x=Math.max(rock.radius,Math.min(640-rock.radius,rock.x+rock.vx*dt));rock.y+=rock.vy*dt
   const distance=Math.hypot(s.x-rock.x,s.y-rock.y)
   if(rock.crystal&&distance<31+(s.loadout.collector||0)*18){s.coins++;rock.y=1000}
   else if(!rock.crystal&&distance<rock.radius+17&&s.tick>=s.shieldUntil){s.health--;s.shieldUntil=s.tick+95;rock.y=1000}
  }
  s.travelled=Math.floor(s.tick/6)
  if(s.health<=0){s.dead=true;s.reason='La nave necesita reparaciones. Buen intento, piloto.'}
 }else{
  const acceleration=20;const drag=.975-(s.loadout.stabilizer||0)*.008
  s.vx=(s.vx+input.x*acceleration*dt)*drag;s.vy=(s.vy+input.y*acceleration*dt)*drag
  s.x=Math.max(-180,Math.min(180,s.x+s.vx*dt));s.y=Math.max(-180,Math.min(180,s.y+s.vy*dt))
  const active=input.boost&&s.fuel>0
  s.approach=active?Math.min(3,s.approach+.8*dt):Math.max(.28,s.approach-1.8*(1+(s.loadout.dampener||0)*.25)*dt)
  const distance=Math.min(s.range,s.approach*dt);s.range-=distance;s.travelled+=distance
  s.fuel=Math.max(0,s.fuel-(((input.x!==0||input.y!==0) ? .65 : 0)+(active?1.1:0))*dt)
  const tolerance=12-s.mapIndex*2
  s.precision=Math.max(0,Math.round(100-Math.hypot(s.x,s.y)*2))
  if(s.range<=.0001){
   s.dead=true;s.success=Math.abs(s.x)<=tolerance&&Math.abs(s.y)<=tolerance&&Math.abs(s.vx)<6&&Math.abs(s.vy)<6&&s.approach<=.65
   if(s.success){s.coins=20+Math.floor(s.precision/5)+s.mapIndex*5;s.reason='¡Acoplamiento confirmado! Bienvenido a la estación.'}
   else s.reason=s.approach>.65?'Aproximación demasiado rápida. Frena antes del contacto.':'La nave no estaba alineada. Ajusta los dos ejes antes del contacto.'
  }
  if(s.fuel<=0&&!s.dead){s.dead=true;s.reason='Sin combustible. La aproximación se ha interrumpido.'}
 }
 if(s.tick>=ARCADE_TICKS&&!s.dead){s.dead=true;s.success=s.mode==='meteor-dodge';s.reason=s.success?'¡Patrulla de tres minutos completada!':'Tiempo agotado. Vuelve a intentarlo desde el simulador.'}
}
export function arcadeResult(s:ArcadeState){const distance=Math.floor(s.travelled);return {distance,coins:s.coins,score:distance+s.coins*10,ticks:s.tick}}
export function replayArcade(mode:ArcadeMode,seed:number,loadout:Record<string,number>,events:ArcadeEvent[],ticks:number){
 if(!Number.isInteger(ticks)||ticks<1||ticks>ARCADE_TICKS||!Array.isArray(events)||events.length>ARCADE_TICKS)throw new Error('Registro de juego inválido.')
 let previous=-1
 for(const event of events){if(!event||!Number.isInteger(event.tick)||event.tick<=previous||event.tick<0||event.tick>=ticks||![-1,0,1].includes(event.x)||![-1,0,1].includes(event.y)||typeof event.boost!=='boolean')throw new Error('Controles inválidos.');previous=event.tick}
 const state=createArcade(mode,seed,loadout);let cursor=0;let input:ArcadeInput={x:0,y:0,boost:false}
 while(!state.dead&&state.tick<ticks){if(events[cursor]?.tick===state.tick)input=events[cursor++]!;stepArcade(state,input)}
 if(!state.dead||state.tick!==ticks)throw new Error('La partida no ha terminado o incluye controles posteriores al final.')
 return arcadeResult(state)
}
