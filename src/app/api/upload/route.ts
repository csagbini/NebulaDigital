import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/heic",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
];

/**
 * Hands the browser a short-lived, single-use token so it can upload straight
 * to Blob storage. The store's real read/write token never leaves the server.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED,
        maximumSizeInBytes: MAX_BYTES,
        // Random suffix means the URL can't be guessed from the filename.
        addRandomSuffix: true,
        tokenPayload: null,
      }),
      onUploadCompleted: async () => {
        // The submission row records the URLs; nothing to do here.
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[upload] Rejected:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
