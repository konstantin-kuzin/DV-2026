const START_MIN = 12 * 60 + 0;
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
  { key: "message", label: "Сообщение" },
  { key: "video", label: "Видео" },
  { key: "presentation", label: "Презентация" },
];

const LINK_ICONS = {
  telegram: `<svg viewBox="1.67 4.5 21.19 17.44" aria-hidden="true"><path fill="currentColor" d="M21.4 4.5 2.6 11.4c-1.2.5-1.2 1.1-.2 1.4l4.9 1.5 1.8 5.6c.2.6.1.9.8.9.4 0 .6-.2.9-.5l2.3-2.2 4.8 3.6c.9.5 1.5.2 1.7-.8l3.2-14.7c.3-1.2-.5-1.8-1.4-1.4zM8.8 14.2l9.6-6c.4-.3.9-.1.5.2l-8.2 7.4-.3 3.3-1.6-4.9z"/></svg>`,
  message: `<svg viewBox="2 2 20 20" aria-hidden="true"><path fill="currentColor" d="M4 2C2.9 2 2 2.9 2 4v13l3-3h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4zM18 7v5c0 1.7-1.3 3-3 3H7v2c0 1.1.9 2 2 2h10l3 3V9c0-1.1-.9-2-2-2H18z"/></svg>`,
  presentation: `<svg viewBox="0 0 14 14" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M7 .125c-1.775 0-3.505.105-5.142.297A1.45 1.45 0 0 0 .595 1.596q-.065.351-.119.71a.49.49 0 0 0 .49.56h12.06a.49.49 0 0 0 .49-.56a23 23 0 0 0-.113-.692a1.46 1.46 0 0 0-1.278-1.19A45 45 0 0 0 7 .125M.266 4.585c.01-.264.23-.47.494-.47h12.48c.263 0 .482.205.493.469q.018.422.018.849c0 1.317-.143 2.584-.352 3.797a1.47 1.47 0 0 1-1.292 1.21a54 54 0 0 1-2.205.199l1.956 1.956a.75.75 0 1 1-1.06 1.06l-2.885-2.884l-.037-.04l-.125.002v2.392a.75.75 0 0 1-1.5 0v-2.394l-.122-.003l-.04.043l-2.885 2.884a.75.75 0 0 1-1.06-1.06l1.971-1.972a90 90 0 0 1-2.208-.193a1.47 1.47 0 0 1-1.312-1.2a21.5 21.5 0 0 1-.328-4.644" clip-rule="evenodd"/></svg>`,
  video: `<svg viewBox="0 0 137 150" aria-hidden="true"><path fill="currentColor" d="M11 62L7 71L7 114L8 118L12 123L16 125L33 125L34 126L32 131L20 149L34 149L50 128L53 130L67 149L80 149L68 130L67 126L68 125L91 125L98 118L99 115L99 69L97 64L91 60L14 60ZM136 57L107 74L107 111L136 129ZM12 14L4 21L2 27L0 28L0 34L2 35L4 41L9 46L19 49L20 48L25 48L32 43L36 36L36 25L34 21L29 16L21 13ZM71 0L70 2L67 2L63 4L55 12L52 19L52 24L51 25L52 31L55 38L61 44L70 48L81 48L88 45L95 38L98 31L99 22L96 13L91 7L82 2L79 2L78 0Z"/></svg>`,
};

const { days, halls, events } = window.SCHEDULE;
const byId = new Map(events.map((event) => [event.id, event]));

const daysEl = document.getElementById("days");
const hallsEl = document.getElementById("halls");
const modeBtn = document.getElementById("mode");
const favoritesBtn = document.getElementById("favorites");
const pathBtn = document.getElementById("path");
const sheetFavorite = document.getElementById("sheet-favorite");
const sheetFavoriteLabel = document.getElementById("sheet-favorite-label");
const sheetSecondary = document.getElementById("sheet-secondary");
const sheetSecondaryLabel = document.getElementById("sheet-secondary-label");
const sectionEl = document.getElementById("section");
const board = document.getElementById("board");
const sheet = document.getElementById("sheet");
const sheetMeta = document.getElementById("sheet-meta");
const sheetKind = document.getElementById("sheet-kind");
const sheetTitle = document.getElementById("sheet-title");
const sheetDesc = document.getElementById("sheet-desc");
const sheetPeople = document.getElementById("sheet-people");
const sheetMaterials = document.getElementById("sheet-materials");
const sheetVideo = document.getElementById("sheet-video");
const sheetLinks = document.getElementById("sheet-links");
const sheetBody = sheet.querySelector(".sheet-body");
const sheetPrev = document.getElementById("sheet-prev");
const sheetNext = document.getElementById("sheet-next");
const sheetClose = document.getElementById("sheet-close");
const carryPanel = document.getElementById("carry-panel");
const carryQr = document.getElementById("carry-qr");
const carryCopy = document.getElementById("carry-copy");
const carryCopyStatus = document.getElementById("carry-copy-status");
const importedStatus = document.getElementById("imported-status");

const FIRST_HOUR = Math.floor(START_MIN / 60);
const LAST_HOUR = Math.floor((END_MIN - 1) / 60);
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, index) => FIRST_HOUR + index);

const FAVORITES_KEY = "dv-favorites";
const SECONDARY_KEY = "dv-favorites-secondary";

function readIds(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => typeof id === "string" && byId.has(id)));
  } catch {
    return new Set();
  }
}

function writeFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
    localStorage.setItem(SECONDARY_KEY, JSON.stringify([...secondary]));
  } catch {
    /* хранилище недоступно */
  }
}

const favorites = readIds(FAVORITES_KEY);
const secondary = readIds(SECONDARY_KEY);
for (const id of secondary) {
  if (favorites.has(id)) secondary.delete(id);
}

const PLAN_ID = /^[A-Za-z0-9-]+$/;

function savedIds(set) {
  return [...set].filter((id) => PLAN_ID.test(id) && byId.has(id)).sort();
}

function planValue() {
  return `p:${savedIds(favorites).join(",")}|s:${savedIds(secondary).join(",")}`;
}

function planUrl() {
  const url = new URL(location.href);
  url.hash = "";
  url.searchParams.set("plan", planValue());
  return url.href;
}

function planList(part) {
  if (part === "") return [];
  const ids = part.split(",");
  if (ids.some((id) => !PLAN_ID.test(id))) return null;
  return ids.filter((id) => byId.has(id));
}

function parsePlan(raw) {
  if (typeof raw !== "string") return null;
  const match = /^p:([^|]*)\|s:([^|]*)$/.exec(raw);
  if (!match) return null;
  const primary = planList(match[1]);
  const later = planList(match[2]);
  if (!primary || !later) return null;
  return { primary, secondary: later };
}

function applyPlan(raw) {
  const parsed = parsePlan(raw);
  if (!parsed) return false;
  favorites.clear();
  secondary.clear();
  for (const id of parsed.primary) favorites.add(id);
  for (const id of parsed.secondary) {
    if (!favorites.has(id)) secondary.add(id);
  }
  writeFavorites();
  return true;
}

function consumePlan() {
  const url = new URL(location.href);
  if (!url.searchParams.has("plan")) return false;
  if (!applyPlan(url.searchParams.get("plan"))) return false;
  url.searchParams.delete("plan");
  history.replaceState(null, "", url.pathname + url.search + url.hash);
  return true;
}

function drawPlanQr(url) {
  try {
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    const cell = 4;
    const margin = cell * 4;
    const count = qr.getModuleCount();
    const size = count * cell + margin * 2;
    const context = carryQr.getContext("2d");
    carryQr.width = size;
    carryQr.height = size;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.save();
    context.translate(margin, margin);
    qr.renderTo2dContext(context, cell);
    context.restore();
    carryQr.hidden = false;
  } catch {
    carryQr.hidden = true;
  }
}

const state = {
  day: days[0].id,
  hall: 0,
  hour: HOURS[0],
  byHour: false,
  favoritesOnly: false,
  path: false,
  openId: null,
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

function hourLabel(hour) {
  return `${pad(hour)}:00`;
}

function hourOf(value) {
  return Math.floor(minutes(value) / 60);
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

const CONTACT_KEYS = new Set(["telegram", "message"]);

function contactsForSpeaker(event, index) {
  const contacts = filledLinks(event).filter((field) => CONTACT_KEYS.has(field.key));
  const count = event.speakers.length;
  if (count <= 1) return contacts;
  const own = contacts.filter((field) => field.order === index);
  if (index !== count - 1) return own;
  return own.concat(contacts.filter((field) => field.order >= count));
}

function appendContactIcons(who, contacts) {
  if (!contacts.length) return;
  const row = document.createElement("div");
  row.className = "contacts";
  for (const field of contacts) {
    const link = document.createElement("a");
    link.href = field.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", field.label);
    link.innerHTML = LINK_ICONS[field.key];
    row.append(link);
  }
  who.append(row);
}

function cardLinkIcons(links) {
  const row = document.createElement("div");
  row.className = "card-links";
  row.setAttribute("aria-hidden", "true");
  links.forEach((field) => {
    const icon = document.createElement("span");
    icon.className = "card-link";
    icon.innerHTML = LINK_ICONS[field.key];
    row.append(icon);
  });
  return row;
}

function cardLinkRow(links) {
  const row = document.createElement("div");
  row.className = "card-links";
  links.forEach((field) => {
    const link = document.createElement("a");
    link.className = "card-link";
    link.href = field.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", field.label);
    link.innerHTML = LINK_ICONS[field.key];
    link.addEventListener("click", (clickEvent) => clickEvent.stopPropagation());
    row.append(link);
  });
  return row;
}

function youtubeId(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return "";
  }
  const host = parsed.hostname.replace(/^www\./, "");
  let id = "";
  if (host === "youtu.be") {
    id = parsed.pathname.slice(1).split("/")[0];
  } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (parsed.pathname === "/watch") id = parsed.searchParams.get("v") || "";
    else {
      const [kind, value] = parsed.pathname.split("/").filter(Boolean);
      if (value && ["embed", "shorts", "live", "v"].includes(kind)) id = value;
    }
  }
  return /^[\w-]{11}$/.test(id) ? id : "";
}

