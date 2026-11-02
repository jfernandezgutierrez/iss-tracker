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
    slug: 'meteor-dodge', title: 'Meteor Dodge', category: 'Supervivencia arcade',
    description: 'Esquiva meteoritos, recoge cristales y sobrevive a una patrulla espacial de tres minutos.',
    fullDescription: 'Pilota una nave con un dedo a través de tres sectores. Usa el escudo de emergencia, mejora tus motores y completa misiones para dominar las oleadas de meteoritos.',
    objective: 'Resiste tres minutos o consigue tu mejor puntuación antes de perder la integridad de la nave.',
    pcControls: ['Flechas o WASD: mover la nave.', 'Espacio: activar el escudo cuando esté recargado.', 'Escape: pausar o reanudar.'],
    mobileControls: ['Arrastra la nave por el campo de juego.', 'Pulsa el escudo para protegerte temporalmente.', 'Usa pausa para visitar mapas, mejoras, misiones y perfil.'],
    mechanics: ['Tres mapas con dificultad y aspecto distintos.', 'Escudo recargable, tres puntos de integridad y cristales coleccionables.', 'Motores vectoriales, escudo extendido y recolector con niveles.', 'Misiones y monedas locales para invitados; progreso verificado con una cuenta.'],
    scoring: ['Diez puntos por segundo y diez por cristal.', 'Cada cristal recogido concede una moneda.', 'Las misiones conceden medallas sin monedas adicionales.', 'Los mapas avanzados se desbloquean con 250 y 600 puntos.'],
    image: '/games/arcade/meteor-cover.png', imageAlt: 'Nave original de Meteor Dodge entre asteroides',
    status: 'available', route: '/juegos/meteor-dodge',
  },
  {
    slug: 'iss-docking', title: 'ISS Docking', category: 'Precisión orbital',
    description: 'Alinea tu nave, frena a tiempo y completa un acoplamiento de precisión.',
    fullDescription: 'Practica una aproximación en tres puertos con dificultad creciente. Controla los dos ejes, vigila el combustible y reduce la velocidad antes del contacto. Es un juego de precisión, sin fines de entrenamiento real.',
    objective: 'Llega al puerto alineado, con poca inercia y una velocidad de contacto de 0,65 m/s o menos.',
    pcControls: ['Flechas o WASD: ajustar los dos ejes de alineación.', 'Mantén espacio para acelerar la aproximación; suelta para frenar.', 'Escape: pausar o reanudar.'],
    mobileControls: ['Usa los cuatro botones para centrar la cruz en el puerto.', 'Mantén el impulsor para aproximarte; suelta cerca de la estación.', 'Consulta distancia, velocidad y combustible antes del contacto.'],
    mechanics: ['Inercia lateral, combustible y frenado de aproximación.', 'Tres puertos con tolerancias y distancias diferentes.', 'Estabilizador orbital, depósito auxiliar y freno mejorado.', 'Misiones, récords y mejoras dentro de la pantalla del juego.'],
    scoring: ['Un punto por metro de aproximación completado.', 'Un acoplamiento correcto concede 20 monedas más un extra por precisión y dificultad.', 'Cada moneda añade diez puntos al resultado.', 'Los puertos avanzados se desbloquean con 250 y 500 puntos.'],
    image: '/games/arcade/docking-cover.png', imageAlt: 'Estación orbital original de ISS Docking con puerto de acoplamiento',
    status: 'available', route: '/juegos/iss-docking',
  },
]
