export const RULES_VERSION = 'runner-v1'
export const FPS = 60
export const MAX_TICKS = FPS * 600
export const WORLD = { width: 960, height: 540, speed: 230, gravity: 1200, jump: 460, segment: 420, playerWidth: 22, playerHeight: 30 }
export const upgradeCatalog = [
  { key: 'double-jump', name: 'Doble salto', description: 'Permite un segundo salto en el aire.', price: 60, maxLevel: 1 },
  { key: 'magnet', name: 'Imán de monedas', description: 'Recoge monedas en un radio de 90 píxeles.', price: 40, maxLevel: 1 },
  { key: 'shield', name: 'Escudo inicial', description: 'Absorbe el primer impacto de cada partida.', price: 50, maxLevel: 1 },
  { key: 'oxygen', name: 'Reserva de oxígeno', description: 'Añade 20 segundos de oxígeno inicial.', price: 40, maxLevel: 3 },
  { key: 'multiplier', name: 'Multiplicador de monedas', description: 'Añade una moneda por recogida y nivel.', price: 80, maxLevel: 2 },
  { key: 'thruster', name: 'Propulsor de emergencia', description: 'Una recuperación automática al caer por partida.', price: 90, maxLevel: 1 },
] as const
export type Loadout = Record<string, number>
export function normalizedLoadout(value: Loadout = {}): Loadout {
  return Object.fromEntries(upgradeCatalog.map(upgrade => [upgrade.key, Math.max(0, Math.min(upgrade.maxLevel, Math.floor(value[upgrade.key] || 0)))]))
}
