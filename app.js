const STORAGE_KEY = "wireframe-project-v1";
const CONDUIT_SIZES = ['3/4"', '1"', '1-1/2"', '2"', '2-1/2"', '3"', '3-1/2"', '4"'];
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
const emptyState = () => ({
  settings: {
    projectName: "",
    clientName: "",
    clientProjectNumber: "",
    internalProjectNumber: "",
    revisionNumber: "",
    editorName: "",
    scheduleStatus: "In Progress",
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
    return normalizeCableTrayLocations({
      ...emptyState(),
      ...parsed,
      settings: {
        ...emptyState().settings,
        ...parsed.settings,
        scheduleStatus: parsed.settings?.scheduleStatus || "In Progress",
      },
      cables: Array.isArray(parsed.cables) ? parsed.cables : [],
      conduits: Array.isArray(parsed.conduits) ? parsed.conduits : [],
    });
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

let activePage = "dashboard";
let toastTimer;
let pendingCableDraft = null;
let pendingLocationReturn = null;
const pageContent = document.querySelector("#page-content");
const modalRoot = document.querySelector("#modal-root");
const toast = document.querySelector("#toast");
let state = loadState();
const numberCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

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
  document.querySelector("#sidebar-project-name").textContent = settings.projectName || "New Project";
  document.querySelector("#sidebar-project-number").textContent = settings.internalProjectNumber || "Project Workspace";
  document.querySelector("#editor-avatar").textContent = (settings.editorName || "E").trim().charAt(0).toUpperCase();
  document.querySelector("#cable-nav-count").textContent = state.cables.length;
  document.querySelector("#conduit-nav-count").textContent = state.conduits.length;
}

function setPage(page) {
  activePage = page;
  document.querySelectorAll("[data-page]").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === page && item.classList.contains("nav-item"));
  });
  const titles = { dashboard: "Overview", cables: "Cable schedule", conduits: "Conduit schedule", bom: "Bill of Materials", settings: "Settings" };
  document.querySelector("#breadcrumb-page").textContent = titles[page];
  renderPage();
}

function renderPage() {
  updateWorkspace();
  document.body.classList.toggle("printing-bom", activePage === "bom");
  if (activePage === "settings") pageContent.innerHTML = renderSettings();
  else if (activePage === "cables") pageContent.innerHTML = renderCables();
  else if (activePage === "conduits") pageContent.innerHTML = renderConduits();
  else if (activePage === "bom") pageContent.innerHTML = renderBillOfMaterials();
  else pageContent.innerHTML = renderDashboard();
}

