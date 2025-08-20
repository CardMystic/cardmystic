# CardMystic

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Support on Patreon](https://img.shields.io/badge/support-patreon-F96854.svg)](https://www.patreon.com/thecardmystic)

<div align="center">
  <img src="public/crystall_ball.webp" alt="CardMystic" width="150"/>
</div>

🧙‍♂️ Check it out: [https://cardmystic.com](https://cardmystic.com)

Magic: The Gathering is a complex and intricate game, but finding cards shouldn't be. Our developers decided that traditional keyword search engines fall short. They require exact wording and an intimate knowledge of Magic terms.

CardMystic makes card discovery effortless with natural language search. Just type what you're thinking: “a blue creature that draws cards” or “a cheap red burn spell” and let CardMystic handle the rest. Whether you're a seasoned deckbuilder or brand new to the game, CardMystic helps you find the perfect card without the guesswork.

This project uses Vue & Nuxt as well as the Vuetify component library.

## ✨ Features

- AI / Semantic search for MTG cards: Find cards using natural language queries
  - Example Query: [X Spell Board Wipes](https://cardmystic.io/search?query=x+spell+board+wipes)
- Similarity search: find cards similar to a given card
  - Example Query: [Lightning Bolt](https://cardmystic.io/search/similarity?card_name=Lightning+Bolt)
- Filter by colors, types, converted mana cost, power/toughness, etc.
- View card details including different printings, price, and legality
- Fontend & Backend caching
- Example queries to help you get started
- View Top Searches of the week
- Report issues or suggest features directly from the app
  - Report incorrect search results
- Link directly to TCGPlayer to purchase cards
- Extensive data validation

## 🛣️ Roadmap

- Increasing loading speeds
- Deck recommendation system
- Keyword & Image-based search
- Browser Extension

## 🤝 Contributing

We welcome pull requests and feedback!  
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and coding guidelines.

## 🖥️ Server

The CardMystic server code is not contained in this repository. Instead, the frontend connects to the public API through the proxy defined in `server\api\proxy\[...path.ts]`

[API Documentation](https://api.cardmystic.io/documentation)

## 🤖 Models

The models used for this project are our "Secret Sauce" and will be kept private. Extensive research and iterations have gone into creating the models that power CardMystic's search capabilities.

## 🛠️ Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

Configure environment variables (and edit as needed):

```bash
cp .env_defaults .env
```

### Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

### Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## 🙏 Acknowledgements

- [Scryfall](https://scryfall.com/) for card data
- [Moxfield](https://moxfield.com/) for deck data
