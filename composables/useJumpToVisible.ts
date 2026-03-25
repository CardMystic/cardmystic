export function useJumpToVisible() {
  return useState<boolean>('jumpToVisible', () => false);
}
