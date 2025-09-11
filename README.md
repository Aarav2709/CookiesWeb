# CookiesOnWeb

Vanilla HTML/CSS/JS incremental "Cookie Clicker"-style game.

Features

- Big cookie button with floating +1 effect
- Stats: total cookies and cookies per second (CPS)
- Multiple upgrades (10 tiers) with exponential costs
- Progressive unlocks and achievement messages
- LocalStorage save/load with autosave and offline progress
- Optional prestige system with permanent multiplier

Run
Open `index.html` in a browser. No build needed.

Deploy (Vercel CLI)

1. Install CLI (once):
   - npm i -g vercel
2. Login and link:
   - vercel login
   - vercel
3. Deploy (prod):
   - vercel --prod

Notes: This is a static site. `vercel.json` uses the static builder and routes all paths to `index.html`.

Notes

- Autosaves every 10s; use Save/Load buttons as needed.
- Prestige becomes available as lifetime cookies reach new million thresholds.
- Costs scale by 1.15^owned. CPS is multiplied by prestige multiplier.

License
MIT