function filledLinks(event) {
  const links = event.links || {};
  const entries = [];
  for (const field of LINK_FIELDS) {
    const numbered = Object.keys(links)
      .map((key) => {
        if (key === field.key) return { key, order: 0 };
        const suffix = key.startsWith(field.key) ? key.slice(field.key.length) : "";
        if (!/^[1-9]\d*$/.test(suffix)) return null;
        return { key, order: Number(suffix) };
      })
      .filter(Boolean)
      .sort((a, b) => a.order - b.order);
    for (const item of numbered) {
      const value = links[item.key];
      if (typeof value !== "string" || !value.trim()) continue;
      entries.push({ key: field.key, label: field.label, href: value.trim(), order: item.order });
    }
  }
  return entries;
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

  favoritesBtn.hidden = state.path;
  modeBtn.hidden = state.path;
  pathBtn.setAttribute("aria-pressed", String(state.path));
  modeBtn.setAttribute("aria-pressed", String(state.byHour));
  favoritesBtn.setAttribute("aria-pressed", String(state.favoritesOnly));
  document.body.classList.toggle("is-hours", state.byHour && !state.path);
  document.body.classList.toggle("is-path", state.path);
  document.body.classList.toggle("is-halls-compact", !state.byHour && !state.path && isCompact());
  document.body.classList.toggle("is-favorites-dim", state.favoritesOnly && !state.path);

  if (state.path) {
    hallsEl.hidden = true;
    hallsEl.replaceChildren();
    updateSection();
    return;
  }

  hallsEl.hidden = false;
  if (state.byHour) {
    pinHour();
    hallsEl.setAttribute("aria-label", "Время");
    hallsEl.replaceChildren(
      ...visibleHours().map((hour) => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", String(hour === state.hour));
        button.dataset.hour = String(hour);
        button.textContent = hourLabel(hour);
        return button;
      }),
    );
  } else {
    pinHall();
    hallsEl.setAttribute("aria-label", "Залы");
    hallsEl.replaceChildren(
      ...visibleHalls().map(({ hall, index }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", String(index === state.hall));
        button.dataset.hall = String(index);
        button.textContent = hall.short;
        return button;
      }),
    );
  }

  updateSection();
}

function isSaved(id) {
  return favorites.has(id) || secondary.has(id);
}

function eventsForDay() {
  return events.filter((event) => event.day === state.day);
}

function visibleHalls() {
  return halls.map((hall, index) => ({ hall, index }));
}

function hallIndexes() {
  return visibleHalls().map((item) => item.index);
}

function pinHall() {
  if (state.byHour) return;
  const pool = hallIndexes();
  if (!pool.length || pool.includes(state.hall)) return;
  state.hall = pool[0];
}

function isCompact() {
  return window.matchMedia("(max-width: 799px)").matches;
}

function hoursWithEvents() {
  const present = new Set(eventsForDay().map((event) => hourOf(event.start)));
  return HOURS.filter((hour) => present.has(hour));
}

function visibleHours() {
  return isCompact() ? hoursWithEvents() : HOURS;
}

function pinHour() {
  if (!state.byHour) return;
  const pool = visibleHours();
  if (!pool.length || pool.includes(state.hour)) return;
  state.hour = pool.find((hour) => hour >= state.hour) ?? pool[pool.length - 1];
}

function hoursLayoutCurrent() {
  const rendered = [...board.querySelectorAll(".hour-col")].map((column) => Number(column.dataset.hour));
  const expected = visibleHours();
  return rendered.length === expected.length && rendered.every((hour, index) => hour === expected[index]);
}

function syncFavoriteButton(id) {
  const primary = Boolean(id && favorites.has(id));
  const later = Boolean(id && secondary.has(id));
  sheetFavorite.setAttribute("aria-pressed", String(primary));
  sheetFavoriteLabel.textContent = primary ? "Нет, не Олния (" : "Олния!";
  sheetSecondary.setAttribute("aria-pressed", String(later));
  sheetSecondaryLabel.textContent = later ? "Уже не Ажно!" : "Ажно!";
}

function updateSection() {
  sectionEl.hidden = state.byHour || state.path;
  if (state.byHour || state.path) return;
  const hall = halls[state.hall];
  const section = sectionOf(hall, state.day);
  const curator = section.curator ? ` · ${section.curator}` : "";
  sectionEl.textContent = `${section.title}${curator}`;
}

function createCard(event, { showHall, span }) {
  const hall = hallById(event.hall);
  const button = document.createElement("div");
  button.className = "card";
  if (favorites.has(event.id)) button.classList.add("is-favorite");
  else if (secondary.has(event.id)) button.classList.add("is-secondary");
  button.dataset.id = event.id;
  if (span) button.dataset.span = String(span);

  const time = document.createElement("p");
  time.className = "when-line";
  time.textContent = `${event.start}–${event.end}`;
  if (showHall) {
    const top = document.createElement("div");
    top.className = "card-top";
    const where = document.createElement("p");
    where.className = "where";
    where.textContent = hall.name;
    top.append(where, time);
    button.append(top);
  } else {
    button.append(time);
  }

  const kind = KINDS[event.kind];
  if (kind) {
    const kindLine = document.createElement("p");
    kindLine.className = "kind";
    kindLine.textContent = kind;
    button.append(kindLine);
  }

  const links = filledLinks(event);
  const materials = links.filter((field) => !CONTACT_KEYS.has(field.key));

  event.speakers.forEach((speaker, index) => {
    const person = document.createElement("div");
    person.className = "person";
    const name = document.createElement("p");
    name.className = "name";
    name.textContent = speaker.name;
    const contacts = contactsForSpeaker(event, index);
    const inline = index === 0 ? contacts.concat(materials) : contacts;
    if (inline.length) {
      const line = document.createElement("div");
      line.className = "name-line";
      line.append(name, cardLinkIcons(inline));
      person.append(line);
    } else {
      person.append(name);
    }
    const meta = speaker.org || (speaker.role && speaker.role !== "участник" ? speaker.role : "");
    if (meta) {
      const org = document.createElement("p");
      org.className = "org";
      org.textContent = meta;
      person.append(org);
    }
    button.append(person);
  });

  const title = document.createElement("div");
  title.className = "description";
  title.textContent = event.title;
  button.append(title);

  if (links.length) button.append(cardLinkRow(links));

  const who = peopleLine(event);
  button.setAttribute(
    "aria-label",
    `${event.start}, ${hall.name}. ${event.title}${who ? `. ${who}` : ""}`,
  );
  return button;
}

