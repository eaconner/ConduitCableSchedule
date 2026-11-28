const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../app.js"), "utf8");
const routeStart = source.indexOf("function connectedTeeConduits(tee)");
const routeEnd = source.indexOf("/**\n * Gets the display name of a location including", routeStart);
assert.ok(routeStart >= 0 && routeEnd > routeStart);

function routeContext() {
  const context = {
    CABLE_TRAY_LOCATION_ID: "tray",
    CABLE_TRAY_LOCATION_NAME: "Cable Tray",
    sortByNumber: (items) => [...items].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })),
    state: {
      settings: {
        locations: [{ id: "e1", name: "Equipment 1" }, { id: "e2", name: "Equipment 2" }, { id: "e3", name: "Equipment 3" }],
        tees: [{ id: "t1", name: "Tee 1" }, { id: "t2", name: "Tee 2" }],
      },
      conduits: [],
    },
  };
  vm.createContext(context);
  vm.runInContext(source.slice(routeStart, routeEnd), context);
  return context;
}

function conduit(id, from, to, cableIds) {
  return { id, number: id.toUpperCase(), fromLocationId: from, toLocationId: to, cableIds };
}

test("tee names follow connected conduit numbers while preserving their identifiers", () => {
  const context = routeContext();
  const tee = context.state.settings.tees[0];
  assert.equal(context.locationName("t1"), "Tee: Tee 1");
  context.state.conduits = [
    conduit("p10", "t1", "e2", []),
    conduit("p2", "e1", "t1", []),
  ];
  assert.equal(context.locationName("t1"), "Tee P2, P10");
  context.state.conduits[0].number = "P3";
  assert.equal(context.locationName("t1"), "Tee P2, P3");
  context.state.conduits.shift();
  assert.equal(context.locationName("t1"), "Tee P2");
  context.state.conduits = [];
  assert.equal(context.locationName("t1"), "Tee: Tee 1");
  assert.equal(tee.id, "t1");
  assert.equal(tee.name, "Tee 1");
});

test("tees with identical connected conduits have distinguishable names", () => {
  const context = routeContext();
  context.state.conduits = [conduit("p1", "t1", "t2", [])];
  assert.equal(context.locationName("t1"), "Tee P1 (Tee 1)");
  assert.equal(context.locationName("t2"), "Tee P1 (Tee 2)");
  context.state.conduits.push(conduit("p2", "t1", "e1", []));
  assert.equal(context.locationName("t1"), "Tee P1, P2");
  assert.equal(context.locationName("t2"), "Tee P1");
});

test("conduit schedule shows the tees section only when tees exist", () => {
  const context = routeContext();
  Object.assign(context, {
    sortConduits: (items) => items,
    sortByName: (items) => items,
    paginateRows: (items) => items,
    renderLengthSummary: () => "",
    escapeHtml: (value) => value,
    tableSortState: { conduits: { column: "number", direction: "asc" } },
  });
  context.state.cables = [];
  const start = source.indexOf("function renderConduits()");
  const end = source.indexOf("\n/**", start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);

  context.state.settings.tees = [];
  assert.doesNotMatch(context.renderConduits(), /conduit-tee-section/);
  assert.match(context.renderConduits(), /data-action="new-conduit"/);

  context.state.settings.tees.push({ id: "t1", name: "Tee 1" });
  const html = context.renderConduits();
  assert.match(html, /conduit-tee-section/);
  assert.match(html, /Identifier: Tee 1/);
  assert.doesNotMatch(html, /data-action="edit-tee"/);
  assert.match(html, /data-action="delete-tee" data-id="t1"/);

  context.state.settings.tees.pop();
  assert.doesNotMatch(context.renderConduits(), /conduit-tee-section/);
});

