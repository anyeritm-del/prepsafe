"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";

export async function updateCompany(formData: FormData) {
  const { companyId } = await requireCompanySession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nama company wajib diisi.");

  await prisma.company.update({ where: { id: companyId }, data: { name } });
  revalidatePath("/admin/company");
}
