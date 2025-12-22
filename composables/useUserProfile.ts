import type { User } from '@supabase/supabase-js';
import { useSupabase } from './useSupabase';

const userProfile = ref<User | null>(null);
const loading = ref(true);

export const useUserProfile = () => {
  const supabase = useSupabase();

  const fetchUser = async () => {
    loading.value = true;
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('Error fetching user:', error);
      userProfile.value = null;
    } else {
      userProfile.value = user;
    }

    loading.value = false;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      userProfile.value = null;
    }
  };

  // Listen to auth state changes
  const initAuthListener = () => {
    supabase.auth.onAuthStateChange((event, session) => {
      userProfile.value = session?.user ?? null;

      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }
    });
  };

  return {
    userProfile: readonly(userProfile),
    loading: readonly(loading),
    fetchUser,
    signOut,
    initAuthListener,
  };
};
