import client from './client'

export async function login(email, password) {
  const { data } = await client.post('/auth/login', { email, password })
  return data
}

export async function registerInitiate(email) {
  const { data } = await client.post('/auth/register/initiate', { email })
  return data
}

export async function registerVerify(email, otp, name, password) {
  const { data } = await client.post('/auth/register/verify', { email, otp, name, password })
  return data
}

export async function refreshTokens() {
  const { data } = await client.post('/auth/refresh')
  return data
}

export async function logout() {
  const { data } = await client.post('/auth/logout')
  return data
}

export async function forgotPasswordInitiate(email) {
  const { data } = await client.post('/auth/forgot-password/initiate', { email })
  return data
}

export async function forgotPasswordVerify(email, otp) {
  const { data } = await client.post('/auth/forgot-password/verify', { email, otp })
  return data
}

export async function resetPassword(resetToken, newPassword) {
  const { data } = await client.post('/auth/reset-password', { resetToken, newPassword })
  return data
}

export async function getMe() {
  const { data } = await client.get('/auth/me')
  return data
}
