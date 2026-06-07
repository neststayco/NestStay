export function resolveUserHomeRoute(role) {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'pg_owner':
      return '/pgowner'
    case 'user':
    default:
      return '/user'
  }
}
