import { getUploadByName } from "@/lib/database";

const SAFE_NAME = /^[a-z0-9][a-z0-9\-]*(\.jpg|\.png|\.webp)$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  if (!SAFE_NAME.test(name)) {
    return new Response("Not Found", { status: 404 });
  }

  const upload = await getUploadByName(name);

  if (!upload || upload.data.byteLength === 0) {
    return new Response("Not Found", { status: 404 });
  }

  const body = upload.data.slice().buffer as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Content-Type": upload.content_type,
      "Content-Length": String(upload.data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
