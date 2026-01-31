import type { User } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import { useSupabase } from './useSupabase';

const userProfile = ref<User | null>(null);
const loading = ref(true);
const profileData = ref<Database['public']['Tables']['profiles']['Row'] | null>(
  null,
);

export const useUserProfile = () => {
  // Only initialize Supabase on client side
  const supabase = process.server ? null : useSupabase();

  const fetchUser = async () => {
    if (!supabase) return;
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
      // Automatically fetch profile data when user is loaded
      if (user) {
        await fetchProfileData();
      }
    }

    loading.value = false;
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      userProfile.value = null;
    }
  };

  const fetchProfileData = async () => {
    if (!supabase || !userProfile.value?.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userProfile.value.id)
      .single();

    if (!error && data) {
      profileData.value = data;
    }
  };

  const updateProfileAvatar = async (cardName: string) => {
    if (!supabase || !cardName || !userProfile.value?.id) {
      return { error: new Error('Invalid card name or user not logged in') };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_card_name: cardName,
      })
      .eq('id', userProfile.value.id);

    if (!error && profileData.value) {
      profileData.value.avatar_card_name = cardName;
    }

    return { error };
  };

  const updateUsername = async (username: string) => {
    if (!supabase || !username.trim()) {
      return { error: new Error('Username cannot be empty') };
    }

    const { error } = await supabase.auth.updateUser({
      data: { username },
    });

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabase || newPassword.length < 6) {
      return { error: new Error('Password must be at least 6 characters') };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error };
  };

  // Initialize user and profile data on first use
  if (userProfile.value && !profileData.value) {
    fetchProfileData();
  }

  // Computed properties
  const username = computed(() => {
    return (
      userProfile.value?.user_metadata?.username ||
      userProfile.value?.email?.split('@')[0] ||
      ''
    );
  });

  const profileIconUrl = computed(() => {
    if (!profileData.value?.avatar_card_name) return null;
    return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(profileData.value.avatar_card_name)}&format=image&version=art_crop`;
  });

  // Listen to auth state changes
  const initAuthListener = () => {
    if (!supabase) return;
    supabase.auth.onAuthStateChange((event, session) => {
      userProfile.value = session?.user ?? null;

      if (session?.user) {
        fetchProfileData();
      } else if (event === 'SIGNED_OUT') {
        profileData.value = null;
      }
    });
  };

  return {
    userProfile: readonly(userProfile),
    profileData: readonly(profileData),
    loading: readonly(loading),
    username: readonly(username),
    profileIconUrl: readonly(profileIconUrl),
    fetchUser,
    fetchProfileData,
    updateProfileAvatar,
    updateUsername,
    updatePassword,
    signOut,
    initAuthListener,
  };
};
