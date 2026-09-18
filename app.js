import { HISTORY_ARCHIVE } from "./history-archive.js";
let db,
  functions,
  doc,
  setDoc,
  deleteDoc,
  httpsCallable,
  auth,
  signInWithEmailAndPassword,
  signOut,
  getIdTokenResult;
const PEOPLE = {
  faculty: [
    { id: "amengual", name: "Dante Amengual", photo: "photos/amengual.png" },
    { id: "sentana", name: "Enrique Sentana", photo: "photos/sentana.png" },
    { id: "segura", name: "Anatoli Segura", photo: "photos/segura.png" },
    { id: "repullo", name: "Rafael Repullo", photo: "photos/repullo.png" },
    { id: "suarez", name: "Javier Suarez", photo: "photos/suarez.png" },
    { id: "fanelli", name: "Sebastian Fanelli", photo: "photos/fanelli.png" },
    { id: "kochen", name: "Federico Kochen", photo: "photos/kochen.png" },
    { id: "osberghaus", name: "Alex Osberghaus", photo: "photos/osberghaus.png" },
  ],
  phd: [
    { id: "villota", name: "Jesus Villota", photo: "photos/villota.png" },
    { id: "derosa", name: "Paolo De Rosa", photo: "photos/derosa.png" },
    { id: "taroco", name: "Santiago Taroco", photo: "photos/santiago.png" },
    { id: "wang", name: "Jun Wang", photo: "photos/jun.png" },
  ],
};
const OTHER_PHD = [
  { id: "sonnur-bas", name: "Sonnur Bas", photo: "https://cemfi.es/images/profesores/Sonnur-Bas.png" },
  {
    id: "marta-dominguez",
    name: "Marta Domínguez",
    photo: "https://cemfi.es/images/doctorandos/Domnguez.png",
  },
  {
    id: "santiago-etchegaray",
    name: "Santiago Etchegaray",
    photo: "https://cemfi.es/images/profesores/Santiago-Etchegaray.png",
  },
  {
    id: "daniel-fernandez",
    name: "Daniel Fernández",
    photo: "https://cemfi.es/images/doctorandos/Daniel-Fernandez.png",
  },
  {
    id: "andrea-guccione",
    name: "Andrea Guccione",
    photo: "https://cemfi.es/images/doctorandos/Guccione.png",
  },
  {
    id: "salvatore-liaci",
    name: "Salvatore Liaci",
    photo: "https://cemfi.es/images/profesores/Salvatore-Liaci.png",
  },
  { id: "xianting-lin", name: "Xianting Lin", photo: "https://cemfi.es/images/profesores/Xianting.png" },
  { id: "jorge-martin", name: "Jorge Martín", photo: "https://cemfi.es/images/profesores/Jorge-Martin.png" },
  {
    id: "guillermo-martinez",
    name: "Guillermo Martínez",
    photo: "https://cemfi.es/images/profesores/martinez.png",
  },
  {
    id: "christos-mylonakis",
    name: "Christos Mylonakis",
    photo: "https://cemfi.es/images/profesores/Christos.png",
  },
  {
    id: "erik-ortiz",
    name: "Erik Ortiz-Covarrubias",
    photo: "https://cemfi.es/images/profesores/Erik-Ortiz.png",
  },
  {
    id: "moritz-osterhuber",
    name: "Moritz Osterhuber",
    photo: "https://cemfi.es/images/profesores/osterhuber.png",
  },
  { id: "haozi-pan", name: "Haozi Pan", photo: "https://cemfi.es/images/profesores/Haozi%20Pan.png" },
  { id: "rodrigo-pena", name: "Rodrigo Peña", photo: "https://cemfi.es/images/profesores/Rodrigo-Pena.png" },
  { id: "javier-ramos", name: "Javier Ramos", photo: "https://cemfi.es/images/profesores/Javier-Ramos.png" },
  { id: "jiaxuan-ren", name: "Jiaxuan Ren", photo: "https://cemfi.es/images/profesores/ren.png" },
  { id: "eugenio-renedo", name: "Eugenio Renedo", photo: "https://cemfi.es/images/doctorandos/Renedo.png" },
  {
    id: "jorge-rodriguez",
    name: "Jorge Rodríguez de la Rubia",
    photo: "https://cemfi.es/images/doctorandos/Jorge-Rodriguez.png",
  },
  {
    id: "gonzalo-romero",
    name: "Gonzalo Romero-Villanueva",
    photo: "https://cemfi.es/images/profesores/Gonzalo-Romero-Villanueva.png",
  },
  { id: "manuel-ruiz", name: "Manuel Ruiz", photo: "https://cemfi.es/images/profesores/ruiz.png" },
  { id: "paula-ruiz", name: "Paula Ruiz", photo: "https://cemfi.es/images/profesores/paula.png" },
  { id: "wisse-rutgers", name: "Wisse Rutgers", photo: "https://cemfi.es/images/profesores/rutgers.png" },
  {
    id: "elena-sanjuan",
    name: "Elena Sanjuán",
    photo: "https://cemfi.es/images/profesores/Elena-Sanjuan.png",
  },
  { id: "juan-segura", name: "Juan Segura", photo: "https://cemfi.es/images/doctorandos/Segura.png" },
  {
    id: "afonso-vaz",
    name: "Afonso Vaz de Castro",
    photo: "https://cemfi.es/images/profesores/Afonso-Lemos.png",
  },
  { id: "ke-xu", name: "Ke Xu", photo: "https://cemfi.es/images/profesores/ke.png" },
];
const $ = (id) => document.getElementById(id),
  esc = (v) =>
    String(v || "").replace(
      /[&<>'"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c],
    );
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromISO = (s) => new Date(`${s}T12:00:00`),
  formatDate = (s) =>
    fromISO(s).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
const isMonday = (s) => fromISO(s).getDay() === 1,
  overlaps = (a, b) => a.startTime < b.endTime && b.startTime < a.endTime;
const avatar = (p) =>
  p.photo
    ? `<img class="avatar" src="${p.photo}" alt="" />`
    : `<span class="avatar">${p.name
        .split(" ")
        .map((x) => x[0])
        .join("")
        .slice(0, 2)}</span>`;
const error = (message) => {
  $("error-banner").textContent = message;
  $("error-banner").classList.remove("hidden");
};
const THEMES = [
  { name: "light", icon: "☀", label: "Light theme, switch to dark" },
  { name: "dark", icon: "☾", label: "Dark theme, switch to red" },
  { name: "red", icon: "◆", label: "Red theme, switch to light" },
];
function setTheme(name) {
  const theme = THEMES.find((t) => t.name === name) || THEMES[0];
  document.documentElement.dataset.theme = theme.name;
  localStorage.setItem("bfs-theme", theme.name);
  $("theme-cycle").textContent = theme.icon;
  $("theme-cycle").setAttribute("aria-label", theme.label);
}
setTheme(document.documentElement.dataset.theme || "light");
$("theme-cycle").onclick = () => {
  const i = THEMES.findIndex((t) => t.name === document.documentElement.dataset.theme);
  setTheme(THEMES[(i + 1) % THEMES.length].name);
};

let availability = [],
  requests = [],
  bookings = [],
  blocks = [],
  organizerId = null,
  facultyId = null,
  editingBookingIds = { seminar: null, workshop: null },
  editingBlockId = null;
const ORGANIZER_LOGIN_EMAIL = "dante@cemfi-bf-seminars.firebaseapp.com";
const FACULTY_EMAILS = Object.fromEntries(
  PEOPLE.faculty.map((person) => [person.id, `${person.id}@cemfi-bf-seminars.firebaseapp.com`]),
);

(async () => {
  try {
    const firebaseConfig = {
      apiKey: "AIzaSyCAy2rNbrtWTmqsErNzlf_bqcgFJKaHZg0",
      authDomain: "cemfi-bf-seminars.firebaseapp.com",
      projectId: "cemfi-bf-seminars",
      storageBucket: "cemfi-bf-seminars.firebasestorage.app",
      messagingSenderId: "219990652036",
      appId: "1:219990652036:web:81149aa4e6de8556213ed1",
    };
    const [
      { initializeApp },
      {
        getAuth,
        signInAnonymously,
        onAuthStateChanged,
        signInWithEmailAndPassword: _signInWithEmailAndPassword,
        signOut: _signOut,
        getIdTokenResult: _getIdTokenResult,
      },
      {
        getFirestore,
        collection,
        doc: _doc,
        setDoc: _setDoc,
        deleteDoc: _deleteDoc,
        onSnapshot,
        query,
        where,
      },
      { getFunctions, httpsCallable: _httpsCallable },
    ] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.13.2/firebase-functions.js"),
    ]);
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
    doc = _doc;
    setDoc = _setDoc;
    deleteDoc = _deleteDoc;
    httpsCallable = _httpsCallable;
    signInWithEmailAndPassword = _signInWithEmailAndPassword;
    signOut = _signOut;
    getIdTokenResult = _getIdTokenResult;
    onAuthStateChanged(auth, async (u) => {
      organizerId = null;
      facultyId = null;
      if (u && !u.isAnonymous) {
        const token = await getIdTokenResult(u);
        organizerId = token.claims.organizer || null;
        facultyId = token.claims.faculty || null;
      }
      if (!u)
        signInAnonymously(auth).catch(() =>
          error("Could not connect to the scheduling service. Reload and try again."),
        );
      const currentView = location.hash.slice(1) || "calendar";
      renderHeader();
      if (organizerId && !["calendar", "history"].includes(currentView)) view("organizer");
      else if (facultyId && !["calendar", "history", "faculty"].includes(currentView)) view("faculty");
      renderOrganizerAuth();
      renderDynamic();
    });
    onSnapshot(
      collection(db, "availability"),
      (snap) => {
        availability = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderDynamic();
      },
      () => error("Could not load faculty availability."),
    );
    onSnapshot(
      collection(db, "seminarRequests"),
      (snap) => {
        requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderDynamic();
      },
      () => error("Could not load seminar bookings."),
    );
    onSnapshot(
      collection(db, "bookings"),
      (snap) => {
        bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderDynamic();
      },
      () => error("Could not load the schedule."),
    );
    onSnapshot(
      collection(db, "blocks"),
      (snap) => {
        blocks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderDynamic();
      },
      () => error("Could not load blocked dates."),
    );
  } catch (e) {
    error("Could not connect to the scheduling service. Reload and try again.");
  }
})();