test("adding a tee assigns the next available identifier without interrupting the conduit form", () => {
  const context = routeContext();
  context.state.settings.tees = [{ id: "legacy", name: "Custom tee" }, { id: "existing", name: "t0002" }];
  const select = (value) => ({
    value,
    options: [],
    append(option) { this.options.push(option); },
    focus() { this.focused = true; },
  });
  const from = select("e1");
  const to = select("e2");
  const submit = { disabled: true };
  const note = { removed: false, remove() { this.removed = true; } };
  const form = {
    elements: { namedItem: (name) => ({ fromLocationId: from, toLocationId: to })[name] },
    querySelector: (selector) => selector === "[data-route-setup-note]" ? note : submit,
    draft: { number: "P123", cableIds: ["cable-1"] },
  };
  let saves = 0;
  let renders = 0;
  let updates = 0;
  const messages = [];
  Object.assign(context, {
    document: { createElement: () => ({}) },
    modalRoot: { querySelector: () => form },
    makeId: () => `new-${saves + 1}`,
    persist: () => { saves += 1; return true; },
    renderPage: () => { renders += 1; },
    updateConduitCableOptions: (current) => { assert.equal(current, form); updates += 1; },
    showToast: (message) => messages.push(message),
  });
  const start = source.indexOf("function addRouteTee(form, fieldName)");
  const end = source.indexOf("\n/**", start);
  const actionStart = source.indexOf("function handleAction(action, id, fieldName)");
  const actionEnd = source.indexOf("\n/**", actionStart);
  assert.ok(start >= 0 && end > start && actionStart >= 0 && actionEnd > actionStart);
  vm.runInContext(source.slice(start, end) + source.slice(actionStart, actionEnd), context);

  context.handleAction("add-route-tee", "", "fromLocationId");
  assert.equal(context.state.settings.tees[2].name, "T0001");
  assert.equal(from.value, "new-1");
  assert.equal(to.value, "e2");
  assert.equal(from.options[0].value, "new-1");
  assert.equal(to.options[0].value, "new-1");
  assert.deepEqual(form.draft, { number: "P123", cableIds: ["cable-1"] });
  assert.equal(submit.disabled, false);
  assert.equal(note.removed, true);
  assert.equal(from.focused, true);

  context.handleAction("add-route-tee", "", "toLocationId");
  assert.equal(context.state.settings.tees[3].name, "T0003");
  assert.equal(to.value, "new-2");
  assert.equal(saves, 2);
  assert.equal(renders, 2);
  assert.equal(updates, 2);
  assert.equal(messages[1], "T0003 added.");

  context.persist = () => false;
  context.handleAction("add-route-tee", "", "fromLocationId");
  assert.equal(context.state.settings.tees.length, 4);
  assert.equal(from.value, "new-1");
  assert.equal(from.options.length, 2);
  assert.equal(renders, 2);
});

test("adding a tee reports when all four-digit identifiers are used", () => {
  const context = routeContext();
  context.state.settings.tees = Array.from({ length: 9999 }, (_, i) => ({ id: String(i), name: `T${String(i + 1).padStart(4, "0")}` }));
  let message;
  context.showToast = (text, error) => { message = [text, error]; };
  const start = source.indexOf("function addRouteTee(form, fieldName)");
  const end = source.indexOf("\n/**", start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);
  context.addRouteTee({}, "fromLocationId");
  assert.deepEqual(message, ["No tee identifiers are available.", true]);
  assert.equal(context.state.settings.tees.length, 9999);
});

test("orders each cable through shared segments and multiple tees regardless of conduit direction", () => {
  const context = routeContext();
  context.state.conduits = [
    conduit("c", "t2", "t1", ["c2"]),
    conduit("a", "e1", "t1", ["c1", "c2"]),
    conduit("d", "t2", "e3", ["c2"]),
    conduit("b", "e2", "t1", ["c1"]),
  ];
  const route1 = context.cableConduitRoute({ id: "c1", fromLocationId: "e1", toLocationId: "e2" });
  const route2 = context.cableConduitRoute({ id: "c2", fromLocationId: "e1", toLocationId: "e3" });
  assert.equal(route1.status, "complete");
  assert.deepEqual(Array.from(route1.conduits, (item) => item.number), ["A", "B"]);
  assert.equal(route2.status, "complete");
  assert.deepEqual(Array.from(route2.conduits, (item) => item.number), ["A", "C", "D"]);
});

test("reports incomplete, branched, and disconnected cable assignments without inventing a route", () => {
  const context = routeContext();
  const cable = { id: "c1", fromLocationId: "e1", toLocationId: "e2" };
  context.state.conduits = [conduit("a", "e1", "t1", ["c1"])];
  assert.equal(context.cableConduitRoute(cable).status, "partial");
  context.state.conduits.push(conduit("b", "t1", "e2", ["c1"]), conduit("c", "t1", "e3", ["c1"]));
  assert.match(context.cableConduitRoute(cable).message, /ambiguous/);
  context.state.conduits[2] = conduit("c", "t2", "e3", ["c1"]);
  assert.match(context.cableConduitRoute(cable).message, /disconnected/);
});