function eventsForPath() {
  return events
    .filter((event) => event.day === state.day && isSaved(event.id))
    .sort((a, b) => {
      const byStart = minutes(a.start) - minutes(b.start);
      if (byStart) return byStart;
      return halls.findIndex((hall) => hall.id === a.hall) - halls.findIndex((hall) => hall.id === b.hall);
    });
}

function placePath(node) {
  if (isCompact()) {
    carryPanel.hidden = true;
    board.replaceChildren(node);
  } else {
    const stage = document.createElement("div");
    stage.className = "path-stage";
    const phone = document.createElement("div");
    phone.className = "phone";
    const scroll = document.createElement("div");
    scroll.className = "phone-scroll";
    scroll.append(node);
    phone.append(scroll);
    carryPanel.hidden = false;
    stage.append(phone, carryPanel);
    board.replaceChildren(stage);
    drawPlanQr(planUrl());
  }
  board.scrollTo({ left: 0, top: 0 });
}

function renderPathBoard() {
  const items = eventsForPath();
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-favorites";
    empty.textContent = "Gj странному стечению обстоятельств в избранном пока нет событий";
    placePath(empty);
    return;
  }
  const byHour = new Map();
  items.forEach((event) => {
    const hour = hourOf(event.start);
    const group = byHour.get(hour);
    if (group) group.push(event);
    else byHour.set(hour, [event]);
  });

  const hours = HOURS.slice();
  byHour.forEach((_, hour) => {
    if (!hours.includes(hour)) hours.push(hour);
  });
  hours.sort((a, b) => a - b);

  const list = document.createElement("div");
  list.className = "path-list";
  hours.forEach((hour) => {
    const block = document.createElement("section");
    block.className = "path-block";

    const label = document.createElement("h2");
    label.className = "path-hour";
    label.textContent = hourLabel(hour);
    block.append(label);

    const group = byHour.get(hour) || [];
    const from = hour * 60;
    const busy = items.some((event) => minutes(event.start) < from + 60 && minutes(event.end) > from);
    if (group.length) {
      group.forEach((event) => block.append(createCard(event, { showHall: true })));
    } else if (!busy) {
      const free = document.createElement("span");
      free.className = "path-free";
      free.textContent = "Свободное время";
      label.append(free);
    }

    list.append(block);
  });
  placePath(list);
}

function renderBoard() {
  hideLinkTip();
  if (state.path) renderPathBoard();
  else if (state.byHour) renderHourBoard();
  else renderHallBoard();
  syncSheetNav();
}

function renderCompactHallBoard() {
  pinHall();
  const dayEvents = eventsForDay();
  const boardList = document.createElement("div");
  boardList.className = "hall-board";

  visibleHalls().forEach(({ hall, index }) => {
    const items = dayEvents
      .filter((event) => event.hall === hall.id)
      .sort((a, b) => minutes(a.start) - minutes(b.start));

    const column = document.createElement("section");
    column.className = "hall-col";
    const active = index === state.hall;
    column.classList.toggle("is-active", active);
    column.dataset.hall = String(index);
    column.setAttribute("aria-hidden", String(!active));

    const list = document.createElement("div");
    list.className = "hall-events";
    items.forEach((event) => list.append(createCard(event, { showHall: false })));
    column.append(list);
    boardList.append(column);
  });

  board.replaceChildren(boardList);
  board.scrollTo({ left: 0, top: 0 });
}

function activateCompactHall(index) {
  const columns = [...board.querySelectorAll(".hall-board .hall-col")];
  if (!columns.length) return false;
  columns.forEach((column) => {
    const active = Number(column.dataset.hall) === index;
    column.classList.toggle("is-active", active);
    column.setAttribute("aria-hidden", String(!active));
  });
  return true;
}

