import client from './client'

export async function getMyOnboardingPG() {
  const { data } = await client.get('/onboarding/my-pg')
  return data
}

export async function createOnboardingPG(payload) {
  const { data } = await client.post('/onboarding/create-pg', payload)
  return data
}

export async function updateOnboardingPG(id, payload) {
  const { data } = await client.patch(`/onboarding/${id}`, payload)
  return data
}

export async function submitOnboardingPG() {
  const { data } = await client.post('/onboarding/submit')
  return data
}
