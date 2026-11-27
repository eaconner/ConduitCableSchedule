const STORAGE_KEY = "wireframe-project-v1";
const THEME_PREFERENCE_KEY = "wireframe-theme-preference-v1";
const THEME_PREFERENCES = ["system", "light", "dark"];
const CONDUIT_SIZES = ['1/2"', '3/4"', '1"', '1-1/2"', '2"', '2-1/2"', '3"', '3-1/2"', '4"'];
const NEC_EDITIONS = ["2017", "2020", "2023", "2026"];
const CABLE_FILL_TYPES = [
  { value: "individual", label: "Individual Conductor" },
  { value: "multiconductor", label: "Multiconductor Cable" },
];
const CABLE_MATERIALS = ["Aluminum", "Copper"];
const CABLE_RATINGS = ["60", "75", "90"];
const CABLE_PHASES = ["Single", "Three"];
const CABLE_SPEC_CONSTRUCTIONS = ["conductor", "pair"];
const CABLE_SPEC_SIZES = [
  ...["18", "16", "14", "12", "10", "8", "6", "4", "3", "2", "1", "1/0", "2/0", "3/0", "4/0"].map((size) => `${size} AWG`),
  ...["250", "300", "350", "400", "500", "600", "700", "750", "800", "900", "1000"].map((size) => `${size} KCMIL`),
];
const MAX_PARALLEL_SETS = 6;
const CONDUIT_FILL_CONDITIONS = ["standard", "nipple"];
const CABLE_TRAY_LOCATION_ID = "__wireframe_cable_tray__";
const CABLE_TRAY_LOCATION_NAME = "Cable Tray";
const SCHEDULE_STATUSES = [
  "In Progress",
  "Internal Review",
  "Issued for Review",
  "Issued for Approval",
  "Issued for Construction",
  "Complete",
];
const VERSION_HISTORY = [
  {
    version: "2026.11.00",
    changes: ["Project started as a basic, functioning prototype for creating cable and conduit schedules."],
  },
  {
    version: "2026.11.01",
    changes: ["Added the ability to duplicate conduits while retaining their details and cable assignments."],
  },
  {
    version: "2026.11.02",
    changes: ["Added system-aware light and dark themes, with a user-selectable appearance setting."],
  },
  {
    version: "2026.11.03",
    changes: ["Improved the cable-length summary to total defined lengths and warn when some cable lengths are missing."],
  },
  {
    version: "2026.11.04",
    changes: [
      "Wrapped long table headings to improve schedule and BOM readability.",
      "Split Cable Materials manufacturer and spec number into separate columns, with Spec Type first.",
    ],
  },
  {
    version: "2026.11.05",
    changes: ["Widened modal windows and prevented backdrop clicks or text selection from dismissing them."],
  },
  {
    version: "2026.11.06",
    changes: ["Updated BOM printing to respect the print dialog's orientation and removed an unwanted trailing blank page."],
  },
  {
    version: "2026.11.07",
    changes: ["Added CSV export for the Bill of Materials."],
  },
  {
    version: "2026.11.08",
    changes: ["Centered the Export menu chevron and moved BOM printing into the Export menu."],
  },
  {
    version: "2026.11.09",
    changes: ["Added a landscape Conduit Cable Schedule printout with project details and spacing between conduits."],
  },
  {
    version: "2026.11.10",
    changes: [
      "Unified report print colors, highlighted conduit rows, and added multiline CCS column headings.",
      "Kept CCS From/To values on one line, compacted other columns, and prevented conduit groups from splitting across pages.",
    ],
  },
  {
    version: "2026.11.11",
    changes: ["Added NEC conduit-fill analysis with pass/fail/needs-data status and automatic raceway area lookups for the supplied EMT, RMC, and PVC tables."],
  },
  {
    version: "2026.11.12",
    changes: [
      "Added conduit type to the Bill of Materials and CSV export, grouping conduit totals by type and size.",
      "Listed conduit size before type and sorted conduit materials by size, then type.",
      "Added project and report names to saved project files, CSV exports, and print-to-PDF titles.",
    ],
  },
  {
    version: "2026.11.13",
    changes: [
      "Added a cable specification builder for conductor/pair count, AWG/KCMIL size, ground/shield, and optional suffix; cable material is selected on the cable type.",
      "Added Cable Ampacity lookups by size, material, and rating, plus Ampacity Overhead (ampacity minus load) with combined parallel-set ampacity, red/green status indicators, and ampere units for loads.",
      "Added Power Factor and Max Voltage Drop settings to Project Information; voltage drop uses Table 9 impedance, cable length, load, phase, rating temperature, raceway, and parallel sets, with the maximum setting controlling status colors. Missing inputs show Needs data; multiconductor and pair results are labeled estimates.",
      "Grouped parallel sets in the Cable and Voltage Drop schedules with set counts and cable numbers; added editable per-set numbering (up to six), whole-set duplicate/delete, combined conduit assignments, and “Set x of y” purpose suffixes while showing shared purposes once in grouped rows.",
      "Added Actions headings to Cable and Conduit Schedules, consistent sidebar icon styling, and Voltage Drop column alignment.",
    ],
  },
];
let showAllVersionHistory = false;
const emptyState = () => ({
  settings: {
    projectName: "",
    clientName: "",
    clientProjectNumber: "",
    internalProjectNumber: "",
    revisionNumber: "",
    editorName: "",
    scheduleStatus: "In Progress",
    necEdition: "",
    necJurisdiction: "",
    powerFactor: 0.9,
    maxVoltageDropPercent: 3,
    cableTypes: [],
    locations: [],
  },
  cables: [],
  conduits: [],
});

function loadState() {
  let saved;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error("Could not access the saved project.", error);
    showToast("Browser storage is unavailable. Changes may not persist.", true);
    return emptyState();
  }
  if (!saved) return emptyState();
  try {
    const parsed = JSON.parse(saved);
    return normalizeCableTypeMaterials(normalizeCableTrayLocations({
      ...emptyState(),
      ...parsed,
      settings: {
        ...emptyState().settings,
        ...parsed.settings,
        scheduleStatus: parsed.settings?.scheduleStatus || "In Progress",
      },
      cables: Array.isArray(parsed.cables) ? parsed.cables : [],
      conduits: Array.isArray(parsed.conduits) ? parsed.conduits : [],
    }));
  } catch (error) {
    console.error("Could not read the saved project.", error);
    showToast("Saved project data could not be read. Start a new project or restore a backup.", true);
    return emptyState();
  }
}

function isCableTrayLocation(location) {
  return String(location?.name || "").trim().toLocaleLowerCase() === CABLE_TRAY_LOCATION_NAME.toLocaleLowerCase();
}

function normalizeCableTrayLocations(projectState) {
  const cableTrayIds = new Set(projectState.settings.locations.filter(isCableTrayLocation).map((location) => location.id));
  if (!cableTrayIds.size) return projectState;
  return {
    ...projectState,
    settings: {
      ...projectState.settings,
      locations: projectState.settings.locations.filter((location) => !isCableTrayLocation(location)),
    },
    conduits: projectState.conduits.map((conduit) => ({
      ...conduit,
      fromLocationId: cableTrayIds.has(conduit.fromLocationId) ? CABLE_TRAY_LOCATION_ID : conduit.fromLocationId,
      toLocationId: cableTrayIds.has(conduit.toLocationId) ? CABLE_TRAY_LOCATION_ID : conduit.toLocationId,
    })),
  };
}

function normalizeCableTypeMaterials(projectState) {
  const legacyMaterials = new Map();
  projectState.cables.forEach((cable) => {
    if (!CABLE_MATERIALS.includes(cable.cableMaterial)) return;
    const materials = legacyMaterials.get(cable.cableTypeId) || new Set();
    materials.add(cable.cableMaterial);
    legacyMaterials.set(cable.cableTypeId, materials);
  });
  return {
    ...projectState,
    settings: {
      ...projectState.settings,
      cableTypes: projectState.settings.cableTypes.map((type) => {
        if (CABLE_MATERIALS.includes(type.cableMaterial)) return type;
        const materials = legacyMaterials.get(type.id);
        return materials?.size === 1 ? { ...type, cableMaterial: [...materials][0] } : type;
      }),
    },
  };
}

let activePage = "dashboard";
let toastTimer;
let pendingCableDraft = null;
let pendingLocationReturn = null;
const pageContent = document.querySelector("#page-content");
const modalRoot = document.querySelector("#modal-root");
const toast = document.querySelector("#toast");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
let themePreference = loadThemePreference();
applyTheme();
systemTheme.addEventListener("change", () => {
  if (themePreference === "system") applyTheme();
});
let state = loadState();
const numberCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function loadThemePreference() {
  try {
    const preference = localStorage.getItem(THEME_PREFERENCE_KEY);
    return THEME_PREFERENCES.includes(preference) ? preference : "system";
  } catch (error) {
    console.error("Could not load the appearance preference.", error);
    showToast("Could not load appearance preference. Using the system theme.", true);
    return "system";
  }
}

function applyTheme() {
  const isDark = themePreference === "dark" || (themePreference === "system" && systemTheme.matches);
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#141c27" : "#f5f7fa";
}

function saveThemePreference(preference) {
  if (!THEME_PREFERENCES.includes(preference)) {
    showToast("Choose system, light, or dark appearance.", true);
    return false;
  }
  try {
    localStorage.setItem(THEME_PREFERENCE_KEY, preference);
  } catch (error) {
    console.error("Could not save the appearance preference.", error);
    showToast("Could not save appearance preference in this browser.", true);
    return false;
  }
  themePreference = preference;
  applyTheme();
  showToast("Theme preference saved.");
  return true;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateWorkspace();
    updateSaveStatus("All changes saved");
    return true;
  } catch (error) {
    console.error("Could not save the project.", error);
    updateSaveStatus("Save failed", true);
    showToast("Could not save changes in this browser. Check available storage.", true);
    return false;
  }
}

function updateSaveStatus(message, isError = false) {
  const status = document.querySelector(".saved-state");
  status.innerHTML = `<span class="saved-dot"></span>${escapeHtml(message)}`;
  status.classList.toggle("save-error", isError);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function safeHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—";
}

function hasScheduledLength(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function renderScheduledLength(value) {
  return hasScheduledLength(value) ? `${formatNumber(value)} ft` : `<span class="tag tbd">TBD</span>`;
}

function sumScheduledLengths(records) {
  return records.reduce((sum, record) => sum + (hasScheduledLength(record.length) ? Number(record.length) : 0), 0);
}

function renderLengthSummary(records) {
  const missingCount = records.filter((record) => !hasScheduledLength(record.length)).length;
  const knownLength = formatNumber(sumScheduledLengths(records));
  return missingCount
    ? `${knownLength} ft entered · <span class="length-tbd-text">${missingCount} TBD</span>`
    : `${knownLength} ft total length`;
}

function renderLengthTotal(records) {
  const missingCount = records.filter((record) => !hasScheduledLength(record.length)).length;
  const knownLength = sumScheduledLengths(records);
  return missingCount
    ? `${knownLength ? `${formatNumber(knownLength)} ft + ` : ""}<span class="tag tbd">TBD</span>`
    : `${formatNumber(knownLength)} ft`;
}

function sortByNumber(items) {
  return [...items].sort((a, b) => numberCollator.compare(String(a.number ?? ""), String(b.number ?? "")));
}

function sortCablesByPrefix(items) {
  const prefixOrder = { P: 0, C: 1, S: 2 };
  return [...items].sort((a, b) =>
    prefixOrder[numberPrefixFrom(a.number)] - prefixOrder[numberPrefixFrom(b.number)] ||
    numberCollator.compare(String(a.number ?? ""), String(b.number ?? "")));
}

function sortByName(items) {
  return [...items].sort((a, b) => numberCollator.compare(String(a.name ?? ""), String(b.name ?? "")));
}

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function updateWorkspace() {
  const settings = state.settings;
  const project = (settings.projectName || "").trim();
  const client = (settings.clientName || "").trim();
  const breadcrumb = project ? (client ? `${client} - ${project}` : project) : "New Project";
  const breadcrumbProject = document.querySelector("#breadcrumb-project");
  breadcrumbProject.textContent = breadcrumb;
  breadcrumbProject.title = breadcrumb;
  document.querySelector("#sidebar-version").textContent = `v${VERSION_HISTORY[VERSION_HISTORY.length - 1].version}`;
  document.querySelector("#cable-nav-count").textContent = state.cables.length;
  document.querySelector("#conduit-nav-count").textContent = state.conduits.length;
}

function setPage(page) {
  activePage = page;
  document.querySelectorAll("[data-page]").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === page && item.classList.contains("nav-item"));
  });
  const titles = { dashboard: "Overview", cables: "Cable Schedule", "voltage-drop": "Voltage Drop", conduits: "Conduit Schedule", bom: "Bill of Materials", settings: "Settings" };
  document.querySelector("#breadcrumb-page").textContent = titles[page];
  renderPage();
}

function renderPage() {
  updateWorkspace();
  document.body.classList.toggle("printing-bom", activePage === "bom");
  if (activePage === "settings") pageContent.innerHTML = renderSettings();
  else if (activePage === "cables") pageContent.innerHTML = renderCables();
  else if (activePage === "conduits") pageContent.innerHTML = renderConduits();
  else if (activePage === "voltage-drop") pageContent.innerHTML = renderVoltageDrop();
  else if (activePage === "bom") pageContent.innerHTML = renderBillOfMaterials();
  else pageContent.innerHTML = renderDashboard();
}

function projectName() {
  return state.settings.projectName || "Untitled Project";
}

function titleCaseHeading(value) {
  return String(value).toLocaleLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, separator, letter) =>
    `${separator}${letter.toLocaleUpperCase()}`,
  );
}

function locationName(id) {
  if (id === CABLE_TRAY_LOCATION_ID) return CABLE_TRAY_LOCATION_NAME;
  return state.settings.locations.find((location) => location.id === id)?.name || "Location removed";
}

function normalizedLocationName(name) {
  return String(name ?? "").trim().toLocaleLowerCase();
}

function locationNameKey(id) {
  if (id === CABLE_TRAY_LOCATION_ID) return normalizedLocationName(CABLE_TRAY_LOCATION_NAME);
  const location = state.settings.locations.find((item) => item.id === id);
  return location ? normalizedLocationName(location.name) : "";
}

function locationDisplayName(location) {
  if (!location) return "Location removed";
  const name = location.name || "Location removed";
  const equipmentId = String(location.description || "").trim();
  return equipmentId ? `${name} - ${equipmentId}` : name;
}

function cableLocationName(id) {
  return locationDisplayName(state.settings.locations.find((location) => location.id === id));
}

function cableType(id) {
  return state.settings.cableTypes.find((type) => type.id === id);
}

function racewayTypeLabel(value) {
  return RACEWAY_TYPES.find((type) => type.value === value)?.label || "";
}

