import { inject, provide, type InjectionKey } from 'vue';
import { useMutation } from '@tanstack/vue-query';

interface DislikeData {
  query: string;
  cardName: string;
}

/**
 * Composable for card feedback mutations (dislike tracking)
 */
const feedbackKey: InjectionKey<ReturnType<typeof createCardFeedback>> =
  Symbol('card-feedback');
export function provideCardFeedback() {
  const feedback = createCardFeedback();
  provide(feedbackKey, feedback);
  return feedback;
}
export function useCardFeedback() {
  return inject(feedbackKey, null) ?? createCardFeedback();
}
function createCardFeedback() {
  const config = useRuntimeConfig();

  const dislikeMutation = useMutation({
    mutationFn: async (data: DislikeData) => {
      const response = await fetch(
        `${config.public.backendPath}/metrics/dislike`,
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
