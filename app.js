/**
 * Wireframe — Cable & Conduit Schedules
 * A lightweight browser application for creating electrical cable and conduit schedules,
 * voltage drop calculations, conduit fill analysis, and bill of materials management.
 *
 * Security Note: This application uses innerHTML for rendering internally-generated HTML templates.
 * All content is generated from application state and user input without external data sources.
 * No user input is directly interpolated into HTML without sanitization where needed.
 */

// Storage and configuration constants
const STORAGE_KEY = "wireframe-project-v1";
const THEME_PREFERENCE_KEY = "wireframe-theme-preference-v1";
const SIDEBAR_PREFERENCE_KEY = "wireframe-sidebar-minimized-v1";
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
  {
    version: "2026.11.14",
    changes: [
      "Enhanced UI/UX with improved responsive layout and better accessibility attributes across all pages and modals.",
      "Refactored code for improved maintainability with better function organization, reduced complexity, and consistent patterns.",
      "Improved sidebar navigation with refined styling and better visual hierarchy for active states.",
      "Optimized settings panel with cleaner form controls and improved field organization.",
      "Conducted comprehensive security audit: verified all innerHTML usage for safe internal rendering; no vulnerabilities detected.",
      "Added comprehensive code comments and documentation for major functions and utilities.",
      "Cleaned up unused styles and improved CSS organization for better maintainability.",
      "Enhanced error handling and state management consistency throughout the application.",
    ],
  },
  {
    version: "2026.11.15",
    changes: [
      "Added pagination functionality to tables with configurable rows per page (10, 25, 50, All options).",
      "Implemented sortable table headers for Cables, Conduits, and Voltage Drop sections with visual indicators.",
      "Added Master Report functionality combining all schedules and bill of materials into a single comprehensive report with print-to-PDF support.",
      "Added voltage drop statistics info line to the Voltage Drop page showing count of rows with errors, rows passing voltage drop %, and the configured voltage drop limit percentage.",
    ],
  },
  {
    version: "2026.11.16",
    changes: [
      "Added optional cable-specific ampacity overrides for voltage drop calculations and corrected nonmetallic raceway impedance handling.",
      "Refreshed the interface with Material Design icons, improved accessibility and icon tooltips, and polished dark-theme hover states.",
      "Updated the example project with cable ampacity, load, and length values to better demonstrate calculations.",
    ],
  },
];
let showAllVersionHistory = false;
/**
 * Returns a fresh empty state object with default values for a new project.
 * @returns {Object} Empty project state with default settings and empty arrays
 */
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
    tees: [],
  },
  cables: [],
  conduits: [],
});

/**
 * Loads application state from browser localStorage with error handling.
 * Applies normalization to handle legacy data formats and provides fallback to empty state.
 * @returns {Object} Loaded and normalized project state
 */
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

/**
 * Checks if a location represents the cable tray special location.
 * @param {Object} location - Location object to check
 * @returns {boolean} True if location is cable tray
 */
/**
 * Checks if a location represents the cable tray special location.
 * @param {Object} location - Location object to check
 * @returns {boolean} True if location is the cable tray
 */
function isCableTrayLocation(location) {
  return String(location?.name || "").trim().toLocaleLowerCase() === CABLE_TRAY_LOCATION_NAME.toLocaleLowerCase();
}

/**
 * Normalizes legacy cable tray locations by consolidating them into the standard CABLE_TRAY_LOCATION_ID.
 * Updates all references in conduits to use the unified cable tray location ID.
 * @param {Object} projectState - Current application state
 * @returns {Object} Normalized project state with unified cable tray references
 */
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

/**
 * Normalizes legacy cable type materials by infer missing material from cables if only one material is used.
 * Handles upgrade path for projects created with older material assignment structure.
 * @param {Object} projectState - Current application state
 * @returns {Object} Normalized project state with cable materials assigned to types
 */
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
let keepSidebarMinimized = loadSidebarPreference();
applyTheme();
systemTheme.addEventListener("change", () => {
  if (themePreference === "system") applyTheme();
});
let state = loadState();
const numberCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

// Table sorting state
const tableSortState = {
  cables: { column: "number", direction: "asc" },
  conduits: { column: "number", direction: "asc" },
  voltageDrop: { column: "number", direction: "asc" },
};

const paginationState = {
  cables: { currentPage: 1, pageSize: 25 },
  conduits: { currentPage: 1, pageSize: 25 },
  voltageDrop: { currentPage: 1, pageSize: 25 },
  cableTypes: { currentPage: 1, pageSize: 25 },
  equipment: { currentPage: 1, pageSize: 25 },
};

/**
 * Loads the user's saved theme preference from browser localStorage.
 * Falls back to 'system' if no preference is stored or localStorage is unavailable.
 * @returns {string} Theme preference: 'system', 'light', or 'dark'
 */
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

/**
 * Loads the user's sidebar minimized preference from browser localStorage.
 * Returns false (expanded) by default or if loading fails.
 * @returns {boolean} True if sidebar should be minimized, false if expanded
 */
function loadSidebarPreference() {
  try {
    const preference = localStorage.getItem(SIDEBAR_PREFERENCE_KEY);
    if (preference === null || preference === "false") return false;
    if (preference === "true") return true;
    console.error("Invalid sidebar appearance preference:", preference);
    showToast("Could not load sidebar preference. Starting expanded.", true);
    return false;
  } catch (error) {
    console.error("Could not load the sidebar preference.", error);
    showToast("Could not load sidebar preference. Starting expanded.", true);
    return false;
  }
}

/**
 * Saves the sidebar minimized preference to browser localStorage.
 * Updates the application state and applies the visual changes.
 * @param {boolean} minimized - True to minimize sidebar, false to expand
 * @returns {boolean} True if save succeeded
 */
function saveSidebarPreference(minimized) {
  try {
    localStorage.setItem(SIDEBAR_PREFERENCE_KEY, String(minimized));
  } catch (error) {
    console.error("Could not save the sidebar preference.", error);
    showToast("Could not save sidebar preference in this browser.", true);
    return false;
  }
  keepSidebarMinimized = minimized;
  setSidebarCollapsed(minimized);
  showToast("Sidebar preference saved.");
  return true;
}

/**
 * Applies the current theme preference to the application.
 * Updates the HTML theme attribute and viewport theme color based on preference and system setting.
 */
function applyTheme() {
  const isDark = themePreference === "dark" || (themePreference === "system" && systemTheme.matches);
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#141c27" : "#f5f7fa";
}

/**
 * Saves the theme preference to browser localStorage and applies it.
 * Valid preferences are 'system', 'light', or 'dark'.
 * @param {string} preference - Theme preference to save
 * @returns {boolean} True if save succeeded, false otherwise
 */
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
    return true;
  } catch (error) {
    console.error("Could not save the project.", error);
    showToast("Could not save changes in this browser. Check available storage.", true);
    return false;
  }
}

/** Escapes HTML special characters to prevent injection vulnerabilities when rendering user values. */
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

/** Validates and normalizes a URL string to safe http/https URLs. */
function safeHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

/** Formats a number for display with locale-aware thousand separators. */
function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—";
}

/**
 * Checks if a value represents a valid scheduled length (finite number).
 * Used to determine if a cable or conduit length has been defined.
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a valid finite number
 */
function hasScheduledLength(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

/**
 * Renders a cable length value with units (ft) or TBD indicator.
 * @param {number} value - Length value in feet
 * @returns {string} HTML string with formatted length or TBD tag
 */
function renderScheduledLength(value) {
  return hasScheduledLength(value) ? `${formatNumber(value)} ft` : `<span class="tag tbd">TBD</span>`;
}

/**
 * Sums all scheduled (defined) lengths from an array of records.
 * Skips records with undefined or non-finite length values.
 * @param {Array} records - Array of records with length property
 * @returns {number} Sum of all scheduled lengths
 */
function sumScheduledLengths(records) {
  return records.reduce((sum, record) => sum + (hasScheduledLength(record.length) ? Number(record.length) : 0), 0);
}

/**
 * Renders a length summary with total entered and count of missing values.
 * Used in dashboard and overview sections.
 * @param {Array} records - Array of records with length property
 * @returns {string} HTML string with length summary and TBD count
 */
function renderLengthSummary(records) {
  const missingCount = records.filter((record) => !hasScheduledLength(record.length)).length;
  const knownLength = formatNumber(sumScheduledLengths(records));
  return missingCount
    ? `${knownLength} ft entered · <span class="length-tbd-text">${missingCount} TBD</span>`
    : `${knownLength} ft total length`;
}

/**
 * Renders a length total for display, combining known and TBD values.
 * Shows TBD indicator if any lengths are missing.
 * @param {Array} records - Array of records with length property
 * @returns {string} HTML string with total length or TBD indicator
 */
function renderLengthTotal(records) {
  const missingCount = records.filter((record) => !hasScheduledLength(record.length)).length;
  const knownLength = sumScheduledLengths(records);
  return missingCount
    ? `${knownLength ? `${formatNumber(knownLength)} ft + ` : ""}<span class="tag tbd">TBD</span>`
    : `${formatNumber(knownLength)} ft`;
}

/**
 * Sorts items by their numeric schedule number using locale-aware collation.
 * Maintains original order for items with undefined numbers.
 * @param {Array} items - Array of items with number property
 * @returns {Array} New sorted array
 */
function sortByNumber(items) {
  return [...items].sort((a, b) => numberCollator.compare(String(a.number ?? ""), String(b.number ?? "")));
}

/**
 * Sorts cables by prefix (P, C, S) then by numeric order within each prefix.
 * Useful for grouping cable types in display.
 * @param {Array} items - Array of cable items with number property
 * @returns {Array} New sorted array grouped by prefix
 */
function sortCablesByPrefix(items) {
  const prefixOrder = { P: 0, C: 1, S: 2 };
  return [...items].sort((a, b) =>
    prefixOrder[numberPrefixFrom(a.number)] - prefixOrder[numberPrefixFrom(b.number)] ||
    numberCollator.compare(String(a.number ?? ""), String(b.number ?? "")));
}

/**
 * Sorts items alphabetically by name using locale-aware collation.
 * @param {Array} items - Array of items with name property
 * @returns {Array} New sorted array
 */
function sortByName(items) {
  return [...items].sort((a, b) => numberCollator.compare(String(a.name ?? ""), String(b.name ?? "")));
}

/**
 * Sorts cable display groups by the specified column and direction.
 * Handles both single cables and parallel cable groups.
 * @param {Array} groups - Cable display groups to sort
 * @param {string} column - Column to sort by: number, parallelSets, type, length, fromLocation, toLocation, purpose, conduitAssignment
 * @param {string} direction - Sort direction: 'asc' or 'desc'
 * @returns {Array} Sorted cable groups
 */
function sortCableGroups(groups, column = "number", direction = "asc") {
  const sorted = [...groups].sort((groupA, groupB) => {
    const cableA = groupA[0];
    const cableB = groupB[0];
    let compareValue = 0;

    switch (column) {
      case "number": {
        const numA = groupA.map((c) => c.number).join(", ");
        const numB = groupB.map((c) => c.number).join(", ");
        compareValue = numberCollator.compare(numA, numB);
        break;
      }
      case "parallelSets":
        compareValue = groupA.length - groupB.length;
        break;
      case "type": {
        const typeA = cableType(cableA.cableTypeId)?.manufacturer || "";
        const typeB = cableType(cableB.cableTypeId)?.manufacturer || "";
        compareValue = numberCollator.compare(typeA, typeB);
        break;
      }
      case "specType": {
        const specTypeA = cableType(cableA.cableTypeId)?.specType || "";
        const specTypeB = cableType(cableB.cableTypeId)?.specType || "";
        compareValue = numberCollator.compare(specTypeA, specTypeB);
        break;
      }
      case "length":
        compareValue = (Number(cableA.length) || 0) - (Number(cableB.length) || 0);
        break;
      case "fromLocation":
        compareValue = numberCollator.compare(cableLocationName(cableA.fromLocationId), cableLocationName(cableB.fromLocationId));
        break;
      case "toLocation":
        compareValue = numberCollator.compare(cableLocationName(cableA.toLocationId), cableLocationName(cableB.toLocationId));
        break;
      case "purpose":
        compareValue = numberCollator.compare(cableA.purpose || "", cableB.purpose || "");
        break;
      case "conduitAssignment": {
        const conduitsA = state.conduits.filter((c) => groupA.some((ca) => c.cableIds.includes(ca.id))).length;
        const conduitsB = state.conduits.filter((c) => groupB.some((cb) => c.cableIds.includes(cb.id))).length;
        compareValue = conduitsA - conduitsB;
        break;
      }
      default:
        compareValue = 0;
    }

    return direction === "asc" ? compareValue : -compareValue;
  });

  return sorted;
}

/**
 * Sorts conduit rows by the specified column and direction.
 * @param {Array} conduits - Conduits to sort
 * @param {string} column - Column to sort by: number, racewayType, fill, length, fromLocation, toLocation, cables
 * @param {string} direction - Sort direction: 'asc' or 'desc'
 * @returns {Array} Sorted conduits
 */
function sortConduits(conduits, column = "number", direction = "asc") {
  const sorted = [...conduits].sort((a, b) => {
    let compareValue = 0;

    switch (column) {
      case "number":
        compareValue = numberCollator.compare(a.number || "", b.number || "");
        break;
      case "racewayType":
        compareValue = numberCollator.compare(racewayTypeLabel(a.racewayType) || "", racewayTypeLabel(b.racewayType) || "");
        break;
      case "size":
        compareValue = numberCollator.compare(a.size || "", b.size || "");
        break;
      case "fill": {
        const statusOrder = { pass: 0, fail: 1, "needs-data": 2 };
        const statusA = conduitFillAnalysis(a).status || "needs-data";
        const statusB = conduitFillAnalysis(b).status || "needs-data";
        compareValue = (statusOrder[statusA] || 2) - (statusOrder[statusB] || 2);
        break;
      }
      case "length":
        compareValue = (Number(a.length) || 0) - (Number(b.length) || 0);
        break;
      case "fromLocation":
        compareValue = numberCollator.compare(locationName(a.fromLocationId), locationName(b.fromLocationId));
        break;
      case "toLocation":
        compareValue = numberCollator.compare(locationName(a.toLocationId), locationName(b.toLocationId));
        break;
      case "cables":
        compareValue = a.cableIds.length - b.cableIds.length;
        break;
      default:
        compareValue = 0;
    }

    return direction === "asc" ? compareValue : -compareValue;
  });

  return sorted;
}

/**
 * Sorts voltage drop rows by the specified column and direction.
 * @param {Array} groups - Cable display groups to sort
 * @param {string} column - Column to sort by: number, specType, material, voltage, load, ampacity, overhead, parallelSets, rating, phase, voltageDrop
 * @param {string} direction - Sort direction: 'asc' or 'desc'
 * @returns {Array} Sorted cable groups
 */
function sortVoltageDropRows(groups, column = "number", direction = "asc") {
  const sorted = [...groups].sort((groupA, groupB) => {
    const rowA = voltageDropRowData(groupA);
    const rowB = voltageDropRowData(groupB);
    let compareValue = 0;

    switch (column) {
      case "number": {
        const numA = groupA.map((c) => c.number).join(", ");
        const numB = groupB.map((c) => c.number).join(", ");
        compareValue = numberCollator.compare(numA, numB);
        break;
      }
      case "specType":
        compareValue = numberCollator.compare(rowA.type?.specType || "", rowB.type?.specType || "");
        break;
      case "material":
        compareValue = numberCollator.compare(rowA.material, rowB.material);
        break;
      case "voltage":
        compareValue = numberCollator.compare(rowA.voltage, rowB.voltage);
        break;
      case "load":
        compareValue = (rowA.numericLoadAmps || 0) - (rowB.numericLoadAmps || 0);
        break;
      case "ampacity": {
        const ampacityA = rowA.cableAmpacity === "—" ? 0 : parseFloat(rowA.cableAmpacity);
        const ampacityB = rowB.cableAmpacity === "—" ? 0 : parseFloat(rowB.cableAmpacity);
        compareValue = ampacityA - ampacityB;
        break;
      }
      case "overhead": {
        const overheadA = rowA.ampacityOverhead ?? 0;
        const overheadB = rowB.ampacityOverhead ?? 0;
        compareValue = overheadA - overheadB;
        break;
      }
      case "parallelSets":
        compareValue = rowA.parallelSets - rowB.parallelSets;
        break;
      case "rating":
        compareValue = numberCollator.compare(rowA.rating, rowB.rating);
        break;
      case "phase":
        compareValue = numberCollator.compare(rowA.phase, rowB.phase);
        break;
      case "voltageDrop": {
        const percentA = rowA.voltageDrop.percent ?? -1;
        const percentB = rowB.voltageDrop.percent ?? -1;
        compareValue = percentA - percentB;
        break;
      }
      default:
        compareValue = 0;
    }

    return direction === "asc" ? compareValue : -compareValue;
  });

  return sorted;
}

/**
 * Displays a toast notification message to the user.
 * Automatically hides after 3.2 seconds.
 * @param {string} message - Message to display
 * @param {boolean} isError - True to style as error, false for normal notification
 */
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

/**
 * Updates the workspace section with current project information.
 * Displays project name, client, and version in the sidebar.
 */
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

/**
 * Sets the active page and updates the UI to display it.
 * Updates navigation highlighting and breadcrumb display.
 * @param {string} page - Page key: 'dashboard', 'cables', 'conduits', 'voltage-drop', 'bom', or 'settings'
 */
function setPage(page) {
  activePage = page;
  document.querySelectorAll("[data-page]").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === page && item.classList.contains("nav-item"));
  });
  const titles = { dashboard: "Overview", cables: "Cable Schedule", "voltage-drop": "Voltage Drop", conduits: "Conduit Schedule", bom: "Bill of Materials", settings: "Settings" };
  document.querySelector("#breadcrumb-page").textContent = titles[page];
  renderPage();
}

