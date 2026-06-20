import client from './client'

export async function createComplaint({ pgId, type, description, image, isAnonymous }) {
  const { data } = await client.post('/complaints', { pgId, type, description, image, isAnonymous })
  return data
}

export async function getComplaints(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null && v !== false)
  )
  const { data } = await client.get('/complaints', { params: clean })
  return data // { success, data: Complaint[], pagination }
}

export async function getMyComplaints() {
  const { data } = await client.get('/complaints/mine')
  return data // { success, data: Complaint[] }
}

export async function updateComplaintStatus(id, { status }) {
  const { data } = await client.patch(`/complaints/${id}`, { status })
  return data
}

export async function deleteComplaint(id) {
  const { data } = await client.delete(`/complaints/${id}`)
  return data
}
