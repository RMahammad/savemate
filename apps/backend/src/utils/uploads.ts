import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

function resolveUploadsDir() {
  const configured = process.env.UPLOADS_DIR?.trim();
  if (configured) {
    // Allow absolute paths (recommended for Docker volumes) and relative paths.
    return path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);
  }

  // Default: keep current behavior (relative to backend cwd).
  return path.resolve(process.cwd(), "uploads");
}

const UPLOAD_DIR = resolveUploadsDir();

function resolveMaxUploadBytes(): number {
  const raw = process.env.UPLOAD_IMAGE_MAX_BYTES?.trim();
  if (!raw) return 15_000_000; // ~15MB
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 15_000_000;
  return Math.floor(parsed);
}

const DEFAULT_MAX_UPLOAD_BYTES = resolveMaxUploadBytes();

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

  const maxBytes = input.maxBytes ?? DEFAULT_MAX_UPLOAD_BYTES;
  if (bytes.byteLength > maxBytes) {
    const maxMb = Math.round(maxBytes / 1_000_000);
    throw new Error(`Image too large (max ${maxMb}MB)`);
  }

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Uploads directory is not writable (${UPLOAD_DIR}). ${message}`
    );
  }

  const filename = `${randomUUID()}.${extForMime(mime)}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.writeFile(filePath, bytes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to write uploaded image to ${UPLOAD_DIR}. ${message}`
    );
  }

  // Store a server-relative URL; frontend can prefix API base if needed.
  return { url: `/uploads/${filename}`, filename, bytes: bytes.byteLength };
}

export function getUploadsDir() {
  return UPLOAD_DIR;
}
