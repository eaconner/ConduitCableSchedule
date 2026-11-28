const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../app.js"), "utf8");
const start = source.indexOf("async function downloadBlob(");
const end = source.indexOf('\ndocument.addEventListener("click"', start);
assert.ok(start >= 0 && end > start, "downloadBlob must be present");
const downloadSource = source.slice(start, end);
const clickStart = source.indexOf("  const externalLink =", end);
const pageStart = source.indexOf("  const pageLink =", clickStart);
assert.ok(clickStart > end && pageStart > clickStart, "external link handler must be present");
const linkSource = `(event) => { ${source.slice(clickStart, pageStart)} return false; }`;

test("local desktop builds use the latest application version", () => {
  const root = path.join(__dirname, "../..");
  const version = execFileSync(process.execPath, [path.join(root, ".github/scripts/desktop-version.js")], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, "../tauri.conf.json"), "utf8"));
  assert.equal(config.version, version);
});

function createContext(invoke) {
  const toasts = [];
  const errors = [];
  const downloads = [];
  const menu = { hidden: false };
  const trigger = { setAttribute() {} };
  const context = {
    Blob,
    Uint8Array,
    window: invoke ? { __TAURI__: { core: { invoke } } } : {},
    document: {
      querySelector: (selector) => selector === "#export-menu" ? menu : trigger,
      createElement: () => ({ click() { downloads.push(this.download); } }),
    },
    URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
    setTimeout: (callback) => callback(),
    console: { error: (...args) => errors.push(args) },
    showToast: (...args) => toasts.push(args),
  };
  vm.createContext(context);
  vm.runInContext(downloadSource, context);
  return { context, toasts, errors, downloads, menu };
}

test("desktop export sends the file to the native save dialog", async () => {
  const calls = [];
  const result = createContext(async (...args) => { calls.push(args); return true; });
  await result.context.downloadBlob("project.ccs", new Blob(["hello"]));

  assert.equal(calls[0][0], "save_export");
  assert.equal(calls[0][1].filename, "project.ccs");
  assert.deepEqual(Array.from(calls[0][1].contents), [104, 101, 108, 108, 111]);
  assert.equal(result.toasts[0][0], "project.ccs exported.");
  assert.equal(result.menu.hidden, true);
  assert.deepEqual(result.downloads, []);
});

test("cancelling or failing a desktop export never reports success", async () => {
  const cancelled = createContext(async () => false);
  await cancelled.context.downloadBlob("project.ccs", new Blob(["hello"]));
  assert.equal(cancelled.toasts.length, 0);

  const failed = createContext(async () => { throw new Error("write failed"); });
  await failed.context.downloadBlob("project.ccs", new Blob(["hello"]));
  assert.deepEqual(failed.toasts[0], ["Could not export the file.", true]);
  assert.equal(failed.errors.length, 1);
});

test("web export retains the browser download behavior", async () => {
  const result = createContext();
  await result.context.downloadBlob("project.csv", new Blob(["hello"]));
  assert.deepEqual(result.downloads, ["project.csv"]);
  assert.equal(result.toasts[0][0], "project.csv exported.");
});

test("desktop external links use the system browser and report errors", async () => {
  const calls = [];
  const result = createContext(async (...args) => { calls.push(args); throw new Error("open failed"); });
  const handler = vm.runInContext(linkSource, result.context);
  let prevented = false;
  handler({
    target: { closest: () => ({ href: "https://example.com/" }) },
    preventDefault: () => { prevented = true; },
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(prevented, true);
  assert.equal(calls[0][0], "open_external");
  assert.equal(calls[0][1].url, "https://example.com/");
  assert.deepEqual(result.toasts[0], ["Could not open the link.", true]);
});

test("web external links keep their normal behavior", () => {
  const result = createContext();
  const handler = vm.runInContext(linkSource, result.context);
  let prevented = false;
  handler({
    target: { closest: () => ({ href: "https://example.com/" }) },
    preventDefault: () => { prevented = true; },
  });
  assert.equal(prevented, false);
});