function schoolYear() {
  return { start: new Date(2026, 7, 1), end: new Date(2027, 6, 31) };
}
function allMondays() {
  const { start, end } = schoolYear(),
    out = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1))
    if (d.getDay() === 1) out.push(iso(d));
  return out;
}
function futureMondays() {
  return allMondays();
}
function blockFor(date) {
  return blocks.find((b) => b.startDate <= date && date <= b.endDate);
}
function bookedFor(date) {
  return bookings.find((b) => b.status === "confirmed" && b.date === date);
}
function createDatePicker(prefix, { defaultDate = futureMondays()[0] || iso(new Date()), onChange }) {
  const min = iso(new Date()),
    max = iso(schoolYear().end),
    dateEl = $(`${prefix}-date`),
    exceptionEl = $(`${prefix}-is-exception`),
    mondayEl = $(`${prefix}-date-mode-monday`),
    otherEl = $(`${prefix}-date-mode-other`),
    box = $(`${prefix}-date-calendar`);
  let month = defaultDate.slice(0, 7),
    mode = "monday",
    monday = defaultDate,
    other = "";
  const choose = (date, kind) => {
      if (blockFor(date) || bookedFor(date)) return;
      mode = kind;
      if (kind === "monday") monday = date;
      else other = date;
      dateEl.value = date;
      exceptionEl.value = String(kind === "other");
      mondayEl.checked = kind === "monday";
      otherEl.checked = kind === "other";
      month = date.slice(0, 7);
      render();
      onChange(date, kind === "other");
    },
    render = () => {
      const first = fromISO(`${month}-01`),
        days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(),
        offset = (first.getDay() + 6) % 7,
        label = first.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
        prev = iso(new Date(first.getFullYear(), first.getMonth() - 1, 1)).slice(0, 7),
        next = iso(new Date(first.getFullYear(), first.getMonth() + 1, 1)).slice(0, 7),
        pick = dateEl.value;
      box.innerHTML = `<div class="date-calendar-nav"><button type="button" class="btn" id="${prefix}-calendar-prev"${prev < min.slice(0, 7) ? " disabled" : ""}>Previous</button><strong>${esc(label)}</strong><button type="button" class="btn" id="${prefix}-calendar-next"${next > max.slice(0, 7) ? " disabled" : ""}>Next</button></div><div class="faculty-calendar-weekdays" aria-hidden="true">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => `<span>${day}</span>`).join("")}</div><div class="faculty-calendar-days">${Array.from({ length: offset }, () => '<span class="calendar-day"></span>').join("")}${Array.from(
        { length: days },
        (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`,
            day = fromISO(date).getDay(),
            kind = day === 1 ? "monday" : day >= 2 && day <= 5 ? "other" : "",
            block = blockFor(date),
            booked = !block && bookedFor(date),
            enabled = kind && kind === mode && date >= min && date <= max && !block && !booked;
          if (block)
            return `<span class="calendar-day blocked${date === min ? " today" : ""}" aria-label="${esc(formatDate(date))}, blocked: ${esc(block.reason)}">${i + 1}</span>`;
          if (booked)
            return `<span class="calendar-day blocked${date === min ? " today" : ""}" aria-label="${esc(formatDate(date))}, already booked">${i + 1}</span>`;
          return enabled
            ? `<button type="button" class="calendar-day ${kind === "monday" ? "monday" : "other-day"}${date === pick ? " selected" : ""}${date === min ? " today" : ""}" data-date="${date}" aria-pressed="${date === pick}" aria-label="${esc(formatDate(date))}, ${kind === "monday" ? "Monday, standard" : "other weekday, coordinator approval required"}">${i + 1}</button>`
            : `<span class="calendar-day${date === min ? " today" : ""}">${i + 1}</span>`;
        },
      ).join(
        "",
      )}${Array.from({ length: 42 - offset - days }, () => '<span class="calendar-day"></span>').join("")}</div>`;
      $(`${prefix}-calendar-prev`).onclick = () => {
        month = prev;
        render();
      };
      $(`${prefix}-calendar-next`).onclick = () => {
        month = next;
        render();
      };
      box
        .querySelectorAll("[data-date]")
        .forEach(
          (b) => (b.onclick = () => choose(b.dataset.date, isMonday(b.dataset.date) ? "monday" : "other")),
        );
    };
  mondayEl.onchange = () => {
    if (monday) choose(monday, "monday");
    else {
      mode = "monday";
      mondayEl.checked = true;
      otherEl.checked = false;
      exceptionEl.value = "false";
      render();
      onChange(dateEl.value, false);
    }
  };
  otherEl.onchange = () => {
    mode = "other";
    mondayEl.checked = false;
    otherEl.checked = true;
    if (other) choose(other, "other");
    else {
      dateEl.value = "";
      exceptionEl.value = "true";
      render();
      onChange("", true);
    }
  };
  const reset = () => {
    month = defaultDate.slice(0, 7);
    mode = "monday";
    monday = defaultDate;
    other = "";
    dateEl.value = defaultDate;
    exceptionEl.value = "false";
    mondayEl.checked = true;
    otherEl.checked = false;
    if (blockFor(defaultDate)) {
      dateEl.value = "";
      other = "";
    }
    render();
    onChange(dateEl.value, false);
  };
  reset();
  return { getDate: () => dateEl.value, reset, render };
}
function facultyWithAvailability(date) {
  return PEOPLE.faculty.map((p) => ({
    ...p,
    available: !availability.some(
      (a) => a.group === "seminar" && a.personId === p.id && a.date === date && a.available === false,
    ),
  }));
}
let selectedFaculty = null,
  selectedPhd = null;
// Organizer pages are two levels: a section tab, then an action tab. A bare section
// name resolves to its first action tab, so there is never an empty landing page.
const ORG_TABS = {
  "org-seminars": ["organizer-seminars-approvals", "organizer-seminars-create", "organizer-seminars-edit"],
  "org-workshops": ["organizer-workshops-approvals", "organizer-workshops-create", "organizer-workshops-edit"],
  "org-events": ["organizer-events-create", "organizer-events-edit"],
};
const ORG_PAGES = Object.values(ORG_TABS).flat();
// "organizer" and each bare section name -> that section's first action tab
const ORG_ALIASES = {
  organizer: ORG_TABS["org-seminars"][0],
  ...Object.fromEntries(Object.keys(ORG_TABS).map((s) => [s.replace(/^org-/, "organizer-"), ORG_TABS[s][0]])),
};
const TITLES = {
  calendar: "Calendar",
  history: "History",
  presenter: "Book a seminar",
  phd: "Book a workshop",
  faculty: "Faculty attendance",
  organizer: "Organizer",
};

function showOrganizerPage(name) {
  const page = ORG_ALIASES[name] || (ORG_PAGES.includes(name) ? name : ORG_ALIASES.organizer);
  const panel = `org-${page.replace(/^organizer-/, "")}`; // e.g. org-seminars-approvals
  const section = panel.split("-").slice(0, 2).join("-"); // e.g. org-seminars
  Object.keys(ORG_TABS).forEach((id) => $(id).classList.toggle("hidden", id !== section));
  ORG_PAGES.forEach((p) => $(`org-${p.replace(/^organizer-/, "")}`).classList.toggle("hidden", p !== page));
  document.querySelectorAll("[data-org-page]").forEach((button) => {
    const selected = button.dataset.orgPage.replace(/^organizer-/, "org-") === section;
    button.classList.toggle("active", selected);
    if (selected) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  document
    .querySelectorAll("[data-org-action]")
    .forEach((button) => button.classList.toggle("active", button.dataset.orgAction === page));
}

function view(name) {
  // Legacy entry points and the retired role picker all land on the calendar.
  if (["approval", "seminar-requests", "manage-calendar"].includes(name)) name = "organizer";
  if (organizerId && !["calendar", "history"].includes(name) && !name.startsWith("organizer")) name = "organizer";
  if (facultyId && !["calendar", "history", "faculty"].includes(name)) name = "faculty";
  if (ORG_ALIASES[name]) name = ORG_ALIASES[name];
  if (!["calendar", "history", "presenter", "phd", "faculty"].includes(name) && !ORG_PAGES.includes(name))
    name = "calendar";
  const organizerPage = name.startsWith("organizer");
  $("calendar-view").classList.toggle("hidden", name !== "calendar");
  ["history-view", "presenter-view", "faculty-view", "phd-view", "organizer-view"].forEach((id) =>
    $(id).classList.toggle("hidden", organizerPage ? id !== "organizer-view" : id !== `${name}-view`),
  );
  const top = organizerPage ? "organizer" : name;
  document.querySelectorAll(".header-btn[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === top));
  if (organizerPage) showOrganizerPage(name);
  document.title = `${TITLES[top]} — CEMFI B&F`;
  if (location.hash.slice(1) !== name) location.hash = name;
}
document.querySelectorAll("[data-view]").forEach((b) => (b.onclick = () => view(b.dataset.view)));
document.querySelectorAll("[data-org-page]").forEach((b) => (b.onclick = () => view(b.dataset.orgPage)));
document.querySelectorAll("[data-org-action]").forEach((b) => (b.onclick = () => view(b.dataset.orgAction)));
$("history-year").onchange = (e) => {
  historyYear = e.target.value;
  renderHistoryView();
};
$("history-type").onchange = (e) => {
  historyType = e.target.value;
  renderHistoryView();
};
$("history-search").oninput = (e) => {
  historySearch = e.target.value;
  renderHistoryView();
};
$("history-export-csv").onclick = () => exportCSV(currentHistoryEvents);
$("history-export-json").onclick = () => exportJSON(currentHistoryEvents);
$("history-export-ics").onclick = () => exportICS(currentHistoryEvents);
window.onhashchange = () => view(location.hash.slice(1) || "calendar");
view(location.hash.slice(1) || new URLSearchParams(location.search).get("view") || "calendar");

let presenterPicker = createDatePicker("presenter", { onChange: () => renderPresenter() });
function syncPresenterPaper() {
  const form = $("presenter-form"),
    yes = form.querySelector('input[name="paperKnown"]:checked')?.value === "yes";
  $("presenter-paper-fields").classList.toggle("hidden", !yes);
  form.querySelector('[name="title"]').required = yes;
}
document.querySelectorAll('input[name="paperKnown"]').forEach((r) => (r.onchange = syncPresenterPaper));
syncPresenterPaper();
function renderPresenter() {
  const chosen = $("presenter-date").value;
  if (!chosen) {
    $("presenter-available-note").textContent = "Choose a date to see faculty attendance.";
    $("presenter-faculty").innerHTML = "";
    return;
  }
  if (!isMonday(chosen)) {
    $("presenter-available-note").textContent = "Faculty attendance is not guaranteed for non-Mondays";
    $("presenter-faculty").innerHTML = "";
    return;
  }
  const faculty = facultyWithAvailability(chosen);
  $("presenter-available-note").textContent =
    `Faculty attendance for ${formatDate(chosen)}. Green cards are available; dimmed cards are unavailable.`;
  $("presenter-faculty").innerHTML = faculty
    .map(
      (p) =>
        `<div class="person-card ${p.available ? "available" : "unavailable"}" aria-label="${esc(p.name)}: ${p.available ? "available" : "unavailable"}">${avatar(p)}<span>${esc(p.name)}</span></div>`,
    )
    .join("");
}
function renderFaculty() {
  if (facultyId) selectedFaculty = facultyId;
  $("faculty-cards").innerHTML = PEOPLE.faculty
    .map(
      (p) =>
        `<button class="person-card${p.id === selectedFaculty ? " selected" : ""}" data-faculty="${p.id}"${facultyId && p.id !== facultyId ? " disabled" : ""}>${avatar(p)}<span>${esc(p.name)}</span></button>`,
    )
    .join("");
  document.querySelectorAll("[data-faculty]").forEach(
    (button) =>
      (button.onclick = () => {
        selectedFaculty = button.dataset.faculty;
        renderFaculty();
      }),
  );
  if (selectedFaculty) showFacultyCalendar(selectedFaculty);
}
function showFacultyCalendar(id) {
  const person = PEOPLE.faculty.find((p) => p.id === id),
    box = $("faculty-calendar"),
    dates = allMondays(),
    mondaySet = new Set(dates),
    months = [...new Set(dates.map((date) => date.slice(0, 7)))],
    weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    todayISO = iso(new Date()),
    unlocked = facultyId === id;
  box.classList.remove("hidden");
  box.innerHTML = `<div class="toolbar"><div><h3 class="faculty-calendar-title">${esc(person.name)}</h3>${unlocked ? `<p class="muted">Changes are saved immediately. Green Mondays are available; select one to mark it red and unavailable.</p>` : `<p class="muted">Sign in with your name and surname together, lowercase, e.g. ${esc(person.name.split(/\s+/).join("").toLowerCase())}.</p>`}</div>${unlocked ? '<button type="button" class="btn" id="faculty-signout">Sign out</button>' : ""}</div>${unlocked ? "" : `<form id="faculty-login-form" class="form-grid top-gap narrow"><label class="field wide">Password<input id="faculty-password" type="password" required autocomplete="current-password" /></label><div class="wide"><button class="btn primary">Sign in</button><p id="faculty-login-status" class="muted" role="status"></p></div></form>`}<div class="faculty-calendar-controls"><div class="calendar-legend" aria-label="Calendar legend"><span><span class="available"></span>Available Monday</span><span><span class="unavailable"></span>Unavailable Monday</span></div></div><div class="faculty-calendar-months">${months
    .map((month) => {
      const first = fromISO(`${month}-01`),
        days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(),
        offset = (first.getDay() + 6) % 7,
        label = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      return `<section class="faculty-calendar-month" aria-labelledby="month-${month}"><h4 id="month-${month}">${esc(label)}</h4><div class="faculty-calendar-weekdays" aria-hidden="true">${weekdays.map((day) => `<span>${day}</span>`).join("")}</div><div class="faculty-calendar-days">${Array.from({ length: offset }, () => '<span class="calendar-day"></span>').join("")}${Array.from(
        { length: days },
        (_, index) => {
          const date = `${month}-${String(index + 1).padStart(2, "0")}`,
            unavailable = availability.some(
              (a) => a.group === "seminar" && a.personId === id && a.date === date && a.available === false,
            );
          return mondaySet.has(date)
            ? `<button type="button" class="calendar-day monday${unavailable ? " unavailable" : ""}${unlocked ? "" : " locked"}${date === todayISO ? " today" : ""}" data-availability="${date}"${unlocked ? "" : " disabled"} aria-pressed="${unavailable}" aria-label="${esc(formatDate(date))}: ${unlocked ? (unavailable ? "unavailable; select to mark available" : "available; select to mark unavailable") : (unavailable ? "unavailable" : "available") + " (locked)"}">${index + 1}</button>`
            : `<span class="calendar-day${date === todayISO ? " today" : ""}">${index + 1}</span>`;
        },
      ).join(
        "",
      )}${Array.from({ length: 42 - offset - days }, () => '<span class="calendar-day"></span>').join("")}</div></section>`;
    })
    .join("")}</div>`;
  if (unlocked)
    $("faculty-signout").onclick = () => {
      signOut(auth)
        .then(() => view("calendar"))
        .catch(() => error("Could not sign out."));
    };
  else
    $("faculty-login-form").onsubmit = async (event) => {
      event.preventDefault();
      const status = $("faculty-login-status");
      status.textContent = "Signing in…";
      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          FACULTY_EMAILS[id],
          $("faculty-password").value,
        );
        await credential.user.getIdToken(true);
        const token = await getIdTokenResult(credential.user);
        if (token.claims.faculty !== id)
          throw new Error("This account is not authorized for this faculty card.");
        $("faculty-password").value = "";
        status.textContent = "";
      } catch (error) {
        status.textContent =
          error.code === "auth/invalid-credential"
            ? "Incorrect password."
            : "Could not sign in. Please try again.";
      }
    };
  box.querySelectorAll("[data-availability]").forEach((button) => {
    if (!unlocked) return;
    button.onclick = async () => {
      const date = button.dataset.availability,
        unavailable = button.getAttribute("aria-pressed") === "true",
        ref = doc(db, "availability", `seminar_${id}_${date}`);
      button.disabled = true;
      button.classList.toggle("unavailable", !unavailable);
      button.setAttribute("aria-pressed", String(!unavailable));
      button.setAttribute(
        "aria-label",
        `${esc(formatDate(date))}: ${!unavailable ? "unavailable; select to mark available" : "available; select to mark unavailable"}`,
      );
      const availabilityId = ref.id,
        existingIndex = availability.findIndex((a) => a.id === availabilityId);
      if (unavailable) {
        if (existingIndex > -1) availability.splice(existingIndex, 1);
      } else if (existingIndex === -1)
        availability.push({
          id: availabilityId,
          group: "seminar",
          personId: id,
          personName: person.name,
          date,
          available: false,
          updatedAt: Date.now(),
        });
      try {
        if (unavailable) await deleteDoc(ref);
        else
          await setDoc(ref, {
            group: "seminar",
            personId: id,
            personName: person.name,
            date,
            available: false,
            updatedAt: Date.now(),
          });
      } catch (_) {
        error("Could not save availability.");
        if (unavailable)
          availability.push({
            id: availabilityId,
            group: "seminar",
            personId: id,
            personName: person.name,
            date,
            available: false,
            updatedAt: Date.now(),
          });
        else if (existingIndex === -1) availability = availability.filter((a) => a.id !== availabilityId);
        button.classList.toggle("unavailable", unavailable);
        button.setAttribute("aria-pressed", String(unavailable));
        button.setAttribute(
          "aria-label",
          `${esc(formatDate(date))}: ${unavailable ? "unavailable; select to mark available" : "available; select to mark unavailable"}`,
        );
        button.disabled = false;
      }
    };
  });
}
function renderPhdCards() {
  $("phd-cards").innerHTML =
    PEOPLE.phd
      .filter((p) => !p.id.startsWith("other-"))
      .map(
        (p) =>
          `<button class="person-card${p.id === selectedPhd ? " selected" : ""}" data-phd="${p.id}">${avatar(p)}<span>${esc(p.name)}</span></button>`,
      )
      .join("") +
    `<button class="person-card${selectedPhd?.startsWith("other-") ? " selected" : ""}" data-phd="other">${avatar({ name: "Other" })}<span>Other</span></button>`;
  document.querySelectorAll("[data-phd]").forEach(
    (b) =>
      (b.onclick = () => {
        selectedPhd = b.dataset.phd;
        document
          .querySelectorAll("[data-phd]")
          .forEach((x) => x.classList.toggle("selected", x.dataset.phd === selectedPhd));
        if (selectedPhd === "other") {
          showOtherPhdPicker();
        } else {
          $("other-phd-picker").classList.add("hidden");
          showPhdForm(selectedPhd);
        }
      }),
  );
}
function showOtherPhdPicker() {
  const box = $("other-phd-picker");
  box.classList.remove("hidden");
  box.innerHTML = `<h3>Choose a PhD student</h3><div class="other-phd-list">${OTHER_PHD.map((p) => `<button type="button" class="person-card" data-other-phd="${p.id}">${avatar(p)}<span>${esc(p.name)}</span></button>`).join("")}</div>`;
  box.querySelectorAll("[data-other-phd]").forEach(
    (button) =>
      (button.onclick = () => {
        const person = OTHER_PHD.find((p) => p.id === button.dataset.otherPhd),
          selected = { ...person, id: `other-${person.id}` };
        PEOPLE.phd = [...PEOPLE.phd.filter((p) => !p.id.startsWith("other-")), selected];
        selectedPhd = selected.id;
        box.classList.add("hidden");
        renderPhdCards();
        showPhdForm(selected.id);
      }),
  );
}
function renderPhdAvailable(dateStr) {
  if (!isMonday(dateStr)) {
    $("phd-available-note").textContent = "Faculty attendance is not guaranteed for non-Mondays";
    $("phd-faculty").innerHTML = "";
    return;
  }
  const faculty = facultyWithAvailability(dateStr);
  $("phd-available-note").textContent =
    `Faculty attendance for ${formatDate(dateStr)}. Green cards are available; dimmed cards are unavailable.`;
  $("phd-faculty").innerHTML = faculty
    .map(
      (p) =>
        `<div class="person-card ${p.available ? "available" : "unavailable"}" aria-label="${esc(p.name)}: ${p.available ? "available" : "unavailable"}">${avatar(p)}<span>${esc(p.name)}</span></div>`,
    )
    .join("");
}
function showPhdForm(id) {
  const person = PEOPLE.phd.find((p) => p.id === id),
    wrap = $("phd-form-wrap");
  wrap.classList.remove("hidden");
  wrap.innerHTML = `<h3>${esc(person.name)}</h3><form id="phd-form" class="form-grid"><fieldset class="date-options wide"><label class="date-option"><input id="phd-date-mode-monday" name="phdDateMode" type="radio" value="monday" checked /> Monday (standard)</label><label class="date-option"><input id="phd-date-mode-other" name="phdDateMode" type="radio" value="other" /> Other weekday (approval required)</label></fieldset><div id="phd-date-calendar" class="date-calendar wide"></div><input id="phd-date" name="date" type="hidden" /><input id="phd-is-exception" name="isException" type="hidden" /><label class="field">Start time<input name="startTime" type="time" value="13:30" required /></label><label class="field">End time<input name="endTime" type="time" value="14:30" required /></label><fieldset class="date-options wide"><legend>Do you know what paper you will present?</legend><label class="date-option"><input name="paperKnown" type="radio" value="no" checked /> No</label><label class="date-option"><input name="paperKnown" type="radio" value="yes" /> Yes</label></fieldset><div id="phd-paper-fields" class="wide hidden"><label class="field">Title<input name="title" maxlength="250" /></label><label class="field">Coauthors <span class="muted">(optional)</span><input name="coauthors" maxlength="400" /></label><label class="field">Abstract <span class="muted">(optional)</span><textarea name="abstract" rows="6" maxlength="6000"></textarea></label></div><div class="wide"><button class="btn primary">Book workshop slot</button><p id="phd-status" class="muted" role="status"></p></div></form>`;
  const update = (date, exception) => {
      if (!date) {
        $("phd-available-note").textContent = "Select your card and a date to see faculty attendance.";
        $("phd-faculty").innerHTML = "";
        return;
      }
      renderPhdAvailable(date);
    },
    picker = createDatePicker("phd", { onChange: update }),
    syncPaper = () => {
      const yes = $("phd-form").querySelector('input[name="paperKnown"]:checked')?.value === "yes";
      $("phd-paper-fields").classList.toggle("hidden", !yes);
      $("phd-form").querySelector('[name="title"]').required = yes;
    };
  $("phd-form")
    .querySelectorAll('input[name="paperKnown"]')
    .forEach((r) => (r.onchange = syncPaper));
  syncPaper();
  $("phd-form").onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target)),
      known = data.paperKnown === "yes";
    if (!known) {
      data.title = "TBD";
      data.coauthors = "";
      data.abstract = "";
    }
    delete data.paperKnown;
    data.phdId = id;
    data.phdName = person.name;
    data.date = picker.getDate();
    delete data.phdDateMode;
    data.isException = !isMonday(data.date);
    if (!data.date) {
      $("phd-status").textContent = "Choose a date.";
      return;
    }
    if (blockFor(data.date)) {
      $("phd-status").textContent = `This date is unavailable: ${blockFor(data.date).reason}.`;
      return;
    }
    if (data.endTime <= data.startTime) {
      $("phd-status").textContent = "End time must be after start time.";
      return;
    }
    if (data.date < iso(new Date())) {
      $("phd-status").textContent = "Choose today or a future date.";
      return;
    }
    if (known && !String(data.title || "").trim()) {
      $("phd-status").textContent = "Enter the paper title.";
      return;
    }
    $("phd-status").textContent = "Booking…";
    try {
      await httpsCallable(functions, "submitPhdBooking")(data);
      $("phd-status").textContent = "Workshop booking sent for organizer approval.";
      e.target.reset();
      picker.reset();
      syncPaper();
    } catch (err) {
      $("phd-status").textContent = err.message || "This workshop slot is no longer available.";
    }
  };
}
function renderApprovals() {
  const box = $("seminar-approval-list"),
    pending = requests.filter((r) => r.status === "pending").sort((a, b) => a.createdAt - b.createdAt);
  if (!box) return;
  box.innerHTML = pending.length
    ? pending
        .map((r) => {
          const displacedCount = bookings.filter(
            (b) =>
              b.status === "confirmed" && b.presenterType === "phd" && b.date === r.date && overlaps(b, r),
          ).length;
          return `<article class="card"><div class="toolbar"><div><h3>${esc(r.title)}</h3><p class="muted">${esc(formatDate(r.date))} · ${esc(r.startTime)}–${esc(r.endTime)} ${r.isException ? "· non-Monday proposal" : ""}</p></div><span class="badge status-pending">Pending</span></div><p><strong>${esc(r.name)}</strong>${r.affiliation ? ` · ${esc(r.affiliation)}` : ""}${r.email ? ` · <a href="mailto:${esc(r.email)}">${esc(r.email)}</a>` : ""}</p>${r.coauthors ? `<p class="details"><strong>Coauthors:</strong> ${esc(r.coauthors)}</p>` : ""}${r.abstract ? `<p class="details"><strong>Abstract:</strong> ${esc(r.abstract)}</p>` : ""}${r.bio ? `<p class="details"><strong>Bio:</strong> ${esc(r.bio)}</p>` : ""}${r.website ? `<p class="details"><a href="${esc(r.website)}" rel="noopener" target="_blank">Personal website</a></p>` : ""}<div class="top-gap"><button class="btn primary" data-decision="approve" data-request="${r.id}">Approve</button> <button class="btn danger" data-decision="reject" data-request="${r.id}">Reject</button><div id="notify-${r.id}"></div><p id="decision-${r.id}" class="muted" role="status"></p></div></article>`;
        })
        .join("")
    : '<div class="card muted">No pending seminar bookings.</div>';
  box.querySelectorAll("[data-decision]").forEach(
    (button) =>
      (button.onclick = () => {
        const id = button.dataset.request,
          decision = button.dataset.decision,
          r = requests.find((x) => x.id === id);
        if (!r) return;
        const displacedCount = bookings.filter(
            (b) =>
              b.status === "confirmed" && b.presenterType === "phd" && b.date === r.date && overlaps(b, r),
          ).length,
          notifyName = (name) => `notify-${name}-${id}`;
        $(`notify-${id}`).innerHTML =
          `<fieldset class="date-options" class="notify-box"><legend>Notify presenter?</legend>${r.email ? `<label class="date-option"><input type="radio" name="${notifyName("presenter")}" value="yes" /> Send email to ${esc(r.email)}</label><label class="date-option"><input type="radio" name="${notifyName("presenter")}" value="no" checked /> Don't send</label>` : '<span class="muted">No presenter email provided.</span>'}${decision === "approve" && displacedCount > 0 ? `<div class="field">Notify displaced PhD ${displacedCount === 1 ? "student" : "students"} (${displacedCount})?</div><label class="date-option"><input type="radio" name="${notifyName("displaced")}" value="yes" /> Send reschedule email</label><label class="date-option"><input type="radio" name="${notifyName("displaced")}" value="no" checked /> Don't send</label>` : ""}<div class="top-gap"><button class="btn primary" data-confirm="${id}">Confirm ${decision}</button> <button class="btn" data-back="${id}">Back</button></div></fieldset>`;
        $(`notify-${id}`).querySelector("[data-back]").onclick = () => {
          renderApprovals();
        };
        $(`notify-${id}`).querySelector("[data-confirm]").onclick = async () => {
          const status = $(`decision-${id}`),
            presenterYes = $(`notify-${id}`).querySelector(
              `input[name="${notifyName("presenter")}"]:checked`,
            ),
            displacedEl = $(`notify-${id}`).querySelector(`input[name="${notifyName("displaced")}"]:checked`),
            notifyPresenter = Boolean(r.email && presenterYes?.value === "yes"),
            notifyDisplaced = displacedEl ? displacedEl.value === "yes" : false;
          status.textContent = "Saving…";
          try {
            const res = await httpsCallable(
              functions,
              "decidePresenterRequest",
            )({ requestId: id, decision, notifyPresenter, notifyDisplaced });
            status.textContent = `Decision recorded.${res.data.warning ? ` Note: ${res.data.warning}` : ""}`;
          } catch (err) {
            status.textContent = err.message || "Could not record the decision.";
          } finally {
            renderApprovals();
          }
        };
      }),
  );
}
function renderWorkshopApprovals() {
  const box = $("workshop-approval-list"),
    pending = bookings
      .filter((b) => b.group === "phdworkshop" && b.status === "pending")
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  if (!box) return;
  box.innerHTML = pending.length
    ? pending
        .map(
          (b) =>
            `<article class="card"><strong>${esc(b.title || "TBD")}</strong><p class="muted">${esc(formatDate(b.date))} · ${esc(b.startTime)}–${esc(b.endTime)}</p><p>${esc(b.presenterName || "")}</p><button class="btn primary" data-workshop-decision="approve" data-booking="${b.id}">Approve</button> <button class="btn danger" data-workshop-decision="reject" data-booking="${b.id}">Reject</button><p id="workshop-decision-${b.id}" class="muted" role="status"></p></article>`,
        )
        .join("")
    : '<div class="card muted">No pending workshop bookings.</div>';
  box.querySelectorAll("[data-workshop-decision]").forEach(
    (button) =>
      (button.onclick = async () => {
        const status = $(`workshop-decision-${button.dataset.booking}`);
        status.textContent = "Saving…";
        try {
          await httpsCallable(
            functions,
            "decideWorkshopBooking",
          )({ bookingId: button.dataset.booking, decision: button.dataset.workshopDecision });
          $("workshop-approval-status").textContent = "Decision recorded.";
        } catch (err) {
          status.textContent = err.message || "Could not record the decision.";
        } finally {
          renderWorkshopApprovals();
        }
      }),
  );
}
function renderManageCalendar(group) {
  const prefix = group === "seminar" ? "seminar" : "workshop",
    typeLabel = group === "seminar" ? "Seminar" : "Workshop",
    box = $(`${prefix}-edit-list`);
  if (!box) return;
  const list = bookings
    .filter((b) => b.status === "confirmed" && b.group === (group === "seminar" ? "seminar" : "phdworkshop"))
    .slice()
    .sort(
      (a, b) =>
        (a.date || "").localeCompare(b.date || "") || (a.startTime || "").localeCompare(b.startTime || ""),
    );
  box.innerHTML = list.length
    ? list
        .map(
          (b) =>
            `<div class="schedule-item"><div class="toolbar"><div><strong>${esc(b.title || "(untitled)")}</strong><p class="muted">${esc(formatDate(b.date))} · ${esc(b.startTime)}–${esc(b.endTime)}</p></div><div><button class="btn" data-edit-booking="${b.id}" data-booking-group="${group}">Edit</button> <button class="btn danger" data-cancel-booking="${b.id}">Cancel</button></div></div>${b.presenterName ? `<p class="details"><strong>${esc(b.presenterName)}</strong>${b.presenterAffiliation ? ` · ${esc(b.presenterAffiliation)}` : ""}</p>` : ""}${b.coauthors ? `<p class="details"><strong>Coauthors:</strong> ${esc(b.coauthors)}</p>` : ""}${b.abstract ? `<p class="details"><strong>Abstract:</strong> ${esc(b.abstract)}</p>` : ""}${b.presenterEmail ? `<p class="details"><a href="mailto:${esc(b.presenterEmail)}">${esc(b.presenterEmail)}</a></p>` : ""}${b.bio ? `<p class="details"><strong>Bio:</strong> ${esc(b.bio)}</p>` : ""}${b.website ? `<p class="details"><a href="${esc(b.website)}" rel="noopener" target="_blank">Personal website</a></p>` : ""}<p id="cancel-${b.id}" class="muted" role="status"></p></div>`,
        )
        .join("")
    : '<p class="muted">No confirmed events yet.</p>';
  box.querySelectorAll("[data-edit-booking]").forEach(
    (btn) =>
      (btn.onclick = () => {
        const b = bookings.find((x) => x.id === btn.dataset.editBooking),
          form = $(`${btn.dataset.bookingGroup === "seminar" ? "seminar" : "workshop"}-form`),
          p = btn.dataset.bookingGroup === "seminar" ? "seminar" : "workshop";
        editingBookingIds[p] = b.id;
        [
          "date",
          "startTime",
          "endTime",
          "presenterName",
          "presenterAffiliation",
          "title",
          "coauthors",
          "abstract",
        ].forEach((k) => (form.elements[k].value = b[k] || ""));
        $(`${p}-submit`).textContent = "Save changes";
        $(`${p}-reset`).classList.remove("hidden");
        view(`organizer-${p === "seminar" ? "seminars" : "workshops"}-create`);
        form.scrollIntoView({ behavior: "smooth" });
      }),
  );
  box.querySelectorAll("[data-cancel-booking]").forEach(
    (btn) =>
      (btn.onclick = async () => {
        const id = btn.dataset.cancelBooking,
          status = $(`cancel-${id}`);
        if (!confirm(`Are you sure you want to cancel this ${typeLabel}?`)) return;
        status.textContent = "Cancelling…";
        try {
          await httpsCallable(functions, "cancelConfirmedEvent")({ bookingId: id });
          status.textContent = "Cancelled.";
        } catch (err) {
          status.textContent = err.message || "Could not cancel.";
        }
      }),
  );
}
function renderBlocks() {
  const box = $("block-edit-list");
  if (!box) return;
  const list = blocks.slice().sort((a, b) => a.startDate.localeCompare(b.startDate));
  box.innerHTML = list.length
    ? list
        .map(
          (b) =>
            `<div class="schedule-item"><div class="toolbar"><div><strong>${esc(b.startDate)}${b.endDate !== b.startDate ? `–${esc(b.endDate)}` : ""}</strong><p class="details">${esc(b.reason)}</p></div><div><button class="btn" data-edit-block="${b.id}">Edit</button> <button class="btn danger" data-delete-block="${b.id}">Cancel</button></div></div><p id="block-${b.id}" class="muted" role="status"></p></div>`,
        )
        .join("")
    : '<p class="muted">No blocked dates.</p>';
  box.querySelectorAll("[data-edit-block]").forEach(
    (btn) =>
      (btn.onclick = () => {
        const b = blocks.find((x) => x.id === btn.dataset.editBlock),
          form = $("block-form");
        editingBlockId = b.id;
        form.elements.startDate.value = b.startDate;
        form.elements.endDate.value = b.endDate;
        form.elements.reason.value = b.reason;
        $("block-submit").textContent = "Save changes";
        $("block-reset").classList.remove("hidden");
        view("organizer-events-create");
      }),
  );
  box.querySelectorAll("[data-delete-block]").forEach(
    (btn) =>
      (btn.onclick = async () => {
        const status = $(`block-${btn.dataset.deleteBlock}`);
        if (!confirm("Are you sure you want to cancel this Event?")) return;
        status.textContent = "Cancelling…";
        try {
          await httpsCallable(functions, "deleteBlock")({ blockId: btn.dataset.deleteBlock });
        } catch (err) {
          status.textContent = err.message || "Could not cancel.";
        }
      }),
  );
}
let publicCalMonth = null,
  publicCalSelected = null;
let historyYear = "",
  historyType = "",
  historySearch = "",
  currentHistoryEvents = [];
function publicEvents() {
  const conf = bookings
    .filter((b) => b.status === "confirmed")
    .map((b) => ({
      type: b.group === "seminar" ? "seminar" : "workshop",
      status: "confirmed",
      presenter: b.presenterName || "",
      affiliation: b.presenterAffiliation || "",
      title: b.title || "",
      coauthors: b.coauthors || "",
      abstract: b.abstract || "",
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      source: "live",
    }));
  const pend = requests
    .filter((r) => r.status === "pending")
    .map((r) => ({
      type: "seminar",
      status: "pending",
      presenter: r.name || "",
      affiliation: r.affiliation || "",
      title: r.title || "",
      coauthors: r.coauthors || "",
      abstract: r.abstract || "",
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
    }));
  return [...conf, ...pend]
    .filter((e) => e.date && e.startTime)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}
function confirmedBookingEvents() {
  return bookings
    .filter((b) => b.status === "confirmed")
    .map((b) => ({
      type: b.group === "seminar" ? "seminar" : "workshop",
      status: "confirmed",
      presenter: b.presenterName || "",
      affiliation: b.presenterAffiliation || "",
      title: b.title || "",
      coauthors: b.coauthors || "",
      abstract: b.abstract || "",
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      source: "live",
    }))
    .filter((e) => e.date && e.startTime);
}
function historyEvents() {
  return [...HISTORY_ARCHIVE, ...confirmedBookingEvents()].sort(
    (a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime),
  );
}
function filteredHistoryEvents() {
  const q = historySearch.trim().toLowerCase();
  return historyEvents().filter((e) => {
    if (historyYear && e.date.slice(0, 4) !== historyYear) return false;
    if (historyType && e.type !== historyType) return false;
    if (!q) return true;
    return [e.presenter, e.affiliation, e.title, e.coauthors, e.abstract].some((v) =>
      String(v || "").toLowerCase().includes(q),
    );
  });
}
function renderHistoryYearOptions(events) {
  const select = $("history-year");
  if (!select) return;
  const years = [...new Set(events.map((e) => e.date.slice(0, 4)).filter(Boolean))].sort((a, b) =>
    b.localeCompare(a),
  );
  const options = ['<option value="">All years</option>', ...years.map((y) => `<option value="${esc(y)}">${esc(y)}</option>`)];
  select.innerHTML = options.join("");
  select.value = years.includes(historyYear) ? historyYear : "";
  historyYear = select.value;
}
function historyItemHTML(e) {
  return `<div class="schedule-item type-${e.type}"><div class="toolbar"><div><h4>${esc(e.title || "(untitled)")}</h4><p class="muted">${esc(formatDate(e.date))} · ${esc(e.startTime)}-${esc(e.endTime || "")} · ${e.type === "seminar" ? "B&amp;F Seminar" : "Brown Bag / PhD Workshop"}</p></div><span class="badge status-confirmed">Confirmed</span></div>${e.presenter ? `<p class="details"><strong>${esc(e.presenter)}</strong>${e.affiliation ? ` · ${esc(e.affiliation)}` : ""}</p>` : ""}${e.coauthors ? `<p class="details"><strong>Coauthors:</strong> ${esc(e.coauthors)}</p>` : ""}${e.abstract ? `<p class="details"><strong>Abstract:</strong> ${esc(e.abstract)}</p>` : ""}</div>`;
}
function renderHistoryView() {
  const box = $("history-list");
  if (!box) return;
  const allEvents = historyEvents();
  renderHistoryYearOptions(allEvents);
  currentHistoryEvents = filteredHistoryEvents();
  $("history-count").textContent = `${currentHistoryEvents.length} event${currentHistoryEvents.length === 1 ? "" : "s"}`;
  if (!currentHistoryEvents.length) {
    box.innerHTML = '<div class="card muted">No history entries match these filters.</div>';
    return;
  }
  let currentYear = "";
  box.innerHTML = currentHistoryEvents
    .map((e) => {
      const year = e.date.slice(0, 4),
        heading = year !== currentYear ? `<div class="history-group"><h3>${esc(year)}</h3></div>` : "";
      currentYear = year;
      return `${heading}${historyItemHTML(e)}`;
    })
    .join("");
}
function csvCell(value) {
  const text = String(value || "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function download(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType }),
    url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function exportCSV(events) {
  const columns = ["date", "startTime", "endTime", "type", "presenter", "affiliation", "title", "coauthors", "abstract"],
    rows = [columns.join(","), ...events.map((e) => columns.map((key) => csvCell(e[key])).join(","))];
  download("bf-seminars-history.csv", "text/csv;charset=utf-8", rows.join("\n"));
}
function exportJSON(events) {
  download("bf-seminars-history.json", "application/json;charset=utf-8", JSON.stringify(events, null, 2));
}
function icsDateTime(e, key) {
  return `${e.date.replaceAll("-", "")}T${String(e[key] || e.startTime).replace(":", "")}00`;
}
function icsText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
function exportICS(events) {
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"),
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CEMFI//B&F Seminars//EN", "CALSCALE:GREGORIAN"];
  events.forEach((e, index) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${icsText(`${e.source || "history"}-${e.date}-${e.startTime}-${index}@cemfi-bf-seminars`)}`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsDateTime(e, "startTime")}`,
      `DTEND:${icsDateTime(e, "endTime")}`,
      `SUMMARY:${icsText(`${e.presenter || "CEMFI"} - ${e.title || (e.type === "seminar" ? "B&F Seminar" : "PhD Workshop")}`)}`,
      `DESCRIPTION:${icsText([e.abstract, e.coauthors ? `Coauthors: ${e.coauthors}` : "", e.affiliation].filter(Boolean).join("\n"))}`,
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  download("bf-seminars-history.ics", "text/calendar;charset=utf-8", `${lines.join("\r\n")}\r\n`);
}
function renderPublicCalDetail(evs, date) {
  const box = $("public-calendar-detail"),
    block = blockFor(date || evs?.[0]?.date);
  if ((!evs || !evs.length) && !block) {
    box.classList.add("hidden");
    return;
  }
  box.classList.remove("hidden");
  box.innerHTML =
    `<h3>${esc(formatDate(date || evs[0].date))}</h3>${block ? `<div class="notice error">Blocked: ${esc(block.reason)}</div>` : ""}` +
    (evs || [])
      .map(
        (e) =>
          `<div class="schedule-item type-${e.type}"><div class="toolbar"><div><h4>${esc(e.title || "(untitled)")}</h4><p class="muted">${esc(e.startTime)}–${esc(e.endTime)} · ${e.type === "seminar" ? "B&amp;F Seminar" : "Brown Bag / PhD Workshop"}</p></div><span class="badge ${e.status === "pending" ? "status-pending" : "status-confirmed"}">${e.status === "pending" ? "Pending" : "Confirmed"}</span></div>${e.presenter ? `<p class="details"><strong>${esc(e.presenter)}</strong>${e.affiliation ? ` · ${esc(e.affiliation)}` : ""}</p>` : ""}${e.coauthors ? `<p class="details"><strong>Coauthors:</strong> ${esc(e.coauthors)}</p>` : ""}${e.abstract ? `<p class="details"><strong>Abstract:</strong> ${esc(e.abstract)}</p>` : ""}</div>`,
      )
      .join("");
}
function renderPublicCalendar() {
  const box = $("public-calendar");
  if (!box) return;
  const events = publicEvents(),
    byDate = {};
  events.forEach((e) => (byDate[e.date] = byDate[e.date] || []).push(e));
  const monthsWithItems = [
      ...new Set([
        ...events.map((e) => e.date.slice(0, 7)),
        ...blocks.flatMap((b) => [b.startDate.slice(0, 7), b.endDate.slice(0, 7)]),
      ]),
    ].sort(),
    sy = schoolYear(),
    today = iso(new Date()).slice(0, 7),
    todayISO = iso(new Date()),
    minMonth = [iso(sy.start).slice(0, 7), ...monthsWithItems].sort()[0],
    maxMonth = [iso(sy.end).slice(0, 7), ...monthsWithItems].sort().slice(-1)[0];
  let month = publicCalMonth;
  if (!month) {
    month =
      monthsWithItems.find((m) => m >= today) ||
      monthsWithItems[0] ||
      (today < minMonth ? minMonth : today > maxMonth ? maxMonth : today);
    if (monthsWithItems.length) publicCalMonth = month;
  }
  const first = fromISO(`${month}-01`),
    days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(),
    offset = (first.getDay() + 6) % 7,
    label = first.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    prev = iso(new Date(first.getFullYear(), first.getMonth() - 1, 1)).slice(0, 7),
    next = iso(new Date(first.getFullYear(), first.getMonth() + 1, 1)).slice(0, 7),
    weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    typeColor = { seminar: "var(--accent)", workshop: "var(--green)", blocked: "var(--red)" },
    sideStyle = (items) =>
      ["top", "right", "bottom", "left"]
        .map((side, i) => {
          const it = items[Math.floor((i * items.length) / 4)];
          return `border-${side}:2px ${it.status === "pending" ? "dashed" : "solid"} ${typeColor[it.type]}`;
        })
        .join(";");
  box.innerHTML = `<div class="date-calendar-nav"><button type="button" class="btn" id="public-cal-prev"${prev < minMonth ? " disabled" : ""}>Previous</button><strong>${esc(label)}</strong><button type="button" class="btn" id="public-cal-next"${next > maxMonth ? " disabled" : ""}>Next</button></div><div class="faculty-calendar-weekdays" aria-hidden="true">${weekdays.map((d) => `<span>${d}</span>`).join("")}</div><div class="faculty-calendar-days public-cal-days">${Array.from({ length: offset }, () => '<span class="calendar-day"></span>').join("")}${Array.from(
    { length: days },
    (_, i) => {
      const date = `${month}-${String(i + 1).padStart(2, "0")}`,
        evs = byDate[date] || [],
        block = blockFor(date),
        items = [...(block ? [{ type: "blocked", status: "confirmed", label: block.reason }] : []), ...evs];
      if (!items.length)
        return `<span class="calendar-day${date === todayISO ? " today" : date < todayISO ? " past" : ""}">${i + 1}</span>`;
      const NAMES_SHOWN = 2,
        names = items
          .slice(0, NAMES_SHOWN)
          .map(
            (it) =>
              `<span class="cal-name ${it.type}${it.status === "pending" ? " pending" : ""}">${esc(it.label || it.presenter || it.title || "TBD")}</span>`,
          )
          .join(""),
        overflow = items.length > NAMES_SHOWN ? `<span class="cal-name-more">+${items.length - NAMES_SHOWN}</span>` : "",
        summary = items
          .map(
            (it) =>
              `${it.type}, ${it.label || it.presenter || it.title || "TBD"}${it.status === "pending" ? " (pending)" : ""}`,
          )
          .join("; ");
      return `<button type="button" class="calendar-day has-events${date === publicCalSelected ? " selected" : ""}${date === todayISO ? " today" : date < todayISO ? " past" : ""}" style="${sideStyle(items)}" data-cal-date="${date}" title="${esc(summary)}" aria-label="${esc(formatDate(date))}: ${esc(summary)}"><span>${i + 1}</span><span class="cal-names">${names}${overflow}</span></button>`;
    },
  ).join(
    "",
  )}${Array.from({ length: 42 - offset - days }, () => '<span class="calendar-day"></span>').join("")}</div>`;
  $("public-cal-prev").onclick = () => {
    publicCalMonth = prev;
    renderPublicCalendar();
  };
  $("public-cal-next").onclick = () => {
    publicCalMonth = next;
    renderPublicCalendar();
  };
  box.querySelectorAll("[data-cal-date]").forEach(
    (b) =>
      (b.onclick = () => {
        publicCalSelected = b.dataset.calDate;
        renderPublicCalendar();
      }),
  );
  if (publicCalSelected && (byDate[publicCalSelected] || blockFor(publicCalSelected)))
    renderPublicCalDetail(byDate[publicCalSelected], publicCalSelected);
  else {
    publicCalSelected = null;
    renderPublicCalDetail(null);
  }
}
function renderOrganizerAuth() {
  const logged = Boolean(organizerId);
  $("organizer-login").classList.toggle("hidden", logged);
  $("organizer-dashboard").classList.toggle("hidden", !logged);
  if (logged) {
    $("organizer-welcome").innerHTML =
      `${avatar({ name: "Organizer" })}<div><h3>Welcome, Organizer</h3><p class="muted">Organizer portal</p></div>`;
    showOrganizerPage(location.hash.slice(1) || "organizer");
  }
}
function signOutAndReset() {
  signOut(auth)
    .then(() => {
      selectedFaculty = null;
      selectedPhd = null;
      view("calendar");
    })
    .catch(() => error("Could not sign out."));
}
// The nav only shows what view() will actually let you reach: signing in as an
// organizer or faculty member narrows the site to that role plus the calendar.
function renderHeader() {
  const userEl = $("header-user"),
    person = organizerId
      ? { name: "Organizer" }
      : facultyId
        ? PEOPLE.faculty.find((p) => p.id === facultyId)
        : null,
    allowed = organizerId
      ? ["organizer"]
      : facultyId
        ? ["faculty"]
        : ["presenter", "phd", "faculty", "organizer"];
  document
    .querySelectorAll("[data-nav]")
    .forEach((b) => b.classList.toggle("hidden", !allowed.includes(b.dataset.nav)));
  userEl.classList.toggle("hidden", !person);
  if (!person) return;
  userEl.innerHTML = `<span class="header-role">${esc(person.name)}</span><button type="button" class="btn" id="header-signout">Sign out</button>`;
  $("header-signout").onclick = signOutAndReset;
}
function resetManage(prefix) {
  editingBookingIds[prefix] = null;
  const form = $(`${prefix}-form`);
  form.reset();
  form.elements.startTime.value = "13:30";
  form.elements.endTime.value = prefix === "seminar" ? "15:00" : "14:30";
  $(`${prefix}-submit`).textContent = `Add ${prefix}`;
  $(`${prefix}-reset`).classList.add("hidden");
}
function resetBlock() {
  editingBlockId = null;
  $("block-form").reset();
  $("block-submit").textContent = "Create event";
  $("block-reset").classList.add("hidden");
}
function renderDynamic() {
  renderPublicCalendar();
  renderHistoryView();
  renderPresenter();
  renderFaculty();
  renderPhdCards();
  if (organizerId) {
    renderApprovals();
    renderWorkshopApprovals();
    renderManageCalendar("seminar");
    renderManageCalendar("workshop");
    renderBlocks();
  }
}
$("organizer-login-form").onsubmit = async (e) => {
  e.preventDefault();
  const status = $("organizer-login-status");
  status.textContent = "Signing in…";
  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      ORGANIZER_LOGIN_EMAIL,
      $("organizer-password").value,
    );
    await credential.user.getIdToken(true);
    const token = await getIdTokenResult(credential.user);
    if (!token.claims.organizer) throw new Error("This account is not authorized as an organizer.");
    $("organizer-password").value = "";
    status.textContent = "";
  } catch (err) {
    status.textContent =
      err.code === "auth/invalid-credential" ? "Incorrect password." : "Could not sign in. Please try again.";
  }
};
$("seminar-reset").onclick = () => resetManage("seminar");
$("workshop-reset").onclick = () => resetManage("workshop");
$("block-reset").onclick = resetBlock;
$("presenter-form").onsubmit = async (e) => {
  e.preventDefault();
  const values = Object.fromEntries(new FormData(e.target)),
    date = presenterPicker.getDate(),
    known = values.paperKnown === "yes";
  if (!known) {
    values.title = "TBD";
    values.coauthors = "";
    values.abstract = "";
  }
  delete values.paperKnown;
  delete values.presenterDateMode;
  if (!date) {
    $("presenter-status").textContent = "Choose a date.";
    return;
  }
  if (blockFor(date)) {
    $("presenter-status").textContent = `This date is unavailable: ${blockFor(date).reason}.`;
    return;
  }
  if (date < iso(new Date())) {
    $("presenter-status").textContent = "Choose today or a future date.";
    return;
  }
  values.date = date;
  if (values.endTime <= values.startTime) {
    $("presenter-status").textContent = "End time must be after start time.";
    return;
  }
  if (known && !String(values.title || "").trim()) {
    $("presenter-status").textContent = "Enter the paper title.";
    return;
  }
  values.isException = !isMonday(date);
  $("presenter-status").textContent = "Booking…";
  try {
    await httpsCallable(functions, "submitPresenterRequest")(values);
    $("presenter-status").textContent =
      "Your seminar slot booking has been sent to the seminar organizers for review.";
    e.target.reset();
    presenterPicker.reset();
    syncPresenterPaper();
  } catch (err) {
    $("presenter-status").textContent = err.message || "Could not book the seminar slot.";
  }
};
["seminar", "workshop"].forEach((prefix) => {
  $(`${prefix}-form`).onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target)),
      status = $(`${prefix}-status`),
      editingBookingId = editingBookingIds[prefix];
    if (!data.date) {
      status.textContent = "Choose a date.";
      return;
    }
    if (data.endTime <= data.startTime) {
      status.textContent = "End time must be after start time.";
      return;
    }
    status.textContent = editingBookingId ? "Saving…" : "Adding…";
    try {
      const callable = editingBookingId ? "updateConfirmedEvent" : "addConfirmedEvent",
        res = await httpsCallable(
          functions,
          callable,
        )({
          ...data,
          ...(editingBookingId
            ? { bookingId: editingBookingId }
            : { type: prefix === "seminar" ? "seminar" : "workshop" }),
        });
      status.textContent =
        res.data && res.data.warning ? `Saved. Note: ${res.data.warning}` : "Saved to the calendar.";
      resetManage(prefix);
    } catch (err) {
      status.textContent = err.message || "Could not save the event.";
    }
  };
});
$("block-form").onsubmit = async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target)),
    status = $("block-status");
  if (!data.endDate) data.endDate = data.startDate;
  if (data.endDate < data.startDate) {
    status.textContent = "End date must not be before start date.";
    return;
  }
  status.textContent = "Saving…";
  try {
    const res = await httpsCallable(
      functions,
      "saveBlock",
    )({ ...data, ...(editingBlockId ? { blockId: editingBlockId } : {}) });
    status.textContent = res.data.warning ? `Saved. Note: ${res.data.warning}` : "Block saved.";
    resetBlock();
  } catch (err) {
    status.textContent = err.message || "Could not save the block.";
  }
};
$("block-form").elements.startDate.onchange = () => {
  const end = $("block-form").elements.endDate;
  if (!end.value) end.value = $("block-form").elements.startDate.value;
};
renderHeader();
renderOrganizerAuth();
renderDynamic();
