import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';
import { useRecaptcha } from './useRecaptcha';
import {
  LoginResponseSchema,
  SignUpResponseSchema,
  type LoginRequest,
  type SignUpRequest,
  type SignUpResponse,
} from '@/models/userModel';

/** Account forms load these actions only when their route is opened. */
export const useAccountActions = () => {
  const supabase = import.meta.server ? null : useSupabase();
  const queryClient = useQueryClient();
  const config = useRuntimeConfig();
  const { userProfile } = useUserProfile();

  function validatePasswordPolicy(password: string): string | null {
    if (password.length < 8)
      return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(password))
      return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password))
      return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password))
      return 'Password must contain at least one number.';
    if (!/[^A-Za-z0-9]/.test(password))
      return 'Password must contain at least one special character.';
    if (/\s/.test(password)) return 'Password must not contain whitespace.';
    return null;
  }

  const updateAvatarMutation = useMutation({
    mutationFn: async (cardName: string) => {
      if (!supabase || !userProfile.value?.id) {
        throw new Error('Invalid card name or user not logged in');
      }
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_card_name: cardName })
        .eq('id', userProfile.value.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const updateUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      if (!username.trim()) throw new Error('Username cannot be empty');
      const { data: sessionData } = await supabase!.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');
      const res = await fetch(`${config.public.backendPath}/user/username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Username update failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (newEmail: string) => {
      if (!supabase) throw new Error('Not available on server');

      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      if (!supabase) throw new Error('Not available on server');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');

      const res = await fetch(
        `${config.public.backendPath}/user/update-password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ newPassword }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password update failed');
    },
  });

  // ---- Auth request methods ----

  const { verifyRecaptcha } = useRecaptcha();

  /** Authenticate with email/password via backend API, then establish Supabase session. */
  const loginWithEmail = async (credentials: LoginRequest): Promise<void> => {
    const verified = await verifyRecaptcha('login');
    if (!verified)
      throw new Error('Security verification failed. Please try again.');

    const res = await fetch(`${config.public.backendPath}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed.');

    const { access_token, refresh_token } = LoginResponseSchema.parse(data);
    await supabase!.auth.setSession({ access_token, refresh_token });
  };

  /** Register a new account via backend API. Returns the server success message. */
  const signupWithEmail = async (
    credentials: SignUpRequest,
  ): Promise<SignUpResponse> => {
    const verified = await verifyRecaptcha('signup');
    if (!verified)
      throw new Error('Security verification failed. Please try again.');

    const res = await fetch(`${config.public.backendPath}/user/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Signup failed.');

    return SignUpResponseSchema.parse(data);
  };

  /** Initiate Google OAuth login flow. Redirects the user to Google. */
  const loginWithGoogle = async (): Promise<void> => {
    const verified = await verifyRecaptcha('login_google');
    if (!verified)
      throw new Error('Security verification failed. Please try again.');

    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw new Error(error.message);
  };

  /** Initiate Google OAuth signup flow. Sets a pending flag for the auth listener. */
  const signupWithGoogle = async (): Promise<void> => {
    const verified = await verifyRecaptcha('signup_google');
    if (!verified)
      throw new Error('Security verification failed. Please try again.');

    sessionStorage.setItem('pendingOAuthSignup', 'true');
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      sessionStorage.removeItem('pendingOAuthSignup');
      throw new Error(error.message);
    }
  };

  /** Resend the signup confirmation email. */
  const resendVerificationEmail = async (email: string): Promise<void> => {
    const { error } = await supabase!.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    if (error) throw new Error(error.message);
  };

  /** Send a password reset email via Supabase. Client-only (uses window.location). */
  const sendResetEmail = async (email: string): Promise<void> => {
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/user/reset-password`,
    });
    if (error) throw new Error(error.message);
  };

  /** Update the authenticated user's password using the active recovery session. */
  const updatePasswordWithToken = async (
    newPassword: string,
  ): Promise<void> => {
    const { error } = await supabase!.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(error.message);
  };

  return {
    validatePasswordPolicy,
    updateAvatarMutation,
    updateUsernameMutation,
    updateEmailMutation,
    updatePasswordMutation,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    signupWithGoogle,
    resendVerificationEmail,
    sendResetEmail,
    updatePasswordWithToken,
  };
};