test("does not infer connections through the generic cable tray or change legacy route display", () => {
  const context = routeContext();
  const cable = { id: "c1", fromLocationId: "e1", toLocationId: "e2" };
  context.state.conduits = [conduit("a", "e1", "tray", ["c1"])];
  assert.equal(context.cableConduitRoute(cable), null);
  context.state.conduits.push(conduit("b", "tray", "t1", ["c1"]));
  assert.match(context.cableConduitRoute(cable).message, /Cable tray routing is not tracked/);
});

function lengthCheckContext() {
  const context = routeContext();
  const start = source.indexOf("function formatNumber(value)");
  const end = source.indexOf("/**\n * Renders a length summary", start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);
  return context;
}

test("cable length check sums assigned segments and requires a 10 ft allowance", () => {
  const context = lengthCheckContext();
  const cable = { id: "c1", length: 60 };
  const conduits = [
    { length: 30, cableIds: ["c1", "c2"] },
    { length: 20, cableIds: ["c1"] },
  ];
  const route = { status: "complete" };
  assert.equal(context.cableLengthCheck(cable, conduits, route).status, "pass");
  assert.equal(context.cableLengthCheck({ ...cable, length: 100 }, conduits, route).status, "pass");
  const short = context.cableLengthCheck({ ...cable, length: 59.5 }, conduits);
  assert.equal(short.status, "short");
  assert.match(short.detail, /0\.5 ft short/);
  assert.equal(context.cableLengthCheck({ id: "c2", length: 45 }, conduits.filter((item) => item.cableIds.includes("c2")), route).status, "pass");
  assert.equal(context.cableLengthCheck({ length: 11.12 }, [{ length: 0.01 }, { length: 1.11 }], route).status, "pass");
  assert.match(context.cableLengthCheck({ length: 59.999 }, conduits).detail, /Less than 0\.01 ft short/);
});

test("cable length check does not pass missing or uncertain route data", () => {
  const context = lengthCheckContext();
  const cable = { id: "c1", length: 100 };
  const conduits = [{ length: 50, fromLocationId: "e1", toLocationId: "e2" }];
  assert.match(context.cableLengthCheck({ ...cable, length: "" }, conduits).detail, /Cable length/);
  assert.match(context.cableLengthCheck(cable, []).detail, /No conduit/);
  assert.match(context.cableLengthCheck(cable, [{ ...conduits[0], length: null }]).detail, /Conduit length/);
  assert.equal(context.cableLengthCheck(cable, conduits, { status: "partial", message: "Check route" }).status, "review");
  assert.equal(context.cableLengthCheck(cable, [{ ...conduits[0], toLocationId: "tray" }]).status, "review");
  assert.equal(context.cableLengthCheck({ ...cable, fromLocationId: "tray" }, conduits).status, "review");
  assert.equal(context.cableLengthCheck({ ...cable, length: 55 }, conduits, { status: "partial" }).status, "short");
  const routedCable = { ...cable, fromLocationId: "e1", toLocationId: "e2" };
  assert.equal(context.cableLengthCheck(routedCable, conduits).status, "pass");
  assert.equal(context.cableLengthCheck({ ...routedCable, length: 150 }, [conduits[0], conduits[0]]).status, "review");
  assert.equal(context.cableLengthCheck({ ...routedCable, toLocationId: "e3" }, conduits).status, "review");
});

