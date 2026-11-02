import type Phaser from 'phaser'
import {createArcade,stepArcade,arcadeResult,type ArcadeMode,type ArcadeInput,type ArcadeEvent,type ArcadeState} from '#shared/games/arcade'
import atlasFrames from '../../public/games/arcade/v2/frames.json'
export interface ArcadeController{pause(value:boolean):void;setMuted(value:boolean):void;destroy():void}
export interface ArcadeOptions{mode:ArcadeMode;seed:number;loadout:Record<string,number>;input:ArcadeInput;pulseBoost:boolean;target:{x:number;y:number}|null;muted?:boolean;onReady():void;onStats(state:ArcadeState):void;onEnd(result:ReturnType<typeof arcadeResult>,events:ArcadeEvent[],message:string):void;onError?(message:string):void}
export function mountArcade(P:typeof Phaser,parent:HTMLElement,options:ArcadeOptions):ArcadeController{
 const state=createArcade(options.mode,options.seed,options.loadout)
 const events:ArcadeEvent[]=[]
 const meteor=options.mode==='meteor-dodge'
 const frames=meteor?atlasFrames.meteor.frames:atlasFrames.docking.frames
 let paused=false,ready=false,muted=options.muted!==false
 let last:ArcadeInput={x:0,y:0,boost:false}
 let audio:AudioContext|undefined
 function tone(frequency:number,duration=.12){
  if(muted)return
  try{audio ||= new AudioContext();void audio.resume();const oscillator=audio.createOscillator();const gain=audio.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);oscillator.connect(gain);gain.connect(audio.destination);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};oscillator.start();oscillator.stop(audio.currentTime+duration)}catch{}
 }
 class ArcadeScene extends P.Scene{
  sky!:Phaser.GameObjects.Graphics;art!:Phaser.GameObjects.Graphics;effects!:Phaser.GameObjects.Graphics
  ship!:Phaser.GameObjects.Image;station?:Phaser.GameObjects.Image;port?:Phaser.GameObjects.Image;shield?:Phaser.GameObjects.Image
  exhaust:Phaser.GameObjects.Image[]=[];rocks:Phaser.GameObjects.Image[]=[];crystals:Phaser.GameObjects.Image[]=[]
  particles:{x:number;y:number;vx:number;vy:number;life:number;color:number}[]=[]
  labels:Phaser.GameObjects.Text[]=[];labelLives:number[]=[]
  accumulator=0;visualMs=0;endingAt=0;lastVisualX=0;lastVisualY=0;lastInput:ArcadeInput={x:0,y:0,boost:false}
  constructor(){super('orbital-arcade')}
  preload(){
   this.load.image('arcade-pack',`/games/arcade/v2/${meteor?'meteor':'docking'}-atlas.png`)
   this.load.once('loaderror',()=>options.onError?.('No se han podido cargar los sprites. Comprueba la conexión y vuelve a intentarlo.'))
  }
  create(){
   if(!this.textures.exists('arcade-pack'))return
   const texture=this.textures.get('arcade-pack')
   for(const[name,frame]of Object.entries(frames))texture.add(name,0,frame.x,frame.y,frame.width,frame.height)
   this.sky=this.add.graphics().setDepth(-5);this.art=this.add.graphics();this.effects=this.add.graphics().setDepth(7)
   this.ship=this.add.image(state.x,state.y,'arcade-pack','ship').setDepth(4)
   if(meteor){
    this.shield=this.add.image(0,0,'arcade-pack','shield').setDisplaySize(100,100).setDepth(5).setVisible(false)
    for(let index=0;index<32;index++){
     this.rocks.push(this.add.image(0,0,'arcade-pack','rock').setVisible(false).setDepth(2))
     this.crystals.push(this.add.image(0,0,'arcade-pack','crystal').setVisible(false).setDisplaySize(23,34).setDepth(2))
    }
   }else{
    this.station=this.add.image(320,410,'arcade-pack','station').setDepth(1)
    this.port=this.add.image(320,410,'arcade-pack','port').setDepth(2)
    for(let index=0;index<5;index++)this.exhaust.push(this.add.image(0,0,'arcade-pack','flame').setVisible(false).setDepth(3))
   }
   for(let i=0;i<6;i++){this.labels.push(this.add.text(0,0,'',{fontFamily:'system-ui',fontSize:'21px',fontStyle:'bold',color:'#b8fff0'}).setOrigin(.5).setDepth(9).setVisible(false));this.labelLives.push(0)}
   ready=true;this.paint();options.onStats(state);options.onReady()
  }
  burst(x:number,y:number,color:number,count=12){
   for(let index=0;index<count&&this.particles.length<80;index++)this.particles.push({x,y,vx:Math.cos(index*2.4)*(1+index%4),vy:Math.sin(index*2.4)*(1+index%4),life:32,color})
  }
  label(text:string,x:number,y:number){const index=this.labelLives.findIndex(life=>life<=0);if(index<0)return;this.labelLives[index]=50;this.labels[index]!.setText(text).setPosition(x,y).setAlpha(1).setVisible(true)}
  background(){
   const sky=this.sky;const colors=meteor?[0x173047,0x352347,0x4b2b2b]:[0x122e42,0x26213f,0x302e31]
   sky.clear().fillStyle(0x071521).fillRect(0,0,640,900).fillStyle(colors[state.mapIndex]!,1).fillCircle(530,120,280)
   if(state.mapIndex===1){for(let i=0;i<5;i++)sky.fillStyle(meteor?0x735899:0x394a75,.06).fillEllipse(130+i*100,170+i*125,460,260)}
   if(state.mapIndex===2){sky.fillStyle(0xe58e51,.05).fillCircle(700,390,380);sky.lineStyle(2,0xc98164,.07);for(let i=0;i<8;i++)sky.lineBetween(640,i*130,100,i*130+300)}
   if(!meteor&&state.mapIndex===0){sky.fillStyle(0x153e59).fillCircle(160,1050,430);sky.lineStyle(6,0x5a9bad,.3).strokeCircle(160,1050,430)}
   for(let i=0;i<95;i++){const x=(i*137+options.seed%640)%640;const y=(i*i*31+state.tick*(meteor?.8:.04))%900;sky.fillStyle(0xa9cfdd,.25+(i%3)*.2).fillRect(x,y,i%4===0?3:2,i%4===0?3:2)}
  }
  paint(){
   this.background();this.art.clear();this.effects.clear()
   const ending=state.dead?Math.min(1,(this.visualMs-this.endingAt)/1100):0
   if(meteor){
    const bank=Math.max(-12,Math.min(12,(state.x-this.lastVisualX)*2));this.lastVisualX=state.x
    this.ship.setPosition(state.x,state.y+Math.sin(this.visualMs/200)*1.3).setDisplaySize(66,64).setAngle(bank).setAlpha(state.dead&&!state.success?1-ending:1)
    this.ship.setTint(state.tick<state.shieldUntil&&state.tick%12<6?0x9edce9:0xffffff)
    this.shield!.setVisible(state.tick<state.shieldUntil&&!state.dead).setPosition(state.x,state.y).setAlpha(.45+Math.sin(this.visualMs/100)*.15).setAngle(this.visualMs/90)
    if(!state.dead){for(const dx of[-17,17]){const flicker=6+Math.sin(this.visualMs/35)*5;this.effects.fillStyle(0xffa961,.8).fillTriangle(state.x+dx-4,state.y+25,state.x+dx+4,state.y+25,state.x+dx,state.y+43+flicker);this.effects.fillStyle(0xffe7b2).fillRect(state.x+dx-2,state.y+25,4,10)}}
    let rockIndex=0,crystalIndex=0
    for(const rock of state.rocks){
     if(rock.y>=970)continue
     if(rock.crystal){this.crystals[crystalIndex++]!.setVisible(true).setPosition(rock.x,rock.y).setAngle(Math.sin(this.visualMs/300+rock.id)*12).setAlpha(.85+Math.sin(this.visualMs/160+rock.id)*.15)}
     else this.rocks[rockIndex++]!.setVisible(true).setPosition(rock.x,rock.y).setDisplaySize(rock.radius*2.08,rock.radius*2).setAngle(rock.id*33+this.visualMs*.012).setFlipX(rock.id%2===0).setTint([0xffffff,0xe2d0f0,0xf3d3a9][state.mapIndex]!)
    }
    for(;rockIndex<this.rocks.length;rockIndex++)this.rocks[rockIndex]!.setVisible(false)
    for(;crystalIndex<this.crystals.length;crystalIndex++)this.crystals[crystalIndex]!.setVisible(false)
    if(state.dead&&state.success)this.effects.lineStyle(4,0x9af0ce,.6).strokeCircle(state.x,state.y,40+ending*80)
   }else{
    const progress=(75+state.mapIndex*15-state.range)/(75+state.mapIndex*15)
    const size=245+progress*180
    this.station!.setDisplaySize(size,size*.967).setAlpha(.95)
    const aligned=Math.abs(state.x)<=12-state.mapIndex*2&&Math.abs(state.y)<=12-state.mapIndex*2
    this.port!.setDisplaySize(85+progress*60,85+progress*60).setAlpha(.25+Math.sin(this.visualMs/300)*.08).setTint(aligned?0x8affd4:0xffd5a1)
    this.art.lineStyle(1,0x7ac2ce,.12);for(let x=0;x<640;x+=64)this.art.lineBetween(x,100,x,740);for(let y=100;y<750;y+=64)this.art.lineBetween(0,y,640,y)
    this.art.lineStyle(2,aligned?0x86eacb:0x89bccc,.7).strokeCircle(320,410,84).lineBetween(210,410,275,410).lineBetween(365,410,430,410).lineBetween(320,300,320,365).lineBetween(320,455,320,520)
    let x=320+state.x*1.5,y=410+state.y*1.5
    if(state.dead&&state.success){x+=(320-x)*ending;y+=(410-y)*ending;this.effects.lineStyle(3,0x8dffd3,1-ending*.3).strokeCircle(320,410,50+ending*70)}
    this.ship.setPosition(x,y).setDisplaySize(49-ending*(state.success?10:0),45-ending*(state.success?9:0)).setAngle(Math.max(-9,Math.min(9,state.vx/2))).setAlpha(state.dead&&!state.success?1-ending*.8:1)
    this.effects.lineStyle(2,aligned?0x8bedd3:0xf0bd79,.75).strokeRect(x-28,y-27,56,54)
    this.exhaust.forEach(flame=>flame.setVisible(false))
    if(!state.dead){
     const flicker=1+Math.sin(this.visualMs/30)*.12
     if(this.lastInput.boost)this.exhaust[0]!.setVisible(true).setPosition(x,y+36).setDisplaySize(8*flicker,28*flicker).setAngle(0)
     if(this.lastInput.x!==0)this.exhaust[1]!.setVisible(true).setPosition(x-this.lastInput.x*29,y+8).setDisplaySize(5*flicker,18*flicker).setAngle(this.lastInput.x*90)
     if(this.lastInput.y!==0)this.exhaust[2]!.setVisible(true).setPosition(x,y-this.lastInput.y*29).setDisplaySize(5*flicker,18*flicker).setAngle(this.lastInput.y>0?180:0)
    }
    this.art.lineStyle(2,0x5e8d9f,.65).strokeRect(50,784,540,12).fillStyle(state.approach>.65?0xf0a077:0x83dfc9).fillRect(52,786,Math.min(536,state.approach/3*536),8)
   }
   this.particles=this.particles.filter(particle=>particle.life>0)
   for(const particle of this.particles){if(!paused){particle.x+=particle.vx;particle.y+=particle.vy;particle.life--}this.effects.fillStyle(particle.color,particle.life/32).fillCircle(particle.x,particle.y,2+particle.life/20)}
   this.labels.forEach((label,index)=>{if(this.labelLives[index]!<=0){label.setVisible(false);return}if(!paused){this.labelLives[index]=this.labelLives[index]!-1;label.y-=.65}label.setAlpha(this.labelLives[index]!/50)})
  }
  override update(_time:number,delta:number){
   if(!ready)return
   if(state.dead&&this.visualMs-this.endingAt>1350)return
   if(!paused)this.visualMs+=Math.min(delta,100)
   if(paused||state.dead){this.paint();return}
   this.accumulator+=Math.min(100,delta)
   while(this.accumulator>=1000/60&&!state.dead){
    this.accumulator-=1000/60
    const input={...options.input}
    if(options.pulseBoost){input.boost=true;options.pulseBoost=false}
    if(meteor&&options.target){const target=options.target;input.x=Math.abs(target.x-state.x)<9?0:target.x>state.x?1:-1;input.y=Math.abs(target.y-state.y)<9?0:target.y>state.y?1:-1}
    if(input.x!==last.x||input.y!==last.y||input.boost!==last.boost){events.push({tick:state.tick,...input});last=input}
    this.lastInput=input
    const coins=state.coins,health=state.health,shield=state.shieldReady
    stepArcade(state,input)
    if(state.coins>coins){this.burst(state.x,state.y,0x83efdd);this.label(`+${state.coins-coins}`,state.x,state.y-40);tone(880)}
    if(state.health<health){this.burst(state.x,state.y,0xffa076,22);this.cameras.main.shake(120,.004);tone(130,.2)}
    if(state.shieldReady>shield){this.burst(state.x,state.y,0x83dfff,16);tone(400)}
    if(state.tick%6===0)options.onStats(state)
   }
   if(state.dead){this.endingAt=this.visualMs;if(state.success){this.burst(meteor?state.x:320,meteor?state.y:410,0xa3f2ca,35);tone(660,.25)}else{this.burst(meteor?state.x:320+state.x*1.5,meteor?state.y:410+state.y*1.5,0xffad73,40);tone(100,.3)}}
   this.paint()
   if(state.dead){options.onStats(state);options.onEnd(arcadeResult(state),events,state.reason)}
  }
 }
 const game=new P.Game({type:P.AUTO,parent,width:640,height:900,backgroundColor:'#071521',pixelArt:false,antialias:true,input:{keyboard:false},scale:{mode:P.Scale.FIT,autoCenter:P.Scale.CENTER_BOTH},scene:ArcadeScene,audio:{noAudio:true}})
 const observer=new ResizeObserver(()=>game.scale.refresh());observer.observe(parent)
 return{pause(value){paused=value;if(value){options.input.x=0;options.input.y=0;options.input.boost=false;options.target=null;options.pulseBoost=false;void audio?.suspend()}else void audio?.resume()},setMuted(value){muted=value;if(!value)tone(520)},destroy(){ready=false;observer.disconnect();game.destroy(true);void audio?.close()}}
}
