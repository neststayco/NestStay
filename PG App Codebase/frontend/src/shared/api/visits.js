import client from './client'

export async function createVisit(data) {
  const { data: res } = await client.post('/visits', data)
  return res
}

export async function getOwnerVisits() {
  const { data } = await client.get('/visits/owner')
  return data
}
