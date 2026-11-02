import assert from'node:assert/strict'
import{chromium}from'playwright'
const base=process.env.GAMES_TEST_URL||'http://localhost:3120'
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const errors=[]
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'})
 await context.addInitScript(()=>{try{for(const game of['meteor-dodge','iss-docking']){const key=`iss-progress-${game}-v1`;if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({coins:200,levels:{},missions:{},bestScore:300,bestDistance:0,seen:[]}))}}catch{}})
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message))
 await page.goto(`${base}/juegos`)
 assert.equal(await page.getByText('Disponible',{exact:true}).count(),3)
 for(const game of['meteor-dodge','iss-docking']){
  const meteor=game==='meteor-dodge'
  await page.goto(`${base}/juegos/${game}`)
  await page.getByRole('button',{name:meteor?'INICIAR PATRULLA':'INICIAR APROXIMACIÓN',exact:false}).waitFor()
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1),true)
  await page.screenshot({path:`.cache/${game}-home.png`})
  await page.getByRole('button',{name:'Perfil',exact:true}).tap()
  await page.getByRole('button',{name:'Activar sonido',exact:true}).tap()
  assert.equal(await page.getByRole('button',{name:'Silenciar',exact:true}).getAttribute('aria-pressed'),'true')
  await page.getByRole('button',{name:'Silenciar',exact:true}).tap()
  await page.getByRole('button',{name:'Inicio',exact:true}).tap()
  await page.getByRole('button',{name:'Mapas',exact:true}).tap();await page.getByRole('heading',{name:'Elige tu destino'}).waitFor()
  const locked=page.getByRole('button').filter({hasText:meteor?'Tormenta solar':'Estación remota'})
  assert.equal(await locked.isDisabled(),true)
  await page.getByRole('button').filter({hasText:meteor?'Nebulosa violeta':'Lado nocturno'}).tap()
  await page.screenshot({path:`.cache/${game}-maps.png`})
  await page.getByRole('button',{name:'Mejoras',exact:true}).tap();await page.getByRole('heading',{name:'Mejora tu equipo'}).waitFor()
  await page.getByRole('button',{name:'35 monedas · Mejorar',exact:true}).tap()
  await page.getByText('Nivel 1 / 3',{exact:true}).waitFor()
  assert.equal(await page.locator('.wallet').innerText(),'165')
  await page.getByRole('button',{name:'Misiones',exact:true}).tap();await page.getByRole('heading',{name:'Bitácora de misiones'}).waitFor()
  await page.getByRole('button',{name:'Inicio',exact:true}).tap()
  await page.getByRole('button',{name:meteor?'INICIAR PATRULLA':'INICIAR APROXIMACIÓN',exact:false}).tap()
  await page.getByRole('button',{name:'Pausar',exact:true}).waitFor();await page.locator('canvas').waitFor()
  if(meteor){
   const surface=page.getByRole('button',{name:'Arrastra la nave para esquivar meteoritos'});const bounds=await surface.boundingBox();const cdp=await context.newCDPSession(page)
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bounds.x+bounds.width*.7,y:bounds.y+bounds.height*.55}]});await page.waitForTimeout(400);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
   await page.getByRole('button',{name:'ACTIVAR ESCUDO',exact:false}).tap()
   await page.getByRole('button',{name:/ESCUDO ·/}).waitFor()
  }else{
   const align=page.getByRole('button',{name:'Alinear a la izquierda'});const bounds=await align.boundingBox();const cdp=await context.newCDPSession(page)
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2}]});await page.waitForTimeout(400);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
   await page.getByRole('button',{name:'MANTÉN PARA APROXIMARTE',exact:false}).tap()
  }
  await page.screenshot({path:`.cache/${game}-playing.png`})
  await page.getByRole('button',{name:'Pausar',exact:true}).tap();await page.getByRole('heading',{name:'Misión en pausa'}).waitFor()
  await page.getByRole('button',{name:'Mejoras',exact:true}).tap();await page.getByRole('heading',{name:'Mejora tu equipo'}).waitFor()
  await page.getByRole('button',{name:'Inicio',exact:true}).tap();await page.getByRole('button',{name:'Reanudar misión',exact:true}).tap();await page.keyboard.press('Escape');await page.getByRole('heading',{name:'Misión en pausa'}).waitFor()
  await page.getByRole('button',{name:'Mapas',exact:true}).tap();assert.equal(await page.getByRole('button').filter({hasText:meteor?'Nebulosa violeta':'Lado nocturno'}).getAttribute('aria-pressed'),'true')
  await page.reload();await page.getByRole('button',{name:'Mejoras',exact:true}).tap();await page.getByText('Nivel 1 / 3',{exact:true}).waitFor()
  await page.setViewportSize({width:844,height:390});await page.getByRole('button',{name:'Inicio',exact:true}).tap();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`.cache/${game}-landscape.png`});await page.setViewportSize({width:390,height:844})
 }
 await page.goto(`${base}/juegos/iss-runner`);await page.getByRole('button',{name:'Mapas',exact:true}).tap();await page.getByRole('heading',{name:'Elige tu destino'}).waitFor();await page.getByRole('button',{name:'Tienda',exact:true}).tap();await page.getByRole('heading',{name:'Mejora tu equipo'}).waitFor()
 const desktop=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});const desk=await desktop.newPage();desk.on('pageerror',error=>errors.push(error.message))
 await desk.goto(`${base}/juegos/meteor-dodge`);await desk.getByRole('button',{name:'INICIAR PATRULLA',exact:false}).click();await desk.getByRole('button',{name:'Pausar',exact:true}).waitFor();await desk.keyboard.down('ArrowLeft');await desk.waitForTimeout(250);await desk.keyboard.up('ArrowLeft');await desk.keyboard.press('Escape');await desk.getByRole('heading',{name:'Misión en pausa'}).waitFor();await desk.getByRole('link',{name:'Volver al catálogo'}).click();await desk.getByRole('heading',{name:'Juegos espaciales',exact:true}).waitFor();assert.equal(await desk.locator('canvas').count(),0)
 assert.deepEqual(errors,[])
 console.log('Arcade browser checks passed: both games, touch, keyboard, pause, maps, local purchases, missions, persistence, landscape and Runner integration.')
}finally{await browser.close()}
