import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

type AllowedMime = "image/jpeg" | "image/png" | "image/webp";

function extForMime(mime: AllowedMime) {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

function parseBase64Input(input: { base64: string; mime?: string }): {
  bytes: Buffer;
  mime: AllowedMime;
} {
  const raw = input.base64.trim();

  // Supports both:
  // - data:image/png;base64,AAAA...
  // - AAAA... (requires mime)
  const dataUrlMatch = raw.match(/^data:([^;]+);base64,(.+)$/);

  let mime = input.mime;
  let payload = raw;

  if (dataUrlMatch) {
    mime = dataUrlMatch[1];
    payload = dataUrlMatch[2];
  }

  if (mime !== "image/jpeg" && mime !== "image/png" && mime !== "image/webp") {
    throw new Error("Unsupported image mime");
  }

  const bytes = Buffer.from(payload, "base64");
  if (!bytes.length) throw new Error("Invalid base64 image");

  return { bytes, mime };
}

export async function saveUploadedImage(input: {
  base64: string;
  mime?: string;
  maxBytes?: number;
}): Promise<{ url: string; filename: string; bytes: number }> {
  const { bytes, mime } = parseBase64Input({
    base64: input.base64,
    mime: input.mime,
  });

  const maxBytes = input.maxBytes ?? 2_500_000; // ~2.5MB
  if (bytes.byteLength > maxBytes) {
    throw new Error("Image too large");
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${randomUUID()}.${extForMime(mime)}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(filePath, bytes);

  // Store a server-relative URL; frontend can prefix API base if needed.
  return { url: `/uploads/${filename}`, filename, bytes: bytes.byteLength };
}

export function getUploadsDir() {
  return UPLOAD_DIR;
}
