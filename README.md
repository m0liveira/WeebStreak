<div align='center'>
  <img src="./WeebStreak/assets/weebstreak.png" alt="WeebStreak Logo" width="120" />
</div>

# WeebStreak

Keep your anime and manga streak alive. WeebStreak is a plugin for Seanime that tracks your daily activity and rewards your consistency with a visual dashboard.

## Features

- **Daily Tracking:** Automatically updates your streak when you watch an anime episode or read a manga chapter.
- **Visual Dashboard:** Adds a dedicated tray to Seanime showing your current streak, longest streak, and a breakdown by media type.
- **Milestones:** Tracks your progress towards targets like 7, 14, 30, 60, and 100+ days.
- **Forgiving Reset:** The daily reset happens at 4:00 AM local time. Late-night binge sessions still count for the previous day.
- **Auto-Correction:** Broken streaks reset automatically if you miss a day.

## Installation

1. Open Seanime and navigate to the **Plugins** section.
2. Click on **Install from URL**.
3. Paste the manifest link: `https://github.com/m0liveira/WeebStreak/blob/main/WeebStreak/weebstreak.json`
4. Click Install and restart Seanime if necessary.

## How it Works

The plugin uses Seanime's background hooks to listen for media consumption. When an update triggers, it fetches the exact media metadata via the AniList GraphQL API and updates your local streak data. All UI logic is safely isolated inside the plugin's tray render cycle.

## Development

This plugin is built with TypeScript and runs on Seanime's Goja engine.

1. Clone the repository.
2. Make your changes in `src/main.ts`.
3. Test locally by pointing Seanime to your local manifest file in development mode.
