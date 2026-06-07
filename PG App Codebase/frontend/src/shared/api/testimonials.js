import client from './client'

export async function getPublicTestimonials(pgId) {
  const { data } = await client.get('/testimonials', { params: { pgId } })
  return data
}

export async function getFeaturedTestimonials() {
  const { data } = await client.get('/testimonials/featured')
  return data
}

export async function createTestimonial(body) {
  const { data } = await client.post('/testimonials', body)
  return data
}

export async function getMyTestimonials() {
  const { data } = await client.get('/testimonials/mine')
  return data
}

export async function getOwnerTestimonials(params = {}) {
  const { data } = await client.get('/testimonials/pg', { params })
  return data
}

export async function updateTestimonial(id, body) {
  const { data } = await client.patch(`/testimonials/${id}`, body)
  return data
}

export async function getAdminTestimonials(params = {}) {
  const { data } = await client.get('/testimonials/admin', { params })
  return data
}
