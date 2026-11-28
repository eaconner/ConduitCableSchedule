const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "../..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");

function referenceContext() {
  const context = {
    modalRoot: { innerHTML: "", querySelector: () => ({ focus() {} }) },
    escapeHtml: (value) => String(value),
    racewayTypeLabel: (type) => vm.runInContext("RACEWAY_TYPES", context).find((item) => item.value === type)?.label || "",
  };
  vm.createContext(context);
  for (const file of ["ampacity-data.js", "raceway-data.js", "voltage-drop-data.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, "data", file), "utf8"), context);
  }
  const sizes = source.match(/^const CONDUIT_SIZES = .*;$/m);
  assert.ok(sizes);
  vm.runInContext(sizes[0], context);
  const start = source.indexOf("function openNecReferenceTable(kind)");
  const end = source.indexOf("\n/**", start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);
  return context;
}

function displayedRows(html) {
  const body = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
  assert.ok(body);
  return [...body[1].matchAll(/<tr>(.*?)<\/tr>/g)].map(([, row]) =>
    [...row.matchAll(/<(?:th scope="row"|td)>(.*?)<\/(?:th|td)>/g)].map(([, value]) => value));
}

const displayValues = (values) => values.map((value) => value == null ? "—" : String(value));

test("NEC reference dialogs display every supplied lookup value", () => {
  const context = referenceContext();
  const ampacity = vm.runInContext("CABLE_AMPACITY_TABLE", context);
  context.openNecReferenceTable("ampacity");
  assert.deepEqual(displayedRows(context.modalRoot.innerHTML), Object.entries(ampacity).map(([size, value]) =>
    displayValues([size, ...value.Copper, ...value.Aluminum])));

  const areas = vm.runInContext("RACEWAY_INTERNAL_AREAS", context);
  context.openNecReferenceTable("raceway");
  const racewayRows = displayedRows(context.modalRoot.innerHTML);
  const allSizes = new Set(Object.values(areas).flatMap((values) => Object.keys(values)));
  assert.equal(racewayRows.length, allSizes.size);
  for (const [size, ...values] of racewayRows) {
    assert.ok(allSizes.delete(size));
    assert.deepEqual(values, displayValues(Object.values(areas).map((area) => area[size])));
  }
  assert.equal(allSizes.size, 0);

  const impedance = vm.runInContext("CABLE_AC_IMPEDANCE_TABLE", context);
  context.openNecReferenceTable("impedance");
  assert.deepEqual(displayedRows(context.modalRoot.innerHTML), Object.entries(impedance).map(([size, value]) =>
    displayValues([size, value.reactance.nm, value.reactance.steel, value.resistance.Copper.nm,
      value.resistance.Copper.steel, value.resistance.Aluminum.nm, value.resistance.Aluminum.steel])));
  assert.match(context.modalRoot.innerHTML, /data-action="close-modal"/);
  assert.doesNotMatch(context.modalRoot.innerHTML, /<input|<form/);
});
