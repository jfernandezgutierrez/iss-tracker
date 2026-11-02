export interface PortalGame {
  slug: string
  title: string
  category: string
  description: string
  fullDescription: string
  objective: string
  pcControls: string[]
  mobileControls: string[]
  mechanics: string[]
  scoring: string[]
  image: string
  imageAlt: string
  status: 'coming-soon' | 'available'
  featured?: boolean
  route: string
  previewRoute?: string
}

export const games: PortalGame[] = [
  {
    slug: 'iss-runner', title: 'ISS Runner', category: 'Vuelo arcade',
    description: 'Despega con un solo dedo, esquiva rayos de energía y conquista la estación orbital.',
    fullDescription: 'Pilota un traje orbital con mochila propulsora en una estación en movimiento. El avance es automático: mantén pulsado para ganar altura y suelta para descender. Regresa al hangar para mejorar tu equipo y completar misiones.',
    objective: 'Llega lo más lejos posible, cruza los espacios entre emisores de energía y recoge monedas y oxígeno.',
    pcControls: ['Mantén espacio, W o flecha arriba para activar el propulsor.', 'Suelta la tecla para descender. El avance es automático.', 'Escape: pausar o reanudar.'],
    mobileControls: ['Mantén pulsada la zona de vuelo o el botón inferior para subir.', 'Suelta para descender.', 'Pulsa pausa para visitar tienda, misiones o perfil sin abandonar el juego.'],
    mechanics: ['Vuelo de un solo control y avance automático.', 'Emisores de energía con pasillos transitables y dificultad progresiva.', 'Monedas, oxígeno, escudo y seis mejoras para el siguiente vuelo.', 'Misiones y récords separados del antiguo modo de plataformas.'],
    scoring: ['Un punto por metro y diez por moneda.', 'Las mejoras de monedas se aplican a las recogidas de la partida.', 'Con una cuenta, el servidor reproduce el vuelo antes de guardar monedas, récord y misiones.', 'Las misiones conceden medallas sin monedas adicionales; el progreso invitado es local.'],
    image: '/games/runner/flight-cover.png', imageAlt: 'ISS Runner Orbital Rush: astronauta original con mochila propulsora en el hangar',
    status: 'available', featured: true, route: '/juegos/iss-runner', previewRoute: '/juegos/iss-runner',
  },
  {
    slug: 'meteor-dodge', title: 'Meteor Dodge', category: 'Arcade',
    description: 'Pon a prueba tus reflejos entre meteoritos en una futura misión de supervivencia.',
    fullDescription: 'Pilota una nave en un campo de meteoritos y encuentra huecos para sobrevivir. Esta propuesta de arcade está en fase conceptual; el diseño definitivo se concretará después de ISS Runner.',
    objective: 'Evita colisiones y sobrevive el mayor tiempo posible.',
    pcControls: ['Propuesta: mover la nave con las flechas o W / A / S / D.', 'Propuesta: Escape para pausar.'],
    mobileControls: ['Propuesta: control direccional táctil para mover la nave.', 'Propuesta: botón de pausa en pantalla.'],
    mechanics: ['Esquivar meteoritos con patrones de dificultad progresiva.', 'Las vidas, los límites de movimiento y los objetos especiales están por definir.'],
    scoring: ['Propuesta: puntuar por tiempo de supervivencia.', 'Bonificaciones y valores pendientes de diseño; no hay clasificación activa.'],
    image: '/games/meteor-dodge.svg', imageAlt: 'Ilustración conceptual de una nave esquivando un campo de meteoritos',
    status: 'coming-soon', route: '/juegos/meteor-dodge',
  },
  {
    slug: 'iss-docking', title: 'ISS Docking', category: 'Simulación',
    description: 'Una futura misión de precisión para acercarte y acoplar tu nave a la estación.',
    fullDescription: 'Practica una aproximación orbital y coordina orientación y velocidad para alcanzar el puerto de acoplamiento. Se trata de un concepto de juego, sin simulación operativa ni fines de entrenamiento real.',
    objective: 'Alinea la nave y completa un acoplamiento suave y controlado.',
    pcControls: ['Propuesta: flechas para ajustar la alineación.', 'Propuesta: W / S para regular la aproximación y Escape para pausar.'],
    mobileControls: ['Propuesta: botones táctiles de alineación y aproximación.', 'Propuesta: botón de pausa en pantalla.'],
    mechanics: ['Control de alineación y velocidad relativa durante la aproximación.', 'Tolerancias, combustible y condiciones de colisión pendientes de diseño.'],
    scoring: ['Propuesta: valorar precisión y suavidad del acoplamiento.', 'Los criterios de éxito y las penalizaciones se definirán antes de implementar el juego.'],
    image: '/games/iss-docking.svg', imageAlt: 'Ilustración conceptual de una nave acercándose a una estación espacial',
    status: 'coming-soon', route: '/juegos/iss-docking',
  },
]