function projectName() {
  return state.settings.projectName || "Untitled Project";
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

function renderDashboard() {
  const settings = state.settings;
  const cableLength = sumScheduledLengths(state.cables);
  const hasUnknownCableLength = state.cables.some((cable) => !hasScheduledLength(cable.length));
  const recent = [...state.cables].slice(-5).reverse();
  return `
    <div class="page-heading">
      <div><div class="eyebrow">PROJECT OVERVIEW</div><h1>${escapeHtml(projectName())}</h1><p>Your cable and conduit schedules, all in one place.</p></div>
      <div class="heading-actions"><button class="button button-secondary" data-page="settings"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Project settings</button><button class="button button-primary" data-action="new-cable"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>New cable</button></div>
    </div>
    <div class="overview-grid">
      <article class="metric-card"><div class="metric-top">Total cables <span class="metric-icon">⌁</span></div><div class="metric-value">${state.cables.length}</div><div class="metric-sub">Across the project schedule</div></article>
      <article class="metric-card"><div class="metric-top">Total conduits <span class="metric-icon">▤</span></div><div class="metric-value">${state.conduits.length}</div><div class="metric-sub">With ${state.conduits.reduce((sum, conduit) => sum + conduit.cableIds.length, 0)} cable assignments</div></article>
      <article class="metric-card"><div class="metric-top">Scheduled cable length <span class="metric-icon">↔</span></div><div class="metric-value">${hasUnknownCableLength ? `<span class="tag tbd">TBD</span>` : `${formatNumber(cableLength)}<span style="font-size:13px;font-weight:500;letter-spacing:0"> ft</span>`}</div><div class="metric-sub">${hasUnknownCableLength ? "One or more cable lengths not set" : "Combined cable footage"}</div></article>
    </div>
    <section class="content-card" style="margin-bottom:18px">
      <div class="card-heading"><div><h2>Project details</h2><p>Project identifiers and schedule ownership</p></div><button class="text-button" data-page="settings">Edit details →</button></div>
      <div class="project-details">
        ${detail("Client Name", settings.clientName)}
        ${detail("Client Project #", settings.clientProjectNumber)}
        ${detail("Internal Project #", settings.internalProjectNumber)}
        ${detail("Revision", settings.revisionNumber)}
        ${detail("Designer", settings.editorName)}
        ${detail("Cable types", settings.cableTypes.length)}
        ${detail("Locations", settings.locations.length)}
        ${detail("Schedule status", scheduleStatus())}
      </div>
    </section>
    <section class="content-card">
      <div class="card-heading"><div><h2>Recently added cables</h2><p>Your latest cable schedule entries</p></div><button class="text-button" data-page="cables">View cable schedule →</button></div>
      ${recent.length ? `<div class="table-wrap"><table><thead><tr><th>Cable number</th><th>Type</th><th>Length</th><th>Route</th><th>Purpose</th></tr></thead><tbody>${recent.map((cable) => {
        const type = cableType(cable.cableTypeId);
        return `<tr><td class="primary-cell">${escapeHtml(cable.number)}</td><td>${escapeHtml(type?.specNumber || "—")}<span class="secondary-cell">${escapeHtml(type?.specType || "Cable type unavailable")}</span></td><td>${renderScheduledLength(cable.length)}</td><td>${escapeHtml(cableLocationName(cable.fromLocationId))} <span style="color:#a6aeba">→</span> ${escapeHtml(cableLocationName(cable.toLocationId))}</td><td>${escapeHtml(cable.purpose || "—")}</td></tr>`;
      }).join("")}</tbody></table></div>` : `<div class="empty-state"><div class="empty-icon">⌁</div><h3>Your schedule starts here</h3><p>Add cable types and equipment locations in Settings, then create your first cable schedule entry.</p><button class="button button-primary" data-action="new-cable"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Create a cable</button></div>`}
    </section>`;
}

function detail(label, value) {
  return `<div class="detail-item"><label>${escapeHtml(label)}</label><span>${escapeHtml(value === 0 ? "0" : value || "Not set")}</span></div>`;
}

function scheduleStatus() {
  return state.settings.scheduleStatus || "In progress";
}

function renderCables() {
  const rows = sortByNumber(state.cables);
  return `
    <div class="page-heading">
      <div><div class="eyebrow">SCHEDULES / CABLES</div><h1>Cable schedule</h1><p>Define cable runs, specifications, and endpoints for this project.</p></div>
      <div class="heading-actions"><button class="button button-primary" data-action="new-cable"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add cable</button></div>
    </div>
    <div class="schedule-info"><strong>${rows.length} ${rows.length === 1 ? "cable" : "cables"}</strong><span class="divider"></span><span>${renderLengthSummary(rows)}</span><span class="divider"></span><span>${state.settings.cableTypes.length} cable types available</span></div>
    <section class="content-card">
      ${rows.length ? `<div class="card-heading"><div><h2>All cables</h2><p>Click a row action to edit or remove a schedule entry</p></div><div class="toolbar"><label class="search-box"><span class="search-icon">⌕</span><input id="cable-search" type="search" placeholder="Search cables..." aria-label="Search cables" /></label></div></div><div class="table-wrap"><table><thead><tr><th>Cable number</th><th>Manufacturer / spec</th><th>Spec type</th><th>Length</th><th>From</th><th>To</th><th>Purpose</th><th>Conduit assignment</th><th></th></tr></thead><tbody id="cable-rows">${rows.map(renderCableRow).join("")}</tbody></table></div><div class="table-footer"><span>Showing ${rows.length} of ${rows.length} cables</span><span>Length in feet</span></div>` : `<div class="empty-state"><div class="empty-icon">⌁</div><h3>No cables yet</h3><p>Create your first cable schedule entry. Cable types and locations are managed in Settings.</p><button class="button button-primary" data-action="new-cable"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add your first cable</button></div>`}
    </section>`;
}

function renderCableRow(cable) {
  const type = cableType(cable.cableTypeId);
  const conduits = state.conduits.filter((conduit) => conduit.cableIds.includes(cable.id));
  const conduitStatus = conduits.length
    ? `<span class="tag">Assigned</span><span class="secondary-cell">${escapeHtml(conduits.map((conduit) => conduit.number).join(", "))}</span>`
    : `<span class="tag neutral">Unassigned</span>`;
  return `<tr data-searchable="${escapeHtml([cable.number, type?.manufacturer, type?.specNumber, type?.specType, cableLocationName(cable.fromLocationId), cableLocationName(cable.toLocationId), cable.purpose].join(" ").toLowerCase())}">
    <td class="primary-cell">${escapeHtml(cable.number)}</td>
    <td>${escapeHtml(type?.manufacturer || "—")}<span class="secondary-cell">${escapeHtml(type?.specNumber || "Type unavailable")}</span></td>
    <td>${escapeHtml(type?.specType || "—")}</td><td>${renderScheduledLength(cable.length)}</td>
    <td>${escapeHtml(cableLocationName(cable.fromLocationId))}</td><td>${escapeHtml(cableLocationName(cable.toLocationId))}</td>
    <td>${escapeHtml(cable.purpose || "—")}</td><td>${conduitStatus}</td><td><div class="table-actions"><button class="icon-button" data-action="edit-cable" data-id="${cable.id}" aria-label="Edit ${escapeHtml(cable.number)}">✎</button><button class="icon-button" data-action="duplicate-cable" data-id="${cable.id}" aria-label="Duplicate ${escapeHtml(cable.number)}" title="Duplicate cable">⧉</button><button class="icon-button delete" data-action="delete-cable" data-id="${cable.id}" aria-label="Delete ${escapeHtml(cable.number)}">×</button></div></td>
  </tr>`;
}

function renderConduits() {
  const rows = sortByNumber(state.conduits);
  return `
    <div class="page-heading">
      <div><div class="eyebrow">SCHEDULES / CONDUITS</div><h1>Conduit schedule</h1><p>Document conduit routes and assign scheduled cables to each run.</p></div>
      <div class="heading-actions"><button class="button button-primary" data-action="new-conduit"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add conduit</button></div>
    </div>
    <div class="schedule-info"><strong>${rows.length} ${rows.length === 1 ? "conduit" : "conduits"}</strong><span class="divider"></span><span>${renderLengthSummary(rows)}</span><span class="divider"></span><span>${state.cables.length} cables available to assign</span></div>
    <section class="content-card">
      ${rows.length ? `<div class="card-heading"><div><h2>All conduits</h2><p>Review routing and cable assignments</p></div><div class="toolbar"><label class="search-box"><span class="search-icon">⌕</span><input id="conduit-search" type="search" placeholder="Search conduits..." aria-label="Search conduits" /></label></div></div><div class="table-wrap"><table><thead><tr><th>Conduit number</th><th>Size</th><th>Length</th><th>From</th><th>To</th><th>Assigned cables</th><th></th></tr></thead><tbody>${rows.map((conduit) => `<tr data-searchable="${escapeHtml([conduit.number, conduit.size, locationName(conduit.fromLocationId), locationName(conduit.toLocationId), ...conduit.cableIds.map((id) => state.cables.find((cable) => cable.id === id)?.number)].join(" ").toLowerCase())}">
        <td class="primary-cell">${escapeHtml(conduit.number)}</td><td>${conduit.size ? `<span class="tag neutral">${escapeHtml(conduit.size)}</span>` : `<span class="tag tbd">TBD</span>`}</td><td>${renderScheduledLength(conduit.length)}</td><td>${escapeHtml(locationName(conduit.fromLocationId))}</td><td>${escapeHtml(locationName(conduit.toLocationId))}</td>
        <td>${conduit.cableIds.length ? `<span class="tag blue">${conduit.cableIds.length} ${conduit.cableIds.length === 1 ? "cable" : "cables"}</span><span class="secondary-cell">${escapeHtml(conduit.cableIds.map((id) => state.cables.find((cable) => cable.id === id)?.number || "Removed").join(", "))}</span>` : `<span class="tag neutral">Unassigned</span>`}</td>
        <td><div class="table-actions"><button class="icon-button" data-action="edit-conduit" data-id="${conduit.id}" aria-label="Edit ${escapeHtml(conduit.number)}">✎</button><button class="icon-button delete" data-action="delete-conduit" data-id="${conduit.id}" aria-label="Delete ${escapeHtml(conduit.number)}">×</button></div></td>
      </tr>`).join("")}</tbody></table></div><div class="table-footer"><span>Showing ${rows.length} of ${rows.length} conduits</span><span>Length in feet</span></div>` : `<div class="empty-state"><div class="empty-icon">▤</div><h3>No conduits yet</h3><p>Create a conduit route, then assign any cables in your cable schedule.</p><button class="button button-primary" data-action="new-conduit"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add your first conduit</button></div>`}
    </section>`;
}

function renderBillOfMaterials() {
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
    const size = String(conduit.size || "").trim() || "TBD";
    const key = size.toLocaleLowerCase();
    if (!conduitGroups.has(key)) conduitGroups.set(key, { size, conduits: [] });
    conduitGroups.get(key).conduits.push(conduit);
  });
  const usedConduitSizes = [...conduitGroups.values()].sort((a, b) => numberCollator.compare(a.size, b.size));
  const settings = state.settings;

  return `
    <div class="bom-page">
      <div class="page-heading">
        <div><div class="eyebrow">PROJECT MATERIALS</div><h1>Bill of Materials</h1><p>Material totals summarized from the cable and conduit schedules for purchasing and field coordination.</p></div>
        <div class="heading-actions print-hide"><button class="button button-primary" data-action="print-bom"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 7V3h10v4M5 14H3V8h14v6h-2M5 11h10v6H5z" /></svg>Print bill of materials</button></div>
      </div>
      <section class="content-card bom-project-card">
        <div class="bom-project-title"><div><h2>${escapeHtml(projectName())}</h2><p>Bill of Materials</p></div><span class="bom-generated">Generated ${escapeHtml(new Date().toLocaleDateString())}</span></div>
        <div class="bom-project-meta">
          ${detail("Client", settings.clientName)}
          ${detail("Client Project #", settings.clientProjectNumber)}
          ${detail("Internal Project #", settings.internalProjectNumber)}
          ${detail("Revision", settings.revisionNumber)}
          ${detail("Designer", settings.editorName)}
        </div>
      </section>
      <section class="content-card bom-section">
        <div class="card-heading"><div><h2>Cable materials</h2><p>Cable types used in this project</p></div></div>
        ${usedCableTypes.length ? `<div class="table-wrap"><table><thead><tr><th>Manufacturer / spec number</th><th>Spec type</th><th>Total length (ft)</th></tr></thead><tbody>${usedCableTypes.map(({ type, cables }) => {
          return `<tr><td class="primary-cell">${escapeHtml(type?.manufacturer || "Cable type unavailable")}<span class="secondary-cell">${escapeHtml(type?.specNumber || "Specification unavailable")}</span></td><td>${escapeHtml(type?.specType || "—")}</td><td>${renderLengthTotal(cables)}</td></tr>`;
        }).join("")}</tbody></table></div>` : `<div class="bom-empty">No cable types are currently used in the cable schedule.</div>`}
      </section>
      <section class="content-card bom-section">
        <div class="card-heading"><div><h2>Conduit materials</h2><p>Conduit sizes used in this project</p></div></div>
        ${usedConduitSizes.length ? `<div class="table-wrap"><table><thead><tr><th>Conduit size</th><th>Total length (ft)</th></tr></thead><tbody>${usedConduitSizes.map(({ size, conduits }) => {
          return `<tr><td class="primary-cell">${size === "TBD" ? `<span class="tag tbd">TBD</span>` : escapeHtml(size)}</td><td>${renderLengthTotal(conduits)}</td></tr>`;
        }).join("")}</tbody></table></div>` : `<div class="bom-empty">No conduit sizes are currently used in the conduit schedule.</div>`}
      </section>
      <p class="bom-note">Material lengths are based on scheduled totals. Confirm field requirements and installation allowances before ordering.</p>
    </div>`;
}

