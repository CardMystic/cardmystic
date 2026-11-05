# Deck and rules assistant proposal

Design only. No assistant endpoint, provider account, API spending, or subscription entitlement has been enabled. The membership page does not advertise an assistant as available.

## Initial scope

A signed-in Pro member can ask about their decks, compare their cards, and ask Magic rules questions. Start with read-only access. Replies should link to the cards and rules used, state uncertainty, and avoid presenting a guess as a ruling. If editing is added later, show the exact proposed deck changes and require confirmation.

Use the current backend and authentication. Do not add a separate agent hosting platform. The model calls a small allowlist of tools: list my decks, read one of my decks, look up card text, retrieve relevant rules, and inspect existing deck statistics or recommendations. Each deck tool checks ownership on the server. Card text, deck names, descriptions and retrieved text are data, never instructions that can grant access or authorize actions.

Retrieve relevant passages from the official Comprehensive Rules and current Oracle card text. Record the rules release date and show rule numbers in the response. Refresh that rules source through a reviewed job; rules questions should not silently use an outdated copy. The official source is https://magic.wizards.com/en/rules.

## Suggested limits for a first release

These are proposed product limits, not a claim about any provider's current prices:

- 50 user messages per billing month, with a $0.50 maximum provider cost per account, whichever comes first. Show the remaining message allowance and explain that complex questions may reach the cost limit sooner. No automatic overage charges.
- A smaller trial allowance, such as 10 messages with a $0.10 cost ceiling for the entire trial. Cancelling or restarting does not reset that allowance.
- One request at a time per account. Reserve the maximum possible request cost atomically before calling the provider; settle using actual metered usage afterward. Reject a request if its maximum cost cannot fit the remaining budget. Count retries and tool-loop calls against the same reservation.
- Cap input tokens, answer length, tool calls, elapsed time and reasoning tokens where the provider supports them. A request can make at most three model calls and five tool calls. Never insert all decks or the full rulebook into every prompt.
- An independent site-wide daily spend cap and a kill switch. Provider-side spending controls are an extra safeguard; the application must enforce its own limits. Rate limiting alone does not bound spending.
- Keep a single account-period usage total and request reservation/idempotency state. Do not create a permanent log of every prompt by default. Short-lived reservation records prevent concurrent requests and retries from overspending; expire only after reconciling their provider outcome.

The $0.50 ceiling is roughly 10% of the $4.99 sticker price, before Stripe fees, taxes and other operating costs. It is a starting ceiling to evaluate, not a margin guarantee. Select a model only after checking current prices and testing actual deck/rules questions. Measure answer quality and cost, including reasoning tokens and retries, before deciding whether 50 messages is realistic. If a chosen provider cannot expose a bounded maximum cost and usage accounting, do not launch it under this design.

Cache reusable public rules explanations by rules version and question. Private deck answers must stay scoped to the owner and exact deck revision. Clear conversation state when switching users; use a short retention period and let users delete chats if stored conversation history is introduced. Update the privacy and billing policies before launch to describe the provider, data sent, retention, allowances and reset rules.

## Implementation order

1. Assemble a small evaluation set of rules questions, deck questions and attempted cross-user access. Include questions where the correct answer is to ask for missing game state.
2. Compare model quality and actual costs, select the model, and set hard token/cost limits.
3. Implement the authorization tools, cost reservations, usage display and global shutoff.
4. Test a private preview with a small account allowlist. Verify concurrent requests, retries, cancellation, trial restarts, prompt injection and budget exhaustion.
5. Add the assistant to the membership features table only after these checks pass.
