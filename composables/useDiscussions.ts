import { ref, computed } from 'vue';

export interface Discussion {
  id: string;
  cardId: string;
  author: string;
  message: string;
  timestamp: number;
  replies?: Discussion[];
}

const STORAGE_KEY = 'cardmystic-discussions';

// Load discussions from localStorage
function loadDiscussions(): Record<string, Discussion[]> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save discussions to localStorage
function saveDiscussions(discussions: Record<string, Discussion[]>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(discussions));
  } catch (error) {
    console.error('Failed to save discussions:', error);
  }
}

export function useDiscussions(cardId: string) {
  const allDiscussions = ref<Record<string, Discussion[]>>(loadDiscussions());
  
  const discussions = computed(() => {
    return allDiscussions.value[cardId] || [];
  });

  const addDiscussion = (author: string, message: string) => {
    const newDiscussion: Discussion = {
      id: `${Date.now()}-${Math.random()}`,
      cardId,
      author,
      message,
      timestamp: Date.now(),
      replies: [],
    };

    if (!allDiscussions.value[cardId]) {
      allDiscussions.value[cardId] = [];
    }
    
    allDiscussions.value[cardId].unshift(newDiscussion);
    saveDiscussions(allDiscussions.value);
  };

  const addReply = (discussionId: string, author: string, message: string) => {
    const discussion = allDiscussions.value[cardId]?.find(d => d.id === discussionId);
    if (discussion) {
      if (!discussion.replies) {
        discussion.replies = [];
      }
      
      const reply: Discussion = {
        id: `${Date.now()}-${Math.random()}`,
        cardId,
        author,
        message,
        timestamp: Date.now(),
      };
      
      discussion.replies.push(reply);
      saveDiscussions(allDiscussions.value);
    }
  };

  const deleteDiscussion = (discussionId: string) => {
    if (allDiscussions.value[cardId]) {
      allDiscussions.value[cardId] = allDiscussions.value[cardId].filter(
        d => d.id !== discussionId
      );
      saveDiscussions(allDiscussions.value);
    }
  };

  return {
    discussions,
    addDiscussion,
    addReply,
    deleteDiscussion,
  };
}