function renderHallBoard() {
  if (isCompact()) {
    renderCompactHallBoard();
    return;
  }

  const shown = visibleHalls();
  const dayEvents = eventsForDay();
  const columnOf = new Map(shown.map((item, position) => [item.hall.id, position]));
  pinHall();

  const grid = document.createElement("div");
  grid.className = "grid";
  grid.style.setProperty("--halls", String(shown.length));
  grid.style.gridTemplateRows = `var(--head) repeat(${SLOT_COUNT}, minmax(var(--slot), auto))`;

  const corner = document.createElement("div");
  corner.className = "corner";
  grid.append(corner);

  shown.forEach(({ hall }, position) => {
    const head = document.createElement("div");
    head.className = "hall-head";
    head.style.gridColumn = String(position + 2);
    const section = sectionOf(hall, state.day);
    const curator = section.curator ? ` · ${section.curator}` : "";
    const name = document.createElement("strong");
    name.textContent = hall.name;
    const detail = document.createElement("span");
    detail.textContent = `${section.title}${curator}`;
    head.append(name, detail);
    const line = document.createElement("div");
    line.className = "col-line";
    line.style.gridColumn = String(position + 2);
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

  dayEvents.forEach((event) => {
    const position = columnOf.get(event.hall);
    if (position === undefined) return;
    const start = slotIndex(event.start);
    const span = slotIndex(event.end) - start;
    const card = createCard(event, { span });
    card.style.gridColumn = String(position + 2);
    card.style.gridRow = `${start + 2} / span ${span}`;
    grid.append(card);
  });

  const now = nowMarker();
  if (now) grid.append(now);

  board.replaceChildren(grid);
  const column = Math.max(0, hallIndexes().indexOf(state.hall));
  scrollBoardTo(column * columnWidth());
}

function renderHourBoard() {
  const boardList = document.createElement("div");
  boardList.className = "hour-board";

  const dayEvents = eventsForDay();
  const tracks = [];
  let selected = null;
  visibleHours().forEach((hour) => {
    const items = dayEvents
      .filter((event) => hourOf(event.start) === hour)
      .sort((a, b) => {
        const byHall = halls.findIndex((hall) => hall.id === a.hall) - halls.findIndex((hall) => hall.id === b.hall);
        if (byHall) return byHall;
        return minutes(a.start) - minutes(b.start);
      });

    const column = document.createElement("section");
    column.className = items.length ? "hour-col" : "hour-col is-empty";
    column.dataset.hour = String(hour);
    tracks.push(items.length ? "minmax(200px, 1fr)" : "max-content");

    const head = document.createElement("div");
    head.className = "hall-head";
    const name = document.createElement("strong");
    name.textContent = hourLabel(hour);
    head.append(name);

    const list = document.createElement("div");
    list.className = "hour-list";
    items.forEach((event) => list.append(createCard(event, { showHall: true })));

    column.append(head, list);
    boardList.append(column);
    if (hour === state.hour) selected = column;
  });

  boardList.style.setProperty("--hour-cols", tracks.join(" "));
  board.replaceChildren(boardList);
  const emptyColumns = boardList.querySelectorAll(".hour-col.is-empty");
  const emptyWidth = emptyColumns[0] ? emptyColumns[0].offsetWidth : 0;
  const filledCount = boardList.querySelectorAll(".hour-col:not(.is-empty)").length;
  const minWidth = Math.ceil(filledCount * 200 + emptyColumns.length * emptyWidth);
  boardList.style.setProperty("--hour-min", `${minWidth}px`);
  scrollBoardTo(selected ? selected.offsetLeft : 0);
}

let scrollLock = 0;

function scrollBoardTo(left, behavior) {
  scrollLock += 1;
  board.scrollTo({ left, top: 0, behavior: behavior || "auto" });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollLock -= 1;
    });
  });
}

function nowMarker() {
  if (state.day !== todayId()) return null;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  if (current < START_MIN || current > END_MIN) return null;
  const offset = (current - START_MIN) / SLOT_MIN;
  const slot = Math.floor(offset);
  const fraction = offset - slot;
  const marker = document.createElement("div");
  marker.className = "now";
  marker.style.gridRow = String(slot + 2);
  marker.style.setProperty("--fraction", String(fraction));
  return marker;
}

function columnWidth() {
  const grid = board.querySelector(".grid");
  if (!grid) return 0;
  const columns = getComputedStyle(grid).gridTemplateColumns.split(" ");
  return parseFloat(columns[1]) || 0;
}

function hourFromScroll() {
  if (board.scrollWidth <= board.clientWidth + 1) return null;
  const columns = [...board.querySelectorAll(".hour-col")];
  if (!columns.length) return null;
  const left = board.scrollLeft;
  let best = columns[0];
  let bestDistance = Infinity;
  columns.forEach((column) => {
    const distance = Math.abs(column.offsetLeft - left);
    if (distance < bestDistance) {
      best = column;
      bestDistance = distance;
    }
  });
  return Number(best.dataset.hour);
}

function setHall(index, scroll) {
  const pool = hallIndexes();
  if (!pool.length) return;
  let next = index;
  if (!pool.includes(index)) {
    if (index > state.hall) next = pool.find((item) => item > state.hall) ?? pool[pool.length - 1];
    else next = [...pool].reverse().find((item) => item < state.hall) ?? pool[0];
  }
  if (!pool.includes(next)) next = pool[0];
  if (next === state.hall && !scroll) return;
  state.hall = next;
  hallsEl.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-selected", String(Number(button.dataset.hall) === next));
  });
  updateSection();
  const chip = hallsEl.querySelector(`[data-hall="${next}"]`);
  if (chip) {
    const left = chip.offsetLeft - (hallsEl.clientWidth - chip.offsetWidth) / 2;
    hallsEl.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }
  if (isCompact()) {
    if (!activateCompactHall(next)) renderCompactHallBoard();
    return;
  }
  if (scroll) {
    board.scrollTo({ left: pool.indexOf(next) * columnWidth(), behavior: "smooth" });
  }
}

function setHour(hour, scroll) {
  const pool = visibleHours();
  if (!pool.length) return;
  let next = hour;
  if (!pool.includes(next)) {
    if (hour > state.hour) next = pool.find((item) => item > state.hour) ?? pool[pool.length - 1];
    else next = [...pool].reverse().find((item) => item < state.hour) ?? pool[0];
  }
  if (next === state.hour && !scroll) return;
  state.hour = next;
  hallsEl.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-selected", String(Number(button.dataset.hour) === next));
  });
  const chip = hallsEl.querySelector(`[data-hour="${next}"]`);
  if (chip) {
    const left = chip.offsetLeft - (hallsEl.clientWidth - chip.offsetWidth) / 2;
    hallsEl.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }
  if (scroll) {
    const column = board.querySelector(`.hour-col[data-hour="${next}"]`);
    if (column) board.scrollTo({ left: column.offsetLeft, behavior: "smooth" });
  }
}