test("parallel cable rows show an individual check for each cable", () => {
  const context = lengthCheckContext();
  context.showCableLengthCheck = true;
  Object.assign(context, {
    cableType: () => null,
    cableLocationName: (id) => id,
    escapeHtml: (value) => String(value),
  });
  context.state.conduits = [
    { number: "P1", length: 30, fromLocationId: "e1", toLocationId: "e2", cableIds: ["c1"] },
    { number: "P2", length: 50, fromLocationId: "e1", toLocationId: "e2", cableIds: ["c2"] },
  ];
  const start = source.indexOf("function renderCableRow(cables)");
  const end = source.indexOf("\n/**", start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);
  const row = context.renderCableRow([
    { id: "c1", number: "C1", length: 50, fromLocationId: "e1", toLocationId: "e2", parallelGroupId: "g1" },
    { id: "c2", number: "C2", length: 50, fromLocationId: "e1", toLocationId: "e2", parallelGroupId: "g1" },
  ]);
  assert.match(row, /C1: <span class="tag fill-pass">Minimum met/);
  assert.match(row, /C2: <span class="tag fill-fail">Too short/);
  assert.match(row, /10 ft short/);
  context.showCableLengthCheck = false;
  assert.doesNotMatch(context.renderCableRow([
    { id: "c1", number: "C1", length: 50, fromLocationId: "e1", toLocationId: "e2" },
  ]), /Minimum met|Too short|Needs review/);
});

test("cable length checks reset on navigation but survive same-page updates", () => {
  const context = {
    activePage: "cables",
    showCableLengthCheck: true,
    document: { querySelectorAll: () => [], querySelector: () => ({}) },
    renderPage: () => {},
  };
  vm.createContext(context);
  const start = source.indexOf("function setPage(page)");
  const end = source.indexOf("\n/**", start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);
  context.setPage("cables");
  assert.equal(context.showCableLengthCheck, true);
  context.setPage("settings");
  context.setPage("cables");
  assert.equal(context.showCableLengthCheck, false);
});

test("project display settings accept legacy projects and reject invalid preferences", () => {
  const context = {
    THEME_PREFERENCES: ["system", "light", "dark"],
    PAGE_SIZE_OPTIONS: [25, 50, 75, 100, "all"],
    PAGINATION_TABLES: ["cables", "conduits", "voltageDrop", "cableTypes", "equipment"],
  };
  vm.createContext(context);
  const start = source.indexOf("function validateProjectDisplaySettings(settings)");
  const end = source.indexOf("\n/**", start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);
  assert.doesNotThrow(() => context.validateProjectDisplaySettings({}));
  assert.doesNotThrow(() => context.validateProjectDisplaySettings({ keepSidebarMinimized: false, pageSizes: { cables: "all", conduits: 50 } }));
  assert.throws(() => context.validateProjectDisplaySettings({ keepSidebarMinimized: "false" }), /display settings/);
  assert.throws(() => context.validateProjectDisplaySettings({ themePreference: "invalid" }), /theme preference/);
  assert.throws(() => context.validateProjectDisplaySettings({ pageSizes: { cables: 10 } }), /pagination settings/);
  assert.throws(() => context.validateProjectDisplaySettings({ pageSizes: { unknown: 25 } }), /pagination settings/);
});

test("project backups preserve display preferences and default them for legacy projects", () => {
  const context = {
    THEME_PREFERENCES: ["system", "light", "dark"],
    PAGE_SIZE_OPTIONS: [25, 50, 75, 100, "all"],
    PAGINATION_TABLES: ["cables", "conduits", "voltageDrop", "cableTypes", "equipment"],
    NEC_EDITIONS: [], CABLE_MATERIALS: [], CABLE_FILL_TYPES: [], CABLE_SPEC_CONSTRUCTIONS: [],
    CABLE_SPEC_SIZES: [], RACEWAY_TYPES: [], CONDUIT_FILL_CONDITIONS: [],
    CABLE_TRAY_LOCATION_ID: "tray",
    normalizeCableTrayLocations: (project) => project,
    normalizeCableTypeMaterials: (project) => project,
    normalizedLocationName: (name) => name,
  };
  vm.createContext(context);
  const defaultsStart = source.indexOf("const emptyState = () =>");
  const defaultsEnd = source.indexOf("\n/**\n * Loads application state", defaultsStart);
  vm.runInContext(source.slice(defaultsStart, defaultsEnd), context);
  const start = source.indexOf("function validateBackupData(backup)");
  const end = source.indexOf("\nasync function importProjectBackup", start);
  vm.runInContext(source.slice(start, end), context);
  const legacy = context.validateBackupData({ settings: {}, cables: [], conduits: [] });
  assert.equal(legacy.settings.showCableLengthCheck, undefined);
  assert.equal(legacy.settings.themePreference, "system");
  assert.equal(legacy.settings.keepSidebarMinimized, false);
  assert.equal(legacy.settings.pageSizes.cables, 25);
  const settings = { showCableLengthCheck: true, themePreference: "dark", keepSidebarMinimized: true, pageSizes: { cables: 50, conduits: "all" } };
  const restored = context.validateBackupData(JSON.parse(JSON.stringify({ settings, cables: [], conduits: [] })));
  assert.equal(restored.settings.showCableLengthCheck, undefined);
  assert.equal(restored.settings.themePreference, "dark");
  assert.equal(restored.settings.keepSidebarMinimized, true);
  assert.equal(restored.settings.pageSizes.cables, 50);
  assert.equal(restored.settings.pageSizes.conduits, "all");
  assert.throws(() => context.validateBackupData({ settings: { ...settings, pageSizes: { cables: 0 } }, cables: [], conduits: [] }), /pagination settings/);
});

