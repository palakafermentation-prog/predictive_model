import { NextResponse } from "next/server";
import { getSession } from "@/services/backend/auth.service";
import { uploadFile } from "@/services/backend/media.service";
import { handleApiError } from "@/lib/api-error";
import { MEDIA_MAX_FILE_SIZE_BYTES } from "@/lib/env";
import { isAllowedFileType } from "@/lib/file-types";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" }, requestId },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const replaceFileId = formData.get("replaceFileId") as string | null;
    const filePrefix = formData.get("filePrefix") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MEDIA_MAX_FILE_SIZE_BYTES) {
      const maxSizeMB = MEDIA_MAX_FILE_SIZE_BYTES / (1024 * 1024);
      return NextResponse.json(
        { error: `File too large (max ${maxSizeMB}MB)` },
        { status: 400 }
      );
    }

    if (!isAllowedFileType(file.type)) {
      return NextResponse.json({ error: "File type not supported" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const mediaFile = await uploadFile({
      userId: session.user.id,
      file: buffer,
      filename: file.name,
      mimeType: file.type,
      replaceFileId: replaceFileId || undefined,
      filePrefix: filePrefix || undefined,
    });

    return NextResponse.json({
      data: {
        id: mediaFile.id,
        url: mediaFile.url,
        mimeType: mediaFile.mimeType,
        sizeBytes: mediaFile.sizeBytes,
        originalFilename: mediaFile.originalFilename,
        width: mediaFile.width,
        height: mediaFile.height,
      },
      requestId,
    });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/media/upload", userId: session?.user?.id, requestId });
  }
}
