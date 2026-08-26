// version-bump.mjs — 由 `npm version <patch|minor|major>` 触发（见 package.json scripts.version）。
// `npm version` 先改 package.json 并注入 npm_package_version，本脚本据此同步 manifest.json 与 versions.json。
import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;
if (!targetVersion) {
  console.error("usage: run via `npm version <patch|minor|major>`");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t") + "\n");

const versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t") + "\n");