test("applying project display settings resets pagination and restores the sidebar", () => {
  const context = {
    showCableLengthCheck: true,
    state: { settings: { keepSidebarMinimized: true, pageSizes: { cables: 50 } } },
    PAGINATION_TABLES: ["cables", "conduits"],
    paginationState: { cables: { currentPage: 3, pageSize: 25 }, conduits: { currentPage: 2, pageSize: "all" } },
    applyTheme: () => { context.themeApplied = true; },
    setSidebarCollapsed: (value) => { context.collapsed = value; },
  };
  vm.createContext(context);
  const start = source.indexOf("function applyProjectDisplaySettings()");
  const end = source.indexOf("\n\napplyProjectDisplaySettings();", start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);
  context.applyProjectDisplaySettings();
  assert.equal(context.themeApplied, true);
  assert.equal(context.showCableLengthCheck, false);
  assert.equal(context.collapsed, true);
  assert.equal(context.paginationState.cables.pageSize, 50);
  assert.equal(context.paginationState.conduits.pageSize, 25);
  assert.equal(context.paginationState.cables.currentPage, 1);
  assert.equal(context.paginationState.conduits.currentPage, 1);
});

test("theme changes persist with the project and roll back when saving fails", () => {
  const context = {
    THEME_PREFERENCES: ["system", "light", "dark"],
    state: { settings: { themePreference: "system" } },
    persist: () => true,
    applyTheme: () => { context.applied = context.state.settings.themePreference; },
    showToast: () => {},
  };
  vm.createContext(context);
  const start = source.indexOf("function saveThemePreference(preference)");
  const end = source.indexOf("\nfunction persist()", start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);
  assert.equal(context.saveThemePreference("dark"), true);
  assert.equal(context.state.settings.themePreference, "dark");
  assert.equal(context.applied, "dark");
  context.persist = () => false;
  assert.equal(context.saveThemePreference("light"), false);
  assert.equal(context.state.settings.themePreference, "dark");
  assert.equal(context.applied, "dark");
  assert.equal(context.saveThemePreference("invalid"), false);
});

test("project theme applies the selected or system appearance", () => {
  const meta = {};
  const context = {
    state: { settings: { themePreference: "system" } },
    systemTheme: { matches: true },
    document: { documentElement: { dataset: {} }, querySelector: () => meta },
  };
  vm.createContext(context);
  const start = source.indexOf("function applyTheme()");
  const end = source.indexOf("\n/**", start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);
  context.applyTheme();
  assert.equal(context.document.documentElement.dataset.theme, "dark");
  assert.equal(meta.content, "#141c27");
  context.state.settings.themePreference = "light";
  context.applyTheme();
  assert.equal(context.document.documentElement.dataset.theme, "light");
  context.state.settings.themePreference = "dark";
  context.systemTheme.matches = false;
  context.applyTheme();
  assert.equal(context.document.documentElement.dataset.theme, "dark");
});

