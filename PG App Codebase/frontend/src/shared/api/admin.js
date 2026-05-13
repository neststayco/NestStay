import client from './client'

export async function getGlobalStats() {
  const { data } = await client.get('/admin/complaints/stats')
  return data // { success, data: { totalComplaints, verifiedComplaints, ... } }
}

export async function getStatsByPG() {
  const { data } = await client.get('/admin/complaints/by-pg')
  return data // { success, data: [{ _id, pgName, complaintCount, verifiedComplaints, unverifiedComplaints }] }
}
