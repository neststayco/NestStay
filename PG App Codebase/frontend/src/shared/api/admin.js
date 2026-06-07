import client from './client'

export async function getGlobalStats() {
  const { data } = await client.get('/admin/complaints/stats')
  return data
}

export async function getStatsByPG() {
  const { data } = await client.get('/admin/complaints/by-pg')
  return data
}

export async function getAllUsers(params = {}) {
  const { data } = await client.get('/admin/users', { params })
  return data
}

export async function deactivateUser(id) {
  const { data } = await client.patch(`/admin/users/${id}/deactivate`)
  return data
}
