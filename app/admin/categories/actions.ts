"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";

async function readCategoryInput(formData: FormData, companyId: string) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nama category wajib diisi.");

  const order = Number(formData.get("order") ?? 10) || 10;

  const regionIdRaw = String(formData.get("regionId") ?? "").trim();
  let regionId: string | null = null;
  if (regionIdRaw) {
    const region = await prisma.region.findFirst({ where: { id: regionIdRaw, companyId } });
    if (!region) throw new Error("Region tidak valid.");
    regionId = region.id;
  }

  return { name, order, regionId };
}

export async function createCategory(formData: FormData) {
  const { companyId } = await requireCompanySession();
  const { name, order, regionId } = await readCategoryInput(formData, companyId);

  await prisma.category.create({ data: { companyId, name, order, regionId } });
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const { companyId } = await requireCompanySession();
  const { name, order, regionId } = await readCategoryInput(formData, companyId);

  await prisma.category.updateMany({ where: { id, companyId }, data: { name, order, regionId } });
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  const { companyId } = await requireCompanySession();
  await prisma.category.deleteMany({ where: { id, companyId } });
  revalidatePath("/admin/categories");
}
