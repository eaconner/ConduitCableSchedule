const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "../..");

test("icon masks embed the bundled SVGs rather than loading file URLs", () => {
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const iconDir = path.join(root, "icons/interface");
  const icons = fs.readdirSync(iconDir).filter((name) => /^mdi-.*\.svg$/.test(name));
  for (const file of icons) {
    const className = file.slice(0, -4);
    const pattern = new RegExp(`\\.${className}\\s*\\{[^}]*--mdi-icon:\\s*url\\("data:image/svg\\+xml,([^"]+)"\\)`);
    const match = css.match(pattern);
    assert.ok(match, `${className} must use an embedded SVG mask`);
    assert.equal(decodeURIComponent(match[1]), fs.readFileSync(path.join(iconDir, file), "utf8").trim());
  }
  for (const direction of ["left", "right"]) {
    const pattern = new RegExp(`\\.mdi-chevron-${direction}\\s*\\{[^}]*--mdi-icon:\\s*url\\("data:image/svg\\+xml,([^"]+)"\\)`);
    const match = css.match(pattern);
    assert.ok(match, `mdi-chevron-${direction} must use an embedded SVG mask`);
    assert.equal(decodeURIComponent(match[1]), fs.readFileSync(path.join(iconDir, "mdi-chevron-down.svg"), "utf8").trim());
  }
});
