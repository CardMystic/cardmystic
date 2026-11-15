# CardMystic database review, November 15, 2026

The initial review used read-only catalog and query-plan checks. On November 15, the operator authorized sections 1 and 2 for the CardMystic production project. Both are now applied. Section 3 and the remaining advisor findings are recommendations.

Production migration `20261115172008` updated the three read policies together. Checks under the anonymous database role confirmed that public lists, cards, and primers remained readable and only public parents were visible. Owner, unrelated-user, service-role, and owner-edit checks passed against synthetic fixtures on disposable PostgreSQL.

The set-code index was built concurrently outside a transaction. Migration `20261115172123` verified and recorded it. The production catalog showed a valid, ready index. The representative set lookup used an index-only scan with zero heap fetches. The SQL below documents the rollout for other environments.

## 1. Restrict reads of private decks and collections

**Apply this first.** The `anon` and `authenticated` roles have SELECT on `card_lists`, `card_list_items`, and `card_list_primer`. Each table has a permissive SELECT policy for PUBLIC with `USING (true)`. At the database permission layer that includes private lists, their cards, and their primer text. This finding comes from grants and policy definitions. It does not establish whether anyone accessed private data.

Run this read-only preflight in the target project's SQL Editor. Save the output. Check for additional permissive SELECT or ALL policies that could grant access independently. The SQL below assumes the three existing read policies still have the audited names. [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)

```sql
select tablename, policyname, roles, cmd, permissive, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('card_lists', 'card_list_items', 'card_list_primer')
order by tablename, policyname;
```

Apply the three changes together. The parent policy controls visibility. Each child policy requires a matching parent row visible to the caller.

```sql
begin;
alter policy "Enable read access for all users" on public.card_lists
  to anon, authenticated
  using (visibility = 'public' or user_id = (select auth.uid()));
alter policy "Enable read access for all users" on public.card_list_items
  to anon, authenticated
  using (exists (select 1 from public.card_lists l where l.id = card_list_items.list_id));
alter policy "Enable read access for all users" on public.card_list_primer
  to anon, authenticated
  using (exists (select 1 from public.card_lists l where l.id = card_list_primer.list_id));
commit;
```

Verify through the normal application and Data API with two test accounts and fixtures you control. Include a public list and a private list, both with cards and a primer. The owner should see all their fixtures. A signed-out visitor and the other account should see the public rows and zero rows for the private list in all three tables. Confirm owner editing and public deck sharing still work. Run these checks with ordinary sessions because the SQL Editor's administrator bypasses RLS. Service-role backend routes must continue enforcing their own visibility checks. If staging checks fail, roll back the test transaction or restore the staging fixture. If a production check fails, keep private reads restricted while correcting the affected policy.

## 2. Add the printing set-code index

The live catalog has an estimated 107,321 rows in `card_printings`. Its indexes cover printing ID and oracle ID/release date. The set-code foreign key has no leading index. A read-only plan for `set_code = 'mh2'` chose a sequential scan and estimated 522 matches. This index also supports checking referencing printings when a parent set key is changed or deleted. Existing printing-by-oracle and tag-assignment indexes already match the deck UI queries.

