import { userTextPattern } from '../utils/textModeration.ts';

// Emit the server version of the browser rules for a new backend migration.
const pattern = `(?<![[:alnum:]])${userTextPattern}(?![[:alnum:]])`;
if (pattern.includes('$pattern$')) throw new Error('Unexpected SQL delimiter');
console.log(`create or replace function moderation.censor_user_text(input text) returns text
language sql immutable strict parallel safe set search_path = '' as $fn$
  select regexp_replace(input, $pattern$${pattern}$pattern$, '•••', 'gi')
$fn$;`);
