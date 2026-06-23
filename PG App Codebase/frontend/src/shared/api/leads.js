import client from "./client.js";

export async function recordView(pgId) {
  const { data } = await client.post("/leads/view", { pgId });
  return data;
}

export async function getOwnerLeads() {
  const { data } = await client.get("/leads/owner");
  return data;
}
