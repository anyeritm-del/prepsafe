"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { uploadPhotoIfProvided } from "@/lib/blob-upload";

async function readClerkInput(formData: FormData, companyId: string) {
  const storeId = String(formData.get("storeId") ?? "").trim();
  const store = await prisma.store.findFirst({ where: { id: storeId, companyId } });
  if (!store) throw new Error("Store tidak valid.");

  const screenName = String(formData.get("screenName") ?? "").trim();
  const printName = String(formData.get("printName") ?? "").trim();
  if (!screenName || !printName) throw new Error("Screen Name dan Print Name wajib diisi.");

  return {
    storeId: store.id,
    screenName,
    printName,
    order: Number(formData.get("order") ?? 1) || 1,
    imageUrl: await uploadPhotoIfProvided(formData.get("image")),
  };
}

export async function createClerk(formData: FormData) {
  const { companyId } = await requireCompanySession();
  const input = await readClerkInput(formData, companyId);

  await prisma.clerk.create({ data: input });
  revalidatePath("/admin/clerks");
  redirect("/admin/clerks");
}

export async function updateClerk(id: string, formData: FormData) {
  const { companyId } = await requireCompanySession();
  const input = await readClerkInput(formData, companyId);

  await prisma.clerk.updateMany({
    where: { id, store: { companyId } },
    data: input,
  });
  revalidatePath("/admin/clerks");
  redirect("/admin/clerks");
}

export async function deleteClerk(id: string) {
  const { companyId } = await requireCompanySession();
  await prisma.clerk.deleteMany({ where: { id, store: { companyId } } });
  revalidatePath("/admin/clerks");
}
