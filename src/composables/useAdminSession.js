import { ref } from 'vue'
import { authLogout, authMe } from '../lib/apiAdmin'

export const adminLoggedIn = ref(false)

export async function syncAdminSession() {
  try {
    const me = await authMe()
    adminLoggedIn.value = Boolean(me.ok)
  } catch {
    adminLoggedIn.value = false
  }
  return adminLoggedIn.value
}

export async function adminLogout() {
  await authLogout()
  adminLoggedIn.value = false
}
