import client from './client'

export async function getPGList(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  const { data } = await client.get('/pgs', { params: clean })
  return data // { success, data: PG[], pagination }
}

export async function getPGDetails(id) {
  const { data } = await client.get(`/pgs/${id}`)
  return data // { success, pg, trust, userContext }
}

export async function createPG(body) {
  const { data } = await client.post('/pgs', body)
  return data
}

export async function updatePG(id, body) {
  const { data } = await client.patch(`/pgs/${id}`, body)
  return data
}

export async function deletePG(id) {
  const { data } = await client.delete(`/pgs/${id}`)
  return data
}

export async function updateMyPGCapacity(totalCapacity) {
  const { data } = await client.patch('/pgs/my/capacity', { totalCapacity })
  return data
}

export async function updateMyPGLocation(lat, lng) {
  const { data } = await client.patch('/pgs/my/location', { lat, lng })
  return data
}

export async function updateMyPGDetails(body) {
  const { data } = await client.patch('/pgs/my/details', body)
  return data
}
