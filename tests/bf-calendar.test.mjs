// B&F public calendar smoke test: seeds bookings/requests/blocks into the
// evaluated app.js and checks the day-cell types, pending
// state, today marker, blocked reason, and presenter names, in the default
// year-overview layout and in each alternative layout.
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
let code = fs.readFileSync(`${DIR}/app.js`, "utf8").replace(/^import .*history-archive.*$/m, "const HISTORY_ARCHIVE = [];").replace(/await Promise\.all\(\[[\s\S]*?\]\);/, "await Promise.reject(new Error('offline'));");
window.eval(
  `(async()=>{ ${code} \n window.__cal = (b, r, bl) => { bookings = b; requests = r; blocks = bl; renderPublicCalendar(); }; window.__presenterPicker = presenterPicker; window.__showFaculty = showFacultyCalendar; window.__firstFaculty = PEOPLE.faculty[0].id; window.__setBookings = (b) => { bookings = b; }; window.__unlockFaculty = (id) => { facultyId = id; db = {}; doc = (_db, _c, key) => ({ id: key }); setDoc = async () => {}; deleteDoc = async () => {}; }; })()`,
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

// --- default layout is the year overview ---------------------------------
assert.ok(box.querySelector(".cal-year"), "year overview is the default layout");
assert.strictEqual(box.querySelector('[data-cal-view="year"]').getAttribute("aria-pressed"), "true");

// --- confirmed seminar: seminar type, presenter name, not pending ---------
{
  const c = cell("2026-10-12");
  assert.ok(c, "confirmed seminar day is a button");
  assert.ok(c.classList.contains("t-seminar"), "confirmed seminar day has the seminar type");
  assert.ok(!c.getAttribute("aria-label").includes("pending"), "confirmed seminar is not pending");
  assert.ok(c.textContent.includes("Anna Cieslak"), "presenter name is shown in the cell");
}

// --- pending seminar: flagged pending -------------------------------------
{
  const c = cell("2026-10-13");
  assert.ok(c.getAttribute("aria-label").includes("(pending)"), "pending seminar is flagged pending");
  assert.ok(c.textContent.includes("Marc Lopez"), "pending presenter name is shown");
}

// --- mixed day: seminar + workshop on the same cell ----------------------
{
  const label = cell("2026-10-14").getAttribute("aria-label");
  assert.ok(label.includes("seminar"), "mixed day keeps the seminar");
  assert.ok(label.includes("workshop"), "mixed day adds the workshop");
}

// --- built-in blocks: JM Rehearsal Mondays, and Mondays outside Sep-Jun ---
{
  assert.ok(cell("2026-10-19").textContent.includes("JM Rehearsal presentations"), "JM Rehearsal Monday 19 Oct blocked");
  assert.ok(cell("2026-10-26").textContent.includes("JM Rehearsal presentations"), "JM Rehearsal Monday 26 Oct blocked");
  assert.strictEqual(cell("2026-10-12").textContent.includes("JM Rehearsal"), false, "other Mondays are not blocked");
  box.querySelector("#public-cal-next").click(); // Oct -> Nov
  assert.ok(cell("2026-11-02").textContent.includes("CEMFI closed"), "2 Nov 2026 is a CEMFI closure");
  assert.strictEqual(cell("2026-11-09"), null, "9 Nov 2026 stays open");
  box.querySelector("#public-cal-prev").click(); // Nov -> Oct
  box.querySelector("#public-cal-prev").click();
  box.querySelector("#public-cal-prev").click(); // Oct -> Aug
  assert.ok(cell("2026-08-03").textContent.includes("Summer holidays"), "August Monday is Non available");
  assert.strictEqual(cell("2026-08-04"), null, "August Tuesday is not blocked");
  box.querySelector("#public-cal-next").click();
  box.querySelector("#public-cal-next").click(); // back to Oct
  for (let i = 0; i < 2; i++) box.querySelector("#public-cal-next").click(); // Oct -> Dec
  assert.ok(cell("2026-12-28").textContent.includes("Christmas holidays"), "Christmas-break Monday is Non available");
  assert.strictEqual(cell("2026-12-14"), null, "mid-December Monday is not blocked");
  for (let i = 0; i < 3; i++) box.querySelector("#public-cal-next").click(); // Dec -> Mar 2027 (Easter 28 Mar 2027)
  assert.ok(cell("2027-03-22").textContent.includes("Easter holidays"), "Holy Monday is Non available");
  assert.ok(cell("2027-03-29").textContent.includes("Easter holidays"), "Easter Monday is Non available");
  assert.strictEqual(cell("2027-03-15"), null, "ordinary March Monday is not blocked");
  for (let i = 0; i < 7; i++) box.querySelector("#public-cal-next").click(); // Mar -> Oct 2027
  assert.ok(cell("2027-10-18").textContent.includes("JM Rehearsal presentations"), "JM Rehearsal Monday 18 Oct 2027 blocked");
  assert.ok(cell("2027-10-25").textContent.includes("JM Rehearsal presentations"), "JM Rehearsal Monday 25 Oct 2027 blocked");
  assert.strictEqual(cell("2027-10-11"), null, "11 Oct 2027 stays open");
  for (let i = 0; i < 12; i++) box.querySelector("#public-cal-prev").click(); // back to Oct 2026
}

// --- jump navigation: month/year dropdowns and Today ---------------------
{
  const pick = (id, v) => { const el = box.querySelector(id); el.value = v; el.dispatchEvent(new window.Event("change")); };
  pick("#public-cal-year", "2027"); // Oct 2026 -> Oct 2027 in one step
  assert.ok(cell("2027-10-18").textContent.includes("JM Rehearsal presentations"), "year dropdown jumps a full year");
  pick("#public-cal-month", "03"); // -> Mar 2027
  assert.ok(cell("2027-03-22").textContent.includes("Easter holidays"), "month dropdown jumps to March");
  box.querySelector("#public-cal-today").click();
  assert.ok(cell("2026-10-19"), "Today returns to the current month");
  assert.ok(box.querySelector("#public-cal-today").disabled, "Today is disabled on the current month");
}

// --- faculty calendar: holidays and rehearsals show red and locked by default ---
{
  window.__showFaculty(window.__firstFaculty);
  const day = (d) => window.document.querySelector(`#faculty-calendar [data-holiday="${d}"], #faculty-calendar [data-availability="${d}"]`);
  assert.ok(!day("2026-10-19").classList.contains("unavailable"), "JM Rehearsal Monday is not red in faculty calendar");
  assert.ok(!day("2026-11-02").classList.contains("unavailable"), "2 Nov closure is not red in faculty calendar");
  assert.ok(day("2026-08-03").classList.contains("unavailable") && day("2026-08-03").disabled, "Summer Monday is red and locked in faculty calendar");
  assert.ok(day("2026-12-28").classList.contains("unavailable"), "Christmas Monday is red in faculty calendar");
  assert.ok(!day("2026-10-12").classList.contains("unavailable"), "ordinary Monday stays green");
}

// --- faculty calendar: equal-size months and the per-month bulk button ---
{
  window.__showFaculty(window.__firstFaculty);
  const doc = window.document;
  assert.strictEqual(doc.querySelector("[data-month-toggle]"), null, "no bulk button while signed out");
  const grids = [...doc.querySelectorAll("#faculty-calendar .faculty-calendar-days")];
  assert.ok(grids.length > 6 && grids.every((g) => g.children.length === 42), "every month renders the same 6x7 grid");
  window.__unlockFaculty(window.__firstFaculty);
  window.__showFaculty(window.__firstFaculty);
  const toggle = doc.querySelector('[data-month-toggle="2026-09"]'),
    sep = () => [...doc.querySelectorAll('#faculty-calendar [data-availability^="2026-09"]')];
  assert.ok(toggle && sep().length === 4, "September has a bulk button and four Mondays");
  assert.strictEqual(toggle.textContent, "Mark all unavailable");
  toggle.click();
  assert.ok(sep().every((b) => b.getAttribute("aria-pressed") === "true"), "bulk button marks every Monday unavailable");
  assert.strictEqual(toggle.textContent, "Mark all available", "bulk button flips its label");
  toggle.click();
  assert.ok(sep().every((b) => b.getAttribute("aria-pressed") === "false"), "bulk button marks every Monday available again");
  window.__unlockFaculty(null);
}

// --- blocked day: red border + reason shown -------------------------------
{
  const c = cell("2026-10-20");
  assert.ok(c.classList.contains("t-blocked"), "blocked day has the blocked type");
  assert.ok(c.textContent.includes("Conference travel"), "block reason is shown in the cell");
}

// --- today: plain (event-less) cell keeps the .today class ---------------
{
  const today = box.querySelector(".cal-day.today");
  assert.ok(today, "today cell is marked");
  assert.strictEqual(today.tagName, "DIV", "event-less today cell has no button chrome");
  assert.ok(!today.classList.contains("past"), "today is not dimmed as past");
}

// --- layouts: each one shows names, opens the detail card, and is remembered ---
{
  const pressed = (v) => box.querySelector(`[data-cal-view="${v}"]`).getAttribute("aria-pressed") === "true";
  for (const [view, marker] of [["grid", ".cal-soft"], ["editorial", ".cal-editorial"], ["agenda", ".cal-agenda"], ["year", ".cal-year"]]) {
    box.querySelector(`[data-cal-view="${view}"]`).click();
    assert.ok(pressed(view) && box.querySelector(marker), `${view} layout renders`);
    assert.strictEqual(window.localStorage.getItem("bfs-cal-view"), view, `${view} layout is remembered`);
    assert.ok(cell("2026-10-12").textContent.includes("Anna Cieslak") || box.textContent.includes("Anna Cieslak"), `${view}: presenter shown`);
    assert.ok(box.textContent.includes("Conference travel"), `${view}: block reason shown`);
    box.querySelector(`[data-cal-date="2026-10-14"]`).click();
    const detail = window.document.getElementById("public-calendar-detail");
    if (view === "agenda") {
      assert.ok(detail.classList.contains("hidden"), "agenda shows details inline");
      assert.ok(box.querySelector(".cal-row.sel"), "agenda marks the selected row");
    } else {
      assert.ok(!detail.classList.contains("hidden") && detail.textContent.includes("Marc Lopez"), `${view}: detail card opens`);
    }
  }
  // type filter hides seminars (and the toggle is reversible)
  box.querySelector('[data-cal-filter="seminar"]').click();
  assert.strictEqual(cell("2026-10-12"), null, "hiding seminars removes seminar days");
  assert.ok(cell("2026-10-14"), "the workshop on a mixed day stays");
  box.querySelector('[data-cal-filter="seminar"]').click();
  assert.ok(cell("2026-10-12"), "showing seminars brings them back");
}

// --- booking date picker: a confirmed date renders unavailable (red) ------
{
  const pickerBox = window.document.getElementById("presenter-date-calendar"),
    nextBtn = () => window.document.getElementById("presenter-calendar-next");
  // Today is pinned to 2026-10-15; Oct's remaining Mondays are JM Rehearsal blocks.
  assert.ok(pickerBox.textContent.includes("October 2026"), "picker opens on the current month");
  assert.strictEqual(window.document.getElementById("presenter-date").value, "", "no free Monday this month: date stays empty");
  assert.ok(pickerBox.querySelector(".date-calendar-hint"), "hint shown when the month has no free day");
  nextBtn().click(); // -> Nov 2026
  assert.ok(!pickerBox.querySelector(".date-calendar-hint"), "no hint in a month with free days");
  window.__presenterPicker.reset();
  assert.ok(pickerBox.textContent.includes("October 2026"), "reset() returns to the current month");
  nextBtn().click();
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
  const emptyDay = (n) => [...box.querySelectorAll("div.cal-day")].find((el) => el.querySelector(".cal-n")?.textContent.endsWith(` ${n}`));
  const dayOne = emptyDay(1);
  assert.ok(dayOne.classList.contains("past"), "past empty day is dimmed");
  const dayTwentyFive = emptyDay(25);
  assert.ok(!dayTwentyFive.classList.contains("past"), "future empty day is not dimmed");
}

console.log("✓ all calendar smoke checks passed");