function assignmentForm(rows) {
  const fields = {
    number: { value: "P1" },
    fromLocationId: { value: "" },
    toLocationId: { value: "" },
    showAllCables: { checked: false },
  };
  const messages = Object.fromEntries([".checkbox-list-header", ".checkbox-list-empty", ".assignment-warning", ".hidden-assignments"]
    .map((selector) => [selector, { hidden: true, textContent: "" }]));
  const options = rows.map(({ from, to, prefix = "P", checked = false }) => {
    const checkbox = { checked };
    const incompatible = { hidden: true };
    return {
      dataset: { fromLocationName: from, toLocationName: to, cablePrefix: prefix },
      checkbox,
      incompatible,
      classList: { toggle() {} },
      querySelector: (selector) => selector === ".checkbox-cable-incompatible" ? incompatible : checkbox,
    };
  });
  return {
    fields, options, messages,
    elements: { namedItem: (name) => fields[name] },
    querySelectorAll: () => options,
    querySelector: (selector) => messages[selector],
  };
}

test("assignment filter data uses location names, not equipment descriptions", () => {
  const context = routeContext();
  context.state.settings.locations = [
    { id: "source", name: "SWGR-1", description: "SW-PUMP-1" },
    { id: "destination", name: "PUMP-1" },
  ];
  context.state.cables = [{ id: "c1", number: "P1", fromLocationId: "source", toLocationId: "destination" }];
  Object.assign(context, {
    RACEWAY_TYPES: [],
    sortCablesByPrefix: (cables) => cables,
    numberPrefixFrom: () => "P",
    cableType: () => null,
    cableLocationName: (id) => {
      const location = context.state.settings.locations.find((item) => item.id === id);
      return location.description ? `${location.name} - ${location.description}` : location.name;
    },
    escapeHtml: (value) => String(value),
    scheduleNumberField: () => "",
    conduitSizeField: () => "",
    selectField: () => "",
    textField: () => "",
    routeLocationField: () => "",
    openModal: (title, subtitle, kind, fields) => { context.markup = fields; },
    modalRoot: { querySelector: () => ({}) },
    updateConduitCableOptions: () => {},
    updateConduitFillCondition: () => {},
    updateConduitRacewayArea: () => {},
  });
  const start = source.indexOf("function openConduitForm(id, draft = {}, modalOptions = {})");
  const end = source.indexOf("\n/**", start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);
  context.openConduitForm();
  assert.match(context.markup, /data-from-location-name="swgr-1" data-to-location-name="pump-1"/);
  assert.match(context.markup, /SWGR-1 - SW-PUMP-1/);
});

test("assignment filtering combines directional substring matches and treats routing points as unconstrained", () => {
  const context = routeContext();
  context.state.settings.locations = [{ id: "e1", name: "EQ1" }, { id: "e2", name: "Eq2" }];
  context.cablePrefixesForConduit = () => ["P", "C", "S"];
  const start = source.indexOf("function updateConduitCableOptions(form)");
  const end = source.indexOf("\n/**", start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);
  const form = assignmentForm([
    { from: "eq1 - feeder", to: "eq2 - panel" },
    { from: "eq1 - feeder", to: "other" },
    { from: "other", to: "eq2 - panel" },
    { from: "eq2", to: "eq1" },
  ]);
  const visible = () => form.options.map((option) => !option.hidden);
  const update = () => context.updateConduitCableOptions(form);

  update();
  assert.deepEqual(visible(), [true, true, true, true]);
  form.fields.fromLocationId.value = "e1";
  update();
  assert.deepEqual(visible(), [true, true, false, false]);
  form.fields.toLocationId.value = "e2";
  update();
  assert.deepEqual(visible(), [true, false, false, false]);
  form.fields.fromLocationId.value = "t1";
  update();
  assert.deepEqual(visible(), [true, false, true, false]);
  form.fields.fromLocationId.value = "tray";
  update();
  assert.deepEqual(visible(), [true, false, true, false]);
  form.fields.fromLocationId.value = "e1";
  form.fields.toLocationId.value = "tray";
  update();
  assert.deepEqual(visible(), [true, true, false, false]);
  form.fields.toLocationId.value = "t1";
  update();
  assert.deepEqual(visible(), [true, true, false, false]);
  form.fields.fromLocationId.value = "tray";
  update();
  assert.deepEqual(visible(), [true, true, true, true]);
  form.fields.fromLocationId.value = "missing";
  update();
  assert.deepEqual(visible(), [false, false, false, false]);
});

