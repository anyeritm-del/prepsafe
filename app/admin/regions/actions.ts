"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";

function readName(formData: FormData): string {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nama region wajib diisi.");
  return name;
}

export async function createRegion(formData: FormData) {
  const { companyId } = await requireCompanySession();
  const name = readName(formData);

  await prisma.region.create({ data: { companyId, name } });
  revalidatePath("/admin/regions");
  redirect("/admin/regions");
}

export async function updateRegion(id: string, formData: FormData) {
  const { companyId } = await requireCompanySession();
  const name = readName(formData);

  await prisma.region.updateMany({ where: { id, companyId }, data: { name } });
  revalidatePath("/admin/regions");
  redirect("/admin/regions");
}

export async function deleteRegion(id: string) {
  const { companyId } = await requireCompanySession();
  await prisma.region.deleteMany({ where: { id, companyId } });
  revalidatePath("/admin/regions");
}
