export interface IssPosition {
  latitude: number
  longitude: number
  altitude: number | null
  velocity: number | null
  visibility: string | null
  footprint: number | null
  timestamp: number | null
}

export interface Astronaut {
  id: string
  name: string
  country: string | null
  flag: string | null
  agency: string | null
  role: string | null
  image: string | null
  bio: string | null
}

const ISS_NOW_ENDPOINT = 'https://api.wheretheiss.at/v1/satellites/25544'
const ASTROS_ENDPOINT = 'https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json'

export async function fetchIssPosition(): Promise<IssPosition> {
  const data = await $fetch<any>(ISS_NOW_ENDPOINT)

  return {
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    altitude: data.altitude != null ? Number(data.altitude) : null,
    velocity: data.velocity != null ? Number(data.velocity) : null,
    visibility: data.visibility ?? null,
    footprint: data.footprint != null ? Number(data.footprint) : null,
    timestamp: data.timestamp != null ? Number(data.timestamp) : null
  }
}

export async function fetchAstronauts(): Promise<Astronaut[]> {
  const data = await $fetch<any>(ASTROS_ENDPOINT)

  const people = Array.isArray(data?.people) ? data.people : []

  return people
    .filter((person: any) => person?.iss === true)
    .map((person: any, index: number) => ({
      id: String(person?.id ?? `astro-${index}`),
      name: String(person?.name || 'Unknown'),
      country: person?.country || null,
      flag: person?.flag_code
        ? `https://flagcdn.com/w40/${String(person.flag_code).toLowerCase()}.png`
        : null,
      agency: person?.agency || null,
      role: person?.position || null,
      image: person?.image || null,
      bio: null
    }))
}
