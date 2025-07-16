import { z } from "zod";

export const TopQuerySchema = z.object({
	query: z.string().min(1, "Query must not be empty"),
	hitCount: z.number().int().min(0, "Hit count must be a non-negative integer"),
	lastAccessed: z.date().max(new Date(), "Last accessed date must be in the past"),
	isCached: z.boolean().default(false),
});
export type TopQuery = z.infer<typeof TopQuerySchema>;
