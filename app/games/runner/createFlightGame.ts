import type Phaser from 'phaser'
import { createFlight, stepFlight, flightResult, FLIGHT, type FlightState } from '#shared/games/flight'
import { FPS, type Loadout } from '#shared/games/config'
import type { InputEvent } from '#shared/games/runner'
import type { RunnerController } from './createGame'
export interface FlightOptions {
 seed: number; loadout: Loadout; input: { boosting: boolean }; muted: boolean
 onReady(): void; onStats(state: FlightState): void
 onEnd(result: ReturnType<typeof flightResult>, events: InputEvent[], reason: string): void
}
export function mountFlight(P: typeof Phaser, parent: HTMLElement, options: FlightOptions): RunnerController {
 let paused = false; let muted = options.muted; let ready = false; let audio: AudioContext | undefined
 const state = createFlight(options.seed, options.loadout)
 const events: InputEvent[] = []; let lastBoost = false
 const height = FLIGHT.height
 const viewportWidth = () => Math.max(280, Math.min(1200, Math.round(height * parent.clientWidth / Math.max(1,parent.clientHeight))))
 let logicalWidth = viewportWidth()
 function beep(frequency: number) {
   if (muted) return
   try { audio ||= new AudioContext(); const tone=audio.createOscillator();const volume=audio.createGain();tone.type='sine';tone.frequency.value=frequency;volume.gain.setValueAtTime(.025,audio.currentTime);volume.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.1);tone.connect(volume);volume.connect(audio.destination);tone.start();tone.stop(audio.currentTime+.1) } catch {}
 }
 class FlightScene extends P.Scene {
   pilot!: Phaser.GameObjects.Sprite
   art!: Phaser.GameObjects.Graphics
   effects!: Phaser.GameObjects.Graphics
   backdrop!: Phaser.GameObjects.Graphics
   items: Phaser.GameObjects.Sprite[]=[]
   emitters: Phaser.GameObjects.Sprite[]=[]
   particles: {x:number;y:number;vx:number;vy:number;life:number;color:number}[]=[]
   accumulator=0
   constructor(){super('orbital-flight')}
   preload(){
     this.load.spritesheet('flight-pilot','/games/runner/flight-pilot.png',{frameWidth:48,frameHeight:48})
     this.load.spritesheet('flight-hazards','/games/runner/flight-hazards.png',{frameWidth:48,frameHeight:48})
     this.load.spritesheet('flight-items','/games/runner/objects.png',{frameWidth:16,frameHeight:16})
   }
   create(){
     this.backdrop=this.add.graphics().setScrollFactor(0).setDepth(-5)
     this.art=this.add.graphics()
     this.effects=this.add.graphics().setDepth(8)
     this.pilot=this.add.sprite(state.x,state.y,'flight-pilot').setScale(1.45).setDepth(4)
     this.anims.create({key:'flight-hover',frames:this.anims.generateFrameNumbers('flight-pilot',{start:0,end:7}),frameRate:10,repeat:-1})
     this.anims.create({key:'flight-boost',frames:this.anims.generateFrameNumbers('flight-pilot',{start:8,end:15}),frameRate:15,repeat:-1})
     for(let i=0;i<64;i++)this.items.push(this.add.sprite(0,0,'flight-items').setScale(1.7).setVisible(false).setDepth(2))
     for(let i=0;i<16;i++)this.emitters.push(this.add.sprite(0,0,'flight-hazards').setScale(1.1).setVisible(false).setDepth(3))
     ready=true;this.paint();options.onStats(state);options.onReady()
   }
   burst(color:number){for(let i=0;i<8&&this.particles.length<60;i++)this.particles.push({x:state.x,y:state.y,vx:Math.cos(i)*2,vy:Math.sin(i)*2,life:24,color})}
   paint(){
     const cameraX=state.x-logicalWidth*.26
     this.cameras.main.scrollX=cameraX
     const biome=(state.mapIndex+Math.floor(state.x/14000))%3
     const glow=[0x3aa8c6,0x9e71db,0x5db397][biome]!
     this.backdrop.clear().fillStyle(0x091529).fillRect(0,0,logicalWidth,height)
     const shift=cameraX*.17%200
     for(let panel=-1;panel<logicalWidth/200+1;panel++){
       const x=panel*200-shift
       this.backdrop.fillStyle(0x122940).fillRoundedRect(x+10,64,174,440,10)
       this.backdrop.lineStyle(2,0x25475f).strokeRoundedRect(x+10,64,174,440,10)
       this.backdrop.fillStyle(0x051123).fillRoundedRect(x+24,84,146,180,7)
       for(let star=0;star<8;star++)this.backdrop.fillStyle(0xb5e8f4,.6).fillRect(x+35+(star*31)%125,99+(star*47)%150,2,2)
       this.backdrop.fillStyle(glow,.12).fillCircle(x+115,185,47)
       this.backdrop.fillStyle(0x24455a).fillRect(x+35,285,120,4)
       for(let pipe=0;pipe<3;pipe++)this.backdrop.fillStyle(0x1a334a).fillRect(x+35+pipe*37,310,10,152)
     }
     this.backdrop.fillStyle(0x213b50).fillRect(0,0,logicalWidth,35).fillRect(0,606,logicalWidth,34)
     this.backdrop.fillStyle(glow,.7).fillRect(0,34,logicalWidth,3).fillRect(0,602,logicalWidth,3)
     const floorShift=cameraX%80
     for(let tile=-1;tile<logicalWidth/80+1;tile++)this.backdrop.lineStyle(2,0x3b5262).lineBetween(tile*80-floorShift,610,tile*80+30-floorShift,638)
     this.art.clear();this.effects.clear()
     let itemIndex=0;let emitterIndex=0
     for(const chunk of state.chunks){
       const gate=chunk.gate;const top=gate.center-gate.gap/2;const bottom=gate.center+gate.gap/2
       const color=[0x5ce9e8,0xffae65,0xea7cce][gate.type]!
       this.art.lineStyle(13,color,.1).lineBetween(gate.x,35,gate.x,top-8).lineBetween(gate.x,bottom+8,gate.x,603)
       this.art.lineStyle(4,color,.9).lineBetween(gate.x,35,gate.x,top-8).lineBetween(gate.x,bottom+8,gate.x,603)
       this.art.lineStyle(1,0xffffff,.8).lineBetween(gate.x+1,35,gate.x+1,top-8).lineBetween(gate.x+1,bottom+8,gate.x+1,603)
       for(const y of [top-20,bottom+20]) if(emitterIndex<this.emitters.length)this.emitters[emitterIndex++]!.setPosition(gate.x,y).setFrame(gate.type*4+Math.floor(state.tick/7)%4).setVisible(true)
       for(const item of chunk.items){
         if(state.collected.has(item.id)||itemIndex>=this.items.length)continue
         this.items[itemIndex++]!.setPosition(item.x,item.y).setFrame(item.oxygen?1:0).setVisible(true)
       }
     }
     for(;itemIndex<this.items.length;itemIndex++)this.items[itemIndex]!.setVisible(false)
     for(;emitterIndex<this.emitters.length;emitterIndex++)this.emitters[emitterIndex]!.setVisible(false)
     this.pilot.setPosition(state.x,state.y).setAngle(Math.max(-12,Math.min(14,state.vy/22))).play(state.boosting?'flight-boost':'flight-hover',true)
     this.pilot.setAlpha(state.tick<state.invulnerableUntil&&state.tick%12<6?.4:1)
     if(state.shield)this.effects.lineStyle(2,0x5ce9e8,.7).strokeCircle(state.x,state.y,40)
     if(state.boosting&&!state.dead){
       this.effects.fillStyle(0xff7644,.8).fillTriangle(state.x-29,state.y+17,state.x-15,state.y+17,state.x-29,state.y+48+state.tick%8)
       this.effects.fillStyle(0xffdf8e).fillTriangle(state.x-26,state.y+17,state.x-19,state.y+17,state.x-25,state.y+35)
     }
     this.particles=this.particles.filter(p=>p.life>0)
     for(const p of this.particles){if(!paused){p.x+=p.vx;p.y+=p.vy;p.life--}this.effects.fillStyle(p.color,p.life/24).fillRect(p.x,p.y,4,4)}
   }
   override update(_time:number,delta:number){
     if(!ready)return
     if(paused||state.dead){this.paint();return}
     this.accumulator+=Math.min(delta,100)
     while(this.accumulator>=1000/FPS&&!state.dead){
       this.accumulator-=1000/FPS
       if(options.input.boosting!==lastBoost){lastBoost=options.input.boosting;events.push({tick:state.tick,direction:1,jump:lastBoost})}
       const coins=state.coins;const health=state.health
       stepFlight(state,options.input.boosting)
       if(state.coins>coins){beep(880);this.burst(0xffd269)}
       if(state.health<health){beep(130);this.burst(0xff776b)}
       if(state.tick%6===0)options.onStats(state)
     }
     this.paint()
     if(state.dead){this.burst(0xff9c56);options.onStats(state);options.onEnd(flightResult(state),events,state.reason)}
   }
 }
 const game=new P.Game({type:P.AUTO,parent,width:logicalWidth,height,backgroundColor:'#091529',pixelArt:true,antialias:false,input:{keyboard:false},scale:{mode:P.Scale.FIT,autoCenter:P.Scale.CENTER_BOTH},scene:FlightScene,audio:{noAudio:true}})
 const observer=new ResizeObserver(()=>{const width=viewportWidth();if(width!==logicalWidth){logicalWidth=width;game.scale.resize(width,height)}})
 observer.observe(parent)
 return {pause(value){paused=value;if(value)options.input.boosting=false},muted(value){muted=value},destroy(){ready=false;observer.disconnect();game.destroy(true);audio?.close().catch(()=>{})}}
}
