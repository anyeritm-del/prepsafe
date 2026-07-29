"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";

async function readStoreInput(formData: FormData, companyId: string) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nama store wajib diisi.");

  const regionIdRaw = String(formData.get("regionId") ?? "").trim();
  let regionId: string | null = null;
  if (regionIdRaw) {
    const region = await prisma.region.findFirst({ where: { id: regionIdRaw, companyId } });
    if (!region) throw new Error("Region tidak valid.");
    regionId = region.id;
  }

  return { name, regionId };
}

export async function createStore(formData: FormData) {
  const { companyId } = await requireCompanySession();
  const { name, regionId } = await readStoreInput(formData, companyId);

  await prisma.store.create({ data: { companyId, name, regionId } });
  revalidatePath("/admin/stores");
  redirect("/admin/stores");
}

export async function updateStore(id: string, formData: FormData) {
  const { companyId } = await requireCompanySession();
  const { name, regionId } = await readStoreInput(formData, companyId);

  await prisma.store.updateMany({ where: { id, companyId }, data: { name, regionId } });
  revalidatePath("/admin/stores");
  redirect("/admin/stores");
}

export async function deleteStore(id: string) {
  const { companyId } = await requireCompanySession();
  await prisma.store.deleteMany({ where: { id, companyId } });
  revalidatePath("/admin/stores");
}