function selectionIds() {
  let root = null;
  if (state.path) root = board.querySelector(".path-list");
  else if (state.byHour) {
    root = isCompact()
      ? board.querySelector(`.hour-col[data-hour="${state.hour}"]`)
      : board.querySelector(".hour-board");
  } else if (isCompact()) root = board.querySelector(".hall-col.is-active");
  else root = board.querySelector(".grid");
  if (!root) return [];
  return [...root.querySelectorAll(".card")].map((card) => card.dataset.id).filter((id) => byId.has(id));
}

function syncSheetNav() {
  const ids = selectionIds();
  const index = state.openId ? ids.indexOf(state.openId) : -1;
  sheetPrev.disabled = index <= 0;
  sheetNext.disabled = index < 0 || index >= ids.length - 1;
}

function revealCard(id) {
  const card = board.querySelector(`[data-id="${id}"]`);
  const event = byId.get(id);
  if (!card || !event) return;

  if (!state.path && !isCompact()) {
    if (state.byHour) {
      if (hourOf(event.start) !== state.hour) setHour(hourOf(event.start), true);
    } else {
      const hallIndex = halls.findIndex((hall) => hall.id === event.hall);
      if (hallIndex !== -1 && hallIndex !== state.hall) setHall(hallIndex, false);
    }
  }

  const scroller = card.closest(".phone-scroll") || card.closest(".hall-events") || card.closest(".hour-list") || board;
  const top = Math.max(0, card.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 12);
  if (scroller === board && !state.path && !state.byHour && !isCompact()) {
    const left = Math.max(0, hallIndexes().indexOf(state.hall) * columnWidth());
    board.scrollTo({ left, top });
    return;
  }
  scroller.scrollTo({ top });
}

function stepOpenEvent(direction) {
  const ids = selectionIds();
  const nextId = ids[ids.indexOf(state.openId) + direction];
  if (!nextId) return;
  openEvent(nextId);
  revealCard(nextId);
  const button = direction < 0 ? sheetPrev : sheetNext;
  if (button.disabled) sheetClose.focus();
}

function openEvent(id) {
  const event = byId.get(id);
  if (!event) return;
  const hall = hallById(event.hall);
  const day = days.find((item) => item.id === event.day);
  const section = sectionOf(hall, event.day);
  sheetMeta.textContent = `${day.weekday}, ${day.date} · ${event.start}–${event.end}\n${hall.name} · ${section.title}`;
  const kind = KINDS[event.kind];
  sheetKind.hidden = !kind;
  sheetKind.textContent = kind || "";
  sheetTitle.textContent = event.title;
  const description = (event.description || "").trim();
  sheetDesc.hidden = !description;
  sheetDesc.textContent = description;
  sheetPeople.replaceChildren(
    ...event.speakers.map((speaker, index) => {
      const item = document.createElement("li");
      const photo = document.createElement(speaker.photo ? "img" : "span");
      photo.className = "portrait";
      if (speaker.photo) {
        photo.src = speaker.photo;
        photo.alt = "";
      } else {
        photo.setAttribute("aria-hidden", "true");
      }
      item.append(photo);
      const who = document.createElement("div");
      who.className = "who";
      const identity = document.createElement("div");
      identity.className = "identity";
      const name = document.createElement("strong");
      name.textContent = speaker.name;
      identity.append(name);
      if (speaker.role && speaker.role !== "участник") {
        const role = document.createElement("span");
        role.className = "role";
        role.textContent = speaker.role;
        identity.append(role);
      }
      const post = speaker.position || speaker.org;
      if (post) {
        const org = document.createElement("span");
        org.textContent = post;
        identity.append(org);
      }
      who.append(identity);
      appendContactIcons(who, contactsForSpeaker(event, index));
      item.append(who);
      if (index === event.speakers.length - 1) item.append(sheetTitle);
      return item;
    }),
  );
  if (!event.speakers.length) sheetDesc.before(sheetTitle);

  const links = filledLinks(event).filter((field) => field.key !== "telegram" && field.key !== "message");
  const embeds = links.flatMap((field) => {
    if (field.key !== "video") return [];
    const id = youtubeId(field.href);
    return id ? [id] : [];
  });
  sheetVideo.hidden = embeds.length === 0;
  sheetVideo.replaceChildren(
    ...embeds.map((id) => {
      const frame = document.createElement("iframe");
      frame.src = `https://www.youtube-nocookie.com/embed/${id}`;
      frame.title = `Видео: ${event.title}`;
      frame.loading = "lazy";
      frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      return frame;
    }),
  );
  sheetMaterials.hidden = links.length === 0 && embeds.length === 0;
  sheetLinks.hidden = links.length === 0;
  sheetLinks.replaceChildren(
    ...links.map((field) => {
      const link = document.createElement("a");
      link.href = field.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      const main = document.createElement("span");
      main.className = "material-link-main";
      main.innerHTML = LINK_ICONS[field.key];
      const text = document.createElement("span");
      text.textContent = field.label;
      main.append(text);
      link.append(main);
      return link;
    }),
  );

  state.openId = event.id;
  syncFavoriteButton(event.id);
  syncSheetNav();
  sheetBody.scrollTop = 0;
  if (!sheet.open) sheet.showModal();
  history.replaceState(null, "", `#${event.id}`);
}

