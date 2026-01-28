import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { SearchHistoryItem } from '~/models/userModel';

export const useSearchHistory = () => {
  const queryClient = useQueryClient();

  // Fetch search history
  const { data: searchHistory, isLoading } = useQuery({
    queryKey: ['searchHistory'],
    queryFn: async () => {
      const response = await fetch('/api/user/search-history');
      if (!response.ok) throw new Error('Failed to fetch search history');
      return response.json() as Promise<SearchHistoryItem[]>;
    },
  });

  // Add search to history
  const addSearchMutation = useMutation({
    mutationFn: async (searchData: { query: string; filters?: any }) => {
      const response = await fetch('/api/user/search-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchData),
      });
      if (!response.ok) throw new Error('Failed to add search to history');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    },
  });

  // Delete search history item
  const deleteSearchMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/user/search-history/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete search history item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    },
  });

  // Clear all search history
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user/search-history', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear search history');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    },
  });

  return {
    searchHistory,
    isLoading,
    addSearch: addSearchMutation.mutate,
    deleteSearch: deleteSearchMutation.mutate,
    clearHistory: clearHistoryMutation.mutate,
    isAdding: addSearchMutation.isPending,
    isDeleting: deleteSearchMutation.isPending,
    isClearing: clearHistoryMutation.isPending,
  };
};