/**
 * Renders the current active page by calling the appropriate render function.
 * Updates workspace information and applies page-specific classes.
 */
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

/**
 * Returns the current project name from settings.
 * Falls back to 'Untitled Project' if no name is set.
 * @returns {string} Project name
 */
function projectName() {
  return state.settings.projectName || "Untitled Project";
}

/**
 * Converts text to title case, preserving proper capitalization for headings.
 * Uses Unicode-aware word boundary detection.
 * @param {string} value - Value to convert
 * @returns {string} Title-cased string
 */
function titleCaseHeading(value) {
  return String(value).toLocaleLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, separator, letter) =>
    `${separator}${letter.toLocaleUpperCase()}`,
  );
}

function connectedTeeConduits(tee) {
  return sortByNumber(state.conduits.filter((conduit) =>
    conduit.fromLocationId === tee.id || conduit.toLocationId === tee.id));
}

function teeBaseName(tee) {
  const connected = connectedTeeConduits(tee);
  return connected.length ? `Tee ${connected.map((conduit) => conduit.number).join(", ")}` : `Tee: ${tee.name}`;
}

function teeDisplayName(tee) {
  const name = teeBaseName(tee);
  const duplicate = state.settings.tees.some((other) =>
    other.id !== tee.id && normalizedLocationName(teeBaseName(other)) === normalizedLocationName(name));
  return duplicate ? `${name} (${tee.name})` : name;
}

/**
 * Gets the display name of a location by ID.
 * Returns special handling for cable tray location.
 * @param {string} id - Location ID
 * @returns {string} Location name or "Location removed" if not found
 */
function locationName(id) {
  if (id === CABLE_TRAY_LOCATION_ID) return CABLE_TRAY_LOCATION_NAME;
  const tee = state.settings.tees.find((item) => item.id === id);
  if (tee) return teeDisplayName(tee);
  return state.settings.locations.find((location) => location.id === id)?.name || "Location removed";
}

function isTee(id) {
  return state.settings.tees.some((tee) => tee.id === id);
}

function routeNodeKey(id) {
  if (!id || id === CABLE_TRAY_LOCATION_ID) return null;
  if (isTee(id)) return `tee:${id}`;
  const name = locationNameKey(id);
  return name ? `location:${name}` : null;
}

function cableConduitRoute(cable) {
  const conduits = state.conduits.filter((conduit) => conduit.cableIds.includes(cable.id));
  if (!conduits.some((conduit) => isTee(conduit.fromLocationId) || isTee(conduit.toLocationId))) return null;
  if (conduits.some((conduit) => conduit.fromLocationId === CABLE_TRAY_LOCATION_ID || conduit.toLocationId === CABLE_TRAY_LOCATION_ID)) {
    return { status: "partial", message: "Cable tray routing is not tracked; verify this route manually." };
  }
  const start = routeNodeKey(cable.fromLocationId);
  const end = routeNodeKey(cable.toLocationId);
  const adjacency = new Map();
  for (const conduit of conduits) {
    const from = routeNodeKey(conduit.fromLocationId);
    const to = routeNodeKey(conduit.toLocationId);
    if (!from || !to || from === to) return { status: "partial", message: "Check conduit endpoints for this route." };
    for (const [node, other] of [[from, to], [to, from]]) {
      if (!adjacency.has(node)) adjacency.set(node, []);
      adjacency.get(node).push({ conduit, other });
    }
  }
  if (!start || !end || start === end || adjacency.get(start)?.length !== 1 || adjacency.get(end)?.length !== 1) {
    return { status: "partial", message: "Route is incomplete or ambiguous; check assigned conduits." };
  }
  const route = [];
  const used = new Set();
  let node = start;
  while (node !== end) {
    const choices = (adjacency.get(node) || []).filter(({ conduit }) => !used.has(conduit.id));
    if (choices.length !== 1) return { status: "partial", message: "Route is incomplete or ambiguous; check assigned conduits." };
    const { conduit, other } = choices[0];
    route.push(conduit);
    used.add(conduit.id);
    node = other;
  }
  if (used.size !== conduits.length) return { status: "partial", message: "Route has extra or disconnected conduit assignments." };
  return { status: "complete", conduits: route };
}

/**
 * Normalizes a location name to lowercase for comparison.
 * Useful for case-insensitive lookups.
 * @param {string} name - Location name
 * @returns {string} Normalized (lowercase, trimmed) name
 */
function normalizedLocationName(name) {
  return String(name ?? "").trim().toLocaleLowerCase();
}

/**
 * Gets a normalized location name key for comparison purposes.
 * Handles cable tray special case.
 * @param {string} id - Location ID
 * @returns {string} Normalized location name key
 */
function locationNameKey(id) {
  if (id === CABLE_TRAY_LOCATION_ID) return normalizedLocationName(CABLE_TRAY_LOCATION_NAME);
  const location = state.settings.locations.find((item) => item.id === id);
  return location ? normalizedLocationName(location.name) : "";
}

/**
 * Gets the display name of a location including optional equipment ID.
 * Formats as "Name - Equipment" if equipment ID is specified.
 * @param {Object} location - Location object
 * @returns {string} Formatted location display name
 */
function locationDisplayName(location) {
  if (!location) return "Location removed";
  const name = location.name || "Location removed";
  const equipmentId = String(location.description || "").trim();
  return equipmentId ? `${name} - ${equipmentId}` : name;
}

/**
 * Gets the display name of a location by cable reference.
 * Looks up location details from cable location ID.
 * @param {string} id - Location ID from cable
 * @returns {string} Formatted location display name
 */
function cableLocationName(id) {
  return locationDisplayName(state.settings.locations.find((location) => location.id === id));
}

/**
 * Looks up a cable type by ID.
 * @param {string} id - Cable type ID
 * @returns {Object|undefined} Cable type object or undefined if not found
 */
function cableType(id) {
  return state.settings.cableTypes.find((type) => type.id === id);
}

/**
 * Gets the label for a raceway type value.
 * @param {string} value - Raceway type value
 * @returns {string} Raceway type label
 */
function racewayTypeLabel(value) {
  return RACEWAY_TYPES.find((type) => type.value === value)?.label || "";
}

/**
 * Looks up the internal area of a raceway by type and size.
 * Returns the area in square inches for conduit fill calculations.
 * @param {string} type - Raceway type (EMT, RMC, PVC)
 * @param {string} size - Trade size (e.g., "1/2\"")
 * @returns {number|null} Internal area in square inches or null if not found
 */
