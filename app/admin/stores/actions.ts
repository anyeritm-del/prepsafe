"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";

function readMarginMm(formData: FormData, field: string, fallback: number): number {
  const value = Number(formData.get(field));
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Reads an optional manual mult override: blank input means "Auto" (null). */
function readOptionalMult(formData: FormData, field: string): number | null {
  const raw = String(formData.get(field) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 2 ? Math.floor(value) : null;
}

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

  return {
    name,
    regionId,
    labelMarginTopMm: readMarginMm(formData, "labelMarginTopMm", 3),
    labelMarginBottomMm: readMarginMm(formData, "labelMarginBottomMm", 1),
    labelMarginLeftMm: readMarginMm(formData, "labelMarginLeftMm", 1),
    labelMarginRightMm: readMarginMm(formData, "labelMarginRightMm", 1),
    labelNameMult: readOptionalMult(formData, "labelNameMult"),
    labelRow1Mult: readOptionalMult(formData, "labelRow1Mult"),
    labelRow2Mult: readOptionalMult(formData, "labelRow2Mult"),
    labelClerkMult: readOptionalMult(formData, "labelClerkMult"),
    labelStatusMult: readOptionalMult(formData, "labelStatusMult"),
  };
}

export async function createStore(formData: FormData) {
  const { companyId } = await requireCompanySession();
  const input = await readStoreInput(formData, companyId);

  await prisma.store.create({ data: { companyId, ...input } });
  revalidatePath("/admin/stores");
  redirect("/admin/stores");
}

export async function updateStore(id: string, formData: FormData) {
  const { companyId } = await requireCompanySession();
  const input = await readStoreInput(formData, companyId);

  await prisma.store.updateMany({ where: { id, companyId }, data: input });
  revalidatePath("/admin/stores");
  redirect("/admin/stores");
}

export async function deleteStore(id: string) {
  const { companyId } = await requireCompanySession();
  await prisma.store.deleteMany({ where: { id, companyId } });
  revalidatePath("/admin/stores");
}
