import type { Board } from '~/models/cardListModel';

export function useCardEditToast() {
  const toast = useToast();
  function show(title: string) {
    toast.add({
      title,
      color: 'neutral',
      duration: 1500,
      close: false,
      ui: {
        root: 'card-edit-toast w-max max-w-[calc(100vw-1rem)] mx-auto rounded-xl bg-[#30204d] ring-0 px-3 py-2 gap-0',
        wrapper: 'w-auto flex-none',
        title: 'text-sm font-medium text-white whitespace-nowrap',
      },
    });
  }
  function notify(action: 'added' | 'removed', count = 1) {
    if (count < 1) return;
    show(
      `${count === 1 ? 'Card' : 'Cards'} ${action === 'added' ? 'Added' : 'Removed'}`,
    );
  }
  function notifyMoved(board: Board) {
    show(`Card Moved to ${board}`);
  }
  function notifyEdit(
    title:
      | 'Copies Updated'
      | 'Commander Set'
      | 'Commander Removed'
      | 'Card Replaced'
      | 'Deck Updated'
      | 'Collection Updated'
      | 'Deck Restored'
      | 'Collection Restored',
  ) {
    show(title);
  }
  return { notify, notifyMoved, notifyEdit };
}
