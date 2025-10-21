import { defineStore } from 'pinia'

export const useISSStore = defineStore('iss', {
  state: () => ({
    data: null,
    crew: [],
    passes: [],
    loading: false
  }),

  actions: {
    async fetchPasses(lat, lon) {
  const apiKey = '4G5K5M-6KPU7C-H4L7X4-5L53'
  const url = `https://api.n2yo.com/rest/v1/satellite/visualpasses/25544/${lat}/${lon}/0/7/300?apiKey=${apiKey}`
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
  try {
    const res = await fetch(proxy)
    const raw = await res.json()
    const data = JSON.parse(raw.contents)
    this.passes = data.passes || []
  } catch (err) {
    console.error('Error obteniendo pasos:', err)
  }
},
    async fetchISS() {
      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544')
        this.data = await res.json()
      } catch (err) {
        console.error('Error al obtener datos ISS:', err)
      }
    },

    async fetchCrew() {
      try {
        const res = await fetch('https://ll.thespacedevs.com/2.2.0/astronaut/?in_space=true')
        const data = await res.json()
        this.crew = data.results
      } catch (err) {
        console.error('Error al obtener tripulación:', err)
      }
    }
  }
})
