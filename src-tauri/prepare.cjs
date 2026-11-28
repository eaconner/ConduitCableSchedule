const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const destination = path.join(__dirname, "dist");
const files = [
  "index.html",
  "styles.css",
  "app.js",
  "data/raceway-data.js",
  "data/ampacity-data.js",
  "data/voltage-drop-data.js",
  "icons/brand-icon.svg",
  "icons/favicon-32.png",
  "icons/apple-touch-icon.png",
  "icons/interface/MDI-LICENSE",
  "icons/interface/APACHE-2.0-LICENSE",
];

for (const name of fs.readdirSync(path.join(root, "icons/interface"))) {
  if (name.startsWith("mdi-") && name.endsWith(".svg")) files.push(`icons/interface/${name}`);
}

for (const file of files) {
  const target = path.join(destination, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, file), target);
}
