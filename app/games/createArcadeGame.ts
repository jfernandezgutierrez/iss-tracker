import type Phaser from 'phaser'
import {createArcade,stepArcade,arcadeResult,type ArcadeMode,type ArcadeInput,type ArcadeEvent,type ArcadeState} from '#shared/games/arcade'
export interface ArcadeController{pause(value:boolean):void;destroy():void}
export interface ArcadeOptions{mode:ArcadeMode;seed:number;loadout:Record<string,number>;input:ArcadeInput;pulseBoost:boolean;target:{x:number;y:number}|null;onReady():void;onStats(state:ArcadeState):void;onEnd(result:ReturnType<typeof arcadeResult>,events:ArcadeEvent[],message:string):void}
export function mountArcade(P:typeof Phaser,parent:HTMLElement,options:ArcadeOptions):ArcadeController{
 const state=createArcade(options.mode,options.seed,options.loadout);const events:ArcadeEvent[]=[];let paused=false;let ready=false;let last:ArcadeInput={x:0,y:0,boost:false}
 class ArcadeScene extends P.Scene{
  art!:Phaser.GameObjects.Graphics;ship!:Phaser.GameObjects.Sprite;station?:Phaser.GameObjects.Image;rocks:Phaser.GameObjects.Sprite[]=[];crystals:Phaser.GameObjects.Graphics[]=[];accumulator=0
  constructor(){super('orbital-arcade')}
  preload(){this.load.spritesheet('arcade-ship',`/games/arcade/${options.mode==='meteor-dodge'?'meteor':'docking'}-ship.png`,{frameWidth:64,frameHeight:64});this.load.spritesheet('arcade-rock','/games/arcade/meteors.png',{frameWidth:64,frameHeight:64});this.load.image('arcade-station','/games/arcade/station.png')}
  create(){this.art=this.add.graphics();this.ship=this.add.sprite(state.x,state.y,'arcade-ship').setDepth(3);if(options.mode==='iss-docking')this.station=this.add.image(320,410,'arcade-station').setDepth(1);for(let i=0;i<32;i++){this.rocks.push(this.add.sprite(0,0,'arcade-rock').setVisible(false).setDepth(2));this.crystals.push(this.add.graphics().setDepth(2))}ready=true;this.paint();options.onStats(state);options.onReady()}
  paint(){
   const art=this.art;const palette=[0x78dfe5,0xb5a1ee,0xf4bc76][state.mapIndex]!;art.clear().fillStyle(0x091728).fillRect(0,0,640,900)
   art.fillStyle(palette,.05).fillCircle(500,180,220)
   for(let i=0;i<90;i++){const x=(i*137+options.seed%640)%640;const y=(i*i*31+state.tick*(options.mode==='meteor-dodge'?.8:.07))%900;art.fillStyle(0x9bc5d5,.25+(i%3)*.2).fillRect(x,y,i%4===0?3:2,i%4===0?3:2)}
   if(options.mode==='meteor-dodge'){
    art.lineStyle(1,palette,.12);for(let y=0;y<900;y+=90)art.lineBetween(0,(y+state.tick*2)%900,640,(y+state.tick*2)%900)
    this.ship.setPosition(state.x,state.y).setAngle(options.input.x*9).setFrame(Math.floor(state.tick/6)%4)
    this.ship.setAlpha(state.tick<state.shieldUntil&&state.tick%12<6?.5:1)
    if(state.tick<state.shieldUntil)art.lineStyle(3,0x83e6dd,.75).strokeCircle(state.x,state.y,43)
    let r=0;let c=0
    for(const rock of state.rocks){if(rock.crystal){const g=this.crystals[c++]!;g.clear().fillStyle(0x91eee0).fillPoints([{x:rock.x,y:rock.y-17},{x:rock.x+13,y:rock.y},{x:rock.x,y:rock.y+17},{x:rock.x-13,y:rock.y}],true).lineStyle(2,0xd7fff5).lineBetween(rock.x,rock.y-12,rock.x,rock.y+10)}else this.rocks[r++]!.setVisible(true).setPosition(rock.x,rock.y).setFrame(rock.id%4).setDisplaySize(rock.radius*2,rock.radius*2).setAngle(rock.id*33+state.tick*.12)}
    for(;r<this.rocks.length;r++)this.rocks[r]!.setVisible(false);for(;c<this.crystals.length;c++)this.crystals[c]!.clear()
   }else{
    const scale=1+(75+state.mapIndex*15-state.range)/90
    this.station!.setScale(scale).setAlpha(.9)
    art.lineStyle(1,0x7ac2ce,.15);for(let x=0;x<640;x+=64)art.lineBetween(x,100,x,740);for(let y=100;y<750;y+=64)art.lineBetween(0,y,640,y)
    art.lineStyle(2,0x89dce4,.65).strokeCircle(320,410,85).lineBetween(205,410,275,410).lineBetween(365,410,435,410).lineBetween(320,295,320,365).lineBetween(320,455,320,525)
    const x=320+state.x*1.5;const y=410+state.y*1.5
    const aligned=Math.abs(state.x)<12-state.mapIndex*2&&Math.abs(state.y)<12-state.mapIndex*2
    art.lineStyle(2,aligned?0x8bedd3:0xf0bd79,.9).strokeRect(x-24,y-24,48,48).lineBetween(x-36,y,x+36,y).lineBetween(x,y-36,x,y+36)
    this.ship.setPosition(x,y).setScale(.65).setFrame(Math.floor(state.tick/8)%4).setAlpha(.9)
    art.lineStyle(2,0x5e8d9f,.7).strokeRect(50,784,540,12);art.fillStyle(state.approach>.65?0xf0a077:0x83dfc9).fillRect(52,786,Math.min(536,state.approach/3*536),8)
   }
  }
  override update(_time:number,delta:number){
   if(!ready)return;if(paused||state.dead){this.paint();return}
   this.accumulator+=Math.min(100,delta)
   while(this.accumulator>=1000/60&&!state.dead){
    this.accumulator-=1000/60
    let input={...options.input}
    if(options.pulseBoost){input.boost=true;options.pulseBoost=false}
    if(options.mode==='meteor-dodge'&&options.target){const target=options.target;input.x=Math.abs(target.x-state.x)<9?0:target.x>state.x?1:-1;input.y=Math.abs(target.y-state.y)<9?0:target.y>state.y?1:-1}
    if(input.x!==last.x||input.y!==last.y||input.boost!==last.boost){events.push({tick:state.tick,...input});last=input}
    stepArcade(state,input);if(state.tick%6===0)options.onStats(state)
   }
   this.paint();if(state.dead){options.onStats(state);options.onEnd(arcadeResult(state),events,state.reason)}
  }
 }
 const game=new P.Game({type:P.AUTO,parent,width:640,height:900,backgroundColor:'#091728',pixelArt:true,input:{keyboard:false},scale:{mode:P.Scale.FIT,autoCenter:P.Scale.CENTER_BOTH},scene:ArcadeScene,audio:{noAudio:true}})
 const observer=new ResizeObserver(()=>game.scale.refresh());observer.observe(parent)
 return{pause(value){paused=value;if(value){options.input.x=0;options.input.y=0;options.input.boost=false;options.target=null;options.pulseBoost=false}},destroy(){ready=false;observer.disconnect();game.destroy(true)}}
}
