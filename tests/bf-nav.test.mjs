// B&F navigation smoke test: loads index.html + app.js into a real DOM with
// Firebase stubbed out, then drives the router.
//
//   npm install --no-save jsdom && node tests/bf-nav.test.mjs
import fs from "fs";
import path from "path";
import assert from "assert";
import { fileURLToPath } from "url";
import { JSDOM } from "jsdom";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(`${DIR}/index.html`, "utf8").replace(/<script type="module" src="app.js"><\/script>/, "");
const dom = new JSDOM(html, { url: "https://x.test/bf-seminars/", runScripts: "dangerously", pretendToBeVisual: true, beforeParse(w){ w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){} }); } });
const { window } = dom;

// app.js dynamically imports the Firebase CDN inside a try/catch; make it fail fast.
let code = fs.readFileSync(`${DIR}/app.js`, "utf8").replace(/await Promise\.all\(\[[\s\S]*?\]\);/, "await Promise.reject(new Error('offline'));");
window.eval(`(async()=>{ ${code} \n window.__view = view; window.__renderHeader = renderHeader; window.__setAuth = (o, f) => { organizerId = o; facultyId = f; }; })()`);
await new Promise((r) => setTimeout(r, 300));

const $ = (id) => window.document.getElementById(id);
const visible = (id) => !$(id).classList.contains("hidden");
const navLabels = () =>
  [...window.document.querySelectorAll("#main-nav .header-btn")]
    .filter((b) => !b.classList.contains("hidden"))
    .map((b) => b.textContent.trim());

// --- default route -------------------------------------------------------
assert.ok(visible("calendar-view"), "calendar is the default view");
assert.deepStrictEqual(navLabels(), ["Calendar", "Book seminar", "Book workshop", "Faculty", "Organizer"]);
assert.strictEqual(window.location.hash, "#calendar");

// --- one click to each public view --------------------------------------
for (const [nav, section, title] of [
  ["presenter", "presenter-view", "Book a seminar"],
  ["phd", "phd-view", "Book a workshop"],
  ["faculty", "faculty-view", "Faculty attendance"],
]) {
  window.document.querySelector(`[data-nav="${nav}"]`).click();
  assert.ok(visible(section), `${nav} -> ${section}`);
  assert.ok(!visible("calendar-view"), `${nav} hides the calendar`);
  assert.strictEqual(window.location.hash, `#${nav}`, `${nav} sets the hash`);
  assert.ok(window.document.title.startsWith(title), `${nav} sets the title`);
  const active = [...window.document.querySelectorAll(".header-btn.active")].map((b) => b.dataset.view);
  assert.deepStrictEqual(active, [nav], `${nav} is the only active nav item`);
}

// --- retired routes fall back to the calendar ---------------------------
for (const dead of ["login", "home", "nonsense", ""]) {
  window.__view(dead);
  assert.ok(visible("calendar-view"), `#${dead} falls back to the calendar`);
}
// legacy organizer deep-links still reach the organizer view (sign-in card if anonymous)
for (const legacy of ["seminar-requests", "manage-calendar", "approval"]) {
  window.__view(legacy);
  assert.ok(visible("organizer-view"), `#${legacy} still reaches the organizer view`);
}

