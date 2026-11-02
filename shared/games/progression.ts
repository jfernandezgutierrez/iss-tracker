export type GameSlug='iss-runner'|'meteor-dodge'|'iss-docking'
export interface WorldMap {key:string;name:string;description:string;index:number;unlock:number;color:string}
export interface GameUpgrade {key:string;name:string;description:string;price:number;maxLevel:number}
export interface GameMission {key:string;title:string;description:string;target:number}
export const worldMaps:Record<GameSlug,WorldMap[]>={
 'iss-runner':[
  {key:'orbit',name:'Órbita terrestre',description:'El hangar de salida. Pasillos amplios y vuelo equilibrado.',index:0,unlock:0,color:'#78e0cb'},
  {key:'lunar',name:'Base lunar',description:'Más velocidad y pasillos algo más estrechos.',index:1,unlock:100,color:'#b6a3ef'},
  {key:'mars',name:'Frontera roja',description:'El reto experto: rayos más cerrados y mayor consumo.',index:2,unlock:300,color:'#f4a373'},
 ],
 'meteor-dodge':[
  {key:'belt',name:'Cinturón exterior',description:'Aprende a leer las trayectorias y recoge cristales.',index:0,unlock:0,color:'#f4bc76'},
  {key:'nebula',name:'Nebulosa violeta',description:'Meteoritos más rápidos entre nubes de polvo.',index:1,unlock:250,color:'#b6a3ef'},
  {key:'storm',name:'Tormenta solar',description:'Oleadas más intensas para pilotos expertos.',index:2,unlock:600,color:'#ef8a7c'},
 ],
 'iss-docking':[
  {key:'training',name:'Puerto de prácticas',description:'Aproximación tranquila y buena tolerancia de alineación.',index:0,unlock:0,color:'#78dce7'},
  {key:'night',name:'Lado nocturno',description:'Más distancia y menor margen de acoplamiento.',index:1,unlock:250,color:'#b6a3ef'},
  {key:'deep',name:'Estación remota',description:'Más exigente: poco combustible y mayor precisión.',index:2,unlock:500,color:'#f4bc76'},
 ],
}
export const arcadeUpgrades:Record<'meteor-dodge'|'iss-docking',GameUpgrade[]>={
 'meteor-dodge':[
  {key:'handling',name:'Motores vectoriales',description:'Un 12% más de velocidad de maniobra por nivel.',price:35,maxLevel:3},
  {key:'barrier',name:'Escudo extendido',description:'El escudo dura un segundo más por nivel.',price:45,maxLevel:2},
  {key:'collector',name:'Recolector magnético',description:'Aumenta el radio de recogida de cristales.',price:40,maxLevel:3},
 ],
 'iss-docking':[
  {key:'stabilizer',name:'Estabilizador orbital',description:'Reduce la inercia lateral para ajustar la alineación.',price:35,maxLevel:3},
  {key:'tank',name:'Depósito auxiliar',description:'Añade 20 unidades de combustible por nivel.',price:40,maxLevel:3},
  {key:'dampener',name:'Freno de aproximación',description:'Frena un 25% más rápido al soltar el impulsor.',price:50,maxLevel:2},
 ],
}
export const arcadeMissions:Record<'meteor-dodge'|'iss-docking',GameMission[]>={
 'meteor-dodge':[
  {key:'score',title:'Entre las rocas',description:'Consigue 250 puntos en una partida.',target:250},
  {key:'coins',title:'Prospector espacial',description:'Recoge 20 cristales entre tus partidas.',target:20},
  {key:'plays',title:'Piloto de patrulla',description:'Completa 3 partidas.',target:3},
 ],
 'iss-docking':[
  {key:'score',title:'Contacto confirmado',description:'Consigue 250 puntos en una aproximación.',target:250},
  {key:'coins',title:'Especialista orbital',description:'Obtén 40 créditos de acoplamiento acumulados.',target:40},
  {key:'plays',title:'Horas de simulador',description:'Completa 3 aproximaciones.',target:3},
 ],
}
export function cleanArcadeLoadout(game:'meteor-dodge'|'iss-docking',value:Record<string,number>={}) {
 return {...Object.fromEntries(arcadeUpgrades[game].map(item=>[item.key,Math.max(0,Math.min(item.maxLevel,Math.floor(Number(value[item.key])||0)))])),map_index:Math.max(0,Math.min(2,Math.floor(Number(value.map_index)||0)))} as Record<string,number>
}
export function advanceArcadeMissions(previous:Record<string,number>,result:{score:number;coins:number}) {return {score:Math.max(previous.score||0,result.score),coins:Math.min(1000,(previous.coins||0)+result.coins),plays:Math.min(3,(previous.plays||0)+1)}}
