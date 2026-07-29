import { put } from "@vercel/blob";

/** Uploads a photo to Vercel Blob if the user actually selected a file. */
export async function uploadPhotoIfProvided(file: FormDataEntryValue | null): Promise<string | undefined> {
  if (!(file instanceof File) || file.size === 0) return undefined;
  const blob = await put(`photos/${file.name}`, file, { access: "public" });
  return blob.url;
}