function closeSheet() {
  state.openId = null;
  if (sheet.open) sheet.close();
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
}

function eventShareUrl(id) {
  const url = new URL(location.href);
  url.hash = id;
  return url.href;
}

function linkedFromHash() {
  const raw = location.hash.replace(/^#/, "");
  if (!raw) return null;
  try {
    return byId.get(decodeURIComponent(raw)) || null;
  } catch {
    return byId.get(raw) || null;
  }
}

function toggleFavorite(id, level) {
  if (!id || !byId.has(id)) return;
  const target = level === "secondary" ? secondary : favorites;
  const other = level === "secondary" ? favorites : secondary;
  if (target.has(id)) target.delete(id);
  else {
    target.add(id);
    other.delete(id);
  }
  writeFavorites();
  syncFavoriteButton(state.openId);
  const staysVisible = !state.path || isSaved(id);
  const card = board.querySelector(`[data-id="${id}"]`);
  if (staysVisible && card) {
    card.classList.toggle("is-favorite", favorites.has(id));
    card.classList.toggle("is-secondary", secondary.has(id));
    if (state.path && !isCompact()) drawPlanQr(planUrl());
  } else {
    renderChrome();
    renderBoard();
  }
  closeSheet();
}

daysEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-day]");
  if (!button || button.dataset.day === state.day) return;
  state.day = button.dataset.day;
  state.hall = 0;
  state.hour = HOURS[0];
  closeSheet();
  renderChrome();
  renderBoard();
});

modeBtn.addEventListener("click", () => {
  state.byHour = !state.byHour;
  renderChrome();
  renderBoard();
});

favoritesBtn.addEventListener("click", () => {
  state.favoritesOnly = !state.favoritesOnly;
  renderChrome();
  renderBoard();
});

pathBtn.addEventListener("click", () => {
  state.path = !state.path;
  renderChrome();
  renderBoard();
});

sheetFavorite.addEventListener("click", () => {
  toggleFavorite(state.openId, "primary");
});

sheetSecondary.addEventListener("click", () => {
  toggleFavorite(state.openId, "secondary");
});

hallsEl.addEventListener("click", (event) => {
  const hourButton = event.target.closest("button[data-hour]");
  if (hourButton) {
    setHour(Number(hourButton.dataset.hour), true);
    return;
  }
  const button = event.target.closest("button[data-hall]");
  if (!button) return;
  setHall(Number(button.dataset.hall), true);
});

board.addEventListener("click", (event) => {
  if (event.target.closest("a")) return;
  const card = event.target.closest(".card");
  if (card) openEvent(card.dataset.id);
});

const linkTip = document.createElement("div");
linkTip.className = "link-tip";
linkTip.hidden = true;
linkTip.setAttribute("role", "tooltip");
document.body.append(linkTip);

const LINK_TIP_DELAY = 300;
let linkTipTarget = null;
let linkTipTimer = 0;

function placeLinkTip() {
  if (!linkTipTarget || !linkTipTarget.isConnected) {
    hideLinkTip();
    return;
  }
  const rect = linkTipTarget.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();
  const visible = rect.width && rect.height
    && rect.bottom > boardRect.top && rect.top < boardRect.bottom
    && rect.right > boardRect.left && rect.left < boardRect.right;
  if (!visible) {
    hideLinkTip();
    return;
  }
  linkTip.hidden = false;
  const tipRect = linkTip.getBoundingClientRect();
  const minLeft = 8;
  const maxLeft = Math.max(minLeft, window.innerWidth - tipRect.width - 8);
  let left = rect.left;
  if (left > maxLeft) left = Math.max(minLeft, rect.right - tipRect.width);
  left = Math.max(minLeft, Math.min(left, maxLeft));
  let top = rect.top - tipRect.height - 8;
  if (top < 8) top = rect.bottom + 8;
  linkTip.style.left = `${left}px`;
  linkTip.style.top = `${top}px`;
}

function revealLinkTip(link) {
  linkTipTarget = link;
  linkTip.textContent = link.getAttribute("href") || "";
  placeLinkTip();
}

function showLinkTip(link) {
  if (linkTipTarget === link && (linkTipTimer || !linkTip.hidden)) return;
  window.clearTimeout(linkTipTimer);
  linkTipTimer = 0;
  if (!linkTip.hidden) {
    revealLinkTip(link);
    return;
  }
  linkTipTarget = link;
  linkTipTimer = window.setTimeout(() => {
    linkTipTimer = 0;
    if (linkTipTarget === link) revealLinkTip(link);
  }, LINK_TIP_DELAY);
}

function hideLinkTip() {
  window.clearTimeout(linkTipTimer);
  linkTipTimer = 0;
  linkTipTarget = null;
  linkTip.hidden = true;
}

function cardLinkFrom(event) {
  return event.target instanceof Element ? event.target.closest("a.card-link") : null;
}

board.addEventListener("pointerover", (event) => {
  const link = cardLinkFrom(event);
  if (link) showLinkTip(link);
});

board.addEventListener("pointerout", (event) => {
  const link = cardLinkFrom(event);
  if (!link || linkTipTarget !== link) return;
  const next = event.relatedTarget;
  if (next instanceof Node && link.contains(next)) return;
  if (next instanceof Element && next.closest(".card-link")) return;
  hideLinkTip();
});

