import { ref } from 'vue'
import type { Astronaut, IssPosition } from '../services/iss'
import { fetchAstronauts, fetchIssPosition } from '../services/iss'

const position = ref<IssPosition | null>(null)
const astronauts = ref<Astronaut[]>([])

const loadingPosition = ref(false)
const loadingAstronauts = ref(false)

const errorPosition = ref<string | null>(null)
const errorAstronauts = ref<string | null>(null)

let positionInterval: ReturnType<typeof setInterval> | null = null

export function useIss() {
  async function loadPosition() {
    loadingPosition.value = true
    errorPosition.value = null

    try {
      position.value = await fetchIssPosition()
    } catch (error: any) {
      errorPosition.value = error?.message || 'Error loading ISS position'
    } finally {
      loadingPosition.value = false
    }
  }

  async function loadAstronauts() {
    loadingAstronauts.value = true
    errorAstronauts.value = null

    try {
      astronauts.value = await fetchAstronauts()
    } catch (error: any) {
      errorAstronauts.value = error?.message || 'Error loading astronauts'
    } finally {
      loadingAstronauts.value = false
    }
  }

  async function loadInitialData() {
    await Promise.all([
      loadPosition(),
      loadAstronauts()
    ])
  }

  function startPositionPolling(ms = 5000) {
    stopPositionPolling()

    positionInterval = setInterval(() => {
      loadPosition()
    }, ms)
  }

  function stopPositionPolling() {
    if (positionInterval) {
      clearInterval(positionInterval)
      positionInterval = null
    }
  }

  return {
    position,
    astronauts,
    loadingPosition,
    loadingAstronauts,
    errorPosition,
    errorAstronauts,
    loadPosition,
    loadAstronauts,
    loadInitialData,
    startPositionPolling,
    stopPositionPolling
  }
}