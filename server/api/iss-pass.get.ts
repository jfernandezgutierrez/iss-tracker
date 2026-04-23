export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const lat = Number(query.lat)
  const lng = Number(query.lng)

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return {
      response: []
    }
  }

  const url = `http://api.open-notify.org/iss-pass.json?lat=${lat}&lon=${lng}`

  try {
    const data = await $fetch<any>(url)
    return data
  } catch {
    return {
      response: []
    }
  }
})
