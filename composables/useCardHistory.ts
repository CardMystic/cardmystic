import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { CardHistoryItem } from '~/models/userModel';

export const useCardHistory = () => {
  const queryClient = useQueryClient();

  // Fetch card history
  const { data: cardHistory, isLoading } = useQuery({
    queryKey: ['cardHistory'],
    queryFn: async () => {
      const response = await fetch('/api/user/card-history');
      if (!response.ok) throw new Error('Failed to fetch card history');
      return response.json() as Promise<CardHistoryItem[]>;
    },
  });

  // Add card to history
  const addCardMutation = useMutation({
    mutationFn: async (cardData: { card_id: string; card_name: string }) => {
      const response = await fetch('/api/user/card-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });
      if (!response.ok) throw new Error('Failed to add card to history');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardHistory'] });
    },
  });

  // Delete card history item
  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/user/card-history/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete card history item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardHistory'] });
    },
  });

  // Clear all card history
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user/card-history', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear card history');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardHistory'] });
    },
  });

  return {
    cardHistory,
    isLoading,
    addCard: addCardMutation.mutate,
    deleteCard: deleteCardMutation.mutate,
    clearHistory: clearHistoryMutation.mutate,
    isAdding: addCardMutation.isPending,
    isDeleting: deleteCardMutation.isPending,
    isClearing: clearHistoryMutation.isPending,
  };
};
