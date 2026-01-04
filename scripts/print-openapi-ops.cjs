const fs = require("fs");

const spec = JSON.parse(
  fs.readFileSync("apps/backend/openapi.json", { encoding: "utf8" })
);

const schemas = spec.components?.schemas ?? {};

function refName(ref) {
  const m = String(ref || "").match(/^#\/components\/schemas\/(.+)$/);
  return m ? m[1] : null;
}

function deref(schema) {
  if (!schema) return schema;
  if (schema.$ref) {
    const name = refName(schema.$ref);
    if (name && schemas[name]) return schemas[name];
  }
  return schema;
}

function mergeAllOf(schema) {
  schema = deref(schema);
  if (!schema?.allOf) return schema;

  const merged = { type: "object", properties: {}, required: [] };

  for (const part of schema.allOf) {
    const s = mergeAllOf(part);
    if (s?.properties) Object.assign(merged.properties, s.properties);
    if (Array.isArray(s?.required)) merged.required.push(...s.required);
  }

  merged.required = [...new Set(merged.required)];
  return merged;
}

function describe(schema, depth = 0) {
  schema = mergeAllOf(schema);
  if (!schema) return "unknown";

  if (schema.oneOf) {
    return schema.oneOf.map((s) => describe(s, depth + 1)).join(" | ");
  }
  if (schema.anyOf) {
    return schema.anyOf.map((s) => describe(s, depth + 1)).join(" | ");
  }

  if (schema.enum) {
    return `enum(${schema.enum.map(String).join(" | ")})`;
  }

  if (schema.type === "array") {
    return `array<${describe(schema.items, depth + 1)}>`;
  }

  if (schema.type === "object" || schema.properties) {
    if (depth >= 2) return "object";
    const props = schema.properties ?? {};
    const required = new Set(schema.required ?? []);

    const parts = Object.entries(props).map(([key, value]) => {
      const opt = required.has(key) ? "" : "?";
      return `${key}${opt}: ${describe(value, depth + 1)}`;
    });

    return `{ ${parts.join("; ")} }`;
  }

  if (schema.type) {
    return schema.format ? `${schema.type}(${schema.format})` : schema.type;
  }

  if (schema.format) return `string(${schema.format})`;

  return "unknown";
}

function listParams(params) {
  const out = { path: [], query: [] };

  for (const p of params ?? []) {
    const resolved = p.$ref ? deref(p) : p;
    const where = resolved.in;
    if (where !== "path" && where !== "query") continue;

    const opt = resolved.required ? "" : "?";
    out[where].push(`${resolved.name}${opt}: ${describe(resolved.schema)}`);
  }

  return out;
}

const methods = ["get", "post", "patch", "delete", "put"];
const ops = [];

for (const [path, item] of Object.entries(spec.paths ?? {})) {
  for (const m of methods) {
    const op = item[m];
    if (!op) continue;

    const auth = op.security?.length ? "auth" : "public";
    const params = listParams([
      ...(item.parameters ?? []),
      ...(op.parameters ?? []),
    ]);

    const bodySchema = op.requestBody?.content?.["application/json"]?.schema;
    const body = bodySchema ? describe(bodySchema) : null;

    const res = op.responses ?? {};
    const okCode = res["200"]
      ? "200"
      : res["201"]
        ? "201"
        : res["204"]
          ? "204"
          : null;

    let ok = null;
    if (okCode === "204") ok = "no content";
    else if (okCode) {
      const okSchema = res[okCode]?.content?.["application/json"]?.schema;
      ok = okSchema ? describe(okSchema) : null;
    }

    ops.push({ path, method: m.toUpperCase(), auth, params, body, okCode, ok });
  }
}

ops.sort(
  (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)
);

for (const o of ops) {
  console.log(`\n${o.method} ${o.path} // ${o.auth}`);
  if (o.params.path.length) console.log(`  path: ${o.params.path.join(", ")}`);
  if (o.params.query.length)
    console.log(`  query: ${o.params.query.join(", ")}`);
  if (o.body) console.log(`  body: ${o.body}`);
  if (o.okCode) console.log(`  ok ${o.okCode}: ${o.ok}`);
}

console.log(`\nTotal operations: ${ops.length}`);
