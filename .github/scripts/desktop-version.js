const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync(process.argv[2] || "app.js", "utf8");
const history = source.match(/^const VERSION_HISTORY = \[[\s\S]*?^\];/m);
if (!history) {
  throw new Error("Could not find VERSION_HISTORY in app.js");
}

const versions = vm.runInNewContext(`${history[0]}\nVERSION_HISTORY`, {}, { timeout: 1000 });
const version = versions.at(-1)?.version;
if (typeof version !== "string" || !/^\d{4}\.\d{2}\.\d{2}$/.test(version)) {
  throw new Error("Latest VERSION_HISTORY entry must use the YYYY.MM.NN format");
}

console.log(version.split(".").map(Number).join("."));
