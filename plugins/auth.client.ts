import { useUserProfile } from '~/composables/useUserProfile';

export default defineNuxtPlugin(() => {
  // TEMP debug: confirm the auth.client plugin actually runs on the OAuth
  // redirect page load. Remove once the Google sign-in regression is fixed.
  // eslint-disable-next-line no-console
  console.log('[cm-auth] auth.client plugin running', {
    href: window.location.href,
    hash: window.location.hash.slice(0, 60),
  });

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
