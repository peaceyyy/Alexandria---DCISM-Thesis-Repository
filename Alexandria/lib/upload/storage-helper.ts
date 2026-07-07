import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { THESIS_PDF_MIME_TYPE } from "./file-validation";

const THESIS_FILES_BUCKET = "thesis_files_bucket";

export type StoredThesisFile = {
  filePath: string;
};

export async function uploadThesisFileToStorage(
  file: File,
  userId: string,
): Promise<StoredThesisFile> {
  const supabase = await createClient();
  const folderId = crypto.randomUUID();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `uploads/${userId}/${folderId}/${safeFileName}`;

  const { data, error } = await supabase.storage
    .from(THESIS_FILES_BUCKET)
    .upload(filePath, file, {
      upsert: false,
      contentType: THESIS_PDF_MIME_TYPE,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return {
    filePath: data.path,
  };
}

export async function removeThesisFileFromStorage(
  filePath: string,
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(THESIS_FILES_BUCKET)
      .remove([filePath]);

    return error?.message ?? null;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Storage cleanup could not be completed.";
  }
}