function racewayInternalAreaFor(type, size) {
  const tradeSize = String(size ?? "").replace(/["]/g, "").trim();
  const areas = Object.prototype.hasOwnProperty.call(RACEWAY_INTERNAL_AREAS, type)
    ? RACEWAY_INTERNAL_AREAS[type]
    : null;
  return areas?.[tradeSize] ?? null;
}

/**
 * Gets the label for a cable fill type value.
 * @param {string} value - Cable fill type value
 * @returns {string} Cable fill type label
 */
function cableFillTypeLabel(value) {
  return CABLE_FILL_TYPES.find((type) => type.value === value)?.label || "";
}

/**
 * Analyzes a conduit's fill status according to NEC requirements.
 * Validates all required inputs and calculates the fill percentage.
 * Returns status (pass, fail, needs-data, or not-applicable) with detailed reasoning.
 * @param {Object} conduit - Conduit object to analyze
 * @returns {Object} Analysis result with status, label, reason, and optional percentage/allowed
 */
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

/**
 * Renders the dashboard overview page.
 * Displays project metrics, details, and recently added cables.
 * @returns {string} HTML string for dashboard page
 */
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
      <div class="heading-actions"><button class="button button-secondary" data-page="settings"><span class="mdi mdi-tune-variant" aria-hidden="true"></span>Project settings</button></div>
    </div>
    <div class="overview-grid">
      <article class="metric-card"><div class="metric-top">Total Cables <span class="metric-icon"><span class="mdi mdi-cable-data" aria-hidden="true"></span></span></div><div class="metric-value">${state.cables.length}</div><div class="metric-sub">Across the project schedule</div></article>
      <article class="metric-card"><div class="metric-top">Total Conduits <span class="metric-icon"><span class="mdi mdi-pipe" aria-hidden="true"></span></span></div><div class="metric-value">${state.conduits.length}</div><div class="metric-sub">With ${state.conduits.reduce((sum, conduit) => sum + conduit.cableIds.length, 0)} cable assignments</div></article>
      <article class="metric-card"><div class="metric-top">Total Cable Length <span class="metric-icon"><span class="mdi mdi-ruler" aria-hidden="true"></span></span></div><div class="metric-value">${hasDefinedCableLength ? `${formatNumber(cableLength)}<span style="font-size:13px;font-weight:500;letter-spacing:0"> ft</span>` : "TBD"}</div><div class="metric-sub">${hasDefinedCableLength && missingCableLengthCount ? `<span class="metric-warning"><span class="mdi mdi-alert-outline" aria-hidden="true"></span> ${missingCableLengthCount} cable ${missingCableLengthCount === 1 ? "length" : "lengths"} not set</span>` : hasDefinedCableLength ? "Combined cable footage" : "No cable lengths defined"}</div></article>
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
      }).join("")}</tbody></table></div>` : `<div class="empty-state"><div class="empty-icon"><span class="mdi mdi-cable-data" aria-hidden="true"></span></div><h3>Your schedule starts here</h3><p>Add cable types and equipment locations in Settings, then create your first cable schedule entry.</p><button class="button button-primary" data-action="new-cable"><span class="mdi mdi-plus" aria-hidden="true"></span>Create a cable</button></div>`}
    </section>`;
}

/**
 * Renders a detail item for display in project details section.
 * Escapes HTML for safety when rendering user input.
 * @param {string} label - Detail label
 * @param {*} value - Detail value
 * @returns {string} HTML string for detail item
 */
function detail(label, value) {
  return `<div class="detail-item"><label>${escapeHtml(label)}</label><span>${escapeHtml(value === 0 ? "0" : value || "Not set")}</span></div>`;
}

/**
 * Returns the current schedule status setting.
 * @returns {string} Schedule status or "In progress" as default
 */
function scheduleStatus() {
  return state.settings.scheduleStatus || "In progress";
}

/**
 * Renders pagination controls and page info for a table.
 * @param {string} tableType - Table or settings list key
 * @param {number} totalRows - Total number of rows before pagination
 * @returns {string} HTML string for pagination controls
 */
function renderPaginationControls(tableType, totalRows) {
  const pagination = paginationState[tableType];
  const pageSize = pagination.pageSize === "all" ? totalRows : parseInt(pagination.pageSize);
  const totalPages = Math.ceil(totalRows / pageSize);
  const startRow = pagination.pageSize === "all" ? 1 : (pagination.currentPage - 1) * pageSize + 1;
  const endRow = pagination.pageSize === "all" ? totalRows : Math.min(pagination.currentPage * pageSize, totalRows);
  
  const pageSizeOptions = [
    { value: "25", label: "25 rows" },
    { value: "50", label: "50 rows" },
    { value: "75", label: "75 rows" },
    { value: "100", label: "100 rows" },
    { value: "all", label: "All rows" },
  ];

  const pageSizeSelect = pageSizeOptions.map(opt => 
    `<option value="${opt.value}" ${pagination.pageSize === parseInt(opt.value) || pagination.pageSize === opt.value ? "selected" : ""}>${opt.label}</option>`
  ).join("");

  const prevDisabled = pagination.currentPage === 1 ? "disabled" : "";
  const nextDisabled = pagination.currentPage >= totalPages ? "disabled" : "";

  return `<div class="pagination-controls">
    <div class="pagination-info">
      <span>Showing ${startRow}–${endRow} of ${totalRows} ${totalRows === 1 ? "row" : "rows"}</span>
      <select class="pagination-page-size" data-table="${tableType}" aria-label="Rows per page">
        ${pageSizeSelect}
      </select>
    </div>
    <div class="pagination-nav">
      <span class="pagination-info-inline">Page ${pagination.currentPage} of ${totalPages}</span>
      <button class="pagination-button" data-table="${tableType}" data-action="prev-page" ${prevDisabled} aria-label="Previous page"><span class="mdi mdi-chevron-left" aria-hidden="true"></span></button>
      <button class="pagination-button" data-table="${tableType}" data-action="next-page" ${nextDisabled} aria-label="Next page"><span class="mdi mdi-chevron-right" aria-hidden="true"></span></button>
    </div>
  </div>`;
}

/**
 * Paginates an array of rows based on the table's current pagination state.
 * @param {Array} rows - Array of rows to paginate
 * @param {string} tableType - Type of table: 'cables', 'conduits', or 'voltageDrop'
 * @returns {Array} Paginated rows for display
 */
