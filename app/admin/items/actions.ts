"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { uploadPhotoIfProvided } from "@/lib/blob-upload";

async function readItemInput(formData: FormData, companyId: string) {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const category = await prisma.category.findFirst({ where: { id: categoryId, companyId } });
  if (!category) throw new Error("Category tidak valid.");

  const buttonText = String(formData.get("buttonText") ?? "").trim();
  const labelText = String(formData.get("labelText") ?? "").trim();
  if (!buttonText || !labelText) throw new Error("Item Name dan Label Text wajib diisi.");

  // A newly uploaded file always wins; otherwise the "Hapus foto ini"
  // checkbox clears it; otherwise leave the existing image untouched
  // (undefined tells Prisma to skip the field).
  const uploadedImageUrl = await uploadPhotoIfProvided(formData.get("image"));
  const removeImage = formData.get("removeImage") === "on";
  const imageUrl = uploadedImageUrl ?? (removeImage ? null : undefined);

  return {
    categoryId: category.id,
    buttonText,
    labelText,
    batchRequired: formData.get("batchRequired") === "on",
    defrostLifeHours: Number(formData.get("defrostLifeHours") ?? 0) || 0,
    directDefrostHours: Number(formData.get("directDefrostHours") ?? 0) || 0,
    shelfLifeHours: Number(formData.get("shelfLifeHours") ?? 0) || 0,
    todayPlusShelfLife: formData.get("todayPlusShelfLife") === "on",
    active: formData.get("active") === "on",
    imageUrl,
  };
}

export async function createItem(formData: FormData) {
  const { companyId } = await requireCompanySession();
  const input = await readItemInput(formData, companyId);

  await prisma.item.create({ data: input });
  revalidatePath("/admin/items");
  redirect("/admin/items");
}

export async function updateItem(id: string, formData: FormData) {
  const { companyId } = await requireCompanySession();
  const input = await readItemInput(formData, companyId);

  await prisma.item.updateMany({
    where: { id, category: { companyId } },
    data: input,
  });
  revalidatePath("/admin/items");
  redirect("/admin/items");
}

export async function deleteItem(id: string) {
  const { companyId } = await requireCompanySession();
  await prisma.item.deleteMany({ where: { id, category: { companyId } } });
  revalidatePath("/admin/items");
}
