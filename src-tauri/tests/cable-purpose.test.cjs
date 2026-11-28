const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../app.js"), "utf8");
const start = source.indexOf("function suggestedCablePurpose(");
const end = source.indexOf("/**\n * Opens the cable form", start);
assert.ok(start >= 0 && end > start);
const context = {
  CABLE_SPEC_CONSTRUCTIONS: ["conductor", "pair"],
  cableType: (id) => ({
    conductor: { specCount: 3, specConstruction: "conductor", specGroundShield: true },
    pair: { specCount: 2, specConstruction: "pair" },
  })[id],
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);

test("suggests available electrical details and cable conductors, excluding ground", () => {
  assert.equal(context.suggestedCablePurpose("480", "Three", context.cableType("conductor")), "480V, 3PH, 3W");
  assert.equal(context.suggestedCablePurpose("120", "Single", context.cableType("pair")), "");
  assert.equal(context.suggestedCablePurpose("120", "Single", { specConstruction: "pair" }), "");
  assert.equal(context.suggestedCablePurpose("", "", undefined), "");
  assert.equal(context.suggestedCablePurpose("24", "", { specType: "3/C #12 AWG W/GND" }), "24V, 3W");
  assert.equal(context.suggestedCablePurpose("24", "Single", { specType: "2PR #18 AWG SH" }), "");
  assert.equal(context.suggestedCablePurpose("480", "Three", { specType: "unrecognized" }), "480V, 3PH");
});

test("updates automatic purposes but never overwrites a manual edit, even when cleared", () => {
  const fields = {
    purpose: { value: "", dataset: { customized: "false" } },
    voltage: { value: "480" },
    phase: { value: "Three" },
    cableTypeId: { value: "conductor" },
  };
  const form = { elements: { namedItem: (name) => fields[name] } };
  context.updateCablePurpose(form);
  assert.equal(fields.purpose.value, "480V, 3PH, 3W");
  fields.phase.value = "Single";
  context.updateCablePurpose(form);
  assert.equal(fields.purpose.value, "480V, 1PH, 3W");
  fields.cableTypeId.value = "pair";
  context.updateCablePurpose(form);
  assert.equal(fields.purpose.value, "");
  fields.purpose.value = "Instrumentation";
  fields.purpose.dataset.customized = "true";
  fields.cableTypeId.value = "conductor";
  context.updateCablePurpose(form);
  assert.equal(fields.purpose.value, "Instrumentation");
  fields.purpose.value = "";
  fields.purpose.dataset.customized = "true";
  fields.voltage.value = "120";
  context.updateCablePurpose(form);
  assert.equal(fields.purpose.value, "");
});
