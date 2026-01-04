import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createOpenApiDocument } from "./document.js";

const outPath = resolve(process.cwd(), "openapi.json");

const doc = createOpenApiDocument();
await writeFile(outPath, JSON.stringify(doc, null, 2), "utf8");

// eslint-disable-next-line no-console
console.log(`OpenAPI written to ${outPath}`);
