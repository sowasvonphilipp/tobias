export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (process.server) return

  const { user, waitForAuth } = useFirebaseAuth()

  // Wait for Firebase to check if user is logged in (from localStorage)
  await waitForAuth()

  // If user is not authenticated, redirect to login
  if (!user.value) {
    return navigateTo('/login')
  }
})
