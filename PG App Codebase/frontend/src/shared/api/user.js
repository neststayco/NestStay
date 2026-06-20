import client from './client'

export const getUserInteractions = () =>
  client.get('/user/interactions').then(r => r.data)

export const toggleSave = (pgId) =>
  client.post(`/user/pgs/${pgId}/save`).then(r => r.data)

export const getSavedPGs = () =>
  client.get('/user/saved').then(r => r.data)
