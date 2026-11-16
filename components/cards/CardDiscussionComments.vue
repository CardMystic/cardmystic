<script setup lang="ts">
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/vue-query';

const props = defineProps<{ oracleId: string }>();
const db = useSupabase();
const client = useQueryClient();
const { userId } = useUserProfile();
const key = ['card-discussion', props.oracleId] as const;
const pageSize = 25;
const query = useInfiniteQuery({
  queryKey: key,
  initialPageParam: null as number | null,
  queryFn: async ({ pageParam }) => {
    let request = db
      .from('card_comments')
      .select('id,user_id,body,created_at,profiles(username)')
      .eq('oracle_id', props.oracleId)
      .order('id', { ascending: false })
      .limit(pageSize + 1);
    if (pageParam !== null) request = request.lt('id', pageParam);
    const { data, error } = await request;
    if (error) throw error;
    const rows = data.slice(0, pageSize);
    return {
      comments: rows.map(({ id, profiles, ...row }) => ({
        ...row,
        id: String(id),
        username: profiles?.username ?? null,
      })),
      next: data.length > pageSize ? rows[rows.length - 1]!.id : undefined,
    };
  },
  getNextPageParam: (page) => page.next,
});
async function refresh() {
  await client.invalidateQueries({ queryKey: key });
}
const post = useMutation({
  mutationFn: async (body: string) => {
    const { error } = await db
      .from('card_comments')
      .insert({ oracle_id: props.oracleId, body });
    if (error) throw error;
  },
  onSuccess: refresh,
});
async function deleteComment(id: string) {
  if (!userId.value) throw new Error('Sign in to delete a comment.');
  const { error } = await db
    .from('card_comments')
    .delete()
    .eq('id', Number(id))
    .eq('oracle_id', props.oracleId)
    .eq('user_id', userId.value);
  if (error) throw error;
  await refresh();
}
const thread = {
  comments: computed(
    () => query.data.value?.pages.flatMap((page) => page.comments) ?? [],
  ),
  isLoading: query.isLoading,
  isFetchingNextPage: query.isFetchingNextPage,
  hasNextPage: query.hasNextPage,
  error: query.error,
  refetch: query.refetch,
  fetchNextPage: query.fetchNextPage,
  isAddingComment: post.isPending,
  addComment: post.mutateAsync,
  deleteComment,
};
</script>

<template>
  <CommentThread
    :thread="thread"
    :show-heading="false"
    in-modal
    placeholder="Share your thoughts on this card..."
  />
</template>
