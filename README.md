# Kaizen - Daily Progress Tracker

## Project Structure

```
DnevniProgresApp/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # All CSS styles
├── js/
│   └── app.js             # Application logic
└── assets/
    ├── images/            # Image assets
    │   ├── metal.png
    │   ├── placeholder.png
    │   ├── samurai.png
    │   └── table.png
    └── video/             # Video assets
        └── video.mp4
```

## How to Run

Simply open `index.html` in your web browser.

## Features

- Daily habit tracking with 3D tactile buttons
- Medal system (Gold, Silver, Bronze) based on task completion
- Winning streak counter
- Progress history with visual calendar
- User ranking system (Apprentice → Warrior → Samurai → Master)
- Victory celebration video
- Motivational quotes
- Local storage for data persistence

## Technical Details

- **Framework**: Vanilla JavaScript (ES6+)
- **Styling**: TailwindCSS + Custom CSS
- **Storage**: localStorage (key: `daily_discipline_app_v2`)
- **No server required**: Runs entirely in the browser

