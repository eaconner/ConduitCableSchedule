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

test("imports old projects and preserves tees through project backup validation", () => {
  const start = source.indexOf("function validateBackupData(backup)");
  const end = source.indexOf("\nasync function importProjectBackup", start);
  assert.ok(start >= 0 && end > start);
  const context = {
    emptyState: () => ({ settings: {
      projectName: "", clientName: "", clientProjectNumber: "", internalProjectNumber: "",
      revisionNumber: "", editorName: "", scheduleStatus: "In Progress", necEdition: "",
      necJurisdiction: "", powerFactor: 0.9, maxVoltageDropPercent: 3, cableTypes: [], locations: [], tees: [],
    } }),
    NEC_EDITIONS: ["2017", "2020", "2023", "2026"],
    CABLE_MATERIALS: ["Aluminum", "Copper"],
    CABLE_FILL_TYPES: [{ value: "individual" }, { value: "multiconductor" }],
    CABLE_SPEC_CONSTRUCTIONS: ["conductor", "pair"],
    CABLE_SPEC_SIZES: ["2 AWG", "1/0 AWG", "500 KCMIL", "750 KCMIL", "350 KCMIL", "250 KCMIL", "8 AWG"],
    RACEWAY_TYPES: [{ value: "emt" }, { value: "rmc" }, { value: "pvc-s40" }, { value: "pvc-s80" }, { value: "other" }],
    CONDUIT_FILL_CONDITIONS: ["standard", "nipple"],
    CABLE_TRAY_LOCATION_ID: "tray",
    normalizedLocationName: (name) => String(name ?? "").trim().toLocaleLowerCase(),
    safeHttpUrl: (url) => url,
    normalizeCableTrayLocations: (project) => project,
    normalizeCableTypeMaterials: (project) => project,
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  const project = JSON.parse(fs.readFileSync(path.join(__dirname, "../../example/example-project.ccs"), "utf8"));
  const legacy = context.validateBackupData(project);
  assert.equal(legacy.settings.tees.length, 0);
  project.settings.tees = [{ id: "tee-1", name: "Tee 1" }];
  project.conduits[0].toLocationId = "tee-1";
  const restored = context.validateBackupData(JSON.parse(JSON.stringify(project)));
  assert.equal(restored.settings.tees[0].name, "Tee 1");
  assert.equal(restored.conduits[0].toLocationId, "tee-1");
  project.settings.tees.push({ id: "tee-2", name: " tee 1 " });
  assert.throws(() => context.validateBackupData(project), /duplicate or conflicting tees/);
});
