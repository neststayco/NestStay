import client from './client'

export const createAdmissionRequest = (body) =>
  client.post('/admissions', body).then(r => r.data)

export const getMyAdmission = () =>
  client.get('/admissions/mine').then(r => r.data)

export const getPGAdmissions = (params) =>
  client.get('/admissions/pg', { params }).then(r => r.data)

export const getAllAdmissions = (params) =>
  client.get('/admissions', { params }).then(r => r.data)

export const decideAdmission = (id, decision) =>
  client.patch(`/admissions/${id}/decide`, { decision }).then(r => r.data)

export const removeResident = (id) =>
  client.patch(`/admissions/${id}/remove-resident`).then(r => r.data)

export const ownerAddResident = (email) =>
  client.post('/admissions/owner-add', { email }).then(r => r.data)

export const withdrawAdmission = (id) =>
  client.post(`/admissions/${id}/withdraw`).then(r => r.data)