// --- organizer: bare section names resolve to their first tab -----------
$("organizer-login").classList.add("hidden");
$("organizer-dashboard").classList.remove("hidden");
const orgCases = [
  ["organizer", "org-seminars", "org-seminars-approvals"],
  ["organizer-seminars", "org-seminars", "org-seminars-approvals"],
  ["organizer-seminars-create", "org-seminars", "org-seminars-create"],
  ["organizer-seminars-edit", "org-seminars", "org-seminars-edit"],
  ["organizer-workshops", "org-workshops", "org-workshops-approvals"],
  ["organizer-workshops-create", "org-workshops", "org-workshops-create"],
  ["organizer-workshops-edit", "org-workshops", "org-workshops-edit"],
  ["organizer-events", "org-events", "org-events-create"],
  ["organizer-events-edit", "org-events", "org-events-edit"],
];
const ALL_PANELS = ["org-seminars-approvals","org-seminars-create","org-seminars-edit","org-workshops-approvals","org-workshops-create","org-workshops-edit","org-events-create","org-events-edit"];
for (const [route, section, panel] of orgCases) {
  window.__view(route);
  assert.ok(visible("organizer-view"), `${route} shows the organizer view`);
  assert.ok(visible(section), `${route} -> ${section}`);
  assert.deepStrictEqual(ALL_PANELS.filter(visible), [panel], `${route} -> only ${panel}`);
  const tab = window.document.querySelector("#org-tabs button.active");
  assert.strictEqual(tab.dataset.orgPage.replace(/^organizer-/, "org-"), section, `${route} highlights its tab`);
  const action = window.document.querySelector("[data-org-action].active");
  assert.strictEqual(action.dataset.orgAction, panel.replace(/^org-/, "organizer-"), `${route} highlights its action tab`);
  // the header keeps "Organizer" lit on every sub-page
  assert.deepStrictEqual([...window.document.querySelectorAll(".header-btn.active")].map((b) => b.dataset.view), ["organizer"]);
}

// --- retired cancellation actions/panels are gone -------------------------
for (const dead of ["organizer-seminars-cancel", "organizer-workshops-cancel", "organizer-events-remove"]) {
  assert.strictEqual(window.document.querySelector(`[data-org-action="${dead}"]`), null, `${dead} action tab removed`);
}
for (const deadPanel of ["org-seminars-cancel", "org-workshops-cancel", "org-events-remove"]) {
  assert.strictEqual($(deadPanel), null, `#${deadPanel} panel removed`);
}
for (const route of ["organizer-seminars-cancel", "organizer-workshops-cancel", "organizer-events-remove"]) {
  window.__view(route);
  assert.ok(visible("calendar-view"), `${route} falls back to the calendar`);
}
window.__view("organizer");

// --- action strips: seminars/workshops Approve/Create/Edit, events Create/Edit
const stripActions = (label) =>
  [...window.document.querySelectorAll(`[aria-label="${label}"] [data-org-action]`)].map(
    (b) => b.dataset.orgAction,
  );
assert.deepStrictEqual(
  stripActions("Seminar actions"),
  ["organizer-seminars-approvals", "organizer-seminars-create", "organizer-seminars-edit"],
  "seminar actions are Approve/Create/Edit",
);
assert.deepStrictEqual(
  stripActions("PhD Workshop actions"),
  ["organizer-workshops-approvals", "organizer-workshops-create", "organizer-workshops-edit"],
  "workshop actions are Approve/Create/Edit",
);
assert.deepStrictEqual(
  stripActions("Exogenous Event actions"),
  ["organizer-events-create", "organizer-events-edit"],
  "event actions are Create/Edit",
);

for (const prefix of ["seminar", "workshop"]) {
  assert.strictEqual($(`${prefix}-cancel-event`), null, `#${prefix}-cancel-event form control removed`);
}

// --- no Back buttons survive --------------------------------------------
assert.strictEqual(window.document.body.innerHTML.match(/Back to/g), null, "no 'Back to …' buttons remain");

// --- signed-in nav narrows to what view() will actually allow -----------
window.__setAuth("amengual", null); window.__renderHeader();
assert.deepStrictEqual(navLabels(), ["Calendar", "Organizer"], "organizer nav narrows");
window.__setAuth(null, "sentana"); window.__renderHeader();
assert.deepStrictEqual(navLabels(), ["Calendar", "Faculty"], "faculty nav narrows");
window.__setAuth(null, null); window.__renderHeader();
assert.strictEqual(navLabels().length, 5, "signing out restores the full nav");

// --- theme cycles light -> dark -> red -> light --------------------------
const seen = [];
for (let i = 0; i < 4; i++) { seen.push(window.document.documentElement.dataset.theme); $("theme-cycle").click(); }
assert.deepStrictEqual(seen, ["light", "dark", "red", "light"], "theme cycles");

console.log("✓ all smoke checks passed");
