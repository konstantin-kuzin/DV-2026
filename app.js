const START_MIN = 11 * 60 + 30;
const END_MIN = 20 * 60;
const SLOT_MIN = 30;
const SLOT_COUNT = (END_MIN - START_MIN) / SLOT_MIN;

const KINDS = {
  opening: "Открытие",
  panel: "Панель",
  performance: "Перфоманс",
};

const LINK_FIELDS = [
  { key: "telegram", label: "Телеграм-канал" },
  { key: "message", label: "Личный канал" },
  { key: "presentation", label: "Презентация" },
  { key: "video", label: "Видео" },
];

const LINK_ICONS = {
  telegram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.4 4.5 2.6 11.4c-1.2.5-1.2 1.1-.2 1.4l4.9 1.5 1.8 5.6c.2.6.1.9.8.9.4 0 .6-.2.9-.5l2.3-2.2 4.8 3.6c.9.5 1.5.2 1.7-.8l3.2-14.7c.3-1.2-.5-1.8-1.4-1.4zM8.8 14.2l9.6-6c.4-.3.9-.1.5.2l-8.2 7.4-.3 3.3-1.6-4.9z"/></svg>`,
  message: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" d="M7 6.25h10.25A1.75 1.75 0 0 1 19 8v7a1.75 1.75 0 0 1-1.75 1.75H9.2L5.25 20.1V8A1.75 1.75 0 0 1 7 6.25Z"/></svg>`,
  presentation: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" d="M6 3.75h8.2L18.75 8.3V20.25H6z"/><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" d="M14 3.75V8.25h4.75"/></svg>`,
  video: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.25" y="6.25" width="12.5" height="11.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.75"/><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" d="M15.75 10.25 20.75 8v8l-5-2.25z"/></svg>`,
};

const { days, halls, events } = window.SCHEDULE;
const byId = new Map(events.map((event) => [event.id, event]));

const daysEl = document.getElementById("days");
const hallsEl = document.getElementById("halls");
const sectionEl = document.getElementById("section");
const board = document.getElementById("board");
const sheet = document.getElementById("sheet");
const sheetMeta = document.getElementById("sheet-meta");
const sheetKind = document.getElementById("sheet-kind");
const sheetTitle = document.getElementById("sheet-title");
const sheetPeople = document.getElementById("sheet-people");
const sheetMaterials = document.getElementById("sheet-materials");
const sheetLinks = document.getElementById("sheet-links");

const state = {
  day: days[0].id,
  hall: 0,
};

function minutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function slotIndex(value) {
  return (minutes(value) - START_MIN) / SLOT_MIN;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function todayId() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function hallById(id) {
  return halls.find((hall) => hall.id === id);
}

function sectionOf(hall, day) {
  return hall.sections[day] || { title: "" };
}

function peopleLine(event) {
  const names = event.speakers.map((speaker) => speaker.name);
  if (names.length === 0) return "";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} и ещё ${names.length - 2}`;
}

function filledLinks(event) {
  const links = event.links || {};
  return LINK_FIELDS.filter((field) => typeof links[field.key] === "string" && links[field.key].trim());
}

function renderChrome() {
  daysEl.replaceChildren(
    ...days.map((day) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(day.id === state.day));
      button.dataset.day = day.id;
      button.textContent = day.weekday === "Суббота" ? "СБ" : "ПТ";
      button.setAttribute("aria-label", `${day.weekday}, ${day.date}`);
      return button;
    }),
  );

  hallsEl.replaceChildren(
    ...halls.map((hall, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(index === state.hall));
      button.dataset.hall = String(index);
      button.textContent = hall.short;
      return button;
    }),
  );

  updateSection();
}

function updateSection() {
  const hall = halls[state.hall];
  const section = sectionOf(hall, state.day);
  const curator = section.curator ? ` · ${section.curator}` : "";
  sectionEl.textContent = `${section.title}${curator}`;
}

function renderBoard() {
  const grid = document.createElement("div");
  grid.className = "grid";
  grid.style.setProperty("--halls", String(halls.length));

  const corner = document.createElement("div");
  corner.className = "corner";
  grid.append(corner);

  halls.forEach((hall, index) => {
    const head = document.createElement("div");
    head.className = "hall-head";
    head.style.gridColumn = String(index + 2);
    const section = sectionOf(hall, state.day);
    const curator = section.curator ? ` · ${section.curator}` : "";
    const name = document.createElement("strong");
    name.textContent = hall.name;
    const detail = document.createElement("span");
    detail.textContent = `${section.title}${curator}`;
    head.append(name, detail);
    const line = document.createElement("div");
    line.className = "col-line";
    line.style.gridColumn = String(index + 2);
    grid.append(head, line);
  });

  for (let index = 0; index < SLOT_COUNT; index += 1) {
    const total = START_MIN + index * SLOT_MIN;
    const hour = total % 60 === 0;
    const tick = document.createElement("div");
    tick.className = hour ? "tick hour" : "tick";
    tick.style.gridRow = String(index + 2);
    if (hour) tick.textContent = `${pad(Math.floor(total / 60))}:00`;
    const rule = document.createElement("div");
    rule.className = "rule";
    rule.style.gridRow = String(index + 2);
    grid.append(tick, rule);
  }

  const dayEvents = events.filter((event) => event.day === state.day);
  dayEvents.forEach((event) => {
    const hallIndex = halls.findIndex((hall) => hall.id === event.hall);
    const start = slotIndex(event.start);
    const span = slotIndex(event.end) - start;
    const hall = halls[hallIndex];
    const button = document.createElement("div");
    button.className = "card";
    button.dataset.id = event.id;
    button.dataset.span = String(span);
    button.style.gridColumn = String(hallIndex + 2);
    button.style.gridRow = `${start + 2} / span ${span}`;
    const kind = KINDS[event.kind];
    const who = peopleLine(event);
    const time = document.createElement("p");
    time.className = "when-line";
    time.textContent = `${event.start}–${event.end}`;
    button.append(time);
    if (kind) {
      const kindLine = document.createElement("p");
      kindLine.className = "kind";
      kindLine.textContent = kind;
      button.append(kindLine);
    }
    event.speakers.forEach((speaker) => {
      const person = document.createElement("div");
      person.className = "person";
      const name = document.createElement("p");
      name.className = "name";
      name.textContent = speaker.name;
      person.append(name);
      const meta = speaker.org || (speaker.role && speaker.role !== "участник" ? speaker.role : "");
      if (meta) {
        const org = document.createElement("p");
        org.className = "org";
        org.textContent = meta;
        person.append(org);
      }
      button.append(person);
    });
    const title = document.createElement("h3");
    title.textContent = event.title;
    button.append(title);
    const links = filledLinks(event);
    if (links.length) {
      const row = document.createElement("div");
      row.className = "card-links";
      links.forEach((field) => {
        const link = document.createElement("a");
        link.className = "card-link";
        link.href = event.links[field.key].trim();
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", field.label);
        link.innerHTML = LINK_ICONS[field.key];
        link.addEventListener("click", (clickEvent) => clickEvent.stopPropagation());
        row.append(link);
      });
      button.append(row);
    }
    button.setAttribute(
      "aria-label",
      `${event.start}, ${hall.name}. ${event.title}${who ? `. ${who}` : ""}`,
    );
    grid.append(button);
  });

  const now = nowMarker();
  if (now) grid.append(now);

  board.replaceChildren(grid);
  board.scrollTo(state.hall * columnWidth(), 0);
}

function nowMarker() {
  if (state.day !== todayId()) return null;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  if (current < START_MIN || current > END_MIN) return null;
  const offset = (current - START_MIN) / SLOT_MIN;
  const row = Math.floor(offset);
  const fraction = offset - row;
  const marker = document.createElement("div");
  marker.className = "now";
  marker.style.gridRow = String(row + 2);
  marker.style.setProperty("--fraction", String(fraction));
  return marker;
}

function columnWidth() {
  const grid = board.querySelector(".grid");
  if (!grid) return 0;
  const columns = getComputedStyle(grid).gridTemplateColumns.split(" ");
  return parseFloat(columns[1]) || 0;
}

function setHall(index, scroll) {
  const next = Math.max(0, Math.min(halls.length - 1, index));
  if (next === state.hall && !scroll) return;
  state.hall = next;
  hallsEl.querySelectorAll("button").forEach((button, buttonIndex) => {
    button.setAttribute("aria-selected", String(buttonIndex === next));
  });
  updateSection();
  const chip = hallsEl.children[next];
  if (chip) {
    const left = chip.offsetLeft - (hallsEl.clientWidth - chip.offsetWidth) / 2;
    hallsEl.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }
  if (scroll) {
    board.scrollTo({ left: next * columnWidth(), behavior: "smooth" });
  }
}

function openEvent(id) {
  const event = byId.get(id);
  if (!event) return;
  const hall = hallById(event.hall);
  const day = days.find((item) => item.id === event.day);
  const section = sectionOf(hall, event.day);
  sheetMeta.textContent = `${day.weekday}, ${day.date} · ${hall.name} · ${section.title} · ${event.start}–${event.end}`;
  const kind = KINDS[event.kind];
  sheetKind.hidden = !kind;
  sheetKind.textContent = kind || "";
  sheetTitle.textContent = event.title;
  sheetPeople.replaceChildren(
    ...event.speakers.map((speaker) => {
      const item = document.createElement("li");
      const name = document.createElement("strong");
      name.textContent = speaker.name;
      item.append(name);
      if (speaker.role && speaker.role !== "участник") {
        const role = document.createElement("span");
        role.className = "role";
        role.textContent = speaker.role;
        item.append(role);
      }
      if (speaker.org) {
        const org = document.createElement("span");
        org.textContent = speaker.org;
        item.append(org);
      }
      return item;
    }),
  );

  const links = filledLinks(event);
  sheetMaterials.hidden = links.length === 0;
  sheetLinks.replaceChildren(
    ...links.map((field) => {
      const link = document.createElement("a");
      link.href = event.links[field.key];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = field.label;
      return link;
    }),
  );

  if (!sheet.open) sheet.showModal();
  history.replaceState(null, "", `#${event.id}`);
}

