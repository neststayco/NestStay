import client from './client'

export const getAllOwners = (params = {}) =>
  client.get('/admin/owners', { params }).then(r => r.data)

export const createOwner = (data) =>
  client.post('/admin/owners', data).then(r => r.data)

export const updateOwner = (id, data) =>
  client.patch(`/admin/owners/${id}`, data).then(r => r.data)

export const resetOwnerPassword = (id, password) =>
  client.patch(`/admin/owners/${id}/password`, { password }).then(r => r.data)
