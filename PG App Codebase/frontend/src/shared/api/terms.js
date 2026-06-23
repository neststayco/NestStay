import client from './client'

export async function getTerms() {
  const { data } = await client.get('/terms')
  return data
}

export async function updateTerms(content) {
  const { data } = await client.patch('/terms', { content })
  return data
}
