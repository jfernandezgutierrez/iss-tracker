export const flightMissions = [
  { key: 'distance', title: 'Primera órbita', description: 'Recorre 100 m en un solo vuelo.', target: 100, icon: 'orbit' },
  { key: 'coins', title: 'Cazatesoros', description: 'Recoge 20 monedas entre tus vuelos.', target: 20, icon: 'coin' },
  { key: 'flights', title: 'Licencia de piloto', description: 'Completa 3 vuelos.', target: 3, icon: 'wings' },
] as const
export type MissionProgress = Record<string, number>
export function advanceMissions(previous: MissionProgress, result: { distance: number; coins: number }): MissionProgress {
  return { distance: Math.max(previous.distance || 0, result.distance), coins: Math.min(20, (previous.coins || 0) + result.coins), flights: Math.min(3, (previous.flights || 0) + 1) }
}
