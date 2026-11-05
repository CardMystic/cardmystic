import type { DeckFolder } from '~/composables/useLibrary';

export function folderTrail(folders: DeckFolder[], id: string): DeckFolder[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const trail: DeckFolder[] = [];
  const visited = new Set<string>();
  let current = byId.get(id);
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    trail.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return trail;
}