function paginateRows(rows, tableType) {
  const pagination = paginationState[tableType];
  if (pagination.pageSize === "all") {
    return rows;
  }
  const pageSize = parseInt(pagination.pageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  pagination.currentPage = Math.min(pagination.currentPage, totalPages);
  const startIndex = (pagination.currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return rows.slice(startIndex, endIndex);
}

/**
 * Gets total pages for a table based on its current pagination state.
 * @param {string} tableType - Type of table or settings list
 * @returns {number} Total number of pages
 */
function getTotalPages(tableType) {
  let totalRows = 0;
  
  if (tableType === "cables") {
    let rows = cableDisplayGroups();
    rows = sortCableGroups(rows, tableSortState.cables.column, tableSortState.cables.direction);
    totalRows = rows.length;
  } else if (tableType === "conduits") {
    let rows = sortByNumber(state.conduits);
    rows = sortConduits(rows, tableSortState.conduits.column, tableSortState.conduits.direction);
    totalRows = rows.length;
  } else if (tableType === "voltageDrop") {
    let rows = cableDisplayGroups();
    rows = sortVoltageDropRows(rows, tableSortState.voltageDrop.column, tableSortState.voltageDrop.direction);
    totalRows = rows.length;
  } else if (tableType === "cableTypes") {
    totalRows = state.settings.cableTypes.length;
  } else if (tableType === "equipment") {
    totalRows = state.settings.locations.filter((location) => !isCableTrayLocation(location)).length;
  }

  const pagination = paginationState[tableType];
  if (pagination.pageSize === "all") {
    return 1;
  }
  return Math.ceil(totalRows / parseInt(pagination.pageSize));
}

/**
 * Renders the cable schedule page with table of all cables and parallel sets.
 * @returns {string} HTML string for cable schedule page
 */
function renderCables() {
  let rows = cableDisplayGroups();
  rows = sortCableGroups(rows, tableSortState.cables.column, tableSortState.cables.direction);
  const cableCount = state.cables.length;
  const totalRows = rows.length;
  
  const sortIcon = (column) => {
    if (tableSortState.cables.column !== column) return "";
    return tableSortState.cables.direction === "asc" ? " ▲" : " ▼";
  };
  
  const headerCell = (label, column) => `<th class="sortable-header" data-sort-column="${column}" data-table="cables" data-searchable="false">${label}${sortIcon(column)}</th>`;

  const paginatedRows = paginateRows(rows, "cables");

  return `
    <div class="page-heading">
      <div><h1>Cable Schedule</h1><p>Define cable runs, specifications, and endpoints for this project.</p></div>
      <div class="heading-actions"><button class="button button-primary" data-action="new-cable"><span class="mdi mdi-plus" aria-hidden="true"></span>Add Cable</button></div>
    </div>
    <div class="schedule-info"><strong>${cableCount} ${cableCount === 1 ? "cable" : "cables"}</strong><span class="divider"></span><span>${renderLengthSummary(state.cables)}</span><span class="divider"></span><span>${state.settings.cableTypes.length} cable types available</span></div>
    <section class="content-card">
      ${rows.length ? `<div class="card-heading"><div><h2>All Cables</h2><p>Click a row action to edit or remove a schedule entry</p></div><div class="toolbar"><label class="search-box"><span class="search-icon mdi mdi-magnify" aria-hidden="true"></span><input id="cable-search" type="search" placeholder="Search cables..." aria-label="Search cables" /></label></div></div><div class="table-wrap"><table class="wrapped-headers cable-schedule-table"><thead><tr>${headerCell("Cable<br>Number", "number")}${headerCell("Parallel<br>Sets", "parallelSets")}${headerCell("Mfr. /<br>Spec", "type")}${headerCell("Spec<br>Type", "specType")}${headerCell("Cable<br>Length", "length")}${headerCell("Cable Routing <br>From", "fromLocation")}${headerCell("Cable Routing <br>To", "toLocation")}${headerCell("Purpose", "purpose")}${headerCell("Conduit<br>Assignment", "conduitAssignment")}<th>Actions</th></tr></thead><tbody id="cable-rows">${paginatedRows.map(renderCableRow).join("")}</tbody></table></div>${renderPaginationControls("cables", totalRows)}` : `<div class="empty-state"><div class="empty-icon"><span class="mdi mdi-cable-data" aria-hidden="true"></span></div><h3>No cables yet</h3><p>Create your first cable schedule entry. Cable types and locations are managed in Settings.</p><button class="button button-primary" data-action="new-cable"><span class="mdi mdi-plus" aria-hidden="true"></span>Add your first cable</button></div>`}
    </section>`;
}

/**
 * Renders a table row for a group of parallel cables.
 * Shows combined information for cable sets including actions.
 * @param {Array} cables - Array of cable objects in the same parallel group
 * @returns {string} HTML string for table row
 */
function renderCableRow(cables) {
  const cable = cables[0];
  const type = cableType(cable.cableTypeId);
  const cableIds = new Set(cables.map((member) => member.id));
  const cableNumbers = cables.map((member) => member.number).join(", ");
  const conduits = state.conduits.filter((conduit) => conduit.cableIds.some((cableId) => cableIds.has(cableId)));
  const conduitNumbers = [...new Set(conduits.map((conduit) => conduit.number))];
  const routes = cables.map((member) => ({ cable: member, route: cableConduitRoute(member) })).filter(({ route }) => route);
  const routeDetails = routes.map(({ cable: member, route }) => {
    const prefix = cables.length > 1 ? `${member.number}: ` : "";
    const description = route.status === "complete"
      ? `Route: ${route.conduits.map((conduit) => conduit.number).join(" → ")}`
      : `Route warning: ${route.message}`;
    return `<span class="secondary-cell">${escapeHtml(prefix + description)}</span>`;
  }).join("");
  const needsRouteReview = routes.some(({ route }) => route.status === "partial");
  const conduitStatus = conduits.length
    ? `<span class="tag ${needsRouteReview ? "fill-fail" : ""}">${needsRouteReview ? "Check route" : "Assigned"}</span><span class="secondary-cell">${escapeHtml(conduitNumbers.join(", "))}</span>${routeDetails}`
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
    <td>${escapeHtml(cable.purpose || "—")}</td><td>${conduitStatus}</td><td><div class="table-actions"><button class="icon-button" data-action="edit-cable" data-id="${cable.id}" aria-label="${escapeHtml(actionLabels.edit)}"><span class="mdi mdi-pencil-outline" aria-hidden="true"></span></button><button class="icon-button" data-action="duplicate-cable" data-id="${cable.id}" aria-label="${escapeHtml(actionLabels.duplicate)}"><span class="mdi mdi-content-copy" aria-hidden="true"></span></button><button class="icon-button delete" data-action="delete-cable" data-id="${cable.id}" aria-label="${escapeHtml(actionLabels.delete)}"><span class="mdi mdi-delete-outline" aria-hidden="true"></span></button></div></td>
  </tr>`;
}

/**
 * Renders the voltage drop analysis page.
 * Shows cable electrical details with ampacity and voltage drop calculations.
 * @returns {string} HTML string for voltage drop page
 */
function renderVoltageDrop() {
  let rows = cableDisplayGroups();
  rows = sortVoltageDropRows(rows, tableSortState.voltageDrop.column, tableSortState.voltageDrop.direction);
  const totalRows = rows.length;
  
  const sortIcon = (column) => {
    if (tableSortState.voltageDrop.column !== column) return "";
    return tableSortState.voltageDrop.direction === "asc" ? " ▲" : " ▼";
  };
  
  const headerCell = (label, column) => `<th class="sortable-header" data-sort-column="${column}" data-table="voltageDrop" data-searchable="false">${label}${sortIcon(column)}</th>`;

  const paginatedRows = paginateRows(rows, "voltageDrop");

  // Calculate voltage drop stats
  const maxVoltageDropPercent = Number(state.settings.maxVoltageDropPercent);
  let rowsWithErrors = 0;
  let rowsPassing = 0;
  rows.forEach((cables) => {
    const row = voltageDropRowData(cables);
    if (row.voltageDrop.percent === null) {
      rowsWithErrors++;
    } else if (voltageDropStatusClass(row.voltageDrop.percent, maxVoltageDropPercent) === "fill-fail") {
      rowsWithErrors++;
    } else if (voltageDropStatusClass(row.voltageDrop.percent, maxVoltageDropPercent) === "fill-pass") {
      rowsPassing++;
    }
  });

  return `
    <div class="page-heading">
      <div><h1>Voltage Drop</h1><p>Review cable electrical details and parallel sets.</p></div>
      <div class="heading-actions"><button class="button button-primary" data-action="new-cable"><span class="mdi mdi-plus" aria-hidden="true"></span>Add Cable</button></div>
    </div>
    ${totalRows ? `<div class="schedule-info"><strong>${rowsWithErrors} ${rowsWithErrors === 1 ? "row with errors" : "rows with errors"}</strong><span class="divider"></span><strong>${rowsPassing} ${rowsPassing === 1 ? "row passing" : "rows passing"}</strong><span class="divider"></span><span>${maxVoltageDropPercent}% voltage drop limit</span></div>` : ""}
    <section class="content-card">
      ${rows.length ? `<div class="card-heading"><div><h2>All Cables</h2><p>Cable ampacity uses the selected material and rating; parallel sets show their combined ampacity. Ampacity Overhead is cable ampacity minus load. Multiconductor and pair voltage-drop values are estimates using single-conductor Table 9 impedance; missing inputs show Needs data.</p></div></div><div class="table-wrap"><table class="wrapped-headers voltage-drop-table"><thead><tr>${headerCell("Cable<br>Number", "number")}${headerCell("Spec Type", "specType")}${headerCell("Cable Material", "material")}${headerCell("Voltage", "voltage")}${headerCell("Load<br>(Amps)", "load")}${headerCell("Cable<br>Ampacity", "ampacity")}${headerCell("Ampacity<br>Overhead", "overhead")}${headerCell("Parallel<br>Sets", "parallelSets")}${headerCell("Cable<br>Rating", "rating")}${headerCell("Phase", "phase")}${headerCell("Voltage<br>Drop %", "voltageDrop")}<th>Actions</th></tr></thead><tbody>${paginatedRows.map(renderVoltageDropRow).join("")}</tbody></table></div>${renderPaginationControls("voltageDrop", totalRows)}` : `<div class="empty-state"><div class="empty-icon"><span class="mdi mdi-chart-bar" aria-hidden="true"></span></div><h3>No cables yet</h3><p>Add cables to see their voltage-drop inputs here.</p><button class="button button-primary" data-action="new-cable"><span class="mdi mdi-plus" aria-hidden="true"></span>Add Cable</button></div>`}
    </section>`;
}

/**
 * Groups cables by their parallel set ID for display.
 * Returns individual cables as single-element arrays and parallel sets grouped together.
 * @param {Array} cables - Cables to group (defaults to sorted state.cables)
 * @returns {Array} Array of cable groups (each group is an array of cables)
 */
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

/**
 * Renders a voltage drop table row for a cable or parallel set group.
 * Shows electrical specifications, ampacity, and voltage drop calculations.
 * @param {Array} cables - Cable group to render
 * @returns {string} HTML string for voltage drop table row
 */
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
    <td><span class="tag ${row.voltageDrop.percent === null ? "tbd" : row.voltageDropClass}"${row.voltageDropTitle ? ` title="${escapeHtml(row.voltageDropTitle)}"` : ""}>${row.voltageDrop.percent === null ? "Needs data" : `${row.voltageDrop.percent.toFixed(2)}%`}</span></td>
    <td><div class="table-actions"><button class="icon-button" data-action="edit-cable" data-id="${row.cable.id}" aria-label="Edit ${escapeHtml(row.cableNumbers)}"><span class="mdi mdi-pencil-outline" aria-hidden="true"></span></button></div></td>
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
  const singleCableAmpacity = type?.cableAmpacity !== null && type?.cableAmpacity !== undefined
    ? type.cableAmpacity
    : lookupCableAmpacity(cableSpecSizeFromType(type), cableMaterial, cable.cableRating);
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
    ["Cable Numbers", "Spec Type", "Cable Material", "Voltage (V)", "Load (A)", "Cable Ampacity (A)", "Ampacity Overhead (A)", "Parallel Sets", "Cable Rating (°C)", "Phase", "Voltage Drop (%)"],
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
          ? "nm"
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

/**
 * Renders the conduit schedule page with table of all conduits.
 * Shows raceway details, NEC fill analysis, and cable assignments.
 * @returns {string} HTML string for conduit schedule page
 */
function renderConduits() {
  let rows = sortByNumber(state.conduits);
  rows = sortConduits(rows, tableSortState.conduits.column, tableSortState.conduits.direction);
  const totalRows = rows.length;
  
  const sortIcon = (column) => {
    if (tableSortState.conduits.column !== column) return "";
    return tableSortState.conduits.direction === "asc" ? " ▲" : " ▼";
  };
  
  const headerCell = (label, column) => `<th class="sortable-header" data-sort-column="${column}" data-table="conduits" data-searchable="false">${label}${sortIcon(column)}</th>`;

  const paginatedRows = paginateRows(rows, "conduits");

  return `
    <div class="page-heading">
      <div><h1>Conduit Schedule</h1><p>Document conduit routes, cable assignments, and conduit fill.</p></div>
      <div class="heading-actions"><button class="button button-primary" data-action="new-conduit"><span class="mdi mdi-plus" aria-hidden="true"></span>Add Conduit</button></div>
    </div>
    <div class="schedule-info"><strong>${totalRows} ${totalRows === 1 ? "conduit" : "conduits"}</strong><span class="divider"></span><span>${renderLengthSummary(rows)}</span><span class="divider"></span><span>${state.settings.necEdition ? `${escapeHtml(state.settings.necEdition)} NEC fill basis` : "NEC edition not selected"}</span><span class="divider"></span><span>${state.cables.length} cables available to assign</span></div>
    <section class="content-card">
      ${rows.length ? `<div class="card-heading"><div><h2>All Conduits</h2><p>Review routing, cable assignments, and fill checks</p></div><div class="toolbar"><label class="search-box"><span class="search-icon mdi mdi-magnify" aria-hidden="true"></span><input id="conduit-search" type="search" placeholder="Search conduits..." aria-label="Search conduits" /></label></div></div><div class="table-wrap"><table class="wrapped-headers conduit-schedule-table"><thead><tr>${headerCell("Conduit<br>number", "number")}${headerCell("Raceway <br>/ Size", "size")}${headerCell("NEC fill", "fill")}${headerCell("Conduit<br>Length", "length")}${headerCell("Conduit Routing <br>From", "fromLocation")}${headerCell("Conduit Routing <br>To", "toLocation")}${headerCell("Assigned<br>cables", "cables")}<th>Actions</th></tr></thead><tbody>${paginatedRows.map((conduit) => {
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
        <td><div class="table-actions"><button class="icon-button" data-action="edit-conduit" data-id="${conduit.id}" aria-label="Edit ${escapeHtml(conduit.number)}"><span class="mdi mdi-pencil-outline" aria-hidden="true"></span></button><button class="icon-button" data-action="duplicate-conduit" data-id="${conduit.id}" aria-label="Duplicate ${escapeHtml(conduit.number)}"><span class="mdi mdi-content-copy" aria-hidden="true"></span></button><button class="icon-button delete" data-action="delete-conduit" data-id="${conduit.id}" aria-label="Delete ${escapeHtml(conduit.number)}"><span class="mdi mdi-delete-outline" aria-hidden="true"></span></button></div></td>
      </tr>`;
      }).join("")}</tbody></table></div>${renderPaginationControls("conduits", totalRows)}` : `<div class="empty-state"><div class="empty-icon"><span class="mdi mdi-pipe" aria-hidden="true"></span></div><h3>No conduits yet</h3><p>Create a conduit route, then assign any cables in your cable schedule.</p><button class="button button-primary" data-action="new-conduit"><span class="mdi mdi-plus" aria-hidden="true"></span>Add your first conduit</button></div>`}
    </section>
    <section class="content-card settings-section conduit-tee-section">
      <div class="card-heading section-title-row"><div><h2>Tees <span class="tag neutral">${state.settings.tees.length}</span></h2><p>Tee names update automatically from connected conduit numbers. Routing points do not represent cable splices. Assign each cable to every conduit it uses. The cable schedule shows routes and warnings; cable tray paths require manual verification.</p></div></div>
      <div class="settings-list">${state.settings.tees.length ? sortByName(state.settings.tees).map((tee) => {
        const name = teeDisplayName(tee);
        const connected = connectedTeeConduits(tee);
        return `<div class="settings-list-row"><div class="settings-item-main"><strong>${escapeHtml(name)}</strong><small>Identifier: ${escapeHtml(tee.name)}${connected.length ? "" : " · No conduits connected"}</small></div><div class="table-actions"><button class="icon-button" data-action="edit-tee" data-id="${escapeHtml(tee.id)}" aria-label="Edit ${escapeHtml(name)}"><span class="mdi mdi-pencil-outline" aria-hidden="true"></span></button><button class="icon-button delete" data-action="delete-tee" data-id="${escapeHtml(tee.id)}" aria-label="Delete ${escapeHtml(name)}"><span class="mdi mdi-delete-outline" aria-hidden="true"></span></button></div></div>`;
      }).join("") : `<div class="settings-empty">No tees yet. Add one while creating or editing a conduit.</div>`}</div>
    </section>`;
}

/**
 * Groups cables and conduits by their specifications for bill of materials.
 * Returns organized arrays for rendering material summaries.
 * @returns {Object} Object with usedCableTypes and usedConduitGroups arrays
 */
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

/**
 * Renders the bill of materials page.
 * Shows cable types and conduit materials used in the project with totals.
 * @returns {string} HTML string for bill of materials page
 */
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

/**
 * Renders the settings page.
 * Manages project info, cable types, equipment locations, appearance, and voltage drop settings.
 * @returns {string} HTML string for settings page
 */
