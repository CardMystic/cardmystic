import { useUserProfile } from '~/composables/useUserProfile';

export default defineNuxtPlugin(() => {
  const { initAuthListener, userProfile, pingActivity } = useUserProfile();

  // Initialize the global Supabase auth listener once on app startup.
  // Previously lived in Navbar.vue's onMounted, but it's app-level
  // infrastructure and should not be tied to a UI component.
  initAuthListener();

  // Ping backend activity once when the user is (or becomes) logged in
  if (userProfile.value) {
    pingActivity();
  } else {
    const stopWatch = watch(userProfile, (profile) => {
      if (profile) {
        pingActivity();
        stopWatch();
      }
    });
  }
});
