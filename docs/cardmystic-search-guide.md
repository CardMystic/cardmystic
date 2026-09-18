# Find the card you need, even if you don't know its name

CardMystic is useful when you know what your deck needs, but you don't know which card does it. You can describe an effect, find alternatives to a card you already like, or get suggestions based on the cards you're actually playing. Then narrow the results down to the colors, format, and mana value you can use.

Maybe you need more draw when your creatures die. Maybe you want another card that does something like [[Swords to Plowshares]]. Maybe you've got half a deck and you're stuck. You shouldn't have to know the answer before you can search for it.

Here's what each search does, and when I'd use it.

## Smart Search

Start here when you can describe what you want a card to do.

Smart Search uses a model trained for Magic searches to match your request to real cards. It looks for relevant meaning in the card information, so you don't need to remember the exact wording printed on the card.

For example:

> draw cards when my creatures die

That's a way to look for effects like [[Grim Haruspex]] and [[Midnight Reaper]] without needing to know either card's name.

((Grim Haruspex))

[Try that Smart Search](https://cardmystic.com/search/all/smart?searchType=smart&query=draw%20cards%20when%20my%20creatures%20die)

This is especially useful for a job that cards describe in a bunch of different ways. "Protect my creatures," "get lands out of my graveyard," or "punish people for drawing cards" are all reasonable places to start.

Keep the query focused on the job. If you need a black creature that costs three or less, use the color, type, and mana value filters for those requirements.

And read the cards before adding them. [[Grim Haruspex]] cares about **another nontoken creature** dying. If your plan is to sacrifice a pile of creature tokens, that detail matters. Smart Search helps you find candidates; the actual rules text still decides whether they work.

## Similarity Search

Use this when you've already found a card you like and want more options in that space.

You enter a card name, and CardMystic compares its text and characteristics with other cards. This is useful for finding redundancy, exploring alternatives, or working out what else might fill a slot.

Try starting with [[Swords to Plowshares]].

((Swords to Plowshares))

[Find cards similar to Swords to Plowshares](https://cardmystic.com/search/all/similarity?searchType=similarity&card_name=Swords%20to%20Plowshares)

You're looking around the same kind of effect: cheap creature removal. [[Path to Exile]] is a useful comparison. Both exile a creature for {W}, but one gives the controller life and the other can give them a basic land. Similar jobs, different tradeoffs.

Compare mana cost, speed, restrictions, and what you give your opponent.

Similarity compares **the cards themselves**. If you want cards that work well alongside a particular card, use the Deck Recommender. A second sacrifice outlet and a payoff for sacrificing creatures can both be useful, but they're answering different needs.

## Commander Search

Use this when the deck idea comes first.

Commander Search uses the same kind of natural-language matching as Smart Search, with the results restricted to cards that can be your commander.

For example:

> graveyard recursion

[Find a commander for graveyard recursion](https://cardmystic.com/search/all/commander?searchType=commander&query=graveyard%20recursion)

Think about the difference between [[Meren of Clan Nel Toth]] and [[Muldrotha, the Gravetide]]. Both give you reasons to fill your graveyard, but Meren brings creature cards back, while Muldrotha lets you play a land and cast a permanent spell of each permanent type from your graveyard during your turns. Those lead to different decks.

((Meren of Clan Nel Toth))

You can start with a broad theme like "spellslinger" or "tokens," or describe something more specific. Then use the color filters to narrow down the options.

## Keyword Search

Sometimes you already know the words you're looking for.

Keyword Search matches against card names, types, and rules text. Card names get extra weight, and it also allows some fuzzy matching, so a small typo doesn't necessarily ruin the search.

Try:

> draw cards enters

[Try Keyword Search](https://cardmystic.com/search/all/keyword?searchType=keyword&query=draw%20cards%20enters)

Or search for a name you half remember. The name matcher can handle a typo like `lightnin bolt`.

This is handy when you remember part of a card, or want to browse cards using particular words. Results don't have to contain every search word, or the whole phrase. If you're describing a general effect in your own words, Smart Search is usually the better place to start.

## Deck Recommender

Paste the cards you've already picked and look for additions that fit.

The Deck Recommender learns patterns from real decklists: which cards tend to be played together, and which combinations of cards point toward particular strategies. It uses your commander, your decklist, or both to suggest additions.

You can start with just a commander. If you've already got a pile of cards, paste that in too. Cards in the pasted list are excluded from the suggestions, and choosing a commander keeps the recommendations within that commander's color identity.

For example, select [[Meren of Clan Nel Toth]] and paste this small starting package:

```text
1 Viscera Seer
1 Blood Artist
1 Grave Pact
1 Skullclamp
```

There's already some direction there. [[Viscera Seer]] gives you a sacrifice outlet, [[Blood Artist]] rewards creatures dying, and [[Grave Pact]] makes your opponents sacrifice creatures too.

[Open the Deck Recommender with Meren](https://cardmystic.com/search/all/deckbuilder?searchType=recommend&commander=Meren%20of%20Clan%20Nel%20Toth)

You can leave the description blank for general suggestions, or ask for something you're missing:

> graveyard recursion value

The description helps focus the suggestions on that job. It can also bring in relevant cards beyond the usual deck-based candidates, which is useful when you're trying to solve a specific problem.

This is why pasting your actual list matters. Two Meren decks can share a commander and still want different cards. The recommender has more to work with when it can see what you've already chosen.

## Popular Cards

Popular Cards shows what people are putting in their Commander decks, based on the decklists in our dataset.

It's useful when you're learning a color combination, checking common inclusions, or looking for something obvious you might have missed.

You can browse the general list or add a description such as:

> mana rocks

[Explore popular mana rocks](https://cardmystic.com/popular-cards/all?query=mana%20rocks)

With a description, the search prioritizes relevant cards from the popular candidates. The usage information still tells you how often those cards show up in the collected decks.

Popularity is a useful clue, but it isn't a win-rate statistic. A card can be common and still be wrong for the deck you're building.

## Popular Commanders

Popular Commanders shows which commanders have the most decks in the dataset.

This is useful if you want to see what people are building around, or browse established options for a theme. Try adding:

> graveyard recursion

[Explore popular graveyard commanders](https://cardmystic.com/popular-commanders/all?query=graveyard%20recursion)

Commander Search starts with how well a commander matches your idea. Popular Commanders starts with the deck data and lets you search within that. Both can help you choose a commander, depending on whether you're exploring the card pool or looking at what people are playing.

## Popular by Commander

Already picked your commander? This shows the cards most often included in decks led by that commander.

For [[Meren of Clan Nel Toth]], it's a way to get familiar with the usual supporting cards before deciding which ones belong in your version.

[See popular cards for Meren](https://cardmystic.com/popular-by-commander/all?commander=Meren%20of%20Clan%20Nel%20Toth)

You can also add a description like "removal" to bring relevant cards toward the top.

The distinction from the Deck Recommender is pretty straightforward: Popular by Commander shows what the collected Meren decks commonly include. The recommender also takes **your own card choices** into account.

There's a useful way to work backward, too. Open a card's page and look at its **Popular Commanders** section. If you've found a card you want to build around, you can see which commanders people are playing it with.

New cards and commanders may not have much deck history yet. Smart Search and Similarity Search can help you explore their effects without waiting for them to become popular.

## Use the filters, then try a few cards

Across the search tools, use the available filters to make the results practical: colors, card types, mana value, format legality, and whether you're playing on Arena, MTGO, or paper. A card can match your idea perfectly and still be unusable in the deck.

For a first pass, try the Meren example above. Look through her popular cards, pick a few that fit the deck you want to build, and put those into the recommender. Ask for one thing you're missing, like card draw or artifact removal.

When you find a card you like, open its Similarity results and compare the alternatives. Read the restrictions, check the mana cost, and save the ones you want to test.