function renderSettings() {
  const settings = state.settings;
  const equipmentLocations = sortByName(settings.locations.filter((location) => !isCableTrayLocation(location)));
  return `
    <div class="page-heading"><div><div class="eyebrow">PROJECT CONFIGURATION</div><h1>Settings</h1><p>Manage project information, cable specifications, and equipment locations.</p></div></div>
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
          <div class="settings-submit"><button class="button button-primary" type="submit">Save project details</button></div>
        </form>
      </section>
      <section class="content-card settings-section">
        <div class="card-heading section-title-row"><div><h2>Cable types <span class="tag neutral">${settings.cableTypes.length}</span></h2><p>Reusable manufacturer and specification details for cable entries</p></div><button class="button button-secondary" data-action="new-cable-type"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add cable type</button></div>
        <div class="settings-list">${settings.cableTypes.length ? settings.cableTypes.map((type) => `<div class="settings-list-row"><div class="settings-item-main"><strong>${escapeHtml(type.manufacturer)} <span style="color:#a1a9b4;font-weight:400">·</span> ${escapeHtml(type.specNumber)}</strong><small>${escapeHtml(type.specType)} · ${formatNumber(type.diameter)} in OD · ${formatNumber(type.netWeight)} lbs/1000'${safeHttpUrl(type.url) ? ` · <a href="${escapeHtml(safeHttpUrl(type.url))}" target="_blank" rel="noopener noreferrer" style="color:#4268e8">Details ↗</a>` : ""}</small></div><div class="table-actions"><button class="icon-button" data-action="edit-cable-type" data-id="${type.id}" aria-label="Edit ${escapeHtml(type.specNumber)}">✎</button><button class="icon-button delete" data-action="delete-cable-type" data-id="${type.id}" aria-label="Delete ${escapeHtml(type.specNumber)}">×</button></div></div>`).join("") : `<div class="settings-empty">No cable types yet. Add a specification to use it in the cable schedule.</div>`}</div>
      </section>
      <section class="content-card settings-section">
        <div class="card-heading section-title-row"><div><h2>Equipment <span class="tag neutral">${equipmentLocations.length}</span></h2><p>Equipment appears in the From and To dropdowns on schedules</p></div><button class="button button-secondary" data-action="new-location"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Add Equipment</button></div>
        <div class="settings-list">${equipmentLocations.length ? equipmentLocations.map((location) => `<div class="settings-list-row"><div class="settings-item-main"><strong>${escapeHtml(locationDisplayName(location))}</strong></div><div class="table-actions"><button class="icon-button" data-action="edit-location" data-id="${location.id}" aria-label="Edit ${escapeHtml(location.name)}">✎</button><button class="icon-button delete" data-action="delete-location" data-id="${location.id}" aria-label="Delete ${escapeHtml(location.name)}">×</button></div></div>`).join("") : `<div class="settings-empty">No equipment yet. Add equipment to use it on schedules.</div>`}</div>
      </section>
    </div>`;
}

function settingsField(name, label, value, placeholder) {
  return `<div class="field"><label for="setting-${name}">${escapeHtml(label)}</label><input id="setting-${name}" name="${name}" value="${escapeHtml(value || "")}" placeholder="${escapeHtml(placeholder)}" /></div>`;
}

function scheduleStatusField(value) {
  const isCustom = Boolean(value) && !SCHEDULE_STATUSES.includes(value);
  const selectedStatus = isCustom ? "custom" : value || "In progress";
  return `<div class="field"><label for="setting-scheduleStatus">Schedule status</label><select id="setting-scheduleStatus" name="scheduleStatus">${SCHEDULE_STATUSES.map((status) => `<option value="${escapeHtml(status)}" ${selectedStatus === status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}<option value="custom" ${selectedStatus === "custom" ? "selected" : ""}>Custom status…</option></select></div>
    <div class="field" id="custom-schedule-status-field" ${isCustom ? "" : "hidden"}><label for="setting-custom-schedule-status">Custom status</label><input id="setting-custom-schedule-status" name="customScheduleStatus" value="${escapeHtml(isCustom ? value : "")}" ${isCustom ? "required" : "disabled"} /></div>`;
}

function options(items, selectedId) {
  return `<option value="">Select…</option>${items.map((item) => `<option value="${item.id}" ${item.id === selectedId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}`;
}

function openModal(title, subtitle, formKind, fields, submitLabel = "Save") {
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-header"><div><h2 id="modal-title">${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><button type="button" class="modal-close" data-action="close-modal" aria-label="Close dialog">×</button></div>
    <form class="modal-form" data-form="${formKind}">${fields}<div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">${escapeHtml(submitLabel)}</button></div></form>
  </section></div>`;
  modalRoot.querySelector(".modal-backdrop").addEventListener("click", (event) => {
    if (event.target.classList.contains("modal-backdrop")) closeModal();
  });
  modalRoot.querySelector(".modal-close").focus();
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
  return `<div class="field${full}"><label for="modal-${name}">${escapeHtml(label)}${options.optional ? ` <span class="optional">(optional)</span>` : ""}</label><input id="modal-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}"${required}${step}${min} /></div>`;
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

function scheduleNumberField(label, items, recordType, prefix = "P", value = "", full = false) {
  const selectedPrefix = ["P", "C", "S"].includes(prefix) ? prefix : "P";
  const number = value || nextScheduleNumber(items, selectedPrefix);
  return `<div class="field${full ? " full" : ""}"><label for="modal-number">${escapeHtml(label)}</label><div class="number-prefix-entry"><select id="modal-number-prefix" name="numberPrefix" data-number-records="${recordType}" aria-label="${escapeHtml(label)} prefix"><option value="P" ${selectedPrefix === "P" ? "selected" : ""}>P · Power</option><option value="C" ${selectedPrefix === "C" ? "selected" : ""}>C · Control</option><option value="S" ${selectedPrefix === "S" ? "selected" : ""}>S · Spare</option></select><input id="modal-number" name="number" value="${escapeHtml(number)}" placeholder="e.g. ${selectedPrefix}101" required /></div></div>`;
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
  const needsLocations = !state.settings.locations.length;
  const setupNote = needsLocations ? `<p class="form-note">Add at least one location using New location below or in <a href="#" data-page="settings">Settings</a>.</p>` : "";
  const cableTypeId = draft.cableTypeId || cable?.cableTypeId;
  const numberField = cable
    ? textField("number", "Cable number", draft.number ?? cable.number, "e.g. C-101")
    : scheduleNumberField("Cable number", state.cables, "cables", draft.numberPrefix || numberPrefixFrom(draft.number), draft.number);
  const fields = `${setupNote}<div class="form-grid">
    ${numberField}
    ${textField("length", "Cable length (ft)", draft.length ?? cable?.length ?? "", "e.g. 250", { type: "number", min: "0", step: "0.01", required: false, optional: true })}
    <div class="field full"><label for="modal-cableTypeId">Cable type</label><div class="inline-select-action"><select id="modal-cableTypeId" name="cableTypeId" required>${options(state.settings.cableTypes.map((type) => ({ id: type.id, name: [type.specType, type.manufacturer, type.specNumber].filter(Boolean).join(" · ") })), cableTypeId)}</select><button class="button button-secondary" type="button" data-action="add-cable-type-inline">+ New type</button></div></div>
    ${routeLocationField("fromLocationId", "From location", draft.fromLocationId || cable?.fromLocationId, true)}
    ${routeLocationField("toLocationId", "To location", draft.toLocationId || cable?.toLocationId, true)}
    ${textField("purpose", "Cable purpose", draft.purpose ?? cable?.purpose ?? "", "e.g. Feeder, control, instrumentation", { required: false, full: true })}
  </div>`;
  openModal(modalOptions.title || (cable ? "Edit cable" : "Add cable"), modalOptions.subtitle || "Enter the cable schedule details and route.", cable ? `edit-cable:${id}` : "new-cable", fields, modalOptions.submitLabel || (cable ? "Save changes" : "Add cable"));
  if (needsLocations) modalRoot.querySelector('[type="submit"]').disabled = true;
}

function openConduitForm(id, draft = {}) {
  const conduit = state.conduits.find((item) => item.id === id);
  const needsLocations = !state.settings.locations.length;
  const setupNote = needsLocations ? `<p class="form-note">Add at least one location using New location below or in <a href="#" data-page="settings">Settings</a>.</p>` : "";
  const assignedCableIds = draft.cableIds || conduit?.cableIds || [];
  const numberField = conduit
    ? textField("number", "Conduit number", draft.number ?? conduit.number, "e.g. CON-101", { full: true })
    : scheduleNumberField("Conduit number", state.conduits, "conduits", draft.numberPrefix || numberPrefixFrom(draft.number), draft.number, true);
  const cableOptions = state.cables.length ? `<div class="field full"><label>Assign cables <span class="optional">(optional)</span></label><p class="form-note assignment-warning" hidden>Remove incompatible cable assignments before saving this conduit.</p><div class="checkbox-list" role="group" aria-label="Assign cables">
    <div class="checkbox-list-header" aria-hidden="true"><span>Select</span><span>Cable number</span><span>From → To</span><span>Cable type / spec</span></div>
    ${sortCablesByPrefix(state.cables).map((cable) => {
      const type = cableType(cable.cableTypeId);
      const typeDetails = [type?.manufacturer, type?.specNumber].filter(Boolean).join(" · ");
      return `<label class="checkbox-option" data-cable-prefix="${numberPrefixFrom(cable.number)}" data-from-location-name="${escapeHtml(locationNameKey(cable.fromLocationId))}" data-to-location-name="${escapeHtml(locationNameKey(cable.toLocationId))}"><input type="checkbox" name="cableIds" value="${escapeHtml(cable.id)}" aria-label="Assign cable ${escapeHtml(cable.number)}" ${assignedCableIds.includes(cable.id) ? "checked" : ""} /><span class="checkbox-cable-number">${escapeHtml(cable.number)}</span><span class="checkbox-cable-route">${escapeHtml(cableLocationName(cable.fromLocationId))}<span aria-hidden="true"> → </span>${escapeHtml(cableLocationName(cable.toLocationId))}</span><span class="checkbox-cable-type"><strong>${escapeHtml(type?.specType || "Cable type unavailable")}</strong><small>${escapeHtml(typeDetails || "Specification unavailable")}</small><small class="checkbox-cable-incompatible" hidden>Not allowed for this conduit</small></span></label>`;
    }).join("")}
    <div class="checkbox-list-empty" hidden></div>
  </div></div>` : `<div class="field full"><label>Assign cables <span class="optional">(optional)</span></label><p class="form-note">No cables are available yet. Add cables from the Cable schedule to assign them here.</p></div>`;
  const fields = `${setupNote}<div class="form-grid">
    ${numberField}
    ${conduitSizeField(draft.size ?? conduit?.size ?? "")}
    ${textField("length", "Conduit length (ft)", draft.length ?? conduit?.length ?? "", "e.g. 120", { type: "number", min: "0", step: "0.01", required: false, optional: true })}
    ${routeLocationField("fromLocationId", "From location", draft.fromLocationId || conduit?.fromLocationId, false, true, true)}
    ${routeLocationField("toLocationId", "To location", draft.toLocationId || conduit?.toLocationId, false, true, true)}
    ${cableOptions}
  </div>`;
  openModal(conduit ? "Edit conduit" : "Add conduit", "Define the conduit route and cable assignments.", conduit ? `edit-conduit:${id}` : "new-conduit", fields, conduit ? "Save changes" : "Add conduit");
  updateConduitCableOptions(modalRoot.querySelector(".modal-form"));
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

function isConduitForm(form) {
  return form?.dataset.form === "new-conduit" || form?.dataset.form.startsWith("edit-conduit:");
}

function openCableTypeForm(id, returnToCableDraft = null) {
  const type = state.settings.cableTypes.find((item) => item.id === id);
  const fields = `<div class="form-grid">
    ${textField("manufacturer", "Manufacturer", type?.manufacturer || "", "e.g. Anixter")}
    ${textField("specNumber", "Spec number", type?.specNumber || "", "e.g. 115-23-3804")}
    ${textField("specType", "Spec type", type?.specType || "", "e.g. 3/C #1/0 AWG 15kV", { full: true })}
    ${textField("diameter", "Overall diameter (in)", type?.diameter ?? "", "e.g. 1.42", { type: "number", min: "0", step: "0.001" })}
    ${textField("netWeight", "Net weight (lbs/1000')", type?.netWeight ?? "", "e.g. 1120", { type: "number", min: "0", step: "0.01" })}
    ${textField("url", "URL to details", type?.url || "", "https://...", { type: "url", required: false, full: true, optional: true })}
  </div>`;
  openModal(type ? "Edit cable type" : "Add cable type", "Save a reusable cable specification for this project.", type ? `edit-cable-type:${id}` : returnToCableDraft ? "new-cable-type-inline" : "new-cable-type", fields, type ? "Save changes" : "Add cable type");
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
  openModal(location ? "Edit location" : "Add location", "Locations are available as cable and conduit route endpoints.", location ? `edit-location:${id}` : returnContext ? "new-location-inline" : "new-location", fields, location ? "Save changes" : "Add location");
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
    Object.keys(state.settings).filter((key) => !["cableTypes", "locations"].includes(key)).forEach((key) => {
      state.settings[key] = String(formData.get(key) || "").trim();
    });
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
    const type = { id, manufacturer: values.manufacturer.trim(), specNumber: values.specNumber.trim(), specType: values.specType.trim(), diameter: Number(values.diameter), netWeight: Number(values.netWeight), url: values.url.trim() };
    const detailsUrl = safeHttpUrl(type.url);
    if (type.url && !detailsUrl) return showToast("Enter an HTTP or HTTPS URL for cable details.", true);
    type.url = detailsUrl || "";
    if (isDuplicate(state.settings.cableTypes, type.specNumber, id, "specNumber")) return showToast("A cable type with that spec number already exists.", true);
    const index = state.settings.cableTypes.findIndex((item) => item.id === id);
    if (index >= 0) state.settings.cableTypes[index] = type;
    else state.settings.cableTypes.push(type);
    if (kind === "new-cable-type-inline") {
      if (persist()) {
        const draft = pendingCableDraft;
        pendingCableDraft = null;
        closeModal();
        openCableForm(undefined, { ...draft, cableTypeId: id });
        showToast("Cable type added. Finish creating your cable.");
      }
    } else {
      saveAndClose(index >= 0 ? "Cable type updated." : "Cable type added.");
    }
  } else if (kind === "new-cable" || kind.startsWith("edit-cable:")) {
    const id = kind.startsWith("edit-cable:") ? kind.split(":")[1] : makeId();
    const cable = { id, number: values.number.trim(), length: values.length === "" ? null : Number(values.length), cableTypeId: values.cableTypeId, fromLocationId: values.fromLocationId, toLocationId: values.toLocationId, purpose: values.purpose.trim() };
    if (isDuplicate(state.cables, cable.number, id, "number")) return showToast("A cable with that number already exists.", true);
    const index = state.cables.findIndex((item) => item.id === id);
    if (index >= 0) state.cables[index] = cable;
    else state.cables.push(cable);
    saveAndClose(index >= 0 ? "Cable updated." : "Cable added.");
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
    const conduit = { id, number, size: values.size.trim() || null, length: values.length === "" ? null : Number(values.length), fromLocationId: values.fromLocationId, toLocationId: values.toLocationId, cableIds: formData.getAll("cableIds") };
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

function handleAction(action, id, fieldName) {
  if (action === "close-modal") return closeModal();
  if (action === "return-to-cable") {
    const draft = pendingCableDraft;
    pendingCableDraft = null;
    closeModal();
    return openCableForm(undefined, draft || {});
  }
  if (action === "return-to-route") {
    const returnContext = pendingLocationReturn;
    pendingLocationReturn = null;
    closeModal();
    return returnToRoute(returnContext);
  }
  if (action === "new-cable") return openCableForm();
  if (action === "add-cable-type-inline") {
    const formData = new FormData(modalRoot.querySelector(".modal-form"));
    return openCableTypeForm(undefined, Object.fromEntries(formData.entries()));
  }
  if (action === "edit-cable") return openCableForm(id);
  if (action === "duplicate-cable") {
    const cable = state.cables.find((item) => item.id === id);
    if (!cable) return;
    return openCableForm(undefined, { ...cable, number: "", numberPrefix: numberPrefixFrom(cable.number) }, {
      title: "Duplicate cable",
      subtitle: `Copy of ${cable.number}. Enter a new cable number and adjust the details before saving.`,
      submitLabel: "Create duplicate",
    });
  }
  if (action === "new-conduit") return openConduitForm();
  if (action === "edit-conduit") return openConduitForm(id);
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
    if (cable && confirm(`Delete cable ${cable.number}? Assigned conduit references will be removed.`)) {
      state.conduits.forEach((conduit) => { conduit.cableIds = conduit.cableIds.filter((cableId) => cableId !== id); });
      removeRecord(state.cables, id, "Cable");
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
  if (action === "export-project") exportJson();
  if (action === "import-project") {
    document.querySelector("#export-menu").hidden = true;
    document.querySelector("#export-trigger").setAttribute("aria-expanded", "false");
    document.querySelector("#backup-import-input").click();
  }
  if (action === "print-bom") window.print();
}

function cableExportRows() {
  return [
    ["Cable Number", "Cable Length (ft)", "Manufacturer", "Spec Number", "Spec Type", "Overall Diameter (in)", "Net Weight (lbs/1000')", "From Location", "To Location", "Cable Purpose"],
    ...sortByNumber(state.cables).map((cable) => {
      const type = cableType(cable.cableTypeId);
      return [cable.number, cable.length, type?.manufacturer, type?.specNumber, type?.specType, type?.diameter, type?.netWeight, cableLocationName(cable.fromLocationId), cableLocationName(cable.toLocationId), cable.purpose];
    }),
  ];
}

function conduitExportRows() {
  return [
    ["Conduit Number", "Size", "Conduit Length (ft)", "From Location", "To Location", "Assigned Cable Numbers"],
    ...sortByNumber(state.conduits).map((conduit) => [conduit.number, conduit.size, conduit.length, locationName(conduit.fromLocationId), locationName(conduit.toLocationId), conduit.cableIds.map((id) => state.cables.find((cable) => cable.id === id)?.number).filter(Boolean).join("; ")]),
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
        cable.purpose || null,
      ]);
    });

    if (conduitIndex < conduits.length - 1) rows.push(null);
  });

  return rows;
}

function exportConduitCableCsv() {
  const rows = conduitCableExportRows().map((row, rowIndex) =>
    row === null ? null : row.map((cell, columnIndex) =>
      typeof cell === "string" && !(rowIndex > 0 && columnIndex === 3) ? cell.toUpperCase() : cell));
  exportCsv(projectFileName("csv", "Conduit Cable Schedule"), rows);
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
  download(projectFileName("ccs"), JSON.stringify(backup, null, 2), "application/json");
}

function projectFileName(extension, scheduleName = "") {
  const fileNameParts = [
    state.settings.internalProjectNumber,
    state.settings.clientName,
    state.settings.projectName,
    scheduleName,
  ].map((part) => String(part || "").trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/\s+/g, " ").replace(/[. ]+$/g, ""))
    .filter(Boolean);
  return `${fileNameParts.join(" - ") || "project"}.${extension}`;
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
  const textSettings = ["projectName", "clientName", "clientProjectNumber", "internalProjectNumber", "revisionNumber", "editorName", "scheduleStatus"];
  if (!textSettings.every((key) => typeof settings[key] === "string")) {
    throw new Error("The backup contains invalid project settings.");
  }
  validateItems(settings.cableTypes, "cable types", (item) =>
    isRecord(item) && isText(item.id) &&
    (item.url === undefined || item.url === null ||
      (typeof item.url === "string" && (!item.url.trim() || Boolean(safeHttpUrl(item.url))))));
  validateItems(settings.locations, "locations", (item) => isRecord(item) && isText(item.id) && isText(item.name));
  validateItems(backup.cables, "cables", (item) => isRecord(item) && isText(item.id) && isText(item.number));
  validateItems(backup.conduits, "conduits", (item) =>
    isRecord(item) && isText(item.id) && isText(item.number) &&
    Array.isArray(item.cableIds) && item.cableIds.every((id) => typeof id === "string"));

  return normalizeCableTrayLocations({
    settings,
    cables: backup.cables,
    conduits: backup.conduits,
  });
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
    if (action === "backdrop-close") return;
    if (action === "export-trigger") return;
    handleAction(action, actionElement.dataset.id, actionElement.dataset.field);
  }
});

const appShell = document.querySelector(".app-shell");
const sidebarToggle = document.querySelector("#sidebar-toggle");
sidebarToggle.addEventListener("click", () => {
  const isCollapsed = appShell.classList.toggle("sidebar-collapsed");
  const label = isCollapsed ? "Expand sidebar" : "Minimize sidebar";
  sidebarToggle.setAttribute("aria-label", label);
  sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
  sidebarToggle.dataset.tooltip = label;
});

document.addEventListener("submit", handleSubmit);
document.addEventListener("change", (event) => {
  const form = event.target.closest(".modal-form");
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
  const numberInput = modalRoot.querySelector("#modal-number");
  if (numberInput) {
    numberInput.value = nextScheduleNumber(items, prefixSelect.value);
    if (prefixSelect.dataset.numberRecords === "conduits") {
      updateConduitCableOptions(modalRoot.querySelector(".modal-form"));
    }
  }
});

document.addEventListener("input", (event) => {
  const form = event.target.closest(".modal-form");
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