function renderSettings() {
  const settings = state.settings;
  const equipmentLocations = sortByName(settings.locations.filter((location) => !isCableTrayLocation(location)));
  const paginatedCableTypes = paginateRows(settings.cableTypes, "cableTypes");
  const paginatedEquipmentLocations = paginateRows(equipmentLocations, "equipment");
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
          <div class="field appearance-field sidebar-preference">
            <label class="appearance-checkbox" for="sidebar-preference"><input id="sidebar-preference" type="checkbox" aria-describedby="sidebar-preference-description" ${keepSidebarMinimized ? "checked" : ""} />Keep sidebar minimized</label>
            <small id="sidebar-preference-description" class="section-description">Start with the sidebar minimized. You can still expand it temporarily.</small>
          </div>
        </div>
      </section>
      <section class="content-card settings-section">
        <div class="card-heading section-title-row"><div><h2>Cable Types <span class="tag neutral">${settings.cableTypes.length}</span></h2><p>Reusable manufacturer and specification details for cable entries</p></div><button class="button button-secondary" data-action="new-cable-type"><span class="mdi mdi-plus" aria-hidden="true"></span>Add Cable Type</button></div>
        <div class="settings-list">${settings.cableTypes.length ? paginatedCableTypes.map((type) => `<div class="settings-list-row"><div class="settings-item-main"><strong>${escapeHtml(type.manufacturer)} <span style="color:#a1a9b4;font-weight:400">·</span> ${escapeHtml(type.specNumber)}</strong><small>${escapeHtml(type.specType)} · ${formatNumber(type.diameter)} in OD · ${formatNumber(type.netWeight)} lbs/1000' · Material: ${escapeHtml(type.cableMaterial || "not set")} · Fill: ${escapeHtml(cableFillTypeLabel(type.fillClassification) || "not set")}${safeHttpUrl(type.url) ? ` · <a href="${escapeHtml(safeHttpUrl(type.url))}" target="_blank" rel="noopener noreferrer" style="color:#4268e8">Details <span class="mdi mdi-open-in-new external-link-icon" aria-hidden="true"></span></a>` : ""}</small></div><div class="table-actions"><button class="icon-button" data-action="edit-cable-type" data-id="${type.id}" aria-label="Edit ${escapeHtml(type.specNumber)}"><span class="mdi mdi-pencil-outline" aria-hidden="true"></span></button><button class="icon-button delete" data-action="delete-cable-type" data-id="${type.id}" aria-label="Delete ${escapeHtml(type.specNumber)}"><span class="mdi mdi-delete-outline" aria-hidden="true"></span></button></div></div>`).join("") : `<div class="settings-empty">No cable types yet. Add a specification to use it in the cable schedule.</div>`}</div>
        ${settings.cableTypes.length ? renderPaginationControls("cableTypes", settings.cableTypes.length) : ""}
      </section>
      <section class="content-card settings-section">
        <div class="card-heading section-title-row"><div><h2>Equipment <span class="tag neutral">${equipmentLocations.length}</span></h2><p>Equipment appears in the From and To dropdowns on schedules</p></div><button class="button button-secondary" data-action="new-location"><span class="mdi mdi-plus" aria-hidden="true"></span>Add Equipment</button></div>
        <div class="settings-list">${equipmentLocations.length ? paginatedEquipmentLocations.map((location) => `<div class="settings-list-row"><div class="settings-item-main"><strong>${escapeHtml(locationDisplayName(location))}</strong></div><div class="table-actions"><button class="icon-button" data-action="edit-location" data-id="${location.id}" aria-label="Edit ${escapeHtml(location.name)}"><span class="mdi mdi-pencil-outline" aria-hidden="true"></span></button><button class="icon-button delete" data-action="delete-location" data-id="${location.id}" aria-label="Delete ${escapeHtml(location.name)}"><span class="mdi mdi-delete-outline" aria-hidden="true"></span></button></div></div>`).join("") : `<div class="settings-empty">No equipment yet. Add equipment to use it on schedules.</div>`}</div>
        ${equipmentLocations.length ? renderPaginationControls("equipment", equipmentLocations.length) : ""}
      </section>
      <section class="content-card settings-section">
        <div class="card-heading"><div><h2>Version History</h2><p>Updates and changes made to Wireframe</p></div></div>
        <div id="version-history-content">${renderVersionHistory()}</div>
      </section>
    </div>`;
}

/**
 * Renders the version history list.
 * Shows application version history with expandable/collapsible view.
 * @returns {string} HTML string for version history section
 */
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

/**
 * Creates an HTML input field for settings.
 * @param {string} name - Field name attribute
 * @param {string} label - Field label text
 * @param {string} value - Current field value
 * @param {string} placeholder - Placeholder text
 * @returns {string} HTML string for settings input field
 */
function settingsField(name, label, value, placeholder) {
  return `<div class="field"><label for="setting-${name}">${escapeHtml(label)}</label><input id="setting-${name}" name="${name}" value="${escapeHtml(value || "")}" placeholder="${escapeHtml(placeholder)}" /></div>`;
}

/**
 * Creates an HTML select field for schedule status with optional custom value.
 * @param {string} value - Current schedule status value
 * @returns {string} HTML string for schedule status field with custom option
 */
function scheduleStatusField(value) {
  const isCustom = Boolean(value) && !SCHEDULE_STATUSES.includes(value);
  const selectedStatus = isCustom ? "custom" : value || "In progress";
  return `<div class="field"><label for="setting-scheduleStatus">Schedule Status</label><select id="setting-scheduleStatus" name="scheduleStatus">${SCHEDULE_STATUSES.map((status) => `<option value="${escapeHtml(status)}" ${selectedStatus === status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}<option value="custom" ${selectedStatus === "custom" ? "selected" : ""}>Custom status…</option></select></div>
    <div class="field" id="custom-schedule-status-field" ${isCustom ? "" : "hidden"}><label for="setting-custom-schedule-status">Custom Status</label><input id="setting-custom-schedule-status" name="customScheduleStatus" value="${escapeHtml(isCustom ? value : "")}" ${isCustom ? "required" : "disabled"} /></div>`;
}

/**
 * Creates HTML option elements for a select field from items array.
 * @param {Array} items - Array of items with id and name properties
 * @param {string} selectedId - Currently selected item ID
 * @returns {string} HTML string with options
 */
function options(items, selectedId) {
  return `<option value="">Select…</option>${items.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}`;
}

/**
 * Formats cable specification type description from components.
 * Example output: "3/C #12 AWG W/GND 15kV"
 * @param {Object} spec - Cable spec object with count, construction, size, suffix, includeGroundShield
 * @returns {string} Formatted cable specification type
 */
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

/**
 * Creates an HTML select field for cable specification size selection.
 * Organizes sizes by unit (AWG and KCMIL).
 * @param {string} selectedSize - Currently selected size (e.g., "12 AWG")
 * @returns {string} HTML string for cable size field
 */
function cableSpecSizeField(selectedSize) {
  const sizes = (unit) => CABLE_SPEC_SIZES
    .filter((size) => size.endsWith(unit))
    .map((size) => `<option value="${size}" ${selectedSize === size ? "selected" : ""}>${escapeHtml(size)}</option>`)
    .join("");
  return `<div class="field"><label for="modal-specSize">Cable size</label><select id="modal-specSize" name="specSize"><option value="">Select size…</option><optgroup label="AWG">${sizes("AWG")}</optgroup><optgroup label="KCMIL">${sizes("KCMIL")}</optgroup></select></div>`;
}

/**
 * Checks if a form is a cable type form (new or edit).
 * @param {HTMLFormElement} form - Form element to check
 * @returns {boolean} True if the form is a cable type form
 */
function isCableTypeForm(form) {
  return form?.dataset.form === "new-cable-type" ||
    form?.dataset.form === "new-cable-type-inline" ||
    form?.dataset.form.startsWith("edit-cable-type:");
}

/**
 * Updates cable specification form labels based on construction type.
 * Changes "Ground" to "Shield" label for pair construction type.
 * @param {HTMLFormElement} form - Cable spec form element
 */
function updateCableSpecLabels(form) {
  if (!isCableTypeForm(form)) return;
  const construction = form.elements.namedItem("specConstruction").value;
  const groundShieldLabel = form.querySelector("#spec-ground-shield-label");
  groundShieldLabel.textContent = construction === "pair" ? "Include shield" : "Include ground";
}

/**
 * Creates an HTML select field with options.
 * @param {string} name - Field name attribute
 * @param {string} label - Field label text
 * @param {Array} choices - Array of {value, label} objects
 * @param {string} selectedValue - Currently selected value
 * @param {Object} fieldOptions - Display options (full, optional)
 * @returns {string} HTML string for select field
 */
function selectField(name, label, choices, selectedValue = "", fieldOptions = {}) {
  const full = fieldOptions.full ? " full" : "";
  const optional = fieldOptions.optional ? ` <span class="optional">(optional)</span>` : "";
  return `<div class="field${full}"><label for="modal-${name}">${escapeHtml(label)}${optional}</label><select id="modal-${name}" name="${name}"><option value="">Select…</option>${choices.map(({ value, label: choiceLabel }) => `<option value="${escapeHtml(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(choiceLabel)}</option>`).join("")}</select></div>`;
}

/**
 * Opens a modal dialog with form fields.
 * Creates and displays a modal overlay with a form for data entry.
 * @param {string} title - Modal title
 * @param {string} subtitle - Modal subtitle/description
 * @param {string} formKind - Form identifier for handling submission
 * @param {string} fields - HTML string of form fields
 * @param {string} submitLabel - Label for submit button (default: "Save")
 */
function openModal(title, subtitle, formKind, fields, submitLabel = "Save") {
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
    <div class="modal-header"><div><h2 id="modal-title">${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div></div>
    <form class="modal-form" data-form="${formKind}">${fields}<div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">${escapeHtml(submitLabel)}</button></div></form>
  </section></div>`;
  modalRoot.querySelector(".modal").focus();
}

/**
 * Closes the currently open modal dialog.
 * Clears the modal overlay from the DOM.
 */
function closeModal() {
  modalRoot.innerHTML = "";
}

/**
 * Creates an HTML text input field.
 * @param {string} name - Field name attribute
 * @param {string} label - Field label text
 * @param {string} value - Current field value
 * @param {string} placeholder - Placeholder text
 * @param {Object} options - Field options (full, required, type, step, min, max, optional)
 * @returns {string} HTML string for text input field
 */
function textField(name, label, value = "", placeholder = "", options = {}) {
  const full = options.full ? " full" : "";
  const required = options.required === false ? "" : " required";
  const type = options.type || "text";
  const step = options.step ? ` step="${options.step}"` : "";
  const min = options.min ? ` min="${options.min}"` : "";
  const max = options.max ? ` max="${options.max}"` : "";
  return `<div class="field${full}"><label for="modal-${name}">${escapeHtml(label)}${options.optional ? ` <span class="optional">(optional)</span>` : ""}</label><input id="modal-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}"${required}${step}${min}${max} /></div>`;
}

/**
 * Extracts the prefix letter (P, C, or S) from a schedule number.
 * @param {string|number} number - Schedule number to parse
 * @returns {string} Prefix letter ('P', 'C', or 'S'; defaults to 'P')
 */
function numberPrefixFrom(number) {
  return String(number || "").trim().match(/^([PCS])\d+/i)?.[1].toUpperCase() || "P";
}

/**
 * Returns valid cable prefixes for a conduit based on its prefix.
 * P conduits can hold P, C, or S cables; C can hold C or S; S only holds S.
 * @param {string|number} number - Conduit schedule number
 * @returns {Array} Valid cable prefixes for this conduit
 */
function cablePrefixesForConduit(number) {
  const conduitPrefix = numberPrefixFrom(number);
  if (conduitPrefix === "P") return ["P", "C", "S"];
  if (conduitPrefix === "C") return ["C", "S"];
  return [];
}

/**
 * Calculates the next schedule number for a given prefix.
 * @param {Array} items - Items with 'number' field
 * @param {string} prefix - Prefix letter (P, C, or S)
 * @returns {string} Next schedule number (e.g., "P1", "P2")
 */
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

/**
 * Calculates multiple consecutive schedule numbers for a given prefix.
 * Used for creating parallel cable sets.
 * @param {Array} items - Items with 'number' field
 * @param {string} prefix - Prefix letter (P, C, or S)
 * @param {number} count - Number of consecutive numbers to generate
 * @returns {Array} Array of schedule numbers
 */
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

/**
 * Returns all cables in the same parallel group.
 * Cables in a parallel set share the same parallelGroupId.
 * @param {Object} cable - Cable object
 * @returns {Array} Array of cables in the same parallel group
 */
function parallelGroupMembers(cable) {
  if (!cable?.parallelGroupId) return cable ? [cable] : [];
  return state.cables
    .filter((item) => item.parallelGroupId === cable.parallelGroupId)
    .sort((a, b) => Number(a.parallelSetIndex || 0) - Number(b.parallelSetIndex || 0));
}

/**
 * Formats cable purpose text, adding parallel set info if applicable.
 * @param {Object} cable - Cable object
 * @returns {string} Formatted purpose display text
 */
function cablePurposeDisplay(cable) {
  const purpose = String(cable?.purpose || "").trim();
  if (!cable?.parallelGroupId) return purpose;
  const setCount = parallelGroupMembers(cable).length;
  if (setCount < 2) return purpose;
  const setLabel = `Set ${cable.parallelSetIndex || 1} of ${setCount}`;
  return purpose ? `${purpose} - ${setLabel}` : setLabel;
}

/**
 * Creates an HTML input field for schedule number with prefix selector.
 * Includes auto-numbering based on existing items.
 * @param {string} label - Field label
 * @param {Array} items - Existing items for calculating next number
 * @param {string} recordType - Type identifier for data attribute
 * @param {string} prefix - Initial prefix (P, C, or S)
 * @param {string} value - Current value
 * @param {boolean} full - Use full width
 * @param {boolean} autoNumberNote - Show auto-numbering note
 * @returns {string} HTML string for schedule number field
 */
function scheduleNumberField(label, items, recordType, prefix = "P", value = "", full = false, autoNumberNote = false) {
  const selectedPrefix = ["P", "C", "S"].includes(prefix) ? prefix : "P";
  const number = value || nextScheduleNumber(items, selectedPrefix);
  const note = autoNumberNote ? `<small class="number-auto-note" id="parallel-number-note" hidden></small>` : "";
  return `<div class="field${full ? " full" : ""}"><label for="modal-number">${escapeHtml(label)}</label><div class="number-prefix-entry"><select id="modal-number-prefix" name="numberPrefix" data-number-records="${recordType}" aria-label="${escapeHtml(label)} prefix"><option value="P" ${selectedPrefix === "P" ? "selected" : ""}>P · Power</option><option value="C" ${selectedPrefix === "C" ? "selected" : ""}>C · Control</option><option value="S" ${selectedPrefix === "S" ? "selected" : ""}>S · Spare</option></select><input id="modal-number" name="number" value="${escapeHtml(number)}" placeholder="e.g. ${selectedPrefix}101" required /></div>${note}</div>`;
}

/**
 * Creates an HTML input field for a parallel set cable number.
 * @param {number} index - Parallel set index (0-based)
 * @param {string} value - Current cable number value
 * @param {boolean} customized - Whether the user has customized this number
 * @returns {string} HTML string for parallel number input
 */
function parallelNumberInputMarkup(index, value, customized = false) {
  return `<div class="field"><label for="modal-parallel-number-${index + 1}">Set ${index + 1} cable number</label><input id="modal-parallel-number-${index + 1}" name="parallelNumbers" value="${escapeHtml(value)}" required data-customized="${customized}" /></div>`;
}

/**
 * Creates an HTML select field for route location selection.
 * Includes option to create new location inline.
 * @param {string} name - Field name
 * @param {string} label - Field label
 * @param {string} selectedId - Selected location ID
 * @param {boolean} includeEquipmentId - Include equipment ID in label
 * @param {boolean} includeCableTray - Include cable tray as option
 * @param {boolean} combineDuplicateNames - Filter duplicate location names
 * @returns {string} HTML string for route location field
 */
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
  if (includeCableTray) locations.push(...sortByName(state.settings.tees.map((tee) => ({ id: tee.id, name: teeDisplayName(tee) }))));
  const selectedLocation = state.settings.locations.find((location) => location.id === selectedId);
  const selectedName = selectedLocation ? normalizedLocationName(selectedLocation.name) : "";
  const resolvedSelectedId = combineDuplicateNames && selectedName
    ? equipmentLocations.find((location) => normalizedLocationName(location.name) === selectedName)?.id || selectedId
    : selectedId;
  return `<div class="field"><label for="modal-${name}">${escapeHtml(label)}</label><div class="inline-select-action"><select id="modal-${name}" name="${name}" required>${options(locations, resolvedSelectedId)}</select><button class="button button-secondary" type="button" data-action="add-route-location" data-field="${name}">+ New location</button>${includeCableTray ? `<button class="button button-secondary" type="button" data-action="add-route-tee" data-field="${name}">+ New tee</button>` : ""}</div></div>`;
}

/**
 * Creates an HTML select field for conduit size selection.
 * Allows custom sizes to be preserved alongside standard sizes.
 * @param {string} selectedSize - Currently selected size
 * @returns {string} HTML string for conduit size field
 */
function conduitSizeField(selectedSize) {
  const sizes = [...CONDUIT_SIZES];
  if (selectedSize && !sizes.includes(selectedSize)) sizes.push(selectedSize);
  return `<div class="field"><label for="modal-size">Conduit size <span class="optional">(optional)</span></label><select id="modal-size" name="size"><option value="">Select size…</option>${sizes.map((size) => `<option value="${escapeHtml(size)}" ${size === selectedSize ? "selected" : ""}>${escapeHtml(size)}</option>`).join("")}</select></div>`;
}

/**
 * Opens the cable form for creating or editing a cable.
 * Handles single cables and parallel cable sets.
 * @param {string} id - Cable ID (undefined for new cable)
 * @param {Object} draft - Draft form data to pre-populate
 * @param {Object} modalOptions - Modal title, subtitle, and submitLabel
 */
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

/**
 * Updates the preview and validation of parallel cable numbers in the form.
 * Shows auto-generated numbers and validates user input.
 * @param {HTMLFormElement} form - Cable form element
 * @param {boolean} prefixChanged - Whether the prefix selector was changed
 */
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

/**
 * Opens the conduit form for creating or editing a conduit run.
 * Manages conduit type, cables, size, and fill analysis.
 * @param {string} id - Conduit ID (undefined for new conduit)
 * @param {Object} draft - Draft form data to pre-populate
 * @param {Object} modalOptions - Modal title, subtitle, and submitLabel
 */
function openConduitForm(id, draft = {}, modalOptions = {}) {
  const conduit = state.conduits.find((item) => item.id === id);
  const needsLocations = !state.settings.locations.length && !state.settings.tees.length;
  const setupNote = needsLocations ? `<p class="form-note">Add a location or tee using the buttons below.</p>` : "";
  const assignedCableIds = draft.cableIds || conduit?.cableIds || [];
  const numberField = conduit
    ? textField("number", "Conduit number", draft.number ?? conduit.number, "e.g. CON-101", { full: true })
    : scheduleNumberField("Conduit number", state.conduits, "conduits", draft.numberPrefix || numberPrefixFrom(draft.number), draft.number, true);
  const selectedFillCondition = draft.fillCondition || conduit?.fillCondition || "standard";
  const cableOptions = state.cables.length ? `<div class="field full"><label>Assign cables <span class="optional">(optional)</span></label><label class="appearance-checkbox"><input type="checkbox" name="showAllCables" ${draft.showAllCables ? "checked" : ""} />Show all compatible cables</label><p class="section-description">Cable locations must contain the selected From and To locations. Tees and cable tray do not filter that endpoint.</p><p class="section-description hidden-assignments" aria-live="polite" hidden></p><p class="form-note assignment-warning" hidden>Remove incompatible cable assignments before saving this conduit.</p><div class="checkbox-list" role="group" aria-label="Assign cables">
    <div class="checkbox-list-header" aria-hidden="true"><span>Select</span><span>Cable number</span><span>From → To</span><span>Cable type / spec</span></div>
    ${sortCablesByPrefix(state.cables).map((cable) => {
      const type = cableType(cable.cableTypeId);
      const typeDetails = [type?.manufacturer, type?.specNumber].filter(Boolean).join(" · ");
      return `<label class="checkbox-option" data-cable-prefix="${numberPrefixFrom(cable.number)}" data-from-location-name="${escapeHtml(locationNameKey(cable.fromLocationId))}" data-to-location-name="${escapeHtml(locationNameKey(cable.toLocationId))}"><input type="checkbox" name="cableIds" value="${escapeHtml(cable.id)}" aria-label="Assign cable ${escapeHtml(cable.number)}" ${assignedCableIds.includes(cable.id) ? "checked" : ""} /><span class="checkbox-cable-number">${escapeHtml(cable.number)}</span><span class="checkbox-cable-route">${escapeHtml(cableLocationName(cable.fromLocationId))}<span aria-hidden="true"> → </span>${escapeHtml(cableLocationName(cable.toLocationId))}</span><span class="checkbox-cable-type"><strong>${escapeHtml(type?.specType || "Cable type unavailable")}</strong><small>${escapeHtml(typeDetails || "Specification unavailable")}</small><small class="checkbox-cable-incompatible" hidden>Not allowed for this conduit</small></span></label>`;
    }).join("")}
    <div class="checkbox-list-empty" hidden></div>
  </div></div>` : `<div class="field full"><label>Assign cables <span class="optional">(optional)</span></label><p class="form-note">No cables are available yet. Add cables from the Cable schedule to assign them here.</p></div>`;
  const nippleLength = `<div class="field" data-nipple-length-field ${selectedFillCondition === "nipple" ? "" : "hidden"}><label for="modal-nippleLengthInches">Nipple length (in)</label><input id="modal-nippleLengthInches" name="nippleLengthInches" type="number" min="0.1" max="24" step="0.1" value="${escapeHtml(draft.nippleLengthInches ?? conduit?.nippleLengthInches ?? "")}" ${selectedFillCondition === "nipple" ? "required" : ""} /></div>`;
  const fields = `${setupNote}<p class="form-note">For branched routes, use the same tee at each connected conduit and assign a cable to every conduit it passes through.</p><p class="form-note">Supplied EMT, RMC, and PVC Schedule 40/80 areas auto-fill for listed sizes. For other combinations, enter the 100% internal area from the applicable NEC Chapter 9 raceway table or product data.</p><div class="form-grid">
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

/**
 * Updates visible and enabled cable options in a conduit form.
 * Filters cables based on conduit prefix and location compatibility.
 * @param {HTMLFormElement} form - Conduit form element
 */
function updateConduitCableOptions(form) {
  if (!form) return;
  const conduitNumber = form.elements.namedItem("number").value;
  const allowedCablePrefixes = new Set(cablePrefixesForConduit(conduitNumber));
  const fromLocationId = form.elements.namedItem("fromLocationId").value;
  const toLocationId = form.elements.namedItem("toLocationId").value;
  const filterFrom = fromLocationId && fromLocationId !== CABLE_TRAY_LOCATION_ID && !isTee(fromLocationId);
  const filterTo = toLocationId && toLocationId !== CABLE_TRAY_LOCATION_ID && !isTee(toLocationId);
  const fromLocationName = filterFrom ? locationNameKey(fromLocationId) : "";
  const toLocationName = filterTo ? locationNameKey(toLocationId) : "";
  const showAllCables = form.elements.namedItem("showAllCables")?.checked;
  const options = [...form.querySelectorAll(".checkbox-option")];
  let visibleCount = 0;
  let hiddenAssignmentCount = 0;
  let hasIncompatibleAssignments = false;

  options.forEach((option) => {
    const checkbox = option.querySelector('input[name="cableIds"]');
    const isCompatible = allowedCablePrefixes.has(option.dataset.cablePrefix);
    const isIncompatibleAssignment = checkbox.checked && !isCompatible;
    const matchesLocation = showAllCables ||
      ((!filterFrom || (fromLocationName && option.dataset.fromLocationName.includes(fromLocationName))) &&
       (!filterTo || (toLocationName && option.dataset.toLocationName.includes(toLocationName))));

    option.hidden = !(isCompatible && matchesLocation) && !isIncompatibleAssignment;
    option.classList.toggle("incompatible", isIncompatibleAssignment);
    option.querySelector(".checkbox-cable-incompatible").hidden = !isIncompatibleAssignment;
    if (isIncompatibleAssignment) hasIncompatibleAssignments = true;
    if (option.hidden && checkbox.checked) hiddenAssignmentCount += 1;
    if (!option.hidden) visibleCount += 1;
  });

  const header = form.querySelector(".checkbox-list-header");
  const emptyMessage = form.querySelector(".checkbox-list-empty");
  const assignmentWarning = form.querySelector(".assignment-warning");
  const hiddenAssignments = form.querySelector(".hidden-assignments");
  if (header) header.hidden = visibleCount === 0;
  if (emptyMessage) emptyMessage.hidden = visibleCount !== 0;
  if (emptyMessage && visibleCount === 0) {
    emptyMessage.textContent = allowedCablePrefixes.size === 0
      ? "S conduits cannot have assigned cables."
      : "No compatible cables match the selected conduit locations.";
  }
  if (assignmentWarning) assignmentWarning.hidden = !hasIncompatibleAssignments;
  if (hiddenAssignments) {
    hiddenAssignments.hidden = hiddenAssignmentCount === 0;
    hiddenAssignments.textContent = `${hiddenAssignmentCount} assigned ${hiddenAssignmentCount === 1 ? "cable is" : "cables are"} hidden by the location filter. Select "Show all compatible cables" to review.`;
  }
}

/**
 * Updates the nipple length field visibility based on fill condition.
 * Shows/hides the nipple length input when nipple condition is selected.
 * @param {HTMLFormElement} form - Conduit form element
 */
function updateConduitFillCondition(form) {
  if (!form) return;
  const isNipple = form.elements.namedItem("fillCondition").value === "nipple";
  const field = form.querySelector("[data-nipple-length-field]");
  const input = form.elements.namedItem("nippleLengthInches");
  if (!field || !input) return;
  field.hidden = !isNipple;
  input.required = isNipple;
}

/**
 * Updates the raceway internal area field based on selected type and size.
 * Auto-fills from NEC tables if available, otherwise allows custom entry.
 * @param {HTMLFormElement} form - Conduit form element
 * @param {boolean} preserveExisting - Keep existing custom values if set
 */
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

/**
 * Checks if a form is a conduit form (new or edit).
 * @param {HTMLFormElement} form - Form element to check
 * @returns {boolean} True if the form is a conduit form
 */
function isConduitForm(form) {
  return form?.dataset.form === "new-conduit" || form?.dataset.form.startsWith("edit-conduit:");
}

/**
 * Opens the cable type form for creating or editing a cable specification.
 * Manages cable construction, sizing, and material properties.
 * @param {string} id - Cable type ID (undefined for new type)
 * @param {Object} returnToCableDraft - Draft cable data to return to after type creation
 */
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
    ${textField("cableAmpacity", "Cable Ampacity (A)", type?.cableAmpacity ?? "", "e.g. 100", { type: "number", min: "0", step: "0.1", required: false, optional: true, full: true })}
    ${selectField("fillClassification", "Cable fill type", CABLE_FILL_TYPES, type?.fillClassification || "", { full: true, optional: true })}
    ${textField("diameter", "Overall diameter (in)", type?.diameter ?? "", "e.g. 1.42", { type: "number", min: "0", step: "0.001" })}
    ${textField("netWeight", "Net weight (lbs/1000')", type?.netWeight ?? "", "e.g. 1120", { type: "number", min: "0", step: "0.01" })}
    ${textField("url", "URL to details", type?.url || "", "https://...", { type: "url", required: false, full: true, optional: true })}
    <p class="section-description field full">For fill checks, enter the actual outside diameter and identify whether this specification is one insulated conductor or one multiconductor cable assembly. Cable Ampacity, if provided, overrides the automatic voltage drop ampacity lookup.</p>
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

/**
 * Opens the location form for creating or editing equipment locations.
 * Locations serve as cable and conduit route endpoints.
 * @param {string} id - Location ID (undefined for new location)
 * @param {Object} returnContext - Context to return to after location creation (e.g., form being edited)
 */
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

function openTeeForm(id, returnContext = null) {
  const tee = state.settings.tees.find((item) => item.id === id);
  let nextNumber = 1;
  while (isDuplicate(state.settings.tees, `Tee ${nextNumber}`, "", "name")) nextNumber += 1;
  const fields = `<div class="form-grid">${textField("name", "Tee identifier", tee?.name || `Tee ${nextNumber}`, "e.g. Tee 1", { full: true })}</div><p class="form-note">The identifier is used before conduits are connected and to distinguish tees with identical connections. Otherwise the displayed name is based on connected conduit numbers.</p>`;
  openModal(tee ? "Edit Tee" : "Add Tee", "Tees connect conduit segments and do not represent cable splices.", tee ? `edit-tee:${id}` : returnContext ? "new-tee-inline" : "new-tee", fields, tee ? "Save changes" : "Add Tee");
  if (returnContext) {
    pendingLocationReturn = returnContext;
    modalRoot.querySelectorAll('[data-action="close-modal"]').forEach((button) => {
      button.dataset.action = "return-to-route";
    });
  }
}

/**
 * Generates a unique identifier using crypto.randomUUID().
 * @returns {string} Unique UUID string
 */
function makeId() {
  return crypto.randomUUID();
}

/**
 * Main form submission handler for all modal forms.
 * Routes submissions to appropriate handlers based on form type.
 * Handles cables, conduits, cable types, and equipment locations.
 * @param {Event} event - Form submit event
 */
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
      cableAmpacity: values.cableAmpacity === "" ? null : Number(values.cableAmpacity),
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
    if (values.fromLocationId === values.toLocationId && isTee(values.fromLocationId)) {
      return showToast("Choose different endpoints for a conduit connected to a tee.", true);
    }
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
  } else if (kind === "new-tee" || kind === "new-tee-inline" || kind.startsWith("edit-tee:")) {
    const id = kind.startsWith("edit-tee:") ? kind.slice("edit-tee:".length) : makeId();
    const name = values.name.trim();
    if (!name) return showToast("Enter a tee identifier.", true);
    if (isDuplicate(state.settings.tees, name, id, "name")) return showToast("A tee with that identifier already exists.", true);
    const index = state.settings.tees.findIndex((item) => item.id === id);
    if (index >= 0) state.settings.tees[index] = { id, name };
    else state.settings.tees.push({ id, name });
    if (kind === "new-tee-inline") {
      if (persist()) {
        const returnContext = pendingLocationReturn;
        pendingLocationReturn = null;
        closeModal();
        returnToRoute({ ...returnContext, draft: { ...returnContext.draft, [returnContext.fieldName]: id } });
        showToast("Tee added. Finish editing your conduit.");
      }
    } else {
      saveAndClose(index >= 0 ? "Tee updated." : "Tee added.");
    }
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

/**
 * Checks if an item with the given value already exists in collection.
 * Case-insensitive comparison for duplicate detection.
 * @param {Array} items - Array of items to check
 * @param {*} value - Value to search for
 * @param {string} id - Current item ID to exclude from check
 * @param {string} key - Property key to compare
 * @returns {boolean} True if a duplicate exists
 */
function isDuplicate(items, value, id, key) {
  const normalized = String(value ?? "").trim().toLocaleLowerCase();
  return items.some((item) => item.id !== id && String(item[key] ?? "").trim().toLocaleLowerCase() === normalized);
}

/**
 * Checks if an equipment location with matching name and ID already exists.
 * @param {Array} locations - Array of location objects
 * @param {Object} location - Location to check for duplicates
 * @returns {boolean} True if a duplicate location exists
 */
function isDuplicateEquipment(locations, location) {
  const normalize = (value) => String(value ?? "").trim().toLocaleLowerCase();
  return locations.some((item) =>
    item.id !== location.id &&
    normalize(item.name) === normalize(location.name) &&
    normalize(item.description) === normalize(location.description));
}

/**
 * Persists state, closes modal, re-renders page, and displays success message.
 * @param {string} message - Toast message to display
 */
function saveAndClose(message) {
  if (persist()) {
    closeModal();
    renderPage();
    showToast(message);
  }
}

/**
 * Removes a record from a collection and updates the UI.
 * @param {Array} collection - Array to remove from
 * @param {string} id - ID of item to remove
 * @param {string} label - Display name for toast message
 */
function removeRecord(collection, id, label) {
  const index = collection.findIndex((item) => item.id === id);
  if (index < 0) return;
  collection.splice(index, 1);
  if (persist()) {
    renderPage();
    showToast(`${label} deleted.`);
  }
}

/**
 * Returns to a previous form with draft data after creating related record.
 * Used for inline creation of cable types or locations while editing cables/conduits.
 * @param {Object} returnContext - Context with formKind, draft, and other data
 */
function returnToRoute(returnContext) {
  if (!returnContext) return;
  const { formKind, draft } = returnContext;
  if (formKind === "new-cable") return openCableForm(undefined, draft);
  if (formKind.startsWith("edit-cable:")) return openCableForm(formKind.split(":")[1], draft);
  if (formKind === "new-conduit") return openConduitForm(undefined, draft);
  if (formKind.startsWith("edit-conduit:")) return openConduitForm(formKind.split(":")[1], draft);
}

/**
 * Starts a new project after user confirmation.
 * Clears all project data and resets state to empty.
 * User is prompted to save backup first.
 */
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

/**
 * Main action dispatcher for DOM event handling.
 * Routes user actions (button clicks, form submissions) to appropriate handlers.
 * Manages modal operations, form creation, and special actions.
 * @param {string} action - Action identifier
 * @param {string} id - Target record ID (for edit/delete operations)
 * @param {string} fieldName - Target field name (for form updates)
 */
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
  if (action === "add-route-location" || action === "add-route-tee") {
    const form = modalRoot.querySelector(".modal-form");
    const formData = new FormData(form);
    const draft = Object.fromEntries(formData.entries());
    draft.cableIds = formData.getAll("cableIds");
    const returnContext = { formKind: form.dataset.form, draft, fieldName };
    return action === "add-route-tee" ? openTeeForm(undefined, returnContext) : openLocationForm(undefined, returnContext);
  }
  if (action === "new-cable-type") return openCableTypeForm();
  if (action === "edit-cable-type") return openCableTypeForm(id);
  if (action === "new-location") return openLocationForm();
  if (action === "edit-location") return openLocationForm(id);
  if (action === "new-tee") return openTeeForm();
  if (action === "edit-tee") return openTeeForm(id);
  if (action === "delete-tee") {
    const tee = state.settings.tees.find((item) => item.id === id);
    if (state.conduits.some((conduit) => conduit.fromLocationId === id || conduit.toLocationId === id)) {
      return showToast("This tee is used by a conduit. Update those routes before deleting it.", true);
    }
    if (tee && confirm(`Delete ${teeDisplayName(tee)}?`)) removeRecord(state.settings.tees, id, "Tee");
  }
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
  if (action === "print-master-report") printMasterReport();
}

/**
 * Renders the conduit cable schedule in print-ready format.
 * Creates a formatted table for printing or saving as PDF.
 * @returns {string} HTML string for print layout
 */
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

/**
 * Renders the master report combining Conduit Cable Schedule, Voltage Drop, and Bill of Materials.
 * Each section appears on its own page when printed.
 * @returns {string} HTML string for master report print layout
 */
function renderMasterReport() {
  return `
    <div class="master-report">
      <main class="conduit-cable-print master-report-section">
        ${renderConduitCablePrint()}
      </main>
      <main class="voltage-drop-print master-report-section">
        ${renderVoltageDropPrint()}
      </main>
      <div class="master-report-section bom-print">
        ${renderBillOfMaterialsPrint()}
      </div>
    </div>`;
}

/**
 * Renders the bill of materials in print-ready format.
 * @returns {string} HTML string for BOM print layout
 */
function renderBillOfMaterialsPrint() {
  const { usedCableTypes, usedConduitGroups } = billOfMaterialsGroups();
  const settings = state.settings;

  return `
    <section class="bom-project-card">
      <div class="bom-project-title"><div><h2>${escapeHtml(titleCaseHeading(projectName()))}</h2><p>Bill of Materials</p></div><span class="bom-generated">Generated ${escapeHtml(new Date().toLocaleDateString())}</span></div>
      <div class="bom-project-meta">
        ${detail("Client", settings.clientName)}
        ${detail("Client Project #", settings.clientProjectNumber)}
        ${detail("Internal Project #", settings.internalProjectNumber)}
        ${detail("Revision", settings.revisionNumber)}
        ${detail("Designer", settings.editorName)}
      </div>
    </section>
    <section class="bom-section">
      <div class="card-heading"><div><h2>Cable Materials</h2><p>Cable types used in this project</p></div></div>
      ${usedCableTypes.length ? `<div class="table-wrap"><table class="wrapped-headers"><thead><tr><th>Spec Type</th><th>Mfr.</th><th>Spec Number</th><th>Total Length (ft)</th></tr></thead><tbody>${usedCableTypes.map(({ type, cables }) => {
        return `<tr><td>${escapeHtml(type?.specType || "—")}</td><td class="primary-cell">${escapeHtml(type?.manufacturer || "Cable type unavailable")}</td><td>${escapeHtml(type?.specNumber || "Specification unavailable")}</td><td>${renderLengthTotal(cables)}</td></tr>`;
      }).join("")}</tbody></table></div>` : `<div class="bom-empty">No cable types are currently used in the cable schedule.</div>`}
    </section>
    <section class="bom-section">
      <div class="card-heading"><div><h2>Conduit Materials</h2><p>Conduit types and sizes used in this project</p></div></div>
      ${usedConduitGroups.length ? `<div class="table-wrap"><table class="wrapped-headers"><thead><tr><th>Conduit size</th><th>Conduit type</th><th>Total Length (ft)</th></tr></thead><tbody>${usedConduitGroups.map(({ racewayType, size, conduits }) => {
        return `<tr><td class="primary-cell">${size === "TBD" ? `<span class="tag tbd">TBD</span>` : escapeHtml(size)}</td><td>${escapeHtml(racewayType)}</td><td>${renderLengthTotal(conduits)}</td></tr>`;
      }).join("")}</tbody></table></div>` : `<div class="bom-empty">No conduits are currently used in the conduit schedule.</div>`}
    </section>
    <p class="bom-note">Material lengths are based on scheduled totals. Confirm field requirements and installation allowances before ordering.</p>`;
}

/**
 * Opens the browser print dialog for the master report.
 * Displays the combined Conduit Cable Schedule, Voltage Drop, and Bill of Materials reports.
 */
function printMasterReport() {
  const printRoot = document.querySelector("#print-root");
  document.querySelector("#export-menu").hidden = true;
  document.querySelector("#export-trigger").setAttribute("aria-expanded", "false");
  printRoot.innerHTML = renderMasterReport();
  document.body.classList.add("printing-master-report");
  printReport("Master Report", () => {
    document.body.classList.remove("printing-master-report");
    printRoot.replaceChildren();
  });
}

/**
 * Opens the browser print dialog for the conduit cable schedule.
 * Displays the schedule in print-ready format before printing.
 */
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

/**
 * Renders the voltage drop report in print-ready format.
 * Creates a formatted table with voltage drop analysis for printing or export.
 * @returns {string} HTML string for voltage drop print layout
 */
function renderVoltageDropPrint() {
  const rows = voltageDropReportData();
  const settings = state.settings;
  const headers = [
    "Cable #", "Spec Type", "Cable Material", "Voltage", "Load (Amps)", "Cable Ampacity",
    "Ampacity Overhead", "Parallel Sets", "Cable Rating", "Phase", "Voltage Drop %",
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
            : `${row.voltageDrop.percent.toFixed(2)}%`;
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
          </tr>`;
        }).join("") : `<tr><td class="voltage-drop-print-empty" colspan="${headers.length}">No cable entries available.</td></tr>`}</tbody>
      </table>
    </main>`;
}

/**
 * Opens the browser print dialog for the voltage drop report.
 * Displays the voltage analysis in print-ready format before printing.
 */
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

/**
 * Triggers browser print dialog for the specified report type.
 * Updates document title and handles print completion callback.
 * @param {string} reportType - Report type name for document title
 * @param {Function} afterPrint - Callback function after print completes
 */
function printReport(reportType, afterPrint = null) {
  const originalTitle = document.title;
  document.title = projectFileBaseName(reportType);
  window.addEventListener("afterprint", () => {
    document.title = originalTitle;
    afterPrint?.();
  }, { once: true });
  window.print();
}

/**
 * Generates export rows for cable schedule in CSV format.
 * @returns {Array} 2D array with headers and cable data rows
 */
function cableExportRows() {
  return [
    ["Cable Number", "Cable Length (ft)", "Manufacturer", "Spec Number", "Spec Type", "Overall Diameter (in)", "Net Weight (lbs/1000')", "From Location", "To Location", "Cable Purpose"],
    ...sortByNumber(state.cables).map((cable) => {
      const type = cableType(cable.cableTypeId);
      return [cable.number, cable.length, type?.manufacturer, type?.specNumber, type?.specType, type?.diameter, type?.netWeight, cableLocationName(cable.fromLocationId), cableLocationName(cable.toLocationId), cablePurposeDisplay(cable)];
    }),
  ];
}

/**
 * Generates export rows for conduit schedule in CSV format.
 * @returns {Array} 2D array with headers and conduit data rows
 */
function conduitExportRows() {
  return [
    ["Conduit Number", "Size", "Conduit Length (ft)", "From Location", "To Location", "Assigned Cable Numbers"],
    ...sortByNumber(state.conduits).map((conduit) => [conduit.number, conduit.size, conduit.length, locationName(conduit.fromLocationId), locationName(conduit.toLocationId), conduit.cableIds.map((id) => state.cables.find((cable) => cable.id === id)?.number).filter(Boolean).join("; ")]),
  ];
}

/**
 * Generates export rows for bill of materials in CSV format.
 * Includes both cable and conduit material summaries with length totals.
 * @returns {Array} 2D array with headers and material data rows
 */
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

/**
 * Generates export rows for conduit cable schedule combining both schedules.
 * Creates detailed mixed cable/conduit assignment table for export.
 * @returns {Array} 2D array with headers and mixed schedule rows
 */
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

/**
 * Exports the conduit cable schedule to CSV format.
 * Uses formatted conduit cable rows with uppercase text for readability.
 */
function exportConduitCableCsv() {
  exportCsv(projectFileName("csv", "Conduit Cable Schedule"), formattedConduitCableRows());
}

/**
 * Formats conduit cable export rows with uppercase text.
 * Makes cable-related cells uppercase for visual distinction.
 * @returns {Array} 2D array with formatted rows for CSV export
 */
function formattedConduitCableRows() {
  return conduitCableExportRows().map((row, rowIndex) =>
    row === null ? null : row.map((cell, columnIndex) =>
      typeof cell === "string" && !(rowIndex > 0 && columnIndex === 3) ? cell.toUpperCase() : cell));
}

/**
 * Exports data rows to CSV file.
 * Properly escapes quotes and applies formula injection prevention.
 * @param {string} filename - Output file name
 * @param {Array} rows - 2D array of data to export
 */
function exportCsv(filename, rows) {
  const content = rows.map((row) => row === null ? "" : row.map((cell) => {
    const value = String(cell ?? "");
    const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${safeValue.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
  download(filename, `\uFEFF${content}`, "text/csv;charset=utf-8");
}

/**
 * Exports the current project state to JSON format as backup.
 * Includes all project data with export timestamp.
 */
function exportJson() {
  const backup = { ...state, exportedAt: new Date().toISOString(), formatVersion: 1 };
  download(projectFileName("ccs", "Project"), JSON.stringify(backup, null, 2), "application/json");
}

/**
 * Generates a file name with extension for exports.
 * @param {string} extension - File extension (without dot)
 * @param {string} reportType - Optional report type name
 * @returns {string} Full file name with extension
 */
function projectFileName(extension, reportType = "") {
  return `${projectFileBaseName(reportType)}.${extension}`;
}

/**
 * Generates a base file name from project details.
 * Uses internal project number, client, project name, and report type.
 * @param {string} reportType - Optional report type name
 * @returns {string} Sanitized base file name
 */
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

/**
 * Validates backup JSON data for correctness and compatibility.
 * Checks all project data structure, types, and allowed values.
 * @param {Object} backup - Backup object to validate
 * @returns {Object} Validated and normalized project state
 * @throws {Error} If backup is invalid or incompatible
 */
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
  validateItems(settings.tees, "tees", (item) => isRecord(item) && isText(item.id) && isText(item.name));
  const teeIds = settings.tees.map((tee) => tee.id);
  const teeNames = settings.tees.map((tee) => normalizedLocationName(tee.name));
  if (new Set(teeIds).size !== teeIds.length || new Set(teeNames).size !== teeNames.length ||
      teeIds.some((id) => id === CABLE_TRAY_LOCATION_ID || settings.locations.some((location) => location.id === id))) {
    throw new Error("The backup contains duplicate or conflicting tees.");
  }
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
    showToast("Could not import the backup because browser storage could not save it.", true);
    return;
  }

  state = importedState;
  renderPage();
  showToast("Project backup imported.");
}

/**
 * Triggers a file download by creating and clicking a temporary anchor element.
 * @param {string} filename - File name for download
 * @param {string} content - Text content to download
 * @param {string} mimeType - MIME type for content (e.g., "text/csv")
 */
function download(filename, content, mimeType) {
  downloadBlob(filename, new Blob([content], { type: mimeType }));
}

/**
 * Saves a Blob through the desktop dialog or a browser download.
 * @param {string} filename - File name for download
 * @param {Blob} blob - Blob object containing file data
 */
async function downloadBlob(filename, blob) {
  document.querySelector("#export-menu").hidden = true;
  document.querySelector("#export-trigger").setAttribute("aria-expanded", "false");

  if (window.__TAURI__) {
    try {
      const contents = Array.from(new Uint8Array(await blob.arrayBuffer()));
      const saved = await window.__TAURI__.core.invoke("save_export", { filename, contents });
      if (saved) showToast(`${filename} exported.`);
    } catch (error) {
      console.error("Could not export the file.", error);
      showToast("Could not export the file.", true);
    }
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`${filename} exported.`);
}

document.addEventListener("click", (event) => {
  const externalLink = event.target.closest('a[target="_blank"]');
  if (window.__TAURI__ && externalLink) {
    event.preventDefault();
    window.__TAURI__.core.invoke("open_external", { url: externalLink.href }).catch((error) => {
      console.error("Could not open the link.", error);
      showToast("Could not open the link.", true);
    });
    return;
  }

  const pageLink = event.target.closest("[data-page]");
  if (pageLink) {
    event.preventDefault();
    setPage(pageLink.dataset.page);
    closeModal();
    return;
  }

  // Handle pagination
  const paginationButton = event.target.closest(".pagination-button");
  if (paginationButton) {
    const tableType = paginationButton.dataset.table;
    const action = paginationButton.dataset.action;
    const pagination = paginationState[tableType];

    if (action === "prev-page" && pagination.currentPage > 1) {
      pagination.currentPage--;
      setPage(activePage);
    } else if (action === "next-page") {
      const totalPages = getTotalPages(tableType);
      if (pagination.currentPage < totalPages) {
        pagination.currentPage++;
        setPage(activePage);
      }
    }
    return;
  }

  
  // Handle column sorting
  const sortableHeader = event.target.closest(".sortable-header");
  if (sortableHeader) {
    const column = sortableHeader.dataset.sortColumn;
    const tableType = sortableHeader.dataset.table;
    
    if (column && tableType && tableSortState[tableType]) {
      const currentState = tableSortState[tableType];
      
      // Toggle direction if same column, otherwise set to ascending
      if (currentState.column === column) {
        currentState.direction = currentState.direction === "asc" ? "desc" : "asc";
      } else {
        currentState.column = column;
        currentState.direction = "asc";
      }

      paginationState[tableType].currentPage = 1;
      
      // Re-render the current page
      setPage(activePage);
    }
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
const iconTooltip = document.querySelector("#icon-tooltip");
let tooltipAnchor = null;

function hideIconTooltip() {
  iconTooltip.hidden = true;
  tooltipAnchor = null;
}

function showIconTooltip(anchor) {
  if (!anchor || (anchor.classList.contains("nav-item") && !appShell.classList.contains("sidebar-collapsed"))) return;
  const label = anchor.dataset.tooltip || anchor.getAttribute("aria-label");
  if (!label) return;
  const rect = anchor.getBoundingClientRect();
  if (!anchor.isConnected || rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) {
    hideIconTooltip();
    return;
  }
  tooltipAnchor = anchor;
  iconTooltip.textContent = label;
  iconTooltip.hidden = false;
  const tooltipRect = iconTooltip.getBoundingClientRect();
  const left = Math.max(8, Math.min(rect.left + (rect.width - tooltipRect.width) / 2, window.innerWidth - tooltipRect.width - 8));
  const top = rect.top >= tooltipRect.height + 8 ? rect.top - tooltipRect.height : rect.bottom;
  iconTooltip.style.left = `${left}px`;
  iconTooltip.style.top = `${Math.max(0, Math.min(top, window.innerHeight - tooltipRect.height))}px`;
}

function tooltipControl(target) {
  return target instanceof Element ? target.closest(".icon-button, .sidebar [data-tooltip]") : null;
}

document.addEventListener("pointerover", (event) => {
  const anchor = tooltipControl(event.target);
  if (anchor && !anchor.contains(event.relatedTarget) && !iconTooltip.contains(event.relatedTarget)) showIconTooltip(anchor);
});
document.addEventListener("pointerout", (event) => {
  if (!tooltipAnchor || (!tooltipAnchor.contains(event.target) && !iconTooltip.contains(event.target))) return;
  if (tooltipAnchor.contains(event.relatedTarget) || iconTooltip.contains(event.relatedTarget) || (tooltipAnchor === document.activeElement && tooltipAnchor.matches(":focus-visible"))) return;
  hideIconTooltip();
});
document.addEventListener("focusin", (event) => showIconTooltip(tooltipControl(event.target)));
document.addEventListener("focusout", (event) => {
  if (event.target === tooltipAnchor && !tooltipAnchor.matches(":hover") && !iconTooltip.matches(":hover")) hideIconTooltip();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideIconTooltip();
});
document.addEventListener("click", hideIconTooltip, true);
document.addEventListener("scroll", () => { if (tooltipAnchor) showIconTooltip(tooltipAnchor); }, true);
window.addEventListener("resize", () => { if (tooltipAnchor) showIconTooltip(tooltipAnchor); });

function setSidebarCollapsed(isCollapsed) {
  appShell.classList.toggle("sidebar-collapsed", isCollapsed);
  const label = isCollapsed ? "Expand sidebar" : "Minimize sidebar";
  sidebarToggle.setAttribute("aria-label", label);
  sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
  sidebarToggle.dataset.tooltip = label;
}
setSidebarCollapsed(keepSidebarMinimized);
sidebarToggle.addEventListener("click", () => {
  setSidebarCollapsed(!appShell.classList.contains("sidebar-collapsed"));
});

document.addEventListener("submit", handleSubmit);
document.addEventListener("change", (event) => {
  if (event.target.id === "theme-preference") {
    if (!saveThemePreference(event.target.value)) event.target.value = themePreference;
    return;
  }
  if (event.target.id === "sidebar-preference") {
    if (!saveSidebarPreference(event.target.checked)) event.target.checked = keepSidebarMinimized;
    return;
  }
  
  // Handle pagination page size changes
  if (event.target.classList.contains("pagination-page-size")) {
    const tableType = event.target.dataset.table;
    const newPageSize = event.target.value;
    const pagination = paginationState[tableType];

    pagination.pageSize = newPageSize === "all" ? "all" : parseInt(newPageSize);
    pagination.currentPage = 1;
    setPage(activePage);
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
  if (isConduitForm(form) && ["fromLocationId", "toLocationId", "cableIds", "showAllCables"].includes(event.target.name)) {
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
