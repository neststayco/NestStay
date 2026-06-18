export const normalizeAdmission = (admission) => {
  if (!admission) return null
  return {
    ...admission,
    pgId: admission?.pgId?._id || admission?.pgId || null,
  }
}
