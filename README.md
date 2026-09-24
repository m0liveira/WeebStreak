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
3. Paste the manifest link: `https://raw.githubusercontent.com/m0liveira/WeebStreak/main/WeebStreak/weebstreak.json`
4. Click Install and restart Seanime if necessary.

## Customization

WeebStreak automatically inherits your current Seanime font. If you want to customize the dashboard colors manually, add these variables to your Seanime **Custom CSS** settings:

```css
:root {
    --streak-dark: #1A1A1A;
    --streak-border: #2E2E2E;
    --streak-text-200: #5C5C5C;
    --streak-text-100: #E6E6E6;
    --streak-accent: #6152DF; // use var(--brand) for your preset seanime accent color
    --streak-font: 'inter'; // the font is already defaulted to your seanime font
}
```

Note that you can also change other styles by making use of the css classes defined for the plugin!!
