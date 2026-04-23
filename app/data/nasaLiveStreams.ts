/**
 * Directos oficiales de la NASA.
 *
 * `youtubeId` se usa para construir la URL de embed y el enlace directo a YouTube.
 * Añadir/quitar entradas aquí afecta tanto a /directos como al panel del mapa.
 */
export interface NasaLiveStream {
  id: string
  title: string
  description: string
  category: 'iss' | 'mission' | 'tv' | 'earth'
  youtubeId: string
}

export const nasaLiveStreams: NasaLiveStream[] = [
  {
    id: 'iss-hdev',
    title: 'ISS en directo — vistas de la Tierra',
    description:
      'Cámaras exteriores de la Estación Espacial Internacional mostrando la Tierra desde ~400 km de altura.',
    category: 'iss',
    youtubeId: 'sWasdbDVNvc'
  },
  {
    id: 'iss-inside',
    title: 'ISS — vida a bordo',
    description:
      'Transmisiones desde el interior de la estación: actividades de la tripulación, experimentos y comunicaciones.',
    category: 'iss',
    youtubeId: 'xAieE-QtOeM'
  },
  {
    id: 'nasa-tv-public',
    title: 'NASA TV — Canal público',
    description:
      'Cobertura en directo 24/7 de misiones, lanzamientos, ruedas de prensa y contenidos educativos de la NASA.',
    category: 'tv',
    youtubeId: '21X5lGlDOfg'
  },
  {
    id: 'nasa-tv-media',
    title: 'NASA TV — Canal de medios',
    description:
      'Señal técnica sin comentarios enfocada a operaciones de misión, EVAs y eventos clave en directo.',
    category: 'tv',
    youtubeId: 'RSBjwuyqdJs'
  },
  {
    id: 'earth-from-space',
    title: 'La Tierra desde el espacio',
    description:
      'Transmisión HD de cámaras orientadas a la Tierra, con música ambiental. Ideal para dejar de fondo.',
    category: 'earth',
    youtubeId: 'P9C25Un7xaM'
  },
  {
    id: 'nasa-spacex',
    title: 'Misiones tripuladas NASA / SpaceX',
    description:
      'Cobertura de lanzamientos, acoplamientos y regresos de las cápsulas Crew Dragon hacia y desde la ISS.',
    category: 'mission',
    youtubeId: 'DIgkvm2nmHc'
  }
]

export function getStreamById(id: string): NasaLiveStream | undefined {
  return nasaLiveStreams.find(s => s.id === id)
}