test("assignment filtering preserves hidden selections and exposes incompatible assignments", () => {
  const context = routeContext();
  context.cablePrefixesForConduit = () => ["C", "S"];
  const start = source.indexOf("function updateConduitCableOptions(form)");
  const end = source.indexOf("\n/**", start);
  vm.runInContext(source.slice(start, end), context);
  const form = assignmentForm([
    { from: "equipment 1", to: "equipment 2", prefix: "C" },
    { from: "other", to: "equipment 2", prefix: "C", checked: true },
    { from: "other", to: "equipment 2", prefix: "P", checked: true },
    { from: "equipment 1", to: "equipment 2", prefix: "P" },
  ]);
  form.fields.fromLocationId.value = "e1";
  context.updateConduitCableOptions(form);
  assert.deepEqual(form.options.map((option) => !option.hidden), [true, false, true, false]);
  assert.equal(form.options[1].checkbox.checked, true);
  assert.match(form.messages[".hidden-assignments"].textContent, /1 assigned cable is hidden/);
  assert.equal(form.messages[".hidden-assignments"].hidden, false);
  assert.equal(form.messages[".assignment-warning"].hidden, false);
  assert.equal(form.options[2].incompatible.hidden, false);

  form.fields.showAllCables.checked = true;
  context.updateConduitCableOptions(form);
  assert.deepEqual(form.options.map((option) => !option.hidden), [true, true, true, false]);
  assert.equal(form.messages[".hidden-assignments"].hidden, true);
});

function backupContext() {
  const start = source.indexOf("function validateBackupData(backup)");
  const end = source.indexOf("\nasync function importProjectBackup", start);
  assert.ok(start >= 0 && end > start);
  const context = { URL };
  vm.createContext(context);
  const evaluateSection = (from, to) => {
    const sectionStart = source.indexOf(from);
    const sectionEnd = source.indexOf(to, sectionStart);
    assert.ok(sectionStart >= 0 && sectionEnd > sectionStart);
    vm.runInContext(source.slice(sectionStart, sectionEnd), context);
  };
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../../data/raceway-data.js"), "utf8"), context);
  evaluateSection("const STORAGE_KEY", "const VERSION_HISTORY");
  evaluateSection("const emptyState = () =>", "/**\n * Loads application state");
  evaluateSection("function isCableTrayLocation(location)", "\nlet activePage");
  evaluateSection("function safeHttpUrl(value)", "\n/**");
  evaluateSection("function normalizedLocationName(name)", "\n/**");
  vm.runInContext(source.slice(start, end), context);
  return context;
}

test("example projects match the current project format and import unchanged", () => {
  const context = backupContext();
  const defaults = vm.runInContext("emptyState().settings", context);
  for (const name of ["INT-001 - Example - First Test.ccs", "INT-002 - Example - Conduit Tee.ccs"]) {
    const project = JSON.parse(fs.readFileSync(path.join(__dirname, "../../example", name), "utf8"));
    const restored = context.validateBackupData(project);
    assert.deepEqual(JSON.parse(JSON.stringify(restored)), {
      settings: project.settings,
      cables: project.cables,
      conduits: project.conduits,
    }, name);
    assert.equal(project.formatVersion, 1);
    for (const key of ["themePreference", "keepSidebarMinimized", "pageSizes"]) {
      assert.deepEqual(project.settings[key], JSON.parse(JSON.stringify(defaults[key])), `${name}: ${key}`);
    }
    for (const type of project.settings.cableTypes) {
      assert.ok(Object.hasOwn(type, "cableAmpacity"));
      assert.equal(Object.hasOwn(type, "customSpecType"), false);
    }
  }
});

test("imports old projects and preserves tees through project backup validation", () => {
  const context = backupContext();
  const project = JSON.parse(fs.readFileSync(path.join(__dirname, "../../example/INT-002 - Example - Conduit Tee.ccs"), "utf8"));
  const legacyProject = JSON.parse(fs.readFileSync(path.join(__dirname, "../../example/INT-001 - Example - First Test.ccs"), "utf8"));
  delete legacyProject.settings.tees;
  assert.equal(context.validateBackupData(legacyProject).settings.tees.length, 0);
  const restored = context.validateBackupData(project);
  assert.equal(restored.settings.tees.length, 2);
  assert.equal(restored.conduits[0].toLocationId, restored.settings.tees[0].id);
  project.settings.tees.push({ id: "duplicate", name: " tee 1 " });
  assert.throws(() => context.validateBackupData(project), /duplicate or conflicting tees/);
});
