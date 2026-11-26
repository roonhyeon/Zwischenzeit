// Zwischenzeit widget for Scriptable (iOS)
// Home screen: small or medium. Lock screen: rectangular, inline or circular.
// Widget parameter: "suyeon" on Suyeon's phone, "mika" on Mika's phone.

const CONFIG = {
  me: "suyeon", // used when the widget has no parameter
  people: {
    suyeon: { name: "Suyeon", city: "Sydney", tz: "Australia/Sydney", wakeEarly: "07:00", wake: "09:00", bed: "00:30" },
    mika: { name: "Mika", city: "Karlsruhe", tz: "Europe/Berlin", wakeEarly: "08:00", wake: "10:00", bed: "00:00" },
  },
  leave: "2027-01-11", // Mika leaves Sydney
  meet: "2027-12-20", // reunion day
  appUrl: "", // paste the GitHub Pages address here, e.g. https://yourname.github.io/zwischenzeit/
};

const MAYBE = { suyeon: "Maybe up", mika: "Up… or snoozing" };

// ---------- time helpers ----------
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function parts(tz, d = new Date()) {
  const o = {};
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short", hourCycle: "h23",
  });
  for (const p of f.formatToParts(d)) o[p.type] = p.value;
  return { y: +o.year, mo: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second, wd: WD.indexOf(o.weekday) };
}
function off(tz, d = new Date()) {
  const p = parts(tz, d);
  return Math.round((Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(d.getTime() / 1000) * 1000) / 60000);
}
const toM = (s) => { const [a, b] = s.split(":").map(Number); return a * 60 + b; };
const pad = (n) => String(n).padStart(2, "0");
const fmtM = (m) => { m = ((Math.round(m) % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ":" + pad(m % 60); };
const inW = (t, a, b) => (a <= b ? t >= a && t < b : t >= a || t < b);
function status(key, t) {
  const r = CONFIG.people[key];
  if (inW(t, toM(r.wake), toM(r.bed))) return "a";
  if (inW(t, toM(r.wakeEarly), toM(r.wake))) return "m";
  return "s";
}
const label = (key, st) => (st === "a" ? "Awake" : st === "m" ? MAYBE[key] : "Asleep");
const dn = (s) => { const [a, b, c] = s.split("-").map(Number); return Date.UTC(a, b - 1, c) / 864e5; };
const todayDn = (tz) => { const z = parts(tz); return Date.UTC(z.y, z.mo - 1, z.d) / 864e5; };

function sky(h) {
  if (h < 5 || h >= 21) return ["#141a3a", "#2d3468", true];
  if (h < 7) return ["#ff9f7a", "#ffe1cc", false];
  if (h < 18) return ["#58a6ff", "#d6ecff", false];
  return ["#ff7a59", "#3a3f7a", true];
}

// ---------- who is who ----------
const param = (args.widgetParameter || "").trim().toLowerCase();
const meKey = CONFIG.people[param] ? param : CONFIG.me;
const youKey = Object.keys(CONFIG.people).find((k) => k !== meKey);
const me = CONFIG.people[meKey], you = CONFIG.people[youKey];

const now = new Date();
const zy = parts(you.tz, now), zm = parts(me.tz, now);
const youMin = zy.h * 60 + zy.mi, meMin = zm.h * 60 + zm.mi;
const youSt = status(youKey, youMin), meSt = status(meKey, meMin);

// countdown line
const today = todayDn("Australia/Sydney");
const leftLeave = dn(CONFIG.leave) - today;
const leftMeet = dn(CONFIG.meet) - todayDn("Europe/Berlin");
const countdown = leftLeave > 0 ? `Leaves in ${leftLeave}d` : leftLeave === 0 ? "Gute Reise today" : `Reunion in ${leftMeet}d`;
const countdownLong = leftLeave > 0 ? `Mika leaves Sydney in ${leftLeave} days` : leftLeave === 0 ? "Mika flies today. Gute Reise" : `Reunion in ${leftMeet} days`;

// first "both awake" window today, in my time
function bothAwake() {
  const gap = off(me.tz, now) - off(you.tz, now);
  const ok = [];
  for (let i = 0; i < 96; i++) {
    const m = i * 15;
    ok.push(status(meKey, m) === "a" && status(youKey, m - gap) === "a");
  }
  let runs = [], st = -1;
  for (let i = 0; i <= 96; i++) {
    if (i < 96 && ok[i]) { if (st < 0) st = i; } else if (st >= 0) { runs.push([st, i]); st = -1; }
  }
  if (runs.length > 1 && runs[0][0] === 0 && runs[runs.length - 1][1] === 96) { const l = runs.pop(); runs[0] = [l[0], runs[0][1] + 96]; }
  if (!runs.length) return null;
  runs.sort((a, b) => b[1] - b[0] - (a[1] - a[0]));
  const [s, e] = runs[0];
  return { me: `${fmtM(s * 15)}–${fmtM(e * 15)}`, you: `${fmtM(s * 15 - gap)}–${fmtM(e * 15 - gap)}` };
}

// ---------- drawing ----------
function arcImage(h, mi, c1, w = 300, hgt = 90) {
  const ctx = new DrawContext();
  ctx.size = new Size(w, hgt);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const hf = h + mi / 60, sun = hf >= 6 && hf < 20;
  const t = sun ? (hf - 6) / 14 : ((hf - 20 + 24) % 24) / 10;
  const x0 = 14, x1 = w - 14, yb = hgt - 10, yc = -hgt * 0.25, xm = w / 2;
  const path = new Path();
  path.move(new Point(x0, yb));
  path.addQuadCurve(new Point(x1, yb), new Point(xm, yc));
  ctx.addPath(path);
  ctx.setStrokeColor(new Color("#ffffff", 0.45));
  ctx.setLineWidth(1.5);
  ctx.strokePath();
  const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * xm + t * t * x1;
  const y = (1 - t) ** 2 * yb + 2 * (1 - t) * t * yc + t * t * yb;
  if (sun) {
    ctx.setFillColor(new Color("#ffd23f", 0.3));
    ctx.fillEllipse(new Rect(x - 20, y - 20, 40, 40));
    ctx.setFillColor(new Color("#ffd23f"));
    ctx.fillEllipse(new Rect(x - 12, y - 12, 24, 24));
  } else {
    ctx.setFillColor(new Color("#f4f1ff"));
    ctx.fillEllipse(new Rect(x - 11, y - 11, 22, 22));
    ctx.setFillColor(new Color(c1));
    ctx.fillEllipse(new Rect(x - 5, y - 15, 20, 20));
  }
  return ctx.getImage();
}

// live clock trick: a timer that started at the other person's midnight shows their local time
function midnightOf(z) { return new Date(now.getTime() - ((z.h * 60 + z.mi) * 60 + z.s) * 1000); }

function addClock(stack, z, size, color) {
  if (z.h === 0) {
    // the timer style drops the hour during 00:xx, so show plain text in that hour
    const t = stack.addText(fmtM(z.h * 60 + z.mi));
    t.font = Font.semiboldRoundedSystemFont(size);
    t.textColor = color;
    return t;
  }
  const d = stack.addDate(midnightOf(z));
  d.applyTimerStyle();
  d.font = Font.semiboldRoundedSystemFont(size);
  d.textColor = color;
  d.lineLimit = 1;
  d.minimumScaleFactor = 0.6;
  return d;
}

function txt(stack, s, font, color, opacity = 1) {
  const t = stack.addText(s);
  t.font = font;
  t.textColor = color;
  t.textOpacity = opacity;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.7;
  return t;
}

// ---------- build ----------
const family = config.widgetFamily || "medium";
const w = new ListWidget();
if (CONFIG.appUrl) w.url = CONFIG.appUrl;
w.refreshAfterDate = new Date(now.getTime() + 15 * 60 * 1000);

if (family === "accessoryInline") {
  w.addText(`${you.name} ${fmtM(youMin)} · ${label(youKey, youSt).toLowerCase()}`);
} else if (family === "accessoryCircular") {
  w.addAccessoryWidgetBackground = true;
  const s = w.addStack(); s.layoutVertically(); s.centerAlignContent();
  txt(s, you.name, Font.mediumSystemFont(10), Color.white());
  txt(s, fmtM(youMin), Font.semiboldRoundedSystemFont(14), Color.white());
  txt(s, youSt === "s" ? "zzz" : youSt === "m" ? "~" : "up", Font.systemFont(10), Color.white(), 0.8);
} else if (family === "accessoryRectangular") {
  txt(w, `${you.name} · ${fmtM(youMin)}`, Font.semiboldRoundedSystemFont(15), Color.white());
  txt(w, label(youKey, youSt), Font.systemFont(13), Color.white(), 0.85);
  txt(w, countdown, Font.systemFont(13), Color.white(), 0.85);
} else {
  const [c1, c2, dark] = sky(zy.h);
  const ink = dark ? Color.white() : new Color("#15131c");
  const g = new LinearGradient();
  g.colors = [new Color(c1), new Color(c2)];
  g.locations = [0, 1];
  w.backgroundGradient = g;
  w.setPadding(12, 14, 12, 14);

  if (family === "small") {
    w.addImage(arcImage(zy.h, zy.mi, c1, 300, 70)).centerAlignImage();
    w.addSpacer(2);
    txt(w, `${you.name} in ${you.city}`, Font.semiboldSystemFont(13), ink);
    addClock(w, zy, 30, ink);
    txt(w, label(youKey, youSt), Font.mediumSystemFont(12), ink, 0.85);
    w.addSpacer();
    txt(w, countdown, Font.systemFont(11), ink, 0.75);
  } else {
    const row = w.addStack();
    row.layoutHorizontally();
    const left = row.addStack();
    left.layoutVertically();
    left.addImage(arcImage(zy.h, zy.mi, c1, 300, 70));
    txt(left, `${you.name} in ${you.city}`, Font.semiboldSystemFont(14), ink);
    addClock(left, zy, 34, ink);
    txt(left, label(youKey, youSt), Font.mediumSystemFont(13), ink, 0.85);
    row.addSpacer(14);
    const right = row.addStack();
    right.layoutVertically();
    right.addSpacer(4);
    txt(right, `${me.name} · ${fmtM(meMin)}`, Font.semiboldSystemFont(13), ink);
    txt(right, label(meKey, meSt), Font.systemFont(12), ink, 0.8);
    right.addSpacer(8);
    const both = bothAwake();
    txt(right, "Both awake", Font.semiboldSystemFont(12), ink, 0.8);
    txt(right, both ? both.me : "not today", Font.semiboldRoundedSystemFont(14), ink);
    if (both) txt(right, `${both.you} ${you.city}`, Font.systemFont(11), ink, 0.75);
    right.addSpacer();
    txt(right, countdownLong, Font.systemFont(11), ink, 0.75);
  }
}

if (config.runsInWidget || config.runsInAccessoryWidget) {
  Script.setWidget(w);
} else {
  await w.presentMedium();
}
Script.complete();
