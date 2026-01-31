export default defineNuxtRouteMiddleware(async (to, from) => {
  const { userProfile, fetchUser } = useUserProfile();

  // Ensure user data is fetched
  if (!userProfile.value) {
    await fetchUser();
  }

  // Redirect to home if not authenticated
  if (!userProfile.value) {
    return navigateTo('/');
  }
});
