import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { UserProfile, UserUpdate, PasswordUpdate } from '~/models/userModel';

export const useUserProfile = () => {
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json() as Promise<UserProfile>;
    },
  });

  // Update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: UserUpdate) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json() as Promise<UserProfile>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  // Update password
  const updatePasswordMutation = useMutation({
    mutationFn: async (passwordData: PasswordUpdate) => {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });
      if (!response.ok) throw new Error('Failed to update password');
      return response.json();
    },
  });

  // Upload profile image
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload image');
      return response.json() as Promise<{ url: string }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  return {
    profile,
    isLoading,
    updateProfile: updateProfileMutation.mutate,
    updatePassword: updatePasswordMutation.mutate,
    uploadImage: uploadImageMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    isUpdatingPassword: updatePasswordMutation.isPending,
    isUploadingImage: uploadImageMutation.isPending,
  };
};
