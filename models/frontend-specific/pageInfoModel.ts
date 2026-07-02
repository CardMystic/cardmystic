import { z } from 'zod';
import { CardSearchFiltersSchema } from '@/models/frontend-specific/filtersModel';

export type PageInfo = z.infer<typeof PageInfoSchema>;
export const PageInfoSchema = z.object({
  page_url: z.string(),
  page_name: z.string(),
  query: z.string().optional(),
  card_name: z.string().optional(),
  filters: CardSearchFiltersSchema.optional(),
  labels: z.array(z.string()).optional(),
});
