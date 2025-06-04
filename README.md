# CardMystic Frontend

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Support on Patreon](https://img.shields.io/badge/support-patreon-F96854.svg)](https://www.patreon.com/thecardmystic)

🧙‍♂️ Check it out here: [https://cardmystic.com](https://cardmystic.com)

Magic: The Gathering is a complex and intricate game, but finding cards shouldn't be. Our developers decided that traditional keyword search engines fall short. They require exact wording and an intimate knowledge of Magic terms.

CardMystic makes card discovery effortless with natural language search. Just type what you're thinking: “a blue creature that draws cards” or “a cheap red burn spell” and let CardMystic handle the rest. Whether you're a seasoned deckbuilder or brand new to the game, CardMystic helps you find the perfect card without the guesswork.

🚧 We are experimenting with state-of-the-art methods to improve the quality of results. Currently the project performs a dense vector search using Weaviate to retrieve results, but they can be improved greatly. See this great [blog post](https://www.notion.so/Magic-Card-Search-Engine-1fd1a1085527808488dad794522e9158) for more detailed information on the incredible potential with other methods. 🚧

This project uses Vue & Nuxt as well as the Vuetify component library.

## ✨ Features

- Vector/Semantic search for MTG cards
- See the model's confidence for each result
  - Confidence reflects how strongly the model believes a card matches your search. A higher percentage means a closer match to your query.
- Filter by colors, types, converted mana cost, power/toughness, etc.
- View card details & legalities
- Public API access WIP 🚧
- Hybrid search: semantic + keyword combined
- Traditional Keyword search
- image Search WIP 🚧

## 🛣️ Roadmap

- Improve quality of results using state-of-the-art methods
- Image-based search
- User database integration
- Save searches & prompts
- Save & export cards

## 🤝 Contributing

We welcome pull requests and feedback!  
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and coding guidelines.

## 🖥️ Server

The CardMystic server code is private and is not contained in this repository. Instead, the frontend connects to the public API (WIP) through the proxy defined in `server\api\proxy\[...path.ts]`

## 🖼️ Preview

### Home Page

<details>
<summary>Click to view home page</summary>
<img src="docs/homepage.PNG" alt="HomePage" width="700"/>
</details>

### Filters

<details>
<summary>Click to view filters</summary>
<img src="docs/filters.PNG" alt="Filters" width="700"/>
</details>

### Results

<details>
<summary>Click to view results page</summary>
<img src="docs/results.PNG" alt="Results" width="700"/>
</details>

### Card Details

<details>
<summary>Click to card details page</summary>
<img src="docs/carddetails.PNG" alt="Card Details" width="700"/>
</details>

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

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## 🚫 Ignored Sets

**CardMystic** is meant for finding magic cards that are relevant to typical casual & competitive players, as well as collectors. Because of this, any joke & test sets are left out.

- Unglued
- Unhinged
- Unstable
- Unsanctioned
- Unfinity
- Mystery Booster Playtest Cards
- Happy Holidays
- Ponies: The Galloping
- Hero's Path
- Unknown Event

## 🧪 Hybrid Search

This projects uses [Weaviate's hybrid search](https://weaviate.io/developers/weaviate/search/hybrid) to combine keyword search with vector search.

The score for each card is computed with this algorithm:

final*score = alpha * vector*score + (1 - alpha) * bm25_score

The alpha is adjustable, 1.0 being a pure vector search and 0.0 being a pure keyword search.

The current alpha: **0.7**

## 🧠 Weaviate

The Vector Database for this project is [Weaviate](https://weaviate.io/)

### Weaviate Schema

The schema of the data in Weaviate is shown here. This shows whether each property is vectorized (where it is taken into consideration during a vector search) and filterable.

The fields with NLP in the name are enhanced for Natural Language Processing. This includes altering the text slightly so the vectorization model can better understanding the meaning.

"Property name Is Vectorized" is whether or not the property name is vectorized with the value.

<details>
<summary>Click to view schema table</summary>

<table border="1" style="border-collapse: collapse;">
  <tr style="background-color: black; color: white;">
    <th>Property</th>
    <th>Data Type</th>
    <th>Is Vectorized</th>
    <th>Is Filterable</th>
    <th>Property Name Is Vectorized</th>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">name</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">types</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">subtypes</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">supertypes</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">manaCost</td>
    <td style="background-color: white; color: black;">Text Array</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">manaCostNLP</td>
    <td style="background-color: white; color: black;">Text Array</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">cardColors</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">cardColorsLength</td>
    <td style="background-color: white; color: black;">Number</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">colorIdentity</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">convertedManaCost</td>
    <td style="background-color: white; color: black;">Number</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">convertedManaCostNLP</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">rarity</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">rarityNLP</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">setCode</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">setName</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">setNameNLP</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">cardText</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">flavorText</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">power</td>
    <td style="background-color: white; color: black;">Number</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">powerNLP</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">toughness</td>
    <td style="background-color: white; color: black;">Number</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">toughnessNLP</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">artist</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">url</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
    <td style="background-color: lightcoral; color: black;">No</td>
  </tr>
  <tr>
    <td style="background-color: white; color: black;">legalityIn${FormatName}Format</td>
    <td style="background-color: white; color: black;">Text</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
    <td style="background-color: lightgreen; color: black;">Yes</td>
  </tr>
</table>

</details>

## 🙏 Acknowledgements

- [Scryfall](https://scryfall.com/) for inspiration
- [MTGJson](https://mtgjson.com/) for card data
