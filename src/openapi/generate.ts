import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildOpenApiDocument } from "./document.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as { version: string };

const target = resolve(root, 'docs/openapi.json');
writeFileSync(target, `${JSON.stringify(buildOpenApiDocument(pkg.version), null, 2)}\n`);
console.log(`wrote ${target}`);

