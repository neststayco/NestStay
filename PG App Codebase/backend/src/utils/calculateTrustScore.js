/**
 * Trust score formula: max(0, verifiedComplaints * 2 - unverifiedComplaints)
 * This same formula is embedded in the getPGList aggregation pipeline ($addFields stage).
 * Both must stay in sync.
 */
export function calculateTrustScore(verifiedComplaints, unverifiedComplaints) {
  return Math.max(0, verifiedComplaints * 2 - unverifiedComplaints);
}
