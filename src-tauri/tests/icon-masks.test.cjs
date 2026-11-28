const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

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

test("browser icons exist at their advertised sizes and are included in the desktop frontend", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const links = [...html.matchAll(/<link rel="(icon|apple-touch-icon)"([^>]+)>/g)];
  assert.ok(links.some(([, rel]) => rel === "apple-touch-icon"));
  assert.ok(links.some(([, , attributes]) => attributes.includes('type="image/svg+xml"')));
  const copies = new Set();
  const preparePath = path.join(root, "src-tauri/prepare.cjs");
  const fakeFs = {
    readdirSync: fs.readdirSync,
    mkdirSync() {},
    copyFileSync(source, destination) {
      assert.ok(fs.existsSync(source), `Missing desktop asset: ${source}`);
      copies.add(path.relative(path.join(root, "src-tauri/dist"), destination));
    },
  };
  vm.runInNewContext(fs.readFileSync(preparePath, "utf8"), {
    __dirname: path.dirname(preparePath),
    require: (name) => name === "node:fs" ? fakeFs : require(name),
  });
  for (const [, , attributes] of links) {
    const file = attributes.match(/href="([^"]+)"/)[1];
    assert.ok(copies.has(file), `${file} must be included in the desktop frontend`);
    const size = attributes.match(/sizes="(\d+)x(\d+)"/);
    if (size) {
      const png = fs.readFileSync(path.join(root, file));
      assert.equal(png.readUInt32BE(16), Number(size[1]));
      assert.equal(png.readUInt32BE(20), Number(size[2]));
    }
  }
});
