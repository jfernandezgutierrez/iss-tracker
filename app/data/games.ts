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
    slug: 'iss-runner', title: 'ISS Runner', category: 'Plataformas',
    description: 'Una aventura de plataformas entre estaciones orbitales, monedas y desafíos espaciales.',
    fullDescription: 'Ponte el traje de astronauta y explora una sucesión de plataformas orbitales. Decide cuándo avanzar, retroceder o saltar mientras buscas monedas y cápsulas de oxígeno. El recorrido aumenta su dificultad a medida que progreses.',
    objective: 'Llega lo más lejos posible sin caer, agotar el oxígeno ni sucumbir a los peligros del recorrido.',
    pcControls: ['Flechas izquierda y derecha o A / D: desplazarte libremente.', 'Espacio o flecha arriba: saltar.', 'Escape: pausar o reanudar la partida.'],
    mobileControls: ['Botones táctiles de izquierda y derecha: desplazarte.', 'Botón de salto: superar huecos y obstáculos.', 'Botón de pausa: detener o reanudar la partida.'],
    mechanics: ['Movimiento lateral libre, sin avance automático en la primera versión.', 'Plataformas, obstáculos y enemigos en segmentos generados progresivamente.', 'Monedas coleccionables y oxígeno limitado con cápsulas de recarga.', 'Fin de partida al caer, perder la salud o agotar el oxígeno; reinicio desde el comienzo.'],
    scoring: ['La puntuación combinará distancia máxima alcanzada y monedas recogidas.', 'Retroceder y volver a recorrer el mismo tramo no deberá duplicar los puntos de distancia.', 'Obtienes un punto por metro y diez puntos por moneda. Cada nivel de multiplicador añade una moneda por recogida.', 'Con una cuenta, el servidor reproduce tus controles antes de guardar el resultado y las monedas. Las partidas duran como máximo diez minutos.'],
    image: '/games/iss-runner.svg', imageAlt: 'Ilustración conceptual de un astronauta sobre plataformas orbitales',
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
