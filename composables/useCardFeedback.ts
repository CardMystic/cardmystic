import { useMutation } from '@tanstack/vue-query';

interface DislikeData {
  query: string;
  cardName: string;
}

/**
 * Composable for card feedback mutations (dislike tracking)
 */
export function useCardFeedback() {
  const config = useRuntimeConfig();

  const dislikeMutation = useMutation({
    mutationFn: async (data: DislikeData) => {
      const response = await fetch(
        `${config.public.backendUrl}/metrics/dislike`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) {
        throw new Error('Failed to track dislike');
      }
      return response.json();
    },
    onError: (error) => {
      console.error('Failed to track dislike:', error);
    },
  });

  return {
    dislikeMutation,
  };
}
