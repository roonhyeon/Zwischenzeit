# Zwischenzeit

*German for "the time in between".*

Two clocks, two skies, and a countdown until Sydney and Karlsruhe meet again.

---

**Hi Mika,**

You build things for fun, so this time I built one for you.

This is for the months between your last day in Sydney and our reunion in Karlsruhe. Open it whenever you wonder whether I'm asleep, whether it's a good time to call, or how many days are left.

The code is yours now. Break it, fix it, add whatever you want. I left you a few ideas at the bottom.

Gute Reise, and see you soon.

— Suyeon

---

## What it does

- **Two live clocks**: Sydney and Karlsruhe, each with its own sky that changes colour through the day, and a sun or moon that moves along an arc
- **Awake or asleep?**: shows whether the other person is probably up, based on their usual wake-up and bed times
- **When are we both awake?**: a 24-hour strip that highlights the hours you can both talk, shown in both cities' times
- **Countdowns**: next weekly call, next video call (every two weeks), and reunion day
- **Daylight saving handled**: the gap moves between 8 and 10 hours during the year because Australia and Germany switch in opposite seasons. The app works out the dates itself, every year.
- **Whose phone is this?**: one setting flips the whole app to your point of view

## Install on iPhone

### Web app
1. Open https://roonhyeon.github.io/Zwischenzeit/ in **Safari**
2. Share → **Add to Home Screen**, with **Open as Web App** turned on
3. Open it, go to **Settings** and set "Whose phone is this?" to your name

### Widget (home screen and lock screen)
1. Install [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) from the App Store
2. Add `Zwischenzeit.js` as a new script (or drop it into iCloud Drive → Scriptable)
3. Set `appUrl` at the top of the script to the web app address
4. Add a Scriptable widget (small, medium, or a lock screen size) and choose the `Zwischenzeit` script
5. Set the widget parameter to `mika` or `suyeon`

## How it works

- Plain HTML, CSS and JavaScript in one file. No framework, no build step.
- Time zones come from the browser's `Intl.DateTimeFormat` with the IANA zones `Australia/Sydney` and `Europe/Berlin`, so daylight saving rules follow whatever iOS knows.
- Settings are stored in `localStorage` on each phone.
- The widget is a [Scriptable](https://scriptable.app) script. It shows the other person's local time live by using a timer that started at their midnight.

```
index.html            the web app
manifest.webmanifest  home screen settings
icon-180.png          app icon (iPhone)
icon-512.png          app icon (large)
Zwischenzeit.js       Scriptable widget
```

## Ideas for Mika

Pick one, open an issue, send a pull request. I'll review it. Strictly.

- [ ] **Today's photo**: one photo and one line a day from each of us, shown in the app and the widget
- [ ] **Karlsruhe weather** next to the clock, so I know when you're freezing
- [ ] **Sync settings** between our phones, so changing a bedtime on one phone updates the other
- [ ] **Push notification** when the other person posts something
- [ ] **Fix the 00:xx hour in the widget**: the live timer drops the hour after midnight. There must be a cleverer trick.
- [ ] **widget**