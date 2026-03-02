# JKC Devotion App - 90 Days Transformation

A Progressive Web App (PWA) for Japan Kingdom Church's 90-day daily devotion program focused on forgiveness, reconciliation, submission, and obedience.

## Features

- **Daily Devotions**: Access all 31 days of March 2026 devotion content
- **Progress Tracking**: Track completed days and maintain a streak
- **Bookmarks**: Save favorite devotion days for quick access
- **Personal Notes**: Write and save reflections for each day
- **Dark/Light Mode**: Toggle between themes for comfortable reading
- **Offline Support**: Works offline with service worker caching
- **PWA Installable**: Install on mobile devices for app-like experience
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Weekly Themes**: Color-coded themes for each week's focus

## Weekly Themes

1. **Week 1**: Forgiveness (Soft White / Light Teal)
2. **Week 2**: Reconciliation (Warm Gold / Earth Tones)
3. **Week 3**: Submission (Deep Teal / Navy)
4. **Week 4**: Obedience (Royal Purple / Steel)
5. **Week 5**: Easter Holy Week (Dark Slate / Crimson)

## Installation

### As PWA
1. Open the app in a modern browser (Chrome, Safari, Edge)
2. Look for the "Install App" button in the browser menu
3. Click install to add to your home screen

### Local Development
1. Clone or download this repository
2. Serve the files using a local web server:
   ```bash
   # Using Python 3
   python -m http.server 8050
   
   # Using Node.js
   npx serve -p 8050
   ```
3. Open http://localhost:8050 in your browser

## File Structure

```
devotion-app/
├── index.html          # Main HTML file
├── manifest.json       # PWA manifest
├── sw.js              # Service worker for offline support
├── css/
│   └── styles.css     # Main stylesheet
├── js/
│   ├── app.js         # Main JavaScript application
│   └── devotions.json # Devotion content data
├── icons/
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   └── icon-512.png
└── assets/
    └── church-logo.png
```

## Usage

1. **View Daily Devotions**: Browse through the 5 weeks of devotion content
2. **Mark Complete**: Click the checkmark to mark a day as complete
3. **Bookmark**: Click the bookmark icon to save favorite days
4. **Add Notes**: Click on a day card to open the modal and write personal reflections
5. **Track Progress**: View your progress bar and streak at the top of the page
6. **Toggle Theme**: Use the moon/sun icon to switch between dark and light mode

## Data Storage

- User progress (completed days, bookmarks, notes) is stored in localStorage
- All data persists between sessions
- No server required - works completely offline

## Church Information

**Japan Kingdom Church**
- Website: https://www.japankingdomchurch.com
- Email: jkc.contact@gmail.com
- Phone: 042-519-4940
- Address: 〒196-0015 東京都昭島市昭和町2-1-6 TE昭島ビル3F
- Church Elder: Sanna Patterson

## Browser Support

- Chrome/Edge (recommended)
- Safari (iOS and macOS)
- Firefox
- Opera

## Technical Details

- **Framework**: Vanilla JavaScript (no dependencies)
- **Styling**: Custom CSS with CSS variables
- **PWA**: Service Worker with offline caching
- **Storage**: localStorage for user progress
- **Responsive**: Mobile-first design approach

## License

© 2026 Japan Kingdom Church. All rights reserved.

## Deployment

### GitHub Pages

This app is automatically deployed to GitHub Pages on every push to the main branch. The deployment is handled by GitHub Actions workflows.

**Live Site:** https://kudzimusar.github.io/jkc-devotion-app/

### CI/CD Workflows

The repository includes automated workflows:

1. **Deploy Workflow** (`.github/workflows/deploy.yml`)
   - Automatically deploys to GitHub Pages on push to main
   - Runs on pull requests for preview
   - Can be triggered manually

2. **CI Workflow** (`.github/workflows/ci.yml`)
   - Validates HTML, CSS, JavaScript, and JSON files
   - Checks for syntax errors
   - Runs security scans
   - Validates PWA manifest and service worker

3. **Issue Tracker Workflow** (`.github/workflows/issue-tracker.yml`)
   - Creates weekly reports
   - Tracks deployments automatically
   - Generates issues for monitoring

### Manual Deployment

To deploy manually:
1. Push changes to the main branch
2. GitHub Actions will automatically build and deploy
3. Check the Actions tab for deployment status
4. Visit the GitHub Pages URL after deployment completes

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For questions or support, contact: jkc.contact@gmail.com

## License

© 2026 Japan Kingdom Church. All rights reserved.