board.addEventListener("focusin", (event) => {
  const link = cardLinkFrom(event);
  if (link) showLinkTip(link);
});

board.addEventListener("focusout", (event) => {
  const link = cardLinkFrom(event);
  if (link && linkTipTarget === link) hideLinkTip();
});

document.addEventListener("scroll", () => {
  if (linkTipTarget && !linkTip.hidden) placeLinkTip();
}, true);

let scrollFrame = 0;
board.addEventListener(
  "scroll",
  () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      if (scrollLock || state.path || (isCompact() && !state.byHour)) return;
      if (state.byHour) {
        if (!hoursLayoutCurrent()) return;
        const hour = hourFromScroll();
        if (hour !== null && hour !== state.hour) setHour(hour, false);
        return;
      }
      const width = columnWidth();
      if (!width) return;
      const pool = hallIndexes();
      const column = Math.max(0, Math.min(pool.length - 1, Math.round(board.scrollLeft / width)));
      const hallIndex = pool[column];
      if (hallIndex !== undefined && hallIndex !== state.hall) setHall(hallIndex, false);
    });
  },
  { passive: true },
);

board.addEventListener("keydown", (event) => {
  if (state.path) return;
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  event.preventDefault();
  const step = event.key === "ArrowRight" ? 1 : -1;
  if (state.byHour) setHour(state.hour + step, true);
  else setHall(state.hall + step, true);
});

sheetClose.addEventListener("click", closeSheet);
sheetPrev.addEventListener("click", () => stepOpenEvent(-1));
sheetNext.addEventListener("click", () => stepOpenEvent(1));

const sheetShare = document.getElementById("sheet-share");
const shareStatus = document.getElementById("sheet-share-status");
const mobileLayout = window.matchMedia("(max-width: 799px)");
let shareResetTimer = 0;

function markShareCopied() {
  sheetShare.classList.add("is-copied");
  sheetShare.setAttribute("aria-label", "Ссылка скопирована");
  shareStatus.textContent = "Ссылка скопирована";
  window.clearTimeout(shareResetTimer);
  shareResetTimer = window.setTimeout(() => {
    sheetShare.classList.remove("is-copied");
    sheetShare.setAttribute("aria-label", "Поделиться");
    shareStatus.textContent = "";
  }, 1600);
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      return copied;
    } catch {
      return false;
    }
  }
}

async function copyShareUrl(url) {
  if (await writeClipboard(url)) markShareCopied();
}

async function shareOpenEvent() {
  const event = byId.get(state.openId);
  if (!event) return;
  const url = eventShareUrl(event.id);
  if (mobileLayout.matches && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: event.title, url });
    } catch (error) {
      if (error && error.name === "AbortError") return;
      await copyShareUrl(url);
    }
    return;
  }
  await copyShareUrl(url);
}

sheetShare.addEventListener("click", () => {
  shareOpenEvent();
});
sheet.addEventListener("click", (event) => {
  if (event.target === sheet) closeSheet();
});
sheet.addEventListener("close", () => {
  state.openId = null;
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
});

let carryCopyTimer = 0;

async function copyPlanLink() {
  if (!(await writeClipboard(planUrl()))) return;
  carryCopy.textContent = "Ссылка скопирована";
  carryCopyStatus.textContent = "Ссылка скопирована";
  window.clearTimeout(carryCopyTimer);
  carryCopyTimer = window.setTimeout(() => {
    carryCopy.textContent = "Скопировать ссылку";
    carryCopyStatus.textContent = "";
  }, 1600);
}

carryCopy.addEventListener("click", () => {
  copyPlanLink();
});

function start() {
  const imported = consumePlan();

  const linked = linkedFromHash();
  if (days.some((day) => day.id === todayId())) state.day = todayId();
  if (imported) {
    state.path = true;
    const hasSaved = (dayId) => events.some((event) => event.day === dayId && (favorites.has(event.id) || secondary.has(event.id)));
    if (!hasSaved(state.day)) {
      const savedDay = days.find((day) => hasSaved(day.id));
      if (savedDay) state.day = savedDay.id;
    }
  }
  if (linked && linked.day === state.day) {
    state.hall = Math.max(0, halls.findIndex((hall) => hall.id === linked.hall));
  }

  renderChrome();
  renderBoard();

  if (imported) {
    importedStatus.hidden = false;
    importedStatus.textContent = "Избранное с компьютера сохранено";
    window.setTimeout(() => {
      importedStatus.hidden = true;
    }, 5000);
  }

  if (linked) {
    requestAnimationFrame(() => {
      const card = board.querySelector(`[data-id="${linked.id}"]`);
      if (card) {
        const scroller = card.closest(".hall-events");
        if (scroller) {
          const top = card.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 12;
          scroller.scrollTo({ top: Math.max(0, top) });
        } else {
          const top = Math.max(0, card.offsetTop - 12);
          board.scrollTo(state.hall * columnWidth(), top);
        }
      }
      openEvent(linked.id);
    });
  }
}

start();

mobileLayout.addEventListener("change", () => {
  if (state.path) {
    renderBoard();
    return;
  }
  scrollLock += 1;
  renderChrome();
  renderBoard();
  requestAnimationFrame(() => {
    if (state.byHour) {
      const column = board.querySelector(`.hour-col[data-hour="${state.hour}"]`);
      if (column) board.scrollTo({ left: column.offsetLeft, top: 0, behavior: "auto" });
    }
    requestAnimationFrame(() => {
      scrollLock -= 1;
    });
  });
});