function closeSheet() {
  if (sheet.open) sheet.close();
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
}

daysEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-day]");
  if (!button || button.dataset.day === state.day) return;
  state.day = button.dataset.day;
  state.hall = 0;
  closeSheet();
  renderChrome();
  renderBoard();
});

hallsEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-hall]");
  if (!button) return;
  setHall(Number(button.dataset.hall), true);
});

board.addEventListener("click", (event) => {
  if (event.target.closest("a")) return;
  const card = event.target.closest(".card");
  if (card) openEvent(card.dataset.id);
});

let scrollFrame = 0;
board.addEventListener(
  "scroll",
  () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      const width = columnWidth();
      if (!width) return;
      const index = Math.round(board.scrollLeft / width);
      if (index !== state.hall) setHall(index, false);
    });
  },
  { passive: true },
);

board.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    event.preventDefault();
    setHall(state.hall + 1, true);
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    setHall(state.hall - 1, true);
  }
});

document.getElementById("sheet-close").addEventListener("click", closeSheet);
sheet.addEventListener("click", (event) => {
  if (event.target === sheet) closeSheet();
});
sheet.addEventListener("close", () => {
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
});

const hashId = location.hash.replace("#", "");
const linked = byId.get(hashId);
if (linked) {
  state.day = linked.day;
  state.hall = Math.max(0, halls.findIndex((hall) => hall.id === linked.hall));
} else if (days.some((day) => day.id === todayId())) {
  state.day = todayId();
}

renderChrome();
renderBoard();

if (linked) {
  requestAnimationFrame(() => {
    const card = board.querySelector(`[data-id="${linked.id}"]`);
    const top = card ? Math.max(0, card.offsetTop - 12) : 0;
    board.scrollTo(state.hall * columnWidth(), top);
    openEvent(linked.id);
  });
}