Check existing definitions and validity first. If a valid equivalent exists, skip creation. Run the CREATE as **one statement outside a transaction** using an autocommit SQL client connected to the intended project. Recheck validity if a concurrent build is interrupted. [PostgreSQL concurrent index builds](https://www.postgresql.org/docs/current/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY)

```sql
select i.indexrelid::regclass as index_name, i.indisvalid, pg_get_indexdef(i.indexrelid)
from pg_index i where i.indrelid = 'public.card_printings'::regclass;
```

```sql
create index concurrently card_printings_set_code_idx on public.card_printings (set_code);
```

Compare this read-only plan on staging before and after creation, using the same set code and representative data. Compare heap blocks and execution time. The planner may reasonably choose a scan for a very common value. [Supabase query optimization](https://supabase.com/docs/guides/database/query-optimization)

```sql
explain (analyze, buffers) select 1 from public.card_printings where set_code = 'mh2';
```

Rollback for this new index only, as a standalone statement:

```sql
drop index concurrently public.card_printings_set_code_idx;
```

### Other foreign-key findings

| Referencing columns | Live evidence and operator action |
| --- | --- |
| `card_lists(folder_id, user_id)` | Existing partial index on non-null `folder_id` narrows the folder lookup. The parent folder ID is unique. Measure a representative folder query before adding a composite index. |
| `deck_folders(parent_id, user_id)` | There is a partial index on `parent_id` and an index starting with `(user_id, parent_id)`. Five estimated rows. Keep the existing paths. |
| `decklist_comments(user_id)` | Three estimated rows. Per-deck comment pagination already has a matching index. Revisit a user-leading index if author lookups or account removal become costly. |
| `search_credit_grants(user_id)` | Four estimated rows. Checkout lookup uses its primary key. Revisit a user-leading index as account-level lookups or grants grow. |

The Top Tags lookup uses `card_tag_assignments(user_id, oracle_id, tag_id)`. The tag-to-card direction already has `(tag_id, user_id)`. Mainboard reads have `card_list_items(list_id, board)`, and recent history has `deck_revisions(list_id, id DESC)`. No additional indexes are indicated for these paths. [Supabase foreign-key index advisor](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)

## 3. Review duplicate constraints and per-row policy checks

The three duplicate indexes reported by Advisors each back an explicit UNIQUE constraint identical to the table's primary key. Removing the extra constraint would save duplicate write work. The tables are small. Schedule this after the privacy correction. Check database functions, clients, and migrations for references to these constraint names, verify the matching primary keys still exist, and use a short maintenance window for the table locks. Apply without CASCADE so dependencies cause a failure. [Supabase duplicate index advisor](https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index)

```sql
begin;
set local lock_timeout = '3s';
alter table public.decklist_likes drop constraint decklist_likes_list_user_uq;
alter table public.decklist_saves drop constraint decklist_saves_list_user_uq;
alter table public.user_follows drop constraint user_follows_follower_followee_uq;
commit;
```

Verify like, save, and follow toggles and duplicate prevention with test accounts. To restore the original constraints:

```sql
begin;
alter table public.decklist_likes add constraint decklist_likes_list_user_uq unique (list_id, user_id);
alter table public.decklist_saves add constraint decklist_saves_list_user_uq unique (list_id, user_id);
alter table public.user_follows add constraint user_follows_follower_followee_uq unique (follower_id, followee_id);
commit;
```

Seven write policies call `auth.uid()` directly: profile update, and insert/update/delete on both list items and primers. Generate proposed ALTER statements and their rollback statements with this **read-only** query. Review both sets, save the rollback output, and apply only the reviewed forward statements together in a transaction. The command, target roles, and owner predicates stay intact. Verify that owners can still write and that unrelated accounts cannot. [Supabase policy performance advisor](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)

```sql
with policies as (
  select tablename, policyname, qual, with_check
  from pg_policies
  where schemaname = 'public'
    and ((tablename = 'profiles' and policyname = 'Enable users to update their own profiles')
      or (tablename in ('card_list_items', 'card_list_primer') and cmd in ('INSERT', 'UPDATE', 'DELETE')))
    and concat(qual, with_check) like '%auth.uid()%'
    and concat(qual, with_check) not ilike '%select auth.uid()%'
)
select format('alter policy %I on public.%I%s%s;', policyname, tablename,
         coalesce(' using (' || replace(qual, 'auth.uid()', '(select auth.uid())') || ')', ''),
         coalesce(' with check (' || replace(with_check, 'auth.uid()', '(select auth.uid())') || ')', '')) as proposed_sql,
       format('alter policy %I on public.%I%s%s;', policyname, tablename,
         coalesce(' using (' || qual || ')', ''),
         coalesce(' with check (' || with_check || ')', '')) as rollback_sql
from policies order by tablename, policyname;
```

The performance advisor also reported 12 unused indexes. Keep them pending a representative period of usage, including infrequent cleanup and moderation jobs. Review index scan counters together with the last statistics reset and query plans. [Supabase unused index advisor](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)

## Additional advisor findings

The Security Advisor reported 13 RLS-enabled tables without policies, eight functions with mutable search paths, `pg_trgm` in the public schema, and executable security-definer functions (eight anonymous-role and eleven authenticated-role findings, with overlap). Some tables are intentionally service-only, and some RPCs are intended for signed-in callers. Review each function's signature, callers, grants and ownership predicates before changing access. Review leaked-password protection in the project's Auth settings as well. Rerun both Advisors after applying changes. [Security Advisor](https://supabase.com/dashboard/project/ddbgietanhxrozzmogur/advisors/security) · [Performance Advisor](https://supabase.com/dashboard/project/ddbgietanhxrozzmogur/advisors/performance)
