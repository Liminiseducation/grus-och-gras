# Football Match App

A mobile-first web app for organizing spontaneous football matches.

## Folder Structure

```
src/
├── pages/              # Page components
│   ├── MatchListPage.tsx       # "/" - List all matches
│   ├── MatchListPage.css
│   ├── CreateMatchPage.tsx     # "/create" - Create new match
│   ├── CreateMatchPage.css
│   ├── MatchDetailsPage.tsx    # "/match/:id" - Match details
│   └── MatchDetailsPage.css
├── components/         # Reusable UI components
├── data/              # Mock data and constants
│   └── mockMatches.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── utils/             # Helper functions
├── App.tsx            # Router setup
└── main.tsx           # Entry point
```

## Routes

- `/` → MatchListPage - Browse nearby matches
- `/create` → CreateMatchPage - Create a new match
- `/match/:id` → MatchDetailsPage - View and join matches

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router 6

## Development

```bash
npm install
npm run dev
```

## Features

- Mobile-first responsive design
- Match creation with location, date, time, and player count
- View match details and join matches
- Automatic team division when match is full
- Mock data for demonstration

## Next Steps

- Add backend integration
- Implement authentication
- Add geolocation for nearby matches
- Real-time updates
- Player ratings and match history
