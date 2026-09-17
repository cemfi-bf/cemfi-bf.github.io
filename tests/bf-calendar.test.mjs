// B&F public calendar smoke test: seeds bookings/requests/blocks into the
// evaluated app.js and checks the day-cell borders, dashed/solid pending
// state, today fill, blocked reason, and presenter names.
//
//   npm install --no-save jsdom && node tests/bf-calendar.test.mjs
import fs from "fs";
import path from "path";
import assert from "assert";
import { fileURLToPath } from "url";
import { JSDOM } from "jsdom";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(`${DIR}/index.html`, "utf8").replace(/<script type="module" src="app.js"><\/script>/, "");
const dom = new JSDOM(html, { url: "https://x.test/bf-seminars/", runScripts: "dangerously", pretendToBeVisual: true, beforeParse(w){ w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){} }); } });
const { window } = dom;

// Pin "today" to a fixed local date inside the school year so the calendar
// opens a predictable month; fromISO()'s explicit-string Date() calls pass
// straight through to the real constructor.
window.eval(`
  const __FIXED_NOW = new Date(2026, 9, 15, 12, 0, 0).getTime();
  const __RealDate = Date;
  window.Date = class extends __RealDate {
    constructor(...args) { super(...(args.length ? args : [__FIXED_NOW])); }
    static now() { return __FIXED_NOW; }
  };
`);

// app.js dynamically imports the Firebase CDN inside a try/catch; make it fail fast.
let code = fs.readFileSync(`${DIR}/app.js`, "utf8").replace(/await Promise\.all\(\[[\s\S]*?\]\);/, "await Promise.reject(new Error('offline'));");
window.eval(
  `(async()=>{ ${code} \n window.__cal = (b, r, bl) => { bookings = b; requests = r; blocks = bl; renderPublicCalendar(); }; window.__presenterPicker = presenterPicker; window.__setBookings = (b) => { bookings = b; }; })()`,
);
await new Promise((r) => setTimeout(r, 300));

const box = window.document.getElementById("public-calendar");
const cell = (date) => box.querySelector(`[data-cal-date="${date}"]`);

window.__cal(
  [
    { status: "confirmed", group: "seminar", presenterName: "Anna Cieslak", date: "2026-10-12", startTime: "13:30", endTime: "14:30" },
    { status: "confirmed", group: "seminar", presenterName: "Anna Cieslak", date: "2026-10-14", startTime: "13:30", endTime: "14:30" },
    { status: "confirmed", group: "phdworkshop", presenterName: "Marc Lopez", date: "2026-10-14", startTime: "12:00", endTime: "13:00" },
  ],
  [{ status: "pending", name: "Marc Lopez", date: "2026-10-13", startTime: "13:30", endTime: "14:30" }],
  [{ startDate: "2026-10-20", endDate: "2026-10-20", reason: "Conference travel" }],
);

// --- confirmed seminar: solid accent border, presenter name, no dots ----
{
  const c = cell("2026-10-12");
  assert.ok(c, "confirmed seminar day is a button");
  assert.ok(c.getAttribute("style").includes("solid var(--accent)"), "confirmed seminar border is solid accent");
  assert.ok(!c.getAttribute("style").includes("dashed"), "confirmed seminar border is not dashed");
  assert.ok(c.textContent.includes("Anna Cieslak"), "presenter name is shown in the cell");
}
assert.strictEqual(box.querySelector(".cal-chip"), null, "dot chips are gone from the calendar");

// --- pending seminar: dashed accent border --------------------------------
{
  const c = cell("2026-10-13");
  const style = c.getAttribute("style");
  assert.ok(style.includes("dashed var(--accent)"), "pending seminar border is dashed accent");
  assert.ok(c.textContent.includes("Marc Lopez"), "pending presenter name is shown");
}

// --- mixed day: seminar + workshop borders on the same cell --------------
{
  const style = cell("2026-10-14").getAttribute("style");
  assert.ok(style.includes("var(--accent)"), "mixed day keeps the seminar color");
  assert.ok(style.includes("var(--green)"), "mixed day adds the workshop color");
}

// --- blocked day: red border + reason shown -------------------------------
{
  const c = cell("2026-10-20");
  assert.ok(c.getAttribute("style").includes("var(--red)"), "blocked day border is red");
  assert.ok(c.textContent.includes("Conference travel"), "block reason is shown in the cell");
}

// --- today: plain (event-less) cell keeps the .today class ---------------
{
  const today = box.querySelector(".calendar-day.today");
  assert.ok(today, "today cell is marked");
  assert.strictEqual(today.tagName, "SPAN", "event-less today cell has no button chrome");
  assert.ok(!today.classList.contains("past"), "today is not dimmed as past");
}

// --- booking date picker: a confirmed date renders unavailable (red) ------
{
  const pickerBox = window.document.getElementById("presenter-date-calendar"),
    nextBtn = () => window.document.getElementById("presenter-calendar-next");
  nextBtn().click();
  nextBtn().click(); // Aug 2026 -> Oct 2026 (today is pinned to 2026-10-15)
  const monday = pickerBox.querySelector("button.calendar-day.monday");
  assert.ok(monday, "an available Monday renders as a clickable button before booking");
  const bookedDate = monday.dataset.date;
  window.__setBookings([
    { status: "confirmed", group: "seminar", date: bookedDate, startTime: "13:30", endTime: "15:00" },
  ]);
  window.__presenterPicker.render();
  const bookedCell = pickerBox.querySelector(`[data-date="${bookedDate}"]`),
    bookedSpan = [...pickerBox.querySelectorAll("span.calendar-day.blocked")].find(
      (el) => el.getAttribute("aria-label")?.includes("already booked"),
    );
  assert.strictEqual(bookedCell, null, "a confirmed date is no longer a pickable button");
  assert.ok(bookedSpan, "the confirmed date renders as a blocked (red) span instead");
  const stillAvailable = pickerBox.querySelector("button.calendar-day.monday");
  assert.ok(stillAvailable, "other Mondays in the same month remain available");
  assert.notStrictEqual(stillAvailable.dataset.date, bookedDate, "the still-available Monday isn't the booked one");
  window.__setBookings([]);
}

// --- past dates are dimmed, today/future are not --------------------------
{
  // "today" is pinned to 2026-10-15; Oct 12 (event) and Oct 1 (empty) are past.
  assert.ok(cell("2026-10-12").classList.contains("past"), "past event day is dimmed");
  assert.ok(!cell("2026-10-20").classList.contains("past"), "future event day is not dimmed");
  const dayOne = [...box.querySelectorAll("span.calendar-day")].find((el) => el.textContent.trim() === "1");
  assert.ok(dayOne.classList.contains("past"), "past empty day is dimmed");
  const dayTwentyFive = [...box.querySelectorAll("span.calendar-day")].find((el) => el.textContent.trim() === "25");
  assert.ok(!dayTwentyFive.classList.contains("past"), "future empty day is not dimmed");
}

console.log("✓ all calendar smoke checks passed");
