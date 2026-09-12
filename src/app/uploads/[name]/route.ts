import { readFileSync } from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");
const SAFE_NAME = /^[a-z0-9][a-z0-9\-]*(\.jpg|\.png|\.webp)$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  if (!SAFE_NAME.test(name)) {
    return new Response("Not Found", { status: 404 });
  }

  const filePath = path.join(UPLOADS_DIR, name);

  try {
    const buffer = readFileSync(filePath);
    const contentType =
      name.endsWith(".png") ? "image/png"
      : name.endsWith(".webp") ? "image/webp"
      : "image/jpeg";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}