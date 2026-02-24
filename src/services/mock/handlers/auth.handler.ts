import type MockAdapter from 'axios-mock-adapter'
import { mockUsers } from '../data/users.mock'

export function setupAuthHandlers(mock: MockAdapter) {
  mock.onPost('/auth/login').reply((config) => {
    const { email, password } = JSON.parse(config.data)
    const user = mockUsers.find((u) => u.email === email)
    if (user && password === user.password) {
      return [200, { data: { user, accessToken: 'mock-token-' + user.id, refreshToken: 'mock-refresh-' + user.id }, success: true }]
    }
    return [401, { message: 'Identifiants incorrects', success: false }]
  })
  mock.onPost('/auth/logout').reply(200, { success: true })
  mock.onPost('/auth/refresh').reply(200, { data: { token: 'refreshed-mock-token' }, success: true })
  mock.onPost('/auth/forgot-password').reply(200, { message: 'Email envoye', success: true })
  mock.onGet('/auth/me').reply(() => {
    // Return the first super_admin user as the current user
    const user = mockUsers.find((u) => u.role === 'super_admin') ?? mockUsers[0]
    const { password: _, ...userWithoutPassword } = user
    return [200, { data: userWithoutPassword, success: true }]
  })
}
