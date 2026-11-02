import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {chromium} from 'playwright'
await build({entryPoints:['shared/games/arcade.ts'],outfile:'.cache/arcade-finish-core.mjs',bundle:true,platform:'node',format:'esm'})
const{createArcade,stepArcade}=await import('../.cache/arcade-finish-core.mjs')
let fastest={seed:1,ticks:10800}
for(let seed=1;seed<=100;seed++){const state=createArcade('meteor-dodge',seed);while(!state.dead)stepArcade(state,{x:0,y:0,boost:false});if(state.tick<fastest.ticks)fastest={seed,ticks:state.tick}}
const base=process.env.GAMES_TEST_URL||'http://localhost:3130'
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const errors=[]
try{
 for(const mode of['meteor-dodge','iss-docking']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'})
  await context.addInitScript(seed=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=array=>{const value=original(array);if(array instanceof Uint32Array&&array.length===1)array[0]=seed;return value}},fastest.seed)
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message))
  const epoch=Date.now()-60000
  await page.clock.install({time:epoch})
  await page.goto(`${base}/juegos/${mode}`)
  await page.getByRole('button',{name:mode==='meteor-dodge'?'INICIAR PATRULLA':'INICIAR APROXIMACIÓN',exact:false}).waitFor()
  await page.clock.pauseAt(epoch+30000)
  await page.getByRole('button',{name:mode==='meteor-dodge'?'INICIAR PATRULLA':'INICIAR APROXIMACIÓN',exact:false}).dispatchEvent('click')
  for(let i=0;i<50&&await page.getByRole('button',{name:'Pausar',exact:true}).count()===0;i++){await page.clock.runFor(100);await new Promise(resolve=>setTimeout(resolve,50))}
  assert.equal(await page.getByRole('button',{name:'Pausar',exact:true}).count(),1,'Game failed to initialize')
  if(mode==='iss-docking'){
   let previous={x:75,y:-55};let stable=0;const held=new Set()
   const setKeys=async(next)=>{for(const key of held)if(!next.has(key)){await page.keyboard.up(key);held.delete(key)}for(const key of next)if(!held.has(key)){await page.keyboard.down(key);held.add(key)}}
   for(let step=0;step<220&&stable<8;step++){
    const text=await page.locator('.docking-telemetry span').first().innerText();const match=text.match(/X (-?\d+) cm · Y (-?\d+) cm/);assert.ok(match)
    const x=Number(match[1]),y=Number(match[2]);const vx=(x-previous.x)/.1,vy=(y-previous.y)/.1;previous={x,y}
    const predictedX=x+vx*.55,predictedY=y+vy*.55;const next=new Set()
    if(predictedX>2)next.add('ArrowLeft');if(predictedX< -2)next.add('ArrowRight');if(predictedY>2)next.add('ArrowUp');if(predictedY< -2)next.add('ArrowDown')
    await setKeys(next)
    stable=Math.abs(x)<=4&&Math.abs(y)<=4&&Math.abs(vx)<6&&Math.abs(vy)<6?stable+1:0
    await page.clock.runFor(100)
   }
   await setKeys(new Set())
   await page.keyboard.down('Space')
   for(let i=0;i<180;i++){const range=Number((await page.locator('.arcade-hud strong').first().innerText()).replace(' m',''));if(range<=7)break;await page.clock.runFor(250)}
   await page.keyboard.up('Space')
   for(let i=0;i<100&&await page.locator('.ending-status').count()===0&&await page.getByRole('heading',{name:'¡Contacto confirmado!',exact:true}).count()===0;i++)await page.clock.runFor(500)
   await page.clock.runFor(1500)
   await page.getByRole('heading',{name:'¡Contacto confirmado!',exact:true}).waitFor()
   assert.match(await page.locator('.result-detail').innerText(),/Precisión/)
  }else{
   await page.clock.runFor(Math.ceil(fastest.ticks/60)*1000+1800)
   await page.getByRole('heading',{name:'Misión finalizada',exact:true}).waitFor()
   assert.equal(await page.locator('.result-detail').innerText().then(text=>text.includes('Integridad 0 / 3')),true)
  }
  await page.getByText('Progreso y monedas locales guardados en este dispositivo.',{exact:true}).waitFor()
  await page.screenshot({path:`.cache/${mode}-result-v2.png`})
  const saved=await page.evaluate(game=>JSON.parse(localStorage.getItem(`iss-progress-${game}-v1`)),mode)
  assert.equal(saved.missions.plays,1);assert.equal(saved.seen.length,1)
  await page.clock.runFor(2000)
  assert.equal(await page.evaluate(game=>JSON.parse(localStorage.getItem(`iss-progress-${game}-v1`)).missions.plays,mode),1)
  await page.getByRole('button',{name:'Volver a jugar',exact:true}).dispatchEvent('click')
  for(let i=0;i<20&&await page.getByRole('button',{name:'Pausar',exact:true}).count()===0;i++)await page.clock.runFor(100)
  assert.equal(await page.getByRole('button',{name:'Pausar',exact:true}).count(),1)
  await context.close()
  console.log(`${mode}: complete run, ending sequence, result, exactly-once local reward and restart passed`)
 }
 assert.deepEqual(errors,[])
}finally{await browser.close()}