function racewayInternalAreaFor(type, size) {
  const tradeSize = String(size ?? "").replace(/["]/g, "").trim();
  const areas = Object.prototype.hasOwnProperty.call(RACEWAY_INTERNAL_AREAS, type)
    ? RACEWAY_INTERNAL_AREAS[type]
    : null;
  return areas?.[tradeSize] ?? null;
}

function cableFillTypeLabel(value) {
  return CABLE_FILL_TYPES.find((type) => type.value === value)?.label || "";
}

function conduitFillAnalysis(conduit) {
  const cableIds = Array.isArray(conduit.cableIds) ? conduit.cableIds : [];
  if (!cableIds.length) return { status: "not-applicable", label: "No cables", reason: "No cables assigned" };
  if (!NEC_EDITIONS.includes(state.settings.necEdition)) {
    return { status: "needs-data", label: "Needs data", reason: "Select an NEC edition in Settings" };
  }
  if (!conduit.size) return { status: "needs-data", label: "Needs data", reason: "Select a conduit trade size" };
  if (!RACEWAY_TYPES.some((type) => type.value === conduit.racewayType)) {
    return { status: "needs-data", label: "Needs data", reason: "Select a raceway type" };
  }
  const racewayArea = Number(conduit.racewayArea);
  if (!Number.isFinite(racewayArea) || racewayArea <= 0) {
    return { status: "needs-data", label: "Needs data", reason: "Enter the 100% raceway internal area" };
  }
  if (new Set(cableIds).size !== cableIds.length) {
    return { status: "needs-data", label: "Needs data", reason: "Remove duplicate cable assignments" };
  }
  if (!CONDUIT_FILL_CONDITIONS.includes(conduit.fillCondition || "standard")) {
    return { status: "needs-data", label: "Needs data", reason: "Select a supported fill condition" };
  }

  const cables = cableIds.map((id) => state.cables.find((item) => item.id === id));
  if (cables.some((cable) => !cable)) {
    return { status: "needs-data", label: "Needs data", reason: "An assigned cable is unavailable" };
  }

  let cableArea = 0;
  for (const cable of cables) {
    const type = cableType(cable.cableTypeId);
    if (!type) return { status: "needs-data", label: "Needs data", reason: `Add a cable type for ${cable.number}` };
    if (!CABLE_FILL_TYPES.some((fillType) => fillType.value === type.fillClassification)) {
      return { status: "needs-data", label: "Needs data", reason: `Set the fill type for ${type.specNumber || cable.number}` };
    }
    const diameter = Number(type.diameter);
    if (!Number.isFinite(diameter) || diameter <= 0) {
      return { status: "needs-data", label: "Needs data", reason: `Enter a valid outside diameter for ${type.specNumber || cable.number}` };
    }
    cableArea += Math.PI * (diameter / 2) ** 2;
  }

  let allowedPercent;
  if (conduit.fillCondition === "nipple") {
    const nippleLength = Number(conduit.nippleLengthInches);
    if (!Number.isFinite(nippleLength) || nippleLength <= 0 || nippleLength > 24) {
      return { status: "needs-data", label: "Needs data", reason: "Enter a nipple length from 0.1 to 24 inches" };
    }
    allowedPercent = 60;
  } else {
    allowedPercent = cables.length === 1 ? 53 : cables.length === 2 ? 31 : 40;
  }

  const fillPercent = (cableArea / racewayArea) * 100;
  const status = fillPercent <= allowedPercent + Number.EPSILON * 100 ? "pass" : "fail";
  return {
    status,
    label: status === "pass" ? "Pass" : "Fail",
    reason: status === "pass" ? "Conduit fill is within the selected limit" : "Conduit fill exceeds the selected limit",
    fillPercent,
    allowedPercent,
  };
}

function renderDashboard() {
  const settings = state.settings;
  const cableLength = sumScheduledLengths(state.cables);
  const definedCableLengthCount = state.cables.filter((cable) => hasScheduledLength(cable.length)).length;
  const missingCableLengthCount = state.cables.length - definedCableLengthCount;
  const hasDefinedCableLength = definedCableLengthCount > 0;
  const recent = cableDisplayGroups([...state.cables].reverse()).slice(0, 5);
  return `
    <div class="page-heading">
      <div><h1>${escapeHtml(projectName())}</h1><p>Your cable and conduit schedules, all in one place.</p></div>
      <div class="heading-actions"><button class="button button-secondary" data-page="settings"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Project settings</button><button class="button button-primary" data-action="new-cable"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>New cable</button></div>
    </div>
    <div class="overview-grid">
      <article class="metric-card"><div class="metric-top">Total Cables <span class="metric-icon">⌁</span></div><div class="metric-value">${state.cables.length}</div><div class="metric-sub">Across the project schedule</div></article>
      <article class="metric-card"><div class="metric-top">Total Conduits <span class="metric-icon">▤</span></div><div class="metric-value">${state.conduits.length}</div><div class="metric-sub">With ${state.conduits.reduce((sum, conduit) => sum + conduit.cableIds.length, 0)} cable assignments</div></article>
      <article class="metric-card"><div class="metric-top">Total Cable Length <span class="metric-icon">↔</span></div><div class="metric-value">${hasDefinedCableLength ? `${formatNumber(cableLength)}<span style="font-size:13px;font-weight:500;letter-spacing:0"> ft</span>` : "TBD"}</div><div class="metric-sub">${hasDefinedCableLength && missingCableLengthCount ? `<span class="metric-warning">⚠ ${missingCableLengthCount} cable ${missingCableLengthCount === 1 ? "length" : "lengths"} not set</span>` : hasDefinedCableLength ? "Combined cable footage" : "No cable lengths defined"}</div></article>
    </div>
    <section class="content-card" style="margin-bottom:18px">
      <div class="card-heading"><div><h2>Project Details</h2><p>Project identifiers and schedule ownership</p></div><button class="text-button" data-page="settings">Edit details →</button></div>
      <div class="project-details">
        ${detail("Client Name", settings.clientName)}
        ${detail("Client Project #", settings.clientProjectNumber)}
        ${detail("Internal Project #", settings.internalProjectNumber)}
        ${detail("Revision", settings.revisionNumber)}
        ${detail("Designer", settings.editorName)}
        ${detail("Cable Types", settings.cableTypes.length)}
        ${detail("Locations", settings.locations.length)}
        ${detail("Schedule Status", scheduleStatus())}
      </div>
    </section>
    <section class="content-card">
      <div class="card-heading"><div><h2>Recently Added Cables</h2><p>Latest cable entries, with parallel sets grouped together</p></div><button class="text-button" data-page="cables">View cable schedule →</button></div>
      ${recent.length ? `<div class="table-wrap"><table><thead><tr><th>Cable number</th><th>Parallel Sets</th><th>Type</th><th>Length</th><th>Route</th><th>Purpose</th></tr></thead><tbody>${recent.map((cables) => {
        const cable = cables[0];
        const cableNumbers = cables.map((member) => member.number).join(", ");
        const type = cableType(cable.cableTypeId);
        return `<tr><td class="primary-cell">${escapeHtml(cableNumbers)}</td><td>${cables.length}</td><td>${escapeHtml(type?.specNumber || "—")}<span class="secondary-cell">${escapeHtml(type?.specType || "Cable type unavailable")}</span></td><td>${renderScheduledLength(cable.length)}</td><td>${escapeHtml(cableLocationName(cable.fromLocationId))} <span style="color:#a6aeba">→</span> ${escapeHtml(cableLocationName(cable.toLocationId))}</td><td>${escapeHtml(cable.purpose || "—")}</td></tr>`;
      }).join("")}</tbody></table></div>` : `<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2.5 7h3v6h-3zM14.5 7h3v6h-3zM5.5 10c2-3.5 7-3.5 9 0" /></svg></div><h3>Your schedule starts here</h3><p>Add cable types and equipment locations in Settings, then create your first cable schedule entry.</p><button class="button button-primary" data-action="new-cable"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Create a cable</button></div>`}
    </section>`;
}

function detail(label, value) {
  return `<div class="detail-item"><label>${escapeHtml(label)}</label><span>${escapeHtml(value === 0 ? "0" : value || "Not set")}</span></div>`;
}

function scheduleStatus() {
  return state.settings.scheduleStatus || "In progress";
}

function renderCables() {
  const rows = cableDisplayGroups();
  const cableCount = state.cables.length;
  return `
    <div class="page-heading">
      <div><h1>Cable Schedule</h1><p>Define cable runs, specifications, and endpoints for this project.</p></div>
      <div class="heading-actions"><button class="button button-primary" data-action="new-cable"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add Cable</button></div>
    </div>
    <div class="schedule-info"><strong>${cableCount} ${cableCount === 1 ? "cable" : "cables"}</strong><span class="divider"></span><span>${renderLengthSummary(state.cables)}</span><span class="divider"></span><span>${state.settings.cableTypes.length} cable types available</span></div>
    <section class="content-card">
      ${rows.length ? `<div class="card-heading"><div><h2>All Cables</h2><p>Click a row action to edit or remove a schedule entry</p></div><div class="toolbar"><label class="search-box"><span class="search-icon">⌕</span><input id="cable-search" type="search" placeholder="Search cables..." aria-label="Search cables" /></label></div></div><div class="table-wrap"><table class="wrapped-headers cable-schedule-table"><thead><tr><th>Cable<br>Number</th><th>Parallel<br>Sets</th><th>Mfr. /<br>Spec</th><th>Spec<br>Type</th><th>Cable<br>Length</th><th>Cable Routing <br>From</th><th>Cable Routing <br>To</th><th>Purpose</th><th>Conduit<br>Assignment</th><th>Actions</th></tr></thead><tbody id="cable-rows">${rows.map(renderCableRow).join("")}</tbody></table></div><div class="table-footer"><span>${rows.length} schedule rows for ${cableCount} cable entries</span><span>Length in feet</span></div>` : `<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2.5 7h3v6h-3zM14.5 7h3v6h-3zM5.5 10c2-3.5 7-3.5 9 0" /></svg></div><h3>No cables yet</h3><p>Create your first cable schedule entry. Cable types and locations are managed in Settings.</p><button class="button button-primary" data-action="new-cable"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add your first cable</button></div>`}
    </section>`;
}

function renderCableRow(cables) {
  const cable = cables[0];
  const type = cableType(cable.cableTypeId);
  const cableIds = new Set(cables.map((member) => member.id));
  const cableNumbers = cables.map((member) => member.number).join(", ");
  const conduits = state.conduits.filter((conduit) => conduit.cableIds.some((cableId) => cableIds.has(cableId)));
  const conduitNumbers = [...new Set(conduits.map((conduit) => conduit.number))];
  const conduitStatus = conduits.length
    ? `<span class="tag">Assigned</span><span class="secondary-cell">${escapeHtml(conduitNumbers.join(", "))}</span>`
    : `<span class="tag neutral">Unassigned</span>`;
  const isParallelGroup = Boolean(cable.parallelGroupId) && cables.length > 1;
  const actionLabels = isParallelGroup
    ? { edit: `Edit parallel set ${cableNumbers}`, duplicate: `Duplicate parallel set ${cableNumbers}`, delete: `Delete parallel set ${cableNumbers}` }
    : { edit: `Edit ${cable.number}`, duplicate: `Duplicate ${cable.number}`, delete: `Delete ${cable.number}` };
  return `<tr data-searchable="${escapeHtml([cableNumbers, type?.manufacturer, type?.specNumber, type?.specType, cableLocationName(cable.fromLocationId), cableLocationName(cable.toLocationId), cable.purpose].join(" ").toLowerCase())}">
    <td class="primary-cell">${escapeHtml(cableNumbers)}</td>
    <td>${cables.length}</td>
    <td>${escapeHtml(type?.manufacturer || "—")}<span class="secondary-cell">${escapeHtml(type?.specNumber || "Type unavailable")}</span></td>
    <td>${escapeHtml(type?.specType || "—")}</td><td>${renderScheduledLength(cable.length)}</td>
    <td>${escapeHtml(cableLocationName(cable.fromLocationId))}</td><td>${escapeHtml(cableLocationName(cable.toLocationId))}</td>
    <td>${escapeHtml(cable.purpose || "—")}</td><td>${conduitStatus}</td><td><div class="table-actions"><button class="icon-button" data-action="edit-cable" data-id="${cable.id}" aria-label="${escapeHtml(actionLabels.edit)}">✎</button><button class="icon-button" data-action="duplicate-cable" data-id="${cable.id}" aria-label="${escapeHtml(actionLabels.duplicate)}" title="${isParallelGroup ? "Duplicate parallel set" : "Duplicate cable"}">⧉</button><button class="icon-button delete" data-action="delete-cable" data-id="${cable.id}" aria-label="${escapeHtml(actionLabels.delete)}" title="${isParallelGroup ? "Delete parallel set" : "Delete cable"}">×</button></div></td>
  </tr>`;
}

function renderVoltageDrop() {
  const rows = cableDisplayGroups();
  return `
    <div class="page-heading">
      <div><h1>Voltage Drop</h1><p>Review cable electrical details and parallel sets.</p></div>
      <div class="heading-actions"><button class="button button-primary" data-action="new-cable"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add Cable</button></div>
    </div>
    <section class="content-card">
      ${rows.length ? `<div class="card-heading"><div><h2>All Cables</h2><p>Cable ampacity uses the selected material and rating; parallel sets show their combined ampacity. Ampacity Overhead is cable ampacity minus load. Multiconductor and pair voltage-drop values are estimates using single-conductor Table 9 impedance; missing inputs show Needs data.</p></div></div><div class="table-wrap"><table class="wrapped-headers voltage-drop-table"><thead><tr><th>Cable<br>Number</th><th>Spec Type</th><th>Cable Material</th><th>Voltage</th><th>Load<br>(Amps)</th><th>Cable<br>Ampacity</th><th>Ampacity<br>Overhead</th><th>Parallel<br>Sets</th><th>Cable<br>Rating</th><th>Phase</th><th>Voltage<br>Drop %</th><th>Actions</th></tr></thead><tbody>${rows.map(renderVoltageDropRow).join("")}</tbody></table></div>` : `<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 4v12h13M6 7v9m3.5-7v7m3.5-5v5m3.5-3v3" /></svg></div><h3>No cables yet</h3><p>Add cables to see their voltage-drop inputs here.</p><button class="button button-primary" data-action="new-cable"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add Cable</button></div>`}
    </section>`;
}

function cableDisplayGroups(cables = sortByNumber(state.cables)) {
  const seenGroups = new Set();
  const groups = [];
  cables.forEach((cable) => {
    if (!cable.parallelGroupId) {
      groups.push([cable]);
      return;
    }
    if (seenGroups.has(cable.parallelGroupId)) return;
    seenGroups.add(cable.parallelGroupId);
    groups.push(parallelGroupMembers(cable));
  });
  return groups;
}

function renderVoltageDropRow(cables) {
  const row = voltageDropRowData(cables);
  return `<tr>
    <td class="primary-cell">${escapeHtml(row.cableNumbers || "—")}</td>
    <td>${escapeHtml(row.type?.specType || "—")}</td>
    <td>${escapeHtml(row.material)}</td>
    <td>${escapeHtml(row.voltage)}</td>
    <td>${Number.isFinite(row.numericLoadAmps) ? escapeHtml(row.loadAmps) : `<span class="tag tbd">TBD</span>`}</td>
    <td>${escapeHtml(row.cableAmpacity)}</td>
    <td><span class="tag ${row.overheadClass}">${row.ampacityOverhead === null ? "—" : `${formatNumber(row.ampacityOverhead)} A`}</span></td>
    <td>${row.parallelSets}</td>
    <td>${escapeHtml(row.rating)}</td>
    <td>${escapeHtml(row.phase)}</td>
    <td><span class="tag ${row.voltageDrop.percent === null ? "tbd" : row.voltageDropClass}"${row.voltageDropTitle ? ` title="${escapeHtml(row.voltageDropTitle)}"` : ""}>${row.voltageDrop.percent === null ? "Needs data" : `${row.voltageDrop.percent.toFixed(2)}%${row.voltageDrop.approximate ? " est." : ""}`}</span></td>
    <td><div class="table-actions"><button class="icon-button" data-action="edit-cable" data-id="${row.cable.id}" aria-label="Edit ${escapeHtml(row.cableNumbers)}">✎</button></div></td>
  </tr>`;
}

function voltageDropRowData(cables) {
  const cable = cables[0];
  const type = cableType(cable.cableTypeId);
  const cableMaterial = type && Object.hasOwn(type, "cableMaterial") ? type.cableMaterial : cable.cableMaterial;
  const material = CABLE_MATERIALS.includes(cableMaterial) ? cableMaterial : "—";
  const voltage = cable.voltage || "—";
  const numericLoadAmps = cable.loadAmps === null || cable.loadAmps === undefined || cable.loadAmps === ""
    ? null
    : Number(cable.loadAmps);
  const loadAmps = numericLoadAmps === null || !Number.isFinite(numericLoadAmps)
    ? "—"
    : `${formatNumber(numericLoadAmps)} A`;
  const rating = CABLE_RATINGS.includes(String(cable.cableRating)) ? `${cable.cableRating}°C` : "—";
  const phase = CABLE_PHASES.includes(cable.phase) ? cable.phase : "—";
  const cableNumbers = cables.map((member) => member.number).join(", ");
  const singleCableAmpacity = lookupCableAmpacity(cableSpecSizeFromType(type), cableMaterial, cable.cableRating);
  const cableAmpacityValue = singleCableAmpacity === null ? null : singleCableAmpacity * cables.length;
  const cableAmpacity = cableAmpacityValue === null ? "—" : `${formatNumber(cableAmpacityValue)} A`;
  const ampacityOverhead = cableAmpacityValue === null || numericLoadAmps === null || !Number.isFinite(numericLoadAmps)
    ? null
    : cableAmpacityValue - numericLoadAmps;
  const overheadClass = ampacityOverhead === null
    ? "neutral"
    : ampacityOverhead < 0
      ? "fill-fail"
      : ampacityOverhead > 0 ? "fill-pass" : "neutral";
  const voltageDrop = calculateCableVoltageDrop(cables);
  const voltageDropClass = voltageDropStatusClass(
    voltageDrop.percent,
    Number(state.settings.maxVoltageDropPercent),
  );
  const voltageDropTitle = [
    voltageDrop.reason,
    voltageDrop.approximate ? "Estimate: single-conductor Table 9 impedance is used for this cable." : "",
  ].filter(Boolean).join(" ");
  const calculationNotes = [
    voltageDrop.percent === null ? `Needs data: ${voltageDrop.reason}` : "",
    voltageDrop.approximate ? "Estimate: single-conductor Table 9 impedance is used." : "",
  ].filter(Boolean).join(" ") || "Calculated";
  return {
    cable,
    type,
    material,
    voltage,
    numericLoadAmps,
    loadAmps,
    rating,
    phase,
    cableNumbers,
    parallelSets: cables.length,
    cableAmpacityValue,
    cableAmpacity,
    ampacityOverhead,
    overheadClass,
    voltageDrop,
    voltageDropClass,
    voltageDropTitle,
    calculationNotes,
  };
}

function voltageDropReportData() {
  return cableDisplayGroups().map(voltageDropRowData);
}

function voltageDropExportRows() {
  return [
    ["Cable Numbers", "Spec Type", "Cable Material", "Voltage (V)", "Load (A)", "Cable Ampacity (A)", "Ampacity Overhead (A)", "Parallel Sets", "Cable Rating (°C)", "Phase", "Voltage Drop (%)", "Calculation Status / Notes"],
    ...voltageDropReportData().map((row) => [
      row.cableNumbers,
      row.type?.specType || "",
      row.material === "—" ? "" : row.material,
      row.voltage === "—" ? "" : row.voltage,
      Number.isFinite(row.numericLoadAmps) ? row.numericLoadAmps : "",
      row.cableAmpacityValue ?? "",
      row.ampacityOverhead ?? "",
      row.parallelSets,
      row.rating === "—" ? "" : Number(row.cable.cableRating),
      row.phase === "—" ? "" : row.phase,
      row.voltageDrop.percent === null ? "" : Number(row.voltageDrop.percent.toFixed(4)),
      row.calculationNotes,
    ]),
  ];
}

function calculateCableVoltageDrop(cables) {
  const cable = cables[0];
  const type = cableType(cable?.cableTypeId);
  if (!cable || !type) return { percent: null, reason: "Select a cable type.", approximate: false };

  const conductorCount = Number(type.specCount);
  const isSingleConductor = (type.specConstruction === "conductor" && conductorCount === 1) ||
    /^\s*1\s*\/\s*C(?:\s|$)/i.test(String(type.specType || ""));
  const approximate = !isSingleConductor;
  const missing = (reason) => ({ percent: null, reason, approximate });

  if (!hasScheduledLength(cable.length) || Number(cable.length) < 0) return missing("Enter the one-way cable length in feet.");
  const length = Number(cable.length);
  const voltage = Number(cable.voltage);
  if (!Number.isFinite(voltage) || voltage <= 0) return missing("Enter a positive system voltage.");
  const loadAmps = Number(cable.loadAmps);
  if (cable.loadAmps === null || cable.loadAmps === undefined || cable.loadAmps === "" ||
      !Number.isFinite(loadAmps) || loadAmps < 0) return missing("Enter a nonnegative load in amps.");
  if (!CABLE_PHASES.includes(cable.phase)) return missing("Select Single or Three phase.");
  if (!CABLE_RATINGS.includes(String(cable.cableRating))) return missing("Select a cable rating temperature.");

  const cableMaterial = Object.hasOwn(type, "cableMaterial") ? type.cableMaterial : cable.cableMaterial;
  if (!CABLE_MATERIALS.includes(cableMaterial)) return missing("Set the cable material.");
  const size = cableSpecSizeFromType(type);
  if (!size) return missing("Set a supported conductor size.");

  const powerFactor = Number(state.settings.powerFactor);
  if (!Number.isFinite(powerFactor) || powerFactor <= 0 || powerFactor > 1) return missing("Set a valid power factor in Settings.");
  const racewayClasses = cableRacewayClasses(cables);
  if (!racewayClasses.classes.length) return missing(racewayClasses.reason);

  const temperature = Number(cable.cableRating);
  const resistanceTemperatureConstant = cableMaterial === "Copper" ? 234.5 : 228.1;
  const resistanceTemperatureFactor = (resistanceTemperatureConstant + temperature) /
    (resistanceTemperatureConstant + 75);
  const sinTheta = Math.sqrt(1 - powerFactor ** 2);
  const phaseMultiplier = cable.phase === "Single" ? 2 : Math.sqrt(3);
  const parallelSets = cables.length;
  const dropPercentByRaceway = racewayClasses.classes.map((racewayClass) => {
    const impedance = lookupCableACImpedance(size, cableMaterial, racewayClass);
    if (!impedance) return null;
    const resistance = impedance.resistance * resistanceTemperatureFactor;
    const effectiveImpedance = resistance * powerFactor + impedance.reactance * sinTheta;
    const dropVolts = phaseMultiplier * loadAmps * length * effectiveImpedance /
      (1000 * parallelSets);
    return dropVolts / voltage * 100;
  });
  if (dropPercentByRaceway.some((percent) => !Number.isFinite(percent))) {
    return missing("No impedance values are available for this size, material, and raceway.");
  }
  return { percent: Math.max(...dropPercentByRaceway), reason: "", approximate };
}

function cableRacewayClasses(cables) {
  const classes = new Set();
  for (const cable of cables) {
    const assignedConduits = state.conduits.filter((conduit) =>
      Array.isArray(conduit.cableIds) && conduit.cableIds.includes(cable.id));
    if (!assignedConduits.length) {
      return { classes: [], reason: "Assign each cable to a conduit with a supported raceway type." };
    }
    for (const conduit of assignedConduits) {
      const racewayClass = ["emt", "rmc"].includes(conduit.racewayType)
        ? "steel"
        : ["pvc-s40", "pvc-s80"].includes(conduit.racewayType)
          ? "pvc"
          : null;
      if (!racewayClass) {
        return { classes: [], reason: "Set each assigned conduit to EMT, RMC, or PVC." };
      }
      classes.add(racewayClass);
    }
  }
  return { classes: [...classes], reason: "" };
}

function voltageDropStatusClass(percent, maxPercent) {
  if (!Number.isFinite(percent) || !Number.isFinite(maxPercent) || maxPercent < 0) return "neutral";
  if (percent < maxPercent) return "fill-pass";
  if (percent > maxPercent) return "fill-fail";
  return "neutral";
}

function cableSpecSizeFromType(type) {
  if (CABLE_SPEC_SIZES.includes(type?.specSize)) return type.specSize;
  const match = String(type?.specType || "").match(/#?\s*(\d+(?:\/0)?)\s*(AWG|KCMIL)\b/i);
  return match ? `${match[1]} ${match[2].toUpperCase()}` : "";
}

function renderConduits() {
  const rows = sortByNumber(state.conduits);
  return `
    <div class="page-heading">
      <div><h1>Conduit Schedule</h1><p>Document conduit routes, cable assignments, and conduit fill.</p></div>
      <div class="heading-actions"><button class="button button-primary" data-action="new-conduit"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add Conduit</button></div>
    </div>
    <div class="schedule-info"><strong>${rows.length} ${rows.length === 1 ? "conduit" : "conduits"}</strong><span class="divider"></span><span>${renderLengthSummary(rows)}</span><span class="divider"></span><span>${state.settings.necEdition ? `${escapeHtml(state.settings.necEdition)} NEC fill basis` : "NEC edition not selected"}</span><span class="divider"></span><span>${state.cables.length} cables available to assign</span></div>
    <section class="content-card">
      ${rows.length ? `<div class="card-heading"><div><h2>All Conduits</h2><p>Review routing, cable assignments, and fill checks</p></div><div class="toolbar"><label class="search-box"><span class="search-icon">⌕</span><input id="conduit-search" type="search" placeholder="Search conduits..." aria-label="Search conduits" /></label></div></div><div class="table-wrap"><table class="wrapped-headers conduit-schedule-table"><thead><tr><th>Conduit<br>number</th><th>Raceway <br>/ Size</th><th>NEC fill</th><th>Conduit<br>Length</th><th>Conduit Routing <br>From</th><th>Conduit Routing <br>To</th><th>Assigned<br>cables</th><th>Actions</th></tr></thead><tbody>${rows.map((conduit) => {
        const analysis = conduitFillAnalysis(conduit);
        const sizeClass = analysis.status === "pass" ? "fill-pass" : analysis.status === "fail" ? "fill-fail" : "neutral";
        const sizeTitle = analysis.status === "pass" || analysis.status === "fail"
          ? `${analysis.label}: ${analysis.fillPercent.toFixed(1)}% used; ${analysis.allowedPercent}% allowed`
          : analysis.reason;
        const fillDetails = analysis.status === "pass" || analysis.status === "fail"
          ? `${analysis.fillPercent.toFixed(1)}% used · ${analysis.allowedPercent}% max`
          : analysis.reason;
        return `<tr data-searchable="${escapeHtml([conduit.number, conduit.size, racewayTypeLabel(conduit.racewayType), locationName(conduit.fromLocationId), locationName(conduit.toLocationId), ...conduit.cableIds.map((id) => state.cables.find((cable) => cable.id === id)?.number)].join(" ").toLowerCase())}">
        <td class="primary-cell">${escapeHtml(conduit.number)}</td><td><span class="tag ${sizeClass}" title="${escapeHtml(sizeTitle)}">${conduit.size ? escapeHtml(conduit.size) : "TBD"}</span><span class="secondary-cell">${escapeHtml(racewayTypeLabel(conduit.racewayType) || "Raceway type not set")}</span></td><td><span class="tag fill-status ${analysis.status === "pass" ? "fill-pass" : analysis.status === "fail" ? "fill-fail" : "neutral"}">${escapeHtml(analysis.label)}</span><span class="secondary-cell fill-details" title="${escapeHtml(fillDetails)}">${escapeHtml(fillDetails)}</span></td><td>${renderScheduledLength(conduit.length)}</td><td>${escapeHtml(locationName(conduit.fromLocationId))}</td><td>${escapeHtml(locationName(conduit.toLocationId))}</td>
        <td>${conduit.cableIds.length ? `<span class="tag blue">${conduit.cableIds.length} ${conduit.cableIds.length === 1 ? "cable" : "cables"}</span><span class="secondary-cell">${escapeHtml(conduit.cableIds.map((id) => state.cables.find((cable) => cable.id === id)?.number || "Removed").join(", "))}</span>` : `<span class="tag neutral">Unassigned</span>`}</td>
        <td><div class="table-actions"><button class="icon-button" data-action="edit-conduit" data-id="${conduit.id}" aria-label="Edit ${escapeHtml(conduit.number)}">✎</button><button class="icon-button" data-action="duplicate-conduit" data-id="${conduit.id}" aria-label="Duplicate ${escapeHtml(conduit.number)}" title="Duplicate conduit">⧉</button><button class="icon-button delete" data-action="delete-conduit" data-id="${conduit.id}" aria-label="Delete ${escapeHtml(conduit.number)}">×</button></div></td>
      </tr>`;
      }).join("")}</tbody></table></div><div class="table-footer"><span>Showing ${rows.length} of ${rows.length} conduits</span><span>Fill checks use the selected NEC edition's Table 1 limits. Raceway area is entered per conduit.</span></div>` : `<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 3v8a4.5 4.5 0 0 0 4.5 4.5h7M2.5 3h4M13 13.5h4" /></svg></div><h3>No conduits yet</h3><p>Create a conduit route, then assign any cables in your cable schedule.</p><button class="button button-primary" data-action="new-conduit"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add your first conduit</button></div>`}
    </section>`;
}

function billOfMaterialsGroups() {
  const cableGroups = new Map();
  state.cables.forEach((cable) => {
    const key = cable.cableTypeId || "missing-cable-type";
    if (!cableGroups.has(key)) cableGroups.set(key, { type: cableType(cable.cableTypeId), cables: [] });
    cableGroups.get(key).cables.push(cable);
  });
  const usedCableTypes = [...cableGroups.values()].sort((a, b) => numberCollator.compare(
    `${a.type?.manufacturer || ""} ${a.type?.specNumber || "Unavailable"}`,
    `${b.type?.manufacturer || ""} ${b.type?.specNumber || "Unavailable"}`,
  ));

  const conduitGroups = new Map();
  state.conduits.forEach((conduit) => {
    const racewayType = racewayTypeLabel(conduit.racewayType) || "Not set";
    const size = String(conduit.size || "").trim() || "TBD";
    const key = JSON.stringify([racewayType.toLocaleLowerCase(), size.toLocaleLowerCase()]);
    if (!conduitGroups.has(key)) conduitGroups.set(key, { racewayType, size, conduits: [] });
    conduitGroups.get(key).conduits.push(conduit);
  });
  const usedConduitGroups = [...conduitGroups.values()].sort((a, b) =>
    numberCollator.compare(a.size, b.size) || numberCollator.compare(a.racewayType, b.racewayType),
  );
  return { usedCableTypes, usedConduitGroups };
}

function renderBillOfMaterials() {
  const { usedCableTypes, usedConduitGroups } = billOfMaterialsGroups();
  const settings = state.settings;

  return `
    <div class="bom-page">
      <div class="page-heading">
        <div><h1>Bill of Materials</h1><p>Material totals summarized from the cable and conduit schedules for purchasing and field coordination.</p></div>
      </div>
      <section class="content-card bom-project-card">
        <div class="bom-project-title"><div><h2>${escapeHtml(titleCaseHeading(projectName()))}</h2><p>Bill of Materials</p></div><span class="bom-generated">Generated ${escapeHtml(new Date().toLocaleDateString())}</span></div>
        <div class="bom-project-meta">
          ${detail("Client", settings.clientName)}
          ${detail("Client Project #", settings.clientProjectNumber)}
          ${detail("Internal Project #", settings.internalProjectNumber)}
          ${detail("Revision", settings.revisionNumber)}
          ${detail("Designer", settings.editorName)}
        </div>
      </section>
      <section class="content-card bom-section">
        <div class="card-heading"><div><h2>Cable Materials</h2><p>Cable types used in this project</p></div></div>
        ${usedCableTypes.length ? `<div class="table-wrap"><table class="wrapped-headers"><thead><tr><th>Spec Type</th><th>Mfr.</th><th>Spec Number</th><th>Total Length (ft)</th></tr></thead><tbody>${usedCableTypes.map(({ type, cables }) => {
          return `<tr><td>${escapeHtml(type?.specType || "—")}</td><td class="primary-cell">${escapeHtml(type?.manufacturer || "Cable type unavailable")}</td><td>${escapeHtml(type?.specNumber || "Specification unavailable")}</td><td>${renderLengthTotal(cables)}</td></tr>`;
        }).join("")}</tbody></table></div>` : `<div class="bom-empty">No cable types are currently used in the cable schedule.</div>`}
      </section>
      <section class="content-card bom-section">
        <div class="card-heading"><div><h2>Conduit Materials</h2><p>Conduit types and sizes used in this project</p></div></div>
        ${usedConduitGroups.length ? `<div class="table-wrap"><table class="wrapped-headers"><thead><tr><th>Conduit size</th><th>Conduit type</th><th>Total Length (ft)</th></tr></thead><tbody>${usedConduitGroups.map(({ racewayType, size, conduits }) => {
          return `<tr><td class="primary-cell">${size === "TBD" ? `<span class="tag tbd">TBD</span>` : escapeHtml(size)}</td><td>${escapeHtml(racewayType)}</td><td>${renderLengthTotal(conduits)}</td></tr>`;
        }).join("")}</tbody></table></div>` : `<div class="bom-empty">No conduits are currently used in the conduit schedule.</div>`}
      </section>
      <p class="bom-note">Material lengths are based on scheduled totals. Confirm field requirements and installation allowances before ordering.</p>
    </div>`;
}

function renderSettings() {
  const settings = state.settings;
  const equipmentLocations = sortByName(settings.locations.filter((location) => !isCableTrayLocation(location)));
  return `
    <div class="page-heading"><div><h1>Settings</h1><p>Manage project information, cable specifications, and equipment locations.</p></div></div>
    <div class="settings-layout">
      <section class="content-card settings-section">
        <div class="card-heading"><div><h2>Project Information</h2><p>These details are included with your schedule exports</p></div></div>
        <form class="settings-form" id="project-settings-form">
          <div class="form-grid">
            ${settingsField("projectName", "Project Name", settings.projectName, "e.g. North Substation Upgrades")}
            ${settingsField("clientName", "Client Name", settings.clientName, "e.g. Acme Co.")}
            ${settingsField("clientProjectNumber", "Client Project #", settings.clientProjectNumber, "e.g. AC-2026-11")}
            ${settingsField("internalProjectNumber", "Internal Project #", settings.internalProjectNumber, "e.g. ENG-860513")}
            ${settingsField("revisionNumber", "Revision", settings.revisionNumber, "e.g. 0")}
            ${settingsField("editorName", "Designer", settings.editorName, "e.g. E. Conner")}
            ${scheduleStatusField(settings.scheduleStatus)}
          </div>
          <div class="form-divider"></div>
          <div class="card-heading settings-inline-heading"><div><h3>Voltage Drop</h3><p>Configure voltage-drop analysis settings</p></div></div>
          <div class="form-grid">
            <div class="field">
              <label for="setting-powerFactor">Power Factor</label>
              <input id="setting-powerFactor" name="powerFactor" type="number" min="0.01" max="1" step="0.01" value="${escapeHtml(settings.powerFactor ?? 0.9)}" required />
            </div>
            <div class="field">
              <label for="setting-maxVoltageDropPercent">Max Voltage Drop (%)</label>
              <input id="setting-maxVoltageDropPercent" name="maxVoltageDropPercent" type="number" min="0" step="0.01" value="${escapeHtml(settings.maxVoltageDropPercent ?? 3)}" required />
            </div>
          </div>
          <p class="section-description">Power Factor will be used in the voltage-drop calculation. The maximum voltage drop controls the table indicator.</p>
          <div class="form-divider"></div>
          <div class="card-heading settings-inline-heading"><div><h3>Conduit Fill Analysis</h3><p>Set the code basis used for conduit fill checks</p></div></div>
          <div class="form-grid">
            <div class="field">
              <label for="setting-necEdition">NEC edition</label>
              <select id="setting-necEdition" name="necEdition">
                <option value="">Select adopted edition…</option>
                ${NEC_EDITIONS.map((edition) => `<option value="${edition}" ${settings.necEdition === edition ? "selected" : ""}>${edition} NEC</option>`).join("")}
              </select>
            </div>
            ${settingsField("necJurisdiction", "Jurisdiction / Amendments", settings.necJurisdiction, "e.g. City or project code notes")}
          </div>
          <p class="section-description">Select the edition adopted by the authority having jurisdiction. Supplied area lookups cover EMT, RMC, and PVC Schedule 40/80 sizes; other combinations need manual dimensions. Local amendments and requirements beyond conduit fill are not evaluated automatically.</p>
          <div class="settings-submit"><button class="button button-primary" type="submit">Save project details</button></div>
        </form>
      </section>
      <section class="content-card settings-section">
        <div class="card-heading"><div><h2>Appearance</h2><p>Choose how Wireframe looks on this device</p></div></div>
        <div class="settings-form">
          <div class="field appearance-field">
            <label for="theme-preference">Theme</label>
            <select id="theme-preference" aria-describedby="theme-preference-description">
              <option value="system" ${themePreference === "system" ? "selected" : ""}>Use system setting</option>
              <option value="light" ${themePreference === "light" ? "selected" : ""}>Light</option>
              <option value="dark" ${themePreference === "dark" ? "selected" : ""}>Dark</option>
            </select>
            <small id="theme-preference-description" class="section-description">System setting follows your device's appearance preference.</small>
          </div>
        </div>
      </section>
      <section class="content-card settings-section">
        <div class="card-heading section-title-row"><div><h2>Cable Types <span class="tag neutral">${settings.cableTypes.length}</span></h2><p>Reusable manufacturer and specification details for cable entries</p></div><button class="button button-secondary" data-action="new-cable-type"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add Cable Type</button></div>
        <div class="settings-list">${settings.cableTypes.length ? settings.cableTypes.map((type) => `<div class="settings-list-row"><div class="settings-item-main"><strong>${escapeHtml(type.manufacturer)} <span style="color:#a1a9b4;font-weight:400">·</span> ${escapeHtml(type.specNumber)}</strong><small>${escapeHtml(type.specType)} · ${formatNumber(type.diameter)} in OD · ${formatNumber(type.netWeight)} lbs/1000' · Material: ${escapeHtml(type.cableMaterial || "not set")} · Fill: ${escapeHtml(cableFillTypeLabel(type.fillClassification) || "not set")}${safeHttpUrl(type.url) ? ` · <a href="${escapeHtml(safeHttpUrl(type.url))}" target="_blank" rel="noopener noreferrer" style="color:#4268e8">Details ↗</a>` : ""}</small></div><div class="table-actions"><button class="icon-button" data-action="edit-cable-type" data-id="${type.id}" aria-label="Edit ${escapeHtml(type.specNumber)}">✎</button><button class="icon-button delete" data-action="delete-cable-type" data-id="${type.id}" aria-label="Delete ${escapeHtml(type.specNumber)}">×</button></div></div>`).join("") : `<div class="settings-empty">No cable types yet. Add a specification to use it in the cable schedule.</div>`}</div>
      </section>
      <section class="content-card settings-section">
        <div class="card-heading section-title-row"><div><h2>Equipment <span class="tag neutral">${equipmentLocations.length}</span></h2><p>Equipment appears in the From and To dropdowns on schedules</p></div><button class="button button-secondary" data-action="new-location"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add Equipment</button></div>
        <div class="settings-list">${equipmentLocations.length ? equipmentLocations.map((location) => `<div class="settings-list-row"><div class="settings-item-main"><strong>${escapeHtml(locationDisplayName(location))}</strong></div><div class="table-actions"><button class="icon-button" data-action="edit-location" data-id="${location.id}" aria-label="Edit ${escapeHtml(location.name)}">✎</button><button class="icon-button delete" data-action="delete-location" data-id="${location.id}" aria-label="Delete ${escapeHtml(location.name)}">×</button></div></div>`).join("") : `<div class="settings-empty">No equipment yet. Add equipment to use it on schedules.</div>`}</div>
      </section>
      <section class="content-card settings-section">
        <div class="card-heading"><div><h2>Version History</h2><p>Updates and changes made to Wireframe</p></div></div>
        <div id="version-history-content">${renderVersionHistory()}</div>
      </section>
    </div>`;
}

function renderVersionHistory() {
  const newestFirst = [...VERSION_HISTORY].reverse();
  const visibleVersions = showAllVersionHistory ? newestFirst : newestFirst.slice(0, 4);
  return `
    <ol class="version-history" id="version-history-list">${visibleVersions.map(({ version, changes }) => `
      <li class="version-entry">
        <span class="tag blue">v${escapeHtml(version)}</span>
        <ul class="version-changes">${changes.map((change) => `<li>${escapeHtml(change)}</li>`).join("")}</ul>
      </li>`).join("")}
    </ol>
    ${VERSION_HISTORY.length > 4 ? `<button type="button" class="text-button version-history-toggle" data-action="toggle-version-history" aria-controls="version-history-list" aria-expanded="${showAllVersionHistory}">${showAllVersionHistory ? "Show Less" : "Show More"}</button>` : ""}`;
}

function settingsField(name, label, value, placeholder) {
  return `<div class="field"><label for="setting-${name}">${escapeHtml(label)}</label><input id="setting-${name}" name="${name}" value="${escapeHtml(value || "")}" placeholder="${escapeHtml(placeholder)}" /></div>`;
}

function scheduleStatusField(value) {
  const isCustom = Boolean(value) && !SCHEDULE_STATUSES.includes(value);
  const selectedStatus = isCustom ? "custom" : value || "In progress";
  return `<div class="field"><label for="setting-scheduleStatus">Schedule Status</label><select id="setting-scheduleStatus" name="scheduleStatus">${SCHEDULE_STATUSES.map((status) => `<option value="${escapeHtml(status)}" ${selectedStatus === status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}<option value="custom" ${selectedStatus === "custom" ? "selected" : ""}>Custom status…</option></select></div>
    <div class="field" id="custom-schedule-status-field" ${isCustom ? "" : "hidden"}><label for="setting-custom-schedule-status">Custom Status</label><input id="setting-custom-schedule-status" name="customScheduleStatus" value="${escapeHtml(isCustom ? value : "")}" ${isCustom ? "required" : "disabled"} /></div>`;
}

function options(items, selectedId) {
  return `<option value="">Select…</option>${items.map((item) => `<option value="${item.id}" ${item.id === selectedId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}`;
}

function cableSpecTypeValue({ suffix, count, construction, size, includeGroundShield }) {
  const conductorCount = Number(count);
  if (!Number.isSafeInteger(conductorCount) || conductorCount < 1 ||
      !CABLE_SPEC_CONSTRUCTIONS.includes(construction) || !CABLE_SPEC_SIZES.includes(size)) return "";
  const [sizeValue, sizeUnit] = size.split(" ");
  const constructionLabel = construction === "pair" ? `${conductorCount}PR` : `${conductorCount}/C`;
  const sizeLabel = sizeUnit === "AWG" ? `#${sizeValue} AWG` : `${sizeValue} KCMIL`;
  const qualifier = includeGroundShield
    ? (construction === "pair" ? "SH" : "W/GND")
    : "";
  return [constructionLabel, sizeLabel, qualifier, String(suffix || "").trim()].filter(Boolean).join(" ");
}

function cableSpecSizeField(selectedSize) {
  const sizes = (unit) => CABLE_SPEC_SIZES
    .filter((size) => size.endsWith(unit))
    .map((size) => `<option value="${size}" ${selectedSize === size ? "selected" : ""}>${escapeHtml(size)}</option>`)
    .join("");
  return `<div class="field"><label for="modal-specSize">Cable size</label><select id="modal-specSize" name="specSize"><option value="">Select size…</option><optgroup label="AWG">${sizes("AWG")}</optgroup><optgroup label="KCMIL">${sizes("KCMIL")}</optgroup></select></div>`;
}

function isCableTypeForm(form) {
  return form?.dataset.form === "new-cable-type" ||
    form?.dataset.form === "new-cable-type-inline" ||
    form?.dataset.form.startsWith("edit-cable-type:");
}

function updateCableSpecLabels(form) {
  if (!isCableTypeForm(form)) return;
  const construction = form.elements.namedItem("specConstruction").value;
  const groundShieldLabel = form.querySelector("#spec-ground-shield-label");
  groundShieldLabel.textContent = construction === "pair" ? "Include shield" : "Include ground";
}

function selectField(name, label, choices, selectedValue = "", fieldOptions = {}) {
  const full = fieldOptions.full ? " full" : "";
  const optional = fieldOptions.optional ? ` <span class="optional">(optional)</span>` : "";
  return `<div class="field${full}"><label for="modal-${name}">${escapeHtml(label)}${optional}</label><select id="modal-${name}" name="${name}"><option value="">Select…</option>${choices.map(({ value, label: choiceLabel }) => `<option value="${escapeHtml(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(choiceLabel)}</option>`).join("")}</select></div>`;
}

function openModal(title, subtitle, formKind, fields, submitLabel = "Save") {
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
    <div class="modal-header"><div><h2 id="modal-title">${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div></div>
    <form class="modal-form" data-form="${formKind}">${fields}<div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">${escapeHtml(submitLabel)}</button></div></form>
  </section></div>`;
  modalRoot.querySelector(".modal").focus();
}

function closeModal() {
  modalRoot.innerHTML = "";
}

function textField(name, label, value = "", placeholder = "", options = {}) {
  const full = options.full ? " full" : "";
  const required = options.required === false ? "" : " required";
  const type = options.type || "text";
  const step = options.step ? ` step="${options.step}"` : "";
  const min = options.min ? ` min="${options.min}"` : "";
  const max = options.max ? ` max="${options.max}"` : "";
  return `<div class="field${full}"><label for="modal-${name}">${escapeHtml(label)}${options.optional ? ` <span class="optional">(optional)</span>` : ""}</label><input id="modal-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}"${required}${step}${min}${max} /></div>`;
}

function numberPrefixFrom(number) {
  return String(number || "").trim().match(/^([PCS])\d+/i)?.[1].toUpperCase() || "P";
}

function cablePrefixesForConduit(number) {
  const conduitPrefix = numberPrefixFrom(number);
  if (conduitPrefix === "P") return ["P", "C", "S"];
  if (conduitPrefix === "C") return ["C", "S"];
  return [];
}

function nextScheduleNumber(items, prefix) {
  const matchingNumbers = items
    .map((item) => String(item.number || "").trim().match(/^([PCS])(\d+)/i))
    .filter(Boolean);
  const maxSuffix = matchingNumbers.reduce((maximum, match) => Math.max(maximum, Number(match[2])), 0);
  const suffixWidth = matchingNumbers
    .filter((match) => Number(match[2]) === maxSuffix)
    .reduce((width, match) => Math.max(width, match[2].length), 4);
  const usedSuffixes = new Set(matchingNumbers.map((match) => Number(match[2])));
  let suffix = maxSuffix + 1;
  let candidate = `${prefix}${String(suffix).padStart(suffixWidth, "0")}`;
  while (usedSuffixes.has(suffix)) {
    suffix += 1;
    candidate = `${prefix}${String(suffix).padStart(suffixWidth, "0")}`;
  }
  return candidate;
}

function nextScheduleNumbers(items, prefix, count) {
  const availableItems = [...items];
  const numbers = [];
  for (let index = 0; index < count; index += 1) {
    const number = nextScheduleNumber(availableItems, prefix);
    numbers.push(number);
    availableItems.push({ number });
  }
  return numbers;
}

function parallelGroupMembers(cable) {
  if (!cable?.parallelGroupId) return cable ? [cable] : [];
  return state.cables
    .filter((item) => item.parallelGroupId === cable.parallelGroupId)
    .sort((a, b) => Number(a.parallelSetIndex || 0) - Number(b.parallelSetIndex || 0));
}

function cablePurposeDisplay(cable) {
  const purpose = String(cable?.purpose || "").trim();
  if (!cable?.parallelGroupId) return purpose;
  const setCount = parallelGroupMembers(cable).length;
  if (setCount < 2) return purpose;
  const setLabel = `Set ${cable.parallelSetIndex || 1} of ${setCount}`;
  return purpose ? `${purpose} - ${setLabel}` : setLabel;
}

function scheduleNumberField(label, items, recordType, prefix = "P", value = "", full = false, autoNumberNote = false) {
  const selectedPrefix = ["P", "C", "S"].includes(prefix) ? prefix : "P";
  const number = value || nextScheduleNumber(items, selectedPrefix);
  const note = autoNumberNote ? `<small class="number-auto-note" id="parallel-number-note" hidden></small>` : "";
  return `<div class="field${full ? " full" : ""}"><label for="modal-number">${escapeHtml(label)}</label><div class="number-prefix-entry"><select id="modal-number-prefix" name="numberPrefix" data-number-records="${recordType}" aria-label="${escapeHtml(label)} prefix"><option value="P" ${selectedPrefix === "P" ? "selected" : ""}>P · Power</option><option value="C" ${selectedPrefix === "C" ? "selected" : ""}>C · Control</option><option value="S" ${selectedPrefix === "S" ? "selected" : ""}>S · Spare</option></select><input id="modal-number" name="number" value="${escapeHtml(number)}" placeholder="e.g. ${selectedPrefix}101" required /></div>${note}</div>`;
}

function parallelNumberInputMarkup(index, value, customized = false) {
  return `<div class="field"><label for="modal-parallel-number-${index + 1}">Set ${index + 1} cable number</label><input id="modal-parallel-number-${index + 1}" name="parallelNumbers" value="${escapeHtml(value)}" required data-customized="${customized}" /></div>`;
}

function routeLocationField(name, label, selectedId, includeEquipmentId = false, includeCableTray = false, combineDuplicateNames = false) {
  let equipmentLocations = state.settings.locations.filter((location) => !isCableTrayLocation(location));
  if (combineDuplicateNames) {
    const seenNames = new Set();
    equipmentLocations = sortByName(equipmentLocations).filter((location) => {
      const nameKey = normalizedLocationName(location.name);
      if (seenNames.has(nameKey)) return false;
      seenNames.add(nameKey);
      return true;
    });
  }
  if (includeCableTray) equipmentLocations.push({ id: CABLE_TRAY_LOCATION_ID, name: CABLE_TRAY_LOCATION_NAME });
  const locations = sortByName(equipmentLocations).map((location) => ({
    id: location.id,
    name: includeEquipmentId ? locationDisplayName(location) : location.name,
  }));
  const selectedLocation = state.settings.locations.find((location) => location.id === selectedId);
  const selectedName = selectedLocation ? normalizedLocationName(selectedLocation.name) : "";
  const resolvedSelectedId = combineDuplicateNames && selectedName
    ? equipmentLocations.find((location) => normalizedLocationName(location.name) === selectedName)?.id || selectedId
    : selectedId;
  return `<div class="field"><label for="modal-${name}">${escapeHtml(label)}</label><div class="inline-select-action"><select id="modal-${name}" name="${name}" required>${options(locations, resolvedSelectedId)}</select><button class="button button-secondary" type="button" data-action="add-route-location" data-field="${name}">+ New location</button></div></div>`;
}

function conduitSizeField(selectedSize) {
  const sizes = [...CONDUIT_SIZES];
  if (selectedSize && !sizes.includes(selectedSize)) sizes.push(selectedSize);
  return `<div class="field"><label for="modal-size">Conduit size <span class="optional">(optional)</span></label><select id="modal-size" name="size"><option value="">Select size…</option>${sizes.map((size) => `<option value="${escapeHtml(size)}" ${size === selectedSize ? "selected" : ""}>${escapeHtml(size)}</option>`).join("")}</select></div>`;
}

function openCableForm(id, draft = {}, modalOptions = {}) {
  const cable = state.cables.find((item) => item.id === id);
  const groupMembers = cable?.parallelGroupId ? parallelGroupMembers(cable) : [];
  const isParallelGroup = groupMembers.length > 1;
  const needsLocations = !state.settings.locations.length;
  const setupNote = needsLocations ? `<p class="form-note">Add at least one location using New location below or in <a href="#" data-page="settings">Settings</a>.</p>` : "";
  const cableTypeId = draft.cableTypeId || cable?.cableTypeId;
  const numberField = isParallelGroup
    ? ""
    : cable
      ? textField("number", "Cable number", draft.number ?? cable.number, "e.g. C-101")
      : scheduleNumberField("Cable number", state.cables, "cables", draft.numberPrefix || numberPrefixFrom(draft.number), draft.number);
  const voltage = draft.voltage ?? cable?.voltage ?? "";
  const loadAmps = draft.loadAmps ?? cable?.loadAmps ?? "";
  const parallelSets = draft.parallelSets ?? (isParallelGroup ? groupMembers.length : "1");
  const initialParallelNumbers = Array.isArray(draft.parallelNumbers)
    ? draft.parallelNumbers
    : isParallelGroup
      ? groupMembers.map((member) => member.number)
      : [];
  const customizedParallelNumbers = Array.isArray(draft.parallelNumbersCustomized) ? draft.parallelNumbersCustomized : [];
  const parallelNumbersField = `<div class="field full" id="parallel-number-fields" hidden><label>Cable numbers</label><div class="parallel-number-list">${initialParallelNumbers.map((number, index) => parallelNumberInputMarkup(index, number, customizedParallelNumbers[index] === true)).join("")}</div><small class="number-auto-note" id="parallel-number-note"></small></div>`;
  const cableRating = draft.cableRating ?? cable?.cableRating ?? "";
  const phase = draft.phase ?? cable?.phase ?? "";
  const fields = `${setupNote}<div class="form-grid">
    ${numberField}${parallelNumbersField}
    ${textField("length", "Cable length (ft)", draft.length ?? cable?.length ?? "", "e.g. 250", { type: "number", min: "0", step: "0.01", required: false, optional: true })}
    <div class="field full"><label for="modal-cableTypeId">Cable type</label><div class="inline-select-action"><select id="modal-cableTypeId" name="cableTypeId" required>${options(state.settings.cableTypes.map((type) => ({ id: type.id, name: [type.specType, type.manufacturer, type.specNumber].filter(Boolean).join(" · ") })), cableTypeId)}</select><button class="button button-secondary" type="button" data-action="add-cable-type-inline">+ New type</button></div></div>
    ${routeLocationField("fromLocationId", "From location", draft.fromLocationId || cable?.fromLocationId, true)}
    ${routeLocationField("toLocationId", "To location", draft.toLocationId || cable?.toLocationId, true)}
    ${textField("purpose", "Cable purpose", draft.purpose ?? cable?.purpose ?? "", "e.g. Feeder, control, instrumentation", { required: false, full: true })}
    ${textField("voltage", "Voltage", voltage, "e.g. 480", { required: false, optional: true })}
    ${textField("loadAmps", "Load (Amps)", loadAmps, "e.g. 12.5", { type: "number", min: "0", step: "0.01", required: false, optional: true })}
    ${textField("parallelSets", "Parallel Sets", parallelSets, "1", { type: "number", min: "1", max: String(MAX_PARALLEL_SETS), step: "1" })}
    ${selectField("cableRating", "Cable Rating", CABLE_RATINGS.map((value) => ({ value, label: `${value}°C` })), cableRating, { optional: true })}
    ${selectField("phase", "Phase", CABLE_PHASES.map((value) => ({ value, label: value })), phase, { optional: true })}
  </div>`;
  const title = modalOptions.title || (isParallelGroup ? "Edit Parallel Cable Set" : cable ? "Edit Cable" : "Add Cable");
  const subtitle = modalOptions.subtitle || (isParallelGroup
    ? `Changes apply to all ${groupMembers.length} cables in this parallel set. Edit each cable number or change Parallel Sets.`
    : "Enter cable schedule and electrical details. Parallel-set numbers are suggested automatically and can be edited.");
  openModal(title, subtitle, cable ? `edit-cable:${id}` : "new-cable", fields, modalOptions.submitLabel || (cable ? "Save changes" : "Add Cable"));
  const form = modalRoot.querySelector(".modal-form");
  form.dataset.parallelGroup = String(isParallelGroup);
  if (needsLocations) modalRoot.querySelector('[type="submit"]').disabled = true;
  updateParallelNumberPreview(form);
}

function updateParallelNumberPreview(form, prefixChanged = false) {
  if (!form || !(form.dataset.form === "new-cable" || form.dataset.form.startsWith("edit-cable:"))) return;
  const countInput = form.elements.namedItem("parallelSets");
  const numberInput = form.elements.namedItem("number");
  const prefixSelect = form.elements.namedItem("numberPrefix");
  const numberFields = form.querySelector("#parallel-number-fields");
  const note = numberFields?.querySelector("#parallel-number-note");
  if (!countInput || !numberFields || !note) return;
  const count = Number(countInput.value);
  const wasShowingParallelNumbers = numberFields.dataset.active === "true";
  const currentInputs = [...numberFields.querySelectorAll('input[name="parallelNumbers"]')];
  const isEditingParallelGroup = form.dataset.parallelGroup === "true";
  const showParallelNumbers = isEditingParallelGroup || count > 1;
  numberFields.hidden = !showParallelNumbers;
  numberFields.querySelectorAll('input[name="parallelNumbers"]').forEach((input) => {
    input.disabled = !showParallelNumbers;
  });
  if (numberInput) {
    numberInput.disabled = showParallelNumbers;
    numberInput.hidden = showParallelNumbers;
    if (prefixSelect) {
      const label = numberInput.closest(".field").querySelector("label");
      label.textContent = showParallelNumbers ? "Automatic number prefix" : "Cable number";
      label.htmlFor = showParallelNumbers ? "modal-number-prefix" : "modal-number";
    }
  }
  if (!showParallelNumbers) {
    if (wasShowingParallelNumbers && numberInput && currentInputs[0]) {
      numberInput.value = currentInputs[0].value;
      numberInput.dataset.customized = currentInputs[0].dataset.customized;
    }
    numberFields.dataset.active = "false";
    note.textContent = "";
    return;
  }
  if (!Number.isSafeInteger(count) || count < 1 || count > MAX_PARALLEL_SETS) {
    numberFields.dataset.active = "true";
    note.textContent = count > MAX_PARALLEL_SETS
      ? `The maximum is ${MAX_PARALLEL_SETS} parallel sets.`
      : "Enter a whole number of parallel sets.";
    return;
  }
  const currentValues = currentInputs.map((input) => ({
    value: input.value,
    customized: input.dataset.customized === "true",
  }));
  if ((!wasShowingParallelNumbers || !currentValues.length) && numberInput) {
    currentValues[0] = { value: numberInput.value, customized: numberInput.dataset.customized === "true" };
  }
  const prefix = prefixSelect?.value || numberPrefixFrom(currentValues[0]?.value);
  const availableItems = [...state.cables];
  const numberMarkup = [];
  for (let index = 0; index < count; index += 1) {
    const current = currentValues[index];
    const keepCustom = current?.customized;
    const keepExisting = current && !prefixChanged;
    const value = keepCustom || keepExisting
      ? current.value
      : nextScheduleNumber(availableItems, prefix);
    availableItems.push({ number: value });
    numberMarkup.push(parallelNumberInputMarkup(index, value, keepCustom));
  }
  numberFields.querySelector(".parallel-number-list").innerHTML = numberMarkup.join("");
  numberFields.dataset.active = "true";
  note.textContent = "Cable numbers are suggested automatically. Edit any number to use a custom value.";
}

function openConduitForm(id, draft = {}, modalOptions = {}) {
  const conduit = state.conduits.find((item) => item.id === id);
  const needsLocations = !state.settings.locations.length;
  const setupNote = needsLocations ? `<p class="form-note">Add at least one location using New location below or in <a href="#" data-page="settings">Settings</a>.</p>` : "";
  const assignedCableIds = draft.cableIds || conduit?.cableIds || [];
  const numberField = conduit
    ? textField("number", "Conduit number", draft.number ?? conduit.number, "e.g. CON-101", { full: true })
    : scheduleNumberField("Conduit number", state.conduits, "conduits", draft.numberPrefix || numberPrefixFrom(draft.number), draft.number, true);
  const selectedFillCondition = draft.fillCondition || conduit?.fillCondition || "standard";
  const cableOptions = state.cables.length ? `<div class="field full"><label>Assign cables <span class="optional">(optional)</span></label><p class="form-note assignment-warning" hidden>Remove incompatible cable assignments before saving this conduit.</p><div class="checkbox-list" role="group" aria-label="Assign cables">
    <div class="checkbox-list-header" aria-hidden="true"><span>Select</span><span>Cable number</span><span>From → To</span><span>Cable type / spec</span></div>
    ${sortCablesByPrefix(state.cables).map((cable) => {
      const type = cableType(cable.cableTypeId);
      const typeDetails = [type?.manufacturer, type?.specNumber].filter(Boolean).join(" · ");
      return `<label class="checkbox-option" data-cable-prefix="${numberPrefixFrom(cable.number)}" data-from-location-name="${escapeHtml(locationNameKey(cable.fromLocationId))}" data-to-location-name="${escapeHtml(locationNameKey(cable.toLocationId))}"><input type="checkbox" name="cableIds" value="${escapeHtml(cable.id)}" aria-label="Assign cable ${escapeHtml(cable.number)}" ${assignedCableIds.includes(cable.id) ? "checked" : ""} /><span class="checkbox-cable-number">${escapeHtml(cable.number)}</span><span class="checkbox-cable-route">${escapeHtml(cableLocationName(cable.fromLocationId))}<span aria-hidden="true"> → </span>${escapeHtml(cableLocationName(cable.toLocationId))}</span><span class="checkbox-cable-type"><strong>${escapeHtml(type?.specType || "Cable type unavailable")}</strong><small>${escapeHtml(typeDetails || "Specification unavailable")}</small><small class="checkbox-cable-incompatible" hidden>Not allowed for this conduit</small></span></label>`;
    }).join("")}
    <div class="checkbox-list-empty" hidden></div>
  </div></div>` : `<div class="field full"><label>Assign cables <span class="optional">(optional)</span></label><p class="form-note">No cables are available yet. Add cables from the Cable schedule to assign them here.</p></div>`;
  const nippleLength = `<div class="field" data-nipple-length-field ${selectedFillCondition === "nipple" ? "" : "hidden"}><label for="modal-nippleLengthInches">Nipple length (in)</label><input id="modal-nippleLengthInches" name="nippleLengthInches" type="number" min="0.1" max="24" step="0.1" value="${escapeHtml(draft.nippleLengthInches ?? conduit?.nippleLengthInches ?? "")}" ${selectedFillCondition === "nipple" ? "required" : ""} /></div>`;
  const fields = `${setupNote}<p class="form-note">Supplied EMT, RMC, and PVC Schedule 40/80 areas auto-fill for listed sizes. For other combinations, enter the 100% internal area from the applicable NEC Chapter 9 raceway table or product data.</p><div class="form-grid">
    ${numberField}
    <div class="form-grid conduit-raceway-fields">
      ${conduitSizeField(draft.size ?? conduit?.size ?? "")}
      ${selectField("racewayType", "Raceway type", RACEWAY_TYPES, draft.racewayType ?? conduit?.racewayType ?? "", { optional: true })}
      ${textField("racewayArea", "Internal area (sq in)", draft.racewayArea ?? conduit?.racewayArea ?? "", "e.g. 0.864", { type: "number", min: "0.0001", step: "0.0001", required: false, optional: true })}
      <p class="section-description field full" data-raceway-area-note></p>
    </div>
    ${textField("length", "Conduit length (ft)", draft.length ?? conduit?.length ?? "", "e.g. 120", { type: "number", min: "0", step: "0.01", required: false, optional: true })}
    ${selectField("fillCondition", "Fill condition", [
    { value: "standard", label: "Standard raceway" },
    { value: "nipple", label: "Nipple 24 in or shorter" },
    ], selectedFillCondition)}
    ${nippleLength}
    ${routeLocationField("fromLocationId", "From location", draft.fromLocationId || conduit?.fromLocationId, false, true, true)}
    ${routeLocationField("toLocationId", "To location", draft.toLocationId || conduit?.toLocationId, false, true, true)}
    ${cableOptions}
  </div>`;
  openModal(modalOptions.title || (conduit ? "Edit Conduit" : "Add Conduit"), modalOptions.subtitle || "Define the conduit route, raceway dimensions, and cable assignments.", conduit ? `edit-conduit:${id}` : "new-conduit", fields, modalOptions.submitLabel || (conduit ? "Save changes" : "Add Conduit"));
  const form = modalRoot.querySelector(".modal-form");
  updateConduitCableOptions(form);
  updateConduitFillCondition(form);
  updateConduitRacewayArea(form, true);
  if (needsLocations) modalRoot.querySelector('[type="submit"]').disabled = true;
}

function updateConduitCableOptions(form) {
  if (!form) return;
  const conduitNumber = form.elements.namedItem("number").value;
  const allowedCablePrefixes = new Set(cablePrefixesForConduit(conduitNumber));
  const fromLocationId = form.elements.namedItem("fromLocationId").value;
  const toLocationId = form.elements.namedItem("toLocationId").value;
  const selectedLocationNames = new Set([locationNameKey(fromLocationId), locationNameKey(toLocationId)].filter(Boolean));
  const options = [...form.querySelectorAll(".checkbox-option")];
  let visibleCount = 0;
  let hasIncompatibleAssignments = false;

  options.forEach((option) => {
    const checkbox = option.querySelector('input[name="cableIds"]');
    const isCompatible = allowedCablePrefixes.has(option.dataset.cablePrefix);
    const isIncompatibleAssignment = checkbox.checked && !isCompatible;
    const matchesLocation = selectedLocationNames.size === 0 ||
      selectedLocationNames.has(option.dataset.fromLocationName) ||
      selectedLocationNames.has(option.dataset.toLocationName);
    option.hidden = !(isCompatible && matchesLocation) && !checkbox.checked;
    option.classList.toggle("incompatible", isIncompatibleAssignment);
    option.querySelector(".checkbox-cable-incompatible").hidden = !isIncompatibleAssignment;
    if (isIncompatibleAssignment) hasIncompatibleAssignments = true;
    if (!option.hidden) visibleCount += 1;
  });

  const header = form.querySelector(".checkbox-list-header");
  const emptyMessage = form.querySelector(".checkbox-list-empty");
  const assignmentWarning = form.querySelector(".assignment-warning");
  if (header) header.hidden = visibleCount === 0;
  if (emptyMessage) emptyMessage.hidden = visibleCount !== 0;
  if (emptyMessage && visibleCount === 0) {
    emptyMessage.textContent = allowedCablePrefixes.size === 0
      ? "S conduits cannot have assigned cables."
      : "No compatible cables match the selected conduit locations.";
  }
  if (assignmentWarning) assignmentWarning.hidden = !hasIncompatibleAssignments;
}

function updateConduitFillCondition(form) {
  if (!form) return;
  const isNipple = form.elements.namedItem("fillCondition").value === "nipple";
  const field = form.querySelector("[data-nipple-length-field]");
  const input = form.elements.namedItem("nippleLengthInches");
  if (!field || !input) return;
  field.hidden = !isNipple;
  input.required = isNipple;
}

function updateConduitRacewayArea(form, preserveExisting = false) {
  if (!form) return;
  const racewayType = form.elements.namedItem("racewayType").value;
  const size = form.elements.namedItem("size").value;
  const areaInput = form.elements.namedItem("racewayArea");
  const note = form.querySelector("[data-raceway-area-note]");
  const area = racewayInternalAreaFor(racewayType, size);
  if (area !== null) {
    const hasCustomArea = preserveExisting && areaInput.value && Number(areaInput.value) !== area;
    if (!preserveExisting || !areaInput.value) areaInput.value = String(area);
    note.textContent = hasCustomArea
      ? "Keeping the existing custom area. Change raceway or size to use the supplied table value."
      : `Auto-filled from the supplied ${racewayTypeLabel(racewayType)} table. You can edit this value if your product data differs.`;
  } else {
    if (!preserveExisting) areaInput.value = "";
    note.textContent = preserveExisting && areaInput.value
      ? "No supplied lookup for this raceway and size. The existing custom area is retained; verify it against the applicable NEC table or product data."
      : "No supplied lookup for this raceway and size. Enter the 100% internal area from the applicable NEC table or product data.";
  }
}

function isConduitForm(form) {
  return form?.dataset.form === "new-conduit" || form?.dataset.form.startsWith("edit-conduit:");
}

function openCableTypeForm(id, returnToCableDraft = null) {
  const type = state.settings.cableTypes.find((item) => item.id === id);
  const fields = `<div class="form-grid">
    ${textField("manufacturer", "Manufacturer", type?.manufacturer || "", "e.g. Anixter")}
    ${textField("specNumber", "Spec number", type?.specNumber || "", "e.g. 115-23-3804")}
    <div class="cable-spec-builder-row field full">
      ${textField("specCount", "Count", type?.specCount ?? "", "e.g. 3", { type: "number", min: "1", step: "1", required: false })}
      ${selectField("specConstruction", "Conductor or Pair", CABLE_SPEC_CONSTRUCTIONS.map((value) => ({ value, label: value === "pair" ? "Pair" : "Conductor" })), type?.specConstruction || "conductor")}
      ${cableSpecSizeField(type?.specSize || "")}
      ${textField("specSuffix", "Spec suffix", type?.specSuffix ?? type?.specPrefix ?? "", "e.g. 15kV", { required: false })}
      <div class="field"><label for="modal-specGroundShield">Specification detail</label><label class="cable-spec-checkbox" for="modal-specGroundShield"><input id="modal-specGroundShield" name="specGroundShield" type="checkbox" ${type?.specGroundShield ? "checked" : ""} /><span id="spec-ground-shield-label">${type?.specConstruction === "pair" ? "Include shield" : "Include ground"}</span></label></div>
    </div>
    ${selectField("cableMaterial", "Cable Material", CABLE_MATERIALS.map((value) => ({ value, label: value })), type?.cableMaterial || "", { optional: true })}
    ${selectField("fillClassification", "Cable fill type", CABLE_FILL_TYPES, type?.fillClassification || "", { full: true, optional: true })}
    ${textField("diameter", "Overall diameter (in)", type?.diameter ?? "", "e.g. 1.42", { type: "number", min: "0", step: "0.001" })}
    ${textField("netWeight", "Net weight (lbs/1000')", type?.netWeight ?? "", "e.g. 1120", { type: "number", min: "0", step: "0.01" })}
    ${textField("url", "URL to details", type?.url || "", "https://...", { type: "url", required: false, full: true, optional: true })}
    <p class="section-description field full">For fill checks, enter the actual outside diameter and identify whether this specification is one insulated conductor or one multiconductor cable assembly.</p>
  </div>`;
  openModal(type ? "Edit Cable Type" : "Add Cable Type", "Save a reusable cable specification for this project.", type ? `edit-cable-type:${id}` : returnToCableDraft ? "new-cable-type-inline" : "new-cable-type", fields, type ? "Save changes" : "Add Cable Type");
  updateCableSpecLabels(modalRoot.querySelector(".modal-form"));
  if (returnToCableDraft) {
    pendingCableDraft = returnToCableDraft;
    modalRoot.querySelectorAll('[data-action="close-modal"]').forEach((button) => {
      button.dataset.action = "return-to-cable";
    });
  }
}

function openLocationForm(id, returnContext = null) {
  const location = state.settings.locations.find((item) => item.id === id);
  const fields = `<div class="form-grid">${textField("name", "Equipment Name", location?.name || "", "e.g. MCC-01", { full: true })}${textField("description", "Equipment ID", location?.description || "", "e.g. EQ-001", { required: false, full: true, optional: true })}</div>`;
  openModal(location ? "Edit Equipment" : "Add Equipment", "Equipment locations are available as cable and conduit route endpoints.", location ? `edit-location:${id}` : returnContext ? "new-location-inline" : "new-location", fields, location ? "Save changes" : "Add Equipment");
  if (returnContext) {
    pendingLocationReturn = returnContext;
    modalRoot.querySelectorAll('[data-action="close-modal"]').forEach((button) => {
      button.dataset.action = "return-to-route";
    });
  }
}

function makeId() {
  return crypto.randomUUID();
}

function handleSubmit(event) {
  const form = event.target;
  if (form.id === "project-settings-form") {
    event.preventDefault();
    const formData = new FormData(form);
    const selectedScheduleStatus = String(formData.get("scheduleStatus") || "In progress");
    const customScheduleStatus = String(formData.get("customScheduleStatus") || "").trim();
    if (selectedScheduleStatus === "custom" && !customScheduleStatus) {
      return showToast("Enter a custom schedule status.", true);
    }
    const necEdition = String(formData.get("necEdition") || "").trim();
    if (necEdition && !NEC_EDITIONS.includes(necEdition)) {
      return showToast("Choose a supported NEC edition.", true);
    }
    const powerFactor = Number(formData.get("powerFactor"));
    const maxVoltageDropPercent = Number(formData.get("maxVoltageDropPercent"));
    if (!Number.isFinite(powerFactor) || powerFactor <= 0 || powerFactor > 1) {
      return showToast("Power Factor must be greater than 0 and no greater than 1.", true);
    }
    if (!Number.isFinite(maxVoltageDropPercent) || maxVoltageDropPercent < 0) {
      return showToast("Max Voltage Drop must be zero or greater.", true);
    }
    Object.keys(state.settings).filter((key) =>
      !["cableTypes", "locations", "powerFactor", "maxVoltageDropPercent"].includes(key) && formData.has(key)).forEach((key) => {
      state.settings[key] = String(formData.get(key) || "").trim();
    });
    state.settings.powerFactor = powerFactor;
    state.settings.maxVoltageDropPercent = maxVoltageDropPercent;
    state.settings.scheduleStatus = selectedScheduleStatus === "custom"
      ? customScheduleStatus
      : selectedScheduleStatus;
    if (persist()) {
      showToast("Project details saved.");
      renderPage();
    }
    return;
  }
  if (!form.matches(".modal-form")) return;
  event.preventDefault();
  const formData = new FormData(form);
  const values = Object.fromEntries(formData.entries());
  const kind = form.dataset.form;
  if (kind === "new-cable-type" || kind === "new-cable-type-inline" || kind.startsWith("edit-cable-type:")) {
    const id = kind.startsWith("edit-cable-type:") ? kind.split(":")[1] : makeId();
    const existingType = state.settings.cableTypes.find((item) => item.id === id);
    if (values.fillClassification && !CABLE_FILL_TYPES.some((fillType) => fillType.value === values.fillClassification)) {
      return showToast("Choose a supported cable fill type.", true);
    }
    if (values.cableMaterial && !CABLE_MATERIALS.includes(values.cableMaterial)) return showToast("Choose Aluminum or Copper for Cable Material.", true);
    const specCount = values.specCount === "" ? null : Number(values.specCount);
    if (specCount !== null && (!Number.isSafeInteger(specCount) || specCount < 1)) {
      return showToast("Number of conductors or pairs must be a positive whole number.", true);
    }
    if (!CABLE_SPEC_CONSTRUCTIONS.includes(values.specConstruction)) return showToast("Choose Conductor or Pair for the Spec Type.", true);
    if (values.specSize && !CABLE_SPEC_SIZES.includes(values.specSize)) return showToast("Choose a supported cable size.", true);
    const specType = cableSpecTypeValue({
      suffix: values.specSuffix,
      count: specCount,
      construction: values.specConstruction,
      size: values.specSize,
      includeGroundShield: formData.has("specGroundShield"),
    }) || existingType?.specType || "";
    if (!specType) return showToast("Complete the cable specification inputs before saving.", true);
    const type = {
      id,
      manufacturer: values.manufacturer.trim(),
      specNumber: values.specNumber.trim(),
      specType,
      specSuffix: values.specSuffix.trim(),
      specCount,
      specConstruction: values.specConstruction,
      specSize: values.specSize,
      specGroundShield: formData.has("specGroundShield"),
      cableMaterial: values.cableMaterial,
      fillClassification: values.fillClassification.trim(),
      diameter: Number(values.diameter),
      netWeight: Number(values.netWeight),
      url: values.url.trim(),
    };
    const detailsUrl = safeHttpUrl(type.url);
    if (type.url && !detailsUrl) return showToast("Enter an HTTP or HTTPS URL for cable details.", true);
    type.url = detailsUrl || "";
    if (isDuplicate(state.settings.cableTypes, type.specNumber, id, "specNumber")) return showToast("A cable type with that spec number already exists.", true);
    const index = state.settings.cableTypes.findIndex((item) => item.id === id);
    if (index >= 0) state.settings.cableTypes[index] = type;
    else state.settings.cableTypes.push(type);
    if (kind === "new-cable-type-inline") {
      if (persist()) {
          const returnContext = pendingCableDraft;
        pendingCableDraft = null;
        closeModal();
          const draft = { ...returnContext.draft, cableTypeId: id };
          if (returnContext.formKind.startsWith("edit-cable:")) {
            openCableForm(returnContext.formKind.split(":")[1], draft);
          } else {
            openCableForm(undefined, draft);
          }
        showToast("Cable type added. Finish creating your cable.");
      }
    } else {
      saveAndClose(index >= 0 ? "Cable type updated." : "Cable type added.");
    }
  } else if (kind === "new-cable" || kind.startsWith("edit-cable:")) {
    const existingId = kind.startsWith("edit-cable:") ? kind.split(":")[1] : "";
    const existingCable = state.cables.find((item) => item.id === existingId);
    if (existingId && !existingCable) return showToast("This cable is no longer available.", true);
    const setCount = Number(values.parallelSets);
    if (!Number.isSafeInteger(setCount) || setCount < 1 || setCount > MAX_PARALLEL_SETS) {
      return showToast(`Parallel Sets must be a whole number from 1 to ${MAX_PARALLEL_SETS}.`, true);
    }
    if (values.cableRating && !CABLE_RATINGS.includes(values.cableRating)) return showToast("Choose a supported cable rating.", true);
    if (values.phase && !CABLE_PHASES.includes(values.phase)) return showToast("Choose Single or Three for Phase.", true);
    const enteredNumbers = formData.getAll("parallelNumbers").map((number) => String(number).trim());
    const cableNumbers = enteredNumbers.length ? enteredNumbers : [String(values.number || "").trim()];
    if (cableNumbers.length !== setCount || cableNumbers.some((number) => !number)) {
      return showToast("Enter a cable number for every parallel set.", true);
    }
    const currentMembers = existingCable ? parallelGroupMembers(existingCable) : [];
    const currentIds = new Set(currentMembers.map((member) => member.id));
    const usedNumbers = new Set(state.cables
      .filter((cable) => !currentIds.has(cable.id))
      .map((cable) => String(cable.number || "").trim().toLocaleLowerCase()));
    for (const number of cableNumbers) {
      const normalizedNumber = number.toLocaleLowerCase();
      if (usedNumbers.has(normalizedNumber)) return showToast(`A cable with number ${number} already exists.`, true);
      usedNumbers.add(normalizedNumber);
    }
    const loadAmps = values.loadAmps === "" ? null : Number(values.loadAmps);
    if (loadAmps !== null && (!Number.isFinite(loadAmps) || loadAmps < 0)) return showToast("Load (Amps) must be zero or greater.", true);
    const sharedDetails = {
      length: values.length === "" ? null : Number(values.length),
      cableTypeId: values.cableTypeId,
      fromLocationId: values.fromLocationId,
      toLocationId: values.toLocationId,
      purpose: values.purpose.trim(),
      voltage: values.voltage.trim(),
      loadAmps,
      cableRating: values.cableRating,
      phase: values.phase,
    };
    if (!existingCable) {
      if (setCount === 1) {
        const cable = { id: makeId(), number: cableNumbers[0], ...sharedDetails };
        state.cables.push(cable);
        saveAndClose("Cable added.");
        return;
      }
      const parallelGroupId = makeId();
      state.cables.push(...cableNumbers.map((number, index) => ({
        id: makeId(),
        number,
        ...sharedDetails,
        parallelGroupId,
        parallelSetIndex: index + 1,
      })));
      saveAndClose(`${setCount} parallel cables added.`);
      return;
    }

    if (currentMembers.length === 1 && setCount === 1) {
      const cable = { ...existingCable, number: cableNumbers[0], ...sharedDetails };
      Object.assign(existingCable, cable);
      saveAndClose("Cable updated.");
      return;
    }
    const retainedMembers = currentMembers.slice(0, setCount);
    const retainedIds = new Set(retainedMembers.map((member) => member.id));
    const removedMembers = currentMembers.filter((member) => !retainedIds.has(member.id));
    const parallelGroupId = setCount > 1 ? existingCable.parallelGroupId || makeId() : "";
    retainedMembers.forEach((member, index) => {
      member.number = cableNumbers[index];
      Object.assign(member, sharedDetails);
      if (parallelGroupId) {
        member.parallelGroupId = parallelGroupId;
        member.parallelSetIndex = index + 1;
      } else {
        delete member.parallelGroupId;
        delete member.parallelSetIndex;
      }
    });
    const addedMembers = cableNumbers.slice(retainedMembers.length).map((number, index) => ({
      id: makeId(),
      number,
      ...sharedDetails,
      parallelGroupId,
      parallelSetIndex: retainedMembers.length + index + 1,
    }));
    if (removedMembers.length) {
      const removedIds = new Set(removedMembers.map((member) => member.id));
      state.cables = state.cables.filter((member) => !removedIds.has(member.id));
      state.conduits.forEach((conduit) => {
        conduit.cableIds = conduit.cableIds.filter((cableId) => !removedIds.has(cableId));
      });
    }
    state.cables.push(...addedMembers);
    saveAndClose("Parallel cable set updated.");
  } else if (kind === "new-conduit" || kind.startsWith("edit-conduit:")) {
    const id = kind.startsWith("edit-conduit:") ? kind.split(":")[1] : makeId();
    const number = values.number.trim();
    const allowedCablePrefixes = new Set(cablePrefixesForConduit(number));
    const hasIncompatibleAssignment = formData.getAll("cableIds").some((cableId) => {
      const cable = state.cables.find((item) => item.id === cableId);
      return cable && !allowedCablePrefixes.has(numberPrefixFrom(cable.number));
    });
    if (hasIncompatibleAssignment) {
      const message = numberPrefixFrom(number) === "S"
        ? "S conduits cannot have assigned cables."
        : "Remove incompatible cable assignments before saving this conduit.";
      return showToast(message, true);
    }
    const racewayArea = values.racewayArea === "" ? null : Number(values.racewayArea);
    if (racewayArea !== null && (!Number.isFinite(racewayArea) || racewayArea <= 0)) {
      return showToast("Enter a raceway internal area greater than zero.", true);
    }
    if (values.racewayType && !RACEWAY_TYPES.some((type) => type.value === values.racewayType)) {
      return showToast("Choose a supported raceway type.", true);
    }
    const fillCondition = values.fillCondition || "standard";
    if (!CONDUIT_FILL_CONDITIONS.includes(fillCondition)) {
      return showToast("Choose a supported conduit fill condition.", true);
    }
    const nippleLengthInches = values.nippleLengthInches === "" ? null : Number(values.nippleLengthInches);
    if (fillCondition === "nipple" && (!Number.isFinite(nippleLengthInches) || nippleLengthInches <= 0 || nippleLengthInches > 24)) {
      return showToast("A nipple must have a length from 0.1 to 24 inches.", true);
    }
    const conduit = {
      id,
      number,
      size: values.size.trim() || null,
      racewayType: values.racewayType,
      racewayArea,
      length: values.length === "" ? null : Number(values.length),
      fillCondition,
      nippleLengthInches: fillCondition === "nipple" ? nippleLengthInches : null,
      fromLocationId: values.fromLocationId,
      toLocationId: values.toLocationId,
      cableIds: formData.getAll("cableIds"),
    };
    if (isDuplicate(state.conduits, conduit.number, id, "number")) return showToast("A conduit with that number already exists.", true);
    const index = state.conduits.findIndex((item) => item.id === id);
    if (index >= 0) state.conduits[index] = conduit;
    else state.conduits.push(conduit);
    saveAndClose(index >= 0 ? "Conduit updated." : "Conduit added.");
  } else if (kind.startsWith("new-location") || kind.startsWith("edit-location:")) {
    const id = kind.startsWith("edit-location:") ? kind.split(":")[1] : makeId();
    const equipmentId = values.description.trim();
    const location = { id, name: values.name.trim(), description: equipmentId };
    if (isCableTrayLocation(location)) return showToast("Cable Tray is reserved for conduit routing.", true);
    if (isDuplicateEquipment(state.settings.locations, location)) return showToast("Equipment with this name and ID already exists.", true);
    const index = state.settings.locations.findIndex((item) => item.id === id);
    if (index >= 0) state.settings.locations[index] = location;
    else state.settings.locations.push(location);
    if (kind === "new-location-inline") {
      if (persist()) {
        const returnContext = pendingLocationReturn;
        pendingLocationReturn = null;
        closeModal();
        returnToRoute({ ...returnContext, draft: { ...returnContext.draft, [returnContext.fieldName]: id } });
        showToast("Location added. Finish editing your schedule.");
      }
    } else {
      saveAndClose(index >= 0 ? "Location updated." : "Location added.");
    }
  }
}

function isDuplicate(items, value, id, key) {
  const normalized = String(value ?? "").trim().toLocaleLowerCase();
  return items.some((item) => item.id !== id && String(item[key] ?? "").trim().toLocaleLowerCase() === normalized);
}

function isDuplicateEquipment(locations, location) {
  const normalize = (value) => String(value ?? "").trim().toLocaleLowerCase();
  return locations.some((item) =>
    item.id !== location.id &&
    normalize(item.name) === normalize(location.name) &&
    normalize(item.description) === normalize(location.description));
}

function saveAndClose(message) {
  if (persist()) {
    closeModal();
    renderPage();
    showToast(message);
  }
}

function removeRecord(collection, id, label) {
  const index = collection.findIndex((item) => item.id === id);
  if (index < 0) return;
  collection.splice(index, 1);
  if (persist()) {
    renderPage();
    showToast(`${label} deleted.`);
  }
}

function returnToRoute(returnContext) {
  if (!returnContext) return;
  const { formKind, draft } = returnContext;
  if (formKind === "new-cable") return openCableForm(undefined, draft);
  if (formKind.startsWith("edit-cable:")) return openCableForm(formKind.split(":")[1], draft);
  if (formKind === "new-conduit") return openConduitForm(undefined, draft);
  if (formKind.startsWith("edit-conduit:")) return openConduitForm(formKind.split(":")[1], draft);
}

function startNewProject() {
  if (!confirm("Start a new project? This will replace the project currently open in this browser. Save a backup first if you need to keep it.")) return;
  const previousState = state;
  state = emptyState();
  if (!persist()) {
    state = previousState;
    renderPage();
    return;
  }
  pendingCableDraft = null;
  pendingLocationReturn = null;
  showAllVersionHistory = false;
  closeModal();
  setPage("dashboard");
  showToast("New project started.");
}

function handleAction(action, id, fieldName) {
  if (action === "new-project") return startNewProject();
  if (action === "close-modal") return closeModal();
  if (action === "toggle-version-history") {
    showAllVersionHistory = !showAllVersionHistory;
    document.querySelector("#version-history-content").innerHTML = renderVersionHistory();
    return;
  }
  if (action === "return-to-cable") {
    const returnContext = pendingCableDraft;
    pendingCableDraft = null;
    closeModal();
    if (returnContext?.formKind.startsWith("edit-cable:")) {
      return openCableForm(returnContext.formKind.split(":")[1], returnContext.draft);
    }
    return openCableForm(undefined, returnContext?.draft || {});
  }
  if (action === "return-to-route") {
    const returnContext = pendingLocationReturn;
    pendingLocationReturn = null;
    closeModal();
    return returnToRoute(returnContext);
  }
  if (action === "new-cable") return openCableForm();
  if (action === "add-cable-type-inline") {
    const form = modalRoot.querySelector(".modal-form");
    const formData = new FormData(form);
    const draft = Object.fromEntries(formData.entries());
    draft.parallelNumbers = formData.getAll("parallelNumbers");
    draft.parallelNumbersCustomized = [...form.querySelectorAll('input[name="parallelNumbers"]')].map((input) => input.dataset.customized === "true");
    return openCableTypeForm(undefined, { formKind: form.dataset.form, draft });
  }
  if (action === "edit-cable") return openCableForm(id);
  if (action === "duplicate-cable") {
    const cable = state.cables.find((item) => item.id === id);
    if (!cable) return;
    const groupMembers = parallelGroupMembers(cable);
    const isParallelGroup = groupMembers.length > 1;
    const draft = {
      ...cable,
      number: "",
      numberPrefix: numberPrefixFrom(cable.number),
      parallelSets: String(isParallelGroup ? groupMembers.length : 1),
    };
    delete draft.parallelGroupId;
    delete draft.parallelSetIndex;
    if (isParallelGroup) {
      return openCableForm(undefined, draft, {
        title: "Duplicate Parallel Set",
        subtitle: `Copy of ${groupMembers.map((member) => member.number).join(", ")}. Enter new cable numbers and adjust the details before saving.`,
        submitLabel: "Create duplicate set",
      });
    }
    return openCableForm(undefined, draft, {
      title: "Duplicate Cable",
      subtitle: `Copy of ${cable.number}. Enter a new cable number and adjust the details before saving.`,
      submitLabel: "Create duplicate",
    });
  }
  if (action === "new-conduit") return openConduitForm();
  if (action === "edit-conduit") return openConduitForm(id);
  if (action === "duplicate-conduit") {
    const conduit = state.conduits.find((item) => item.id === id);
    if (!conduit) return;
    return openConduitForm(undefined, { ...conduit, number: "", numberPrefix: numberPrefixFrom(conduit.number) }, {
      title: "Duplicate Conduit",
      subtitle: `Copy of ${conduit.number}. Enter a new conduit number and adjust the details before saving.`,
      submitLabel: "Create duplicate",
    });
  }
  if (action === "add-route-location") {
    const form = modalRoot.querySelector(".modal-form");
    const formData = new FormData(form);
    const draft = Object.fromEntries(formData.entries());
    draft.cableIds = formData.getAll("cableIds");
    return openLocationForm(undefined, { formKind: form.dataset.form, draft, fieldName });
  }
  if (action === "new-cable-type") return openCableTypeForm();
  if (action === "edit-cable-type") return openCableTypeForm(id);
  if (action === "new-location") return openLocationForm();
  if (action === "edit-location") return openLocationForm(id);
  if (action === "delete-cable") {
    const cable = state.cables.find((item) => item.id === id);
    if (!cable) return;
    const groupMembers = parallelGroupMembers(cable);
    const isParallelGroup = groupMembers.length > 1;
    const removedIds = new Set((isParallelGroup ? groupMembers : [cable]).map((member) => member.id));
    const cableLabel = isParallelGroup ? `parallel set (${groupMembers.map((member) => member.number).join(", ")})` : `cable ${cable.number}`;
    const confirmation = isParallelGroup
      ? `Delete ${cableLabel}? This will remove ${groupMembers.length} cables and their assigned conduit references.`
      : `Delete ${cableLabel}? Assigned conduit references will be removed.`;
    if (confirm(confirmation)) {
      state.cables = state.cables.filter((item) => !removedIds.has(item.id));
      state.conduits.forEach((conduit) => {
        conduit.cableIds = conduit.cableIds.filter((cableId) => !removedIds.has(cableId));
      });
      if (persist()) {
        renderPage();
        showToast(isParallelGroup ? "Parallel cable set deleted." : "Cable deleted.");
      }
    }
  }
  if (action === "delete-conduit") {
    const conduit = state.conduits.find((item) => item.id === id);
    if (conduit && confirm(`Delete conduit ${conduit.number}?`)) removeRecord(state.conduits, id, "Conduit");
  }
  if (action === "delete-cable-type") {
    const type = state.settings.cableTypes.find((item) => item.id === id);
    if (state.cables.some((cable) => cable.cableTypeId === id)) return showToast("This type is used by a cable. Update those cables before deleting it.", true);
    if (type && confirm(`Delete cable type ${type.specNumber}?`)) removeRecord(state.settings.cableTypes, id, "Cable type");
  }
  if (action === "delete-location") {
    const location = state.settings.locations.find((item) => item.id === id);
    const inUse = state.cables.some((cable) => cable.fromLocationId === id || cable.toLocationId === id) || state.conduits.some((conduit) => conduit.fromLocationId === id || conduit.toLocationId === id);
    if (inUse) return showToast("This location is in use by a cable or conduit. Update those routes before deleting it.", true);
    if (location && confirm(`Delete location ${location.name}?`)) removeRecord(state.settings.locations, id, "Location");
  }
  if (action === "export-cables") exportCsv(projectFileName("csv", "Cable Schedule"), cableExportRows());
  if (action === "export-conduits") exportCsv(projectFileName("csv", "Conduit Schedule"), conduitExportRows());
  if (action === "export-conduit-cable-csv") exportConduitCableCsv();
  if (action === "print-conduit-cable") printConduitCableSchedule();
  if (action === "export-bom") exportCsv(projectFileName("csv", "Bill of Materials"), billOfMaterialsExportRows());
  if (action === "export-voltage-drop") exportCsv(projectFileName("csv", "Voltage Drop Report"), voltageDropExportRows());
  if (action === "export-project") exportJson();
  if (action === "import-project") {
    document.querySelector("#export-menu").hidden = true;
    document.querySelector("#export-trigger").setAttribute("aria-expanded", "false");
    document.querySelector("#backup-import-input").click();
  }
  if (action === "print-bom") {
    document.querySelector("#export-menu").hidden = true;
    document.querySelector("#export-trigger").setAttribute("aria-expanded", "false");
    setPage("bom");
    printReport("Bill of Materials");
  }
  if (action === "print-voltage-drop") printVoltageDropReport();
}

function renderConduitCablePrint() {
  const rows = formattedConduitCableRows();
  const [headers, ...scheduleRows] = rows;
  const settings = state.settings;
  const conduitGroups = [];
  const headerLines = {
    "CONDUIT #": ["CONDUIT", "#"],
    "CONDUIT SIZE": ["CONDUIT", "SIZE"],
    "CONDUIT / CABLE LENGTH": ["CONDUIT / CABLE", "LENGTH"],
    "CABLE NUMBER": ["CABLE", "NUMBER"],
    "CABLE MANUFACTURER": ["CABLE", "MANUFACTURER"],
    "CABLE QTY": ["CABLE", "QTY"],
    "CABLE TYPE": ["CABLE", "TYPE"],
    "CONDUIT / CABLE ROUTING FROM": ["CONDUIT / CABLE ROUTING", "FROM"],
    "CONDUIT / CABLE ROUTING TO": ["CONDUIT / CABLE ROUTING", "TO"],
  };
  let currentGroup = [];
  scheduleRows.forEach((row) => {
    if (row === null) {
      if (currentGroup.length) conduitGroups.push(currentGroup);
      currentGroup = [];
    } else {
      currentGroup.push(row);
    }
  });
  if (currentGroup.length) conduitGroups.push(currentGroup);

  return `
    <main class="conduit-cable-print">
      <header class="conduit-cable-print-header">
        <div class="conduit-cable-print-title">
          <div><h1>Conduit Cable Schedule</h1></div>
          <span>Generated ${escapeHtml(new Date().toLocaleDateString())}</span>
        </div>
        <h2>${escapeHtml(titleCaseHeading(projectName()))}</h2>
        <div class="conduit-cable-print-project-meta">
          ${detail("Client", settings.clientName)}
          ${detail("Client Project #", settings.clientProjectNumber)}
          ${detail("Internal Project #", settings.internalProjectNumber)}
          ${detail("Revision", settings.revisionNumber)}
          ${detail("Designer", settings.editorName)}
        </div>
      </header>
      <table>
        <thead><tr>${headers.map((header) => `<th>${(headerLines[header] || [header]).map(escapeHtml).join("<br>")}</th>`).join("")}</tr></thead>
        ${conduitGroups.map((group, index) => `
          <tbody class="conduit-cable-group">
            ${group.map((row) => `<tr class="${row[0] !== null ? "conduit-cable-group-row" : "conduit-cable-entry-row"}">${row.map((cell) => `<td>${escapeHtml(cell ?? "")}</td>`).join("")}</tr>`).join("")}
            ${index < conduitGroups.length - 1 ? `<tr class="conduit-cable-spacer"><td colspan="${headers.length}"></td></tr>` : ""}
          </tbody>`).join("")}
      </table>
    </main>`;
}

function printConduitCableSchedule() {
  const printRoot = document.querySelector("#print-root");
  document.querySelector("#export-menu").hidden = true;
  document.querySelector("#export-trigger").setAttribute("aria-expanded", "false");
  printRoot.innerHTML = renderConduitCablePrint();
  document.body.classList.add("printing-conduit-cable");
  printReport("Conduit Cable Schedule", () => {
    document.body.classList.remove("printing-conduit-cable");
    printRoot.replaceChildren();
  });
}

function renderVoltageDropPrint() {
  const rows = voltageDropReportData();
  const settings = state.settings;
  const headers = [
    "Cable #", "Spec Type", "Cable Material", "Voltage", "Load (Amps)", "Cable Ampacity",
    "Ampacity Overhead", "Parallel Sets", "Cable Rating", "Phase", "Voltage Drop %", "Calculation Notes",
  ];
  const headerLines = {
    "CABLE #": ["CABLE", "#"],
    "SPEC TYPE": ["SPEC", "TYPE"],
    "CABLE MATERIAL": ["CABLE", "MATERIAL"],
    "VOLTAGE": ["VOLTAGE", "(V)"],
    "LOAD (AMPS)": ["LOAD", "(AMPS)"],
    "CABLE AMPACITY": ["CABLE", "AMPACITY"],
    "AMPACITY OVERHEAD": ["AMPACITY", "OVERHEAD"],
    "PARALLEL SETS": ["PARALLEL", "SETS"],
    "CABLE RATING": ["CABLE", "RATING"],
    "VOLTAGE DROP %": ["VOLTAGE DROP", "%"],
    "CALCULATION NOTES": ["CALCULATION", "NOTES"],
  };
  return `
    <main class="conduit-cable-print voltage-drop-print">
      <header class="conduit-cable-print-header">
        <div class="conduit-cable-print-title">
          <div><h1>Voltage Drop Report</h1></div>
          <span>Generated ${escapeHtml(new Date().toLocaleDateString())}</span>
        </div>
        <h2>${escapeHtml(titleCaseHeading(projectName()))}</h2>
        <div class="conduit-cable-print-project-meta">
          ${detail("Client", settings.clientName)}
          ${detail("Client Project #", settings.clientProjectNumber)}
          ${detail("Internal Project #", settings.internalProjectNumber)}
          ${detail("Revision", settings.revisionNumber)}
          ${detail("Designer", settings.editorName)}
          ${detail("Power Factor", settings.powerFactor)}
          ${detail("Max Voltage Drop", `${settings.maxVoltageDropPercent}%`)}
        </div>
      </header>
      <table class="voltage-drop-report-table">
        <thead><tr>${headers.map((header) => `<th>${(headerLines[header.toLocaleUpperCase()] || [header.toLocaleUpperCase()]).map(escapeHtml).join("<br>")}</th>`).join("")}</tr></thead>
        <tbody>${rows.length ? rows.map((row) => {
          const voltageDrop = row.voltageDrop.percent === null
            ? "Needs data"
            : `${row.voltageDrop.percent.toFixed(2)}%${row.voltageDrop.approximate ? " est." : ""}`;
          return `<tr>
            <td>${escapeHtml(row.cableNumbers || "—")}</td>
            <td>${escapeHtml(row.type?.specType || "—")}</td>
            <td>${escapeHtml(row.material)}</td>
            <td>${escapeHtml(row.voltage)}</td>
            <td>${escapeHtml(row.loadAmps)}</td>
            <td>${escapeHtml(row.cableAmpacity)}</td>
            <td><span class="tag ${row.overheadClass}">${row.ampacityOverhead === null ? "—" : `${formatNumber(row.ampacityOverhead)} A`}</span></td>
            <td>${row.parallelSets}</td>
            <td>${escapeHtml(row.rating)}</td>
            <td>${escapeHtml(row.phase)}</td>
            <td><span class="tag ${row.voltageDropClass}">${escapeHtml(voltageDrop)}</span></td>
            <td>${escapeHtml(row.calculationNotes)}</td>
          </tr>`;
        }).join("") : `<tr><td class="voltage-drop-print-empty" colspan="${headers.length}">No cable entries available.</td></tr>`}</tbody>
      </table>
    </main>`;
}

function printVoltageDropReport() {
  const printRoot = document.querySelector("#print-root");
  document.querySelector("#export-menu").hidden = true;
  document.querySelector("#export-trigger").setAttribute("aria-expanded", "false");
  printRoot.innerHTML = renderVoltageDropPrint();
  document.body.classList.add("printing-voltage-drop");
  printReport("Voltage Drop Report", () => {
    document.body.classList.remove("printing-voltage-drop");
    printRoot.replaceChildren();
  });
}

function printReport(reportType, afterPrint = null) {
  const originalTitle = document.title;
  document.title = projectFileBaseName(reportType);
  window.addEventListener("afterprint", () => {
    document.title = originalTitle;
    afterPrint?.();
  }, { once: true });
  window.print();
}

function cableExportRows() {
  return [
    ["Cable Number", "Cable Length (ft)", "Manufacturer", "Spec Number", "Spec Type", "Overall Diameter (in)", "Net Weight (lbs/1000')", "From Location", "To Location", "Cable Purpose"],
    ...sortByNumber(state.cables).map((cable) => {
      const type = cableType(cable.cableTypeId);
      return [cable.number, cable.length, type?.manufacturer, type?.specNumber, type?.specType, type?.diameter, type?.netWeight, cableLocationName(cable.fromLocationId), cableLocationName(cable.toLocationId), cablePurposeDisplay(cable)];
    }),
  ];
}

function conduitExportRows() {
  return [
    ["Conduit Number", "Size", "Conduit Length (ft)", "From Location", "To Location", "Assigned Cable Numbers"],
    ...sortByNumber(state.conduits).map((conduit) => [conduit.number, conduit.size, conduit.length, locationName(conduit.fromLocationId), locationName(conduit.toLocationId), conduit.cableIds.map((id) => state.cables.find((cable) => cable.id === id)?.number).filter(Boolean).join("; ")]),
  ];
}

function billOfMaterialsExportRows() {
  const { usedCableTypes, usedConduitGroups } = billOfMaterialsGroups();
  return [
    ["Material Type", "Spec Type", "Manufacturer", "Spec Number", "Conduit Size", "Conduit Type", "Total Known Length (ft)", "Missing Length Count"],
    ...usedCableTypes.map(({ type, cables }) => [
      "Cable",
      type?.specType || "—",
      type?.manufacturer || "Cable type unavailable",
      type?.specNumber || "Specification unavailable",
      "",
      "",
      sumScheduledLengths(cables),
      cables.filter((cable) => !hasScheduledLength(cable.length)).length,
    ]),
    ...usedConduitGroups.map(({ racewayType, size, conduits }) => [
      "Conduit",
      "",
      "",
      "",
      size,
      racewayType,
      sumScheduledLengths(conduits),
      conduits.filter((conduit) => !hasScheduledLength(conduit.length)).length,
    ]),
  ];
}

function conduitCableExportRows() {
  const listedCableIds = new Set();
  const rows = [[
    "Conduit #",
    "Conduit Size",
    "Conduit / Cable Length",
    "Cable Number",
    "Cable Manufacturer",
    "Cable Qty",
    "Cable Type",
    "Conduit / Cable Routing From",
    "Conduit / Cable Routing To",
    "Purpose",
  ]];

  sortByNumber(state.conduits).forEach((conduit, conduitIndex, conduits) => {
    rows.push([
      conduit.number,
      conduit.size || "TBD",
      hasScheduledLength(conduit.length) ? Number(conduit.length) : "TBD",
      null,
      null,
      null,
      null,
      locationName(conduit.fromLocationId),
      locationName(conduit.toLocationId),
      "CONDUIT ROUTING",
    ]);

    const assignedCables = sortByNumber(conduit.cableIds
      .map((id) => state.cables.find((cable) => cable.id === id))
      .filter(Boolean));
    assignedCables.forEach((cable) => {
      const type = cableType(cable.cableTypeId);
      const manufacturerAndSpec = [type?.manufacturer, type?.specNumber].filter(Boolean).join(" - ");
      const length = listedCableIds.has(cable.id)
        ? "*"
        : hasScheduledLength(cable.length) ? Number(cable.length) : "TBD";
      listedCableIds.add(cable.id);
      rows.push([
        null,
        null,
        length,
        cable.number,
        manufacturerAndSpec || "Cable type unavailable",
        1,
        type?.specType || null,
        cableLocationName(cable.fromLocationId),
        cableLocationName(cable.toLocationId),
        cablePurposeDisplay(cable) || null,
      ]);
    });

    if (conduitIndex < conduits.length - 1) rows.push(null);
  });

  return rows;
}

function exportConduitCableCsv() {
  exportCsv(projectFileName("csv", "Conduit Cable Schedule"), formattedConduitCableRows());
}

function formattedConduitCableRows() {
  return conduitCableExportRows().map((row, rowIndex) =>
    row === null ? null : row.map((cell, columnIndex) =>
      typeof cell === "string" && !(rowIndex > 0 && columnIndex === 3) ? cell.toUpperCase() : cell));
}

function exportCsv(filename, rows) {
  const content = rows.map((row) => row === null ? "" : row.map((cell) => {
    const value = String(cell ?? "");
    const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${safeValue.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
  download(filename, `\uFEFF${content}`, "text/csv;charset=utf-8");
}

function exportJson() {
  const backup = { ...state, exportedAt: new Date().toISOString(), formatVersion: 1 };
  download(projectFileName("ccs", "Project"), JSON.stringify(backup, null, 2), "application/json");
}

function projectFileName(extension, reportType = "") {
  return `${projectFileBaseName(reportType)}.${extension}`;
}

function projectFileBaseName(reportType = "") {
  const fileNameParts = [
    state.settings.internalProjectNumber,
    state.settings.clientName,
    state.settings.projectName,
    reportType,
  ].map((part) => String(part || "").trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/\s+/g, " ").replace(/[. ]+$/g, ""))
    .filter(Boolean);
  return fileNameParts.join(" - ") || "project";
}

function validateBackupData(backup) {
  const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  const isText = (value) => typeof value === "string" && value.trim().length > 0;
  const validateItems = (items, label, isValid) => {
    if (!Array.isArray(items) || !items.every(isValid)) {
      throw new Error(`The backup contains invalid ${label}.`);
    }
  };

  if (!isRecord(backup)) throw new Error("The selected file is not a project backup.");
  if (backup.formatVersion !== undefined && backup.formatVersion !== 1) {
    throw new Error("This project backup version is not supported.");
  }
  if (!isRecord(backup.settings) || !Array.isArray(backup.cables) || !Array.isArray(backup.conduits)) {
    throw new Error("The selected file is missing required project data.");
  }

  const settings = { ...emptyState().settings, ...backup.settings };
  settings.scheduleStatus ||= "In progress";
  const textSettings = ["projectName", "clientName", "clientProjectNumber", "internalProjectNumber", "revisionNumber", "editorName", "scheduleStatus", "necEdition", "necJurisdiction"];
  if (!textSettings.every((key) => typeof settings[key] === "string")) {
    throw new Error("The backup contains invalid project settings.");
  }
  if (typeof settings.powerFactor !== "number" || !Number.isFinite(settings.powerFactor) ||
      settings.powerFactor <= 0 || settings.powerFactor > 1 ||
      typeof settings.maxVoltageDropPercent !== "number" || !Number.isFinite(settings.maxVoltageDropPercent) ||
      settings.maxVoltageDropPercent < 0) {
    throw new Error("The backup contains invalid voltage drop settings.");
  }
  if (settings.necEdition && !NEC_EDITIONS.includes(settings.necEdition)) {
    throw new Error("The backup contains an unsupported NEC edition.");
  }
  validateItems(settings.cableTypes, "cable types", (item) =>
    isRecord(item) && isText(item.id) &&
    (item.cableMaterial === undefined || item.cableMaterial === "" || CABLE_MATERIALS.includes(item.cableMaterial)) &&
    (item.fillClassification === undefined || item.fillClassification === "" ||
      CABLE_FILL_TYPES.some((fillType) => fillType.value === item.fillClassification)) &&
    (item.specSuffix === undefined || typeof item.specSuffix === "string") &&
    (item.specPrefix === undefined || typeof item.specPrefix === "string") &&
    (item.specCount === undefined || item.specCount === null ||
      (Number.isSafeInteger(item.specCount) && item.specCount >= 1)) &&
    (item.specConstruction === undefined || CABLE_SPEC_CONSTRUCTIONS.includes(item.specConstruction)) &&
    (item.specSize === undefined || item.specSize === "" || CABLE_SPEC_SIZES.includes(item.specSize)) &&
    (item.specGroundShield === undefined || typeof item.specGroundShield === "boolean") &&
    (item.customSpecType === undefined || typeof item.customSpecType === "boolean") &&
    (item.url === undefined || item.url === null ||
      (typeof item.url === "string" && (!item.url.trim() || Boolean(safeHttpUrl(item.url))))));
  validateItems(settings.locations, "locations", (item) => isRecord(item) && isText(item.id) && isText(item.name));
  validateItems(backup.cables, "cables", (item) => isRecord(item) && isText(item.id) && isText(item.number));
  validateItems(backup.conduits, "conduits", (item) =>
    isRecord(item) && isText(item.id) && isText(item.number) &&
    Array.isArray(item.cableIds) && item.cableIds.every((id) => typeof id === "string") &&
    (item.racewayType === undefined || item.racewayType === "" || RACEWAY_TYPES.some((type) => type.value === item.racewayType)) &&
    (item.racewayArea === undefined || item.racewayArea === null ||
      (typeof item.racewayArea === "number" && Number.isFinite(item.racewayArea) && item.racewayArea > 0)) &&
    (item.fillCondition === undefined || item.fillCondition === "" || CONDUIT_FILL_CONDITIONS.includes(item.fillCondition)) &&
    (item.nippleLengthInches === undefined || item.nippleLengthInches === null ||
      (typeof item.nippleLengthInches === "number" && Number.isFinite(item.nippleLengthInches) && item.nippleLengthInches > 0 && item.nippleLengthInches <= 24)));

  return normalizeCableTypeMaterials(normalizeCableTrayLocations({
    settings,
    cables: backup.cables,
    conduits: backup.conduits,
  }));
}

async function importProjectBackup(file) {
  let contents;
  try {
    contents = await file.text();
  } catch (error) {
    console.error("Could not read the selected project backup.", error);
    showToast("Could not read the selected backup file.", true);
    return;
  }

  let backup;
  try {
    backup = JSON.parse(contents);
  } catch (error) {
    console.error("The selected project backup is not valid JSON.", error);
    showToast("The selected file is not valid JSON.", true);
    return;
  }

  let importedState;
  try {
    importedState = validateBackupData(backup);
  } catch (error) {
    console.error("The selected file is not a valid project backup.", error);
    showToast(error.message || "The selected file is not a valid project backup.", true);
    return;
  }

  if (!confirm("Import this backup and replace the project currently open in this browser? This cannot be undone.")) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(importedState));
  } catch (error) {
    console.error("Could not save the imported project backup.", error);
    updateSaveStatus("Import failed", true);
    showToast("Could not import the backup because browser storage could not save it.", true);
    return;
  }

  state = importedState;
  renderPage();
  updateSaveStatus("All changes saved");
  showToast("Project backup imported.");
}

function download(filename, content, mimeType) {
  downloadBlob(filename, new Blob([content], { type: mimeType }));
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`${filename} exported.`);
  document.querySelector("#export-menu").hidden = true;
  document.querySelector("#export-trigger").setAttribute("aria-expanded", "false");
}

document.addEventListener("click", (event) => {
  const pageLink = event.target.closest("[data-page]");
  if (pageLink) {
    event.preventDefault();
    setPage(pageLink.dataset.page);
    closeModal();
    return;
  }
  const actionElement = event.target.closest("[data-action]");
  if (actionElement) {
    const action = actionElement.dataset.action;
    if (action === "export-trigger") return;
    handleAction(action, actionElement.dataset.id, actionElement.dataset.field);
  }
});

const appShell = document.querySelector(".app-shell");
const sidebarToggle = document.querySelector("#sidebar-toggle");
const sidebarTooltipItems = document.querySelectorAll(".sidebar [data-tooltip]");
function syncSidebarTooltipTitles(isCollapsed) {
  sidebarTooltipItems.forEach((item) => {
    if (isCollapsed) item.title = item.dataset.tooltip;
    else item.removeAttribute("title");
  });
}
syncSidebarTooltipTitles(appShell.classList.contains("sidebar-collapsed"));
sidebarToggle.addEventListener("click", () => {
  const isCollapsed = appShell.classList.toggle("sidebar-collapsed");
  const label = isCollapsed ? "Expand sidebar" : "Minimize sidebar";
  sidebarToggle.setAttribute("aria-label", label);
  sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
  sidebarToggle.dataset.tooltip = label;
  syncSidebarTooltipTitles(isCollapsed);
});

document.addEventListener("submit", handleSubmit);
document.addEventListener("change", (event) => {
  if (event.target.id === "theme-preference") {
    if (!saveThemePreference(event.target.value)) event.target.value = themePreference;
    return;
  }
  const form = event.target.closest(".modal-form");
  if (isCableTypeForm(form) && event.target.name === "specConstruction") {
    updateCableSpecLabels(form);
    return;
  }
  if (isConduitForm(form) && ["size", "racewayType"].includes(event.target.name)) {
    updateConduitRacewayArea(form);
    return;
  }
  if (isConduitForm(form) && event.target.name === "fillCondition") {
    updateConduitFillCondition(form);
    return;
  }
  if (isConduitForm(form) && ["fromLocationId", "toLocationId", "cableIds"].includes(event.target.name)) {
    updateConduitCableOptions(form);
    return;
  }
  if (event.target.id === "setting-scheduleStatus") {
    const isCustom = event.target.value === "custom";
    const customField = document.querySelector("#custom-schedule-status-field");
    const customInput = document.querySelector("#setting-custom-schedule-status");
    customField.hidden = !isCustom;
    customInput.disabled = !isCustom;
    customInput.required = isCustom;
    return;
  }
  const prefixSelect = event.target.closest("[data-number-records]");
  if (!prefixSelect) return;
  const items = prefixSelect.dataset.numberRecords === "cables" ? state.cables : state.conduits;
  const prefixForm = prefixSelect.closest(".modal-form");
  const numberInput = modalRoot.querySelector("#modal-number");
  if (numberInput) {
    if (prefixSelect.dataset.numberRecords === "cables" && Number(prefixForm?.elements.namedItem("parallelSets")?.value) > 1) {
      updateParallelNumberPreview(prefixForm, true);
    } else {
      numberInput.value = nextScheduleNumber(items, prefixSelect.value);
      if (prefixSelect.dataset.numberRecords === "cables") numberInput.dataset.customized = "false";
    }
    if (prefixSelect.dataset.numberRecords === "conduits") {
      updateConduitCableOptions(prefixForm);
    }
  }
});

document.addEventListener("input", (event) => {
  const form = event.target.closest(".modal-form");
  if (form && event.target.name === "number") event.target.dataset.customized = "true";
  if (form && event.target.name === "parallelNumbers") event.target.dataset.customized = "true";
  if (form && event.target.name === "parallelSets") updateParallelNumberPreview(form);
  if (isConduitForm(form) && event.target.name === "number") {
    updateConduitCableOptions(form);
  }
  if (event.target.id === "cable-search" || event.target.id === "conduit-search") {
    const query = event.target.value.toLocaleLowerCase().trim();
    event.target.closest(".content-card").querySelectorAll("tbody tr").forEach((row) => {
      row.hidden = !row.dataset.searchable.includes(query);
    });
  }
});

document.querySelector("#export-trigger").addEventListener("click", () => {
  const menu = document.querySelector("#export-menu");
  menu.hidden = !menu.hidden;
  document.querySelector("#export-trigger").setAttribute("aria-expanded", String(!menu.hidden));
});

document.querySelector("#backup-import-input").addEventListener("change", async (event) => {
  const input = event.currentTarget;
  const file = input.files[0];
  input.value = "";
  if (file) await importProjectBackup(file);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".export-wrap")) {
    document.querySelector("#export-menu").hidden = true;
    document.querySelector("#export-trigger").setAttribute("aria-expanded", "false");
  }
});

updateWorkspace();
renderPage();
