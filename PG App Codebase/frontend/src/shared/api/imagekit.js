import client from './client'

export async function getImageKitAuth() {
  const { data } = await client.get('/imagekit/auth')
  return data // { token, expire, signature }
}

export async function updateMyPGImages(images) {
  const { data } = await client.patch('/pgs/my/images', { images })
  return data
}
