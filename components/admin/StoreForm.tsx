interface StoreFormProps {
  action: (formData: FormData) => Promise<void>;
  regions: Array<{ id: string; name: string }>;
  defaultValues?: {
    name: string;
    regionId: string | null;
    labelMarginTopMm: number;
    labelMarginBottomMm: number;
    labelMarginLeftMm: number;
    labelMarginRightMm: number;
    labelLineGapMm: number;
    labelNameMult: number | null;
    labelRow1Mult: number | null;
    labelRow2Mult: number | null;
    labelClerkMult: number | null;
    labelStatusMult: number | null;
  };
  submitLabel: string;
}

const inputClass = "rounded-md border border-neutral-300 px-3 py-2 text-sm";

export function StoreForm({ action, regions, defaultValues, submitLabel }: StoreFormProps) {
  return (
    <form action={action} className="flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Name</span>
        <input
          type="text"
          name="name"
          defaultValue={defaultValues?.name}
          required
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Region</span>
        <select
          name="regionId"
          defaultValue={defaultValues?.regionId ?? ""}
          className={inputClass}
        >
          <option value="">- None -</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3">
        <p className="text-sm font-medium text-neutral-700">Kalibrasi Label (margin, mm)</p>
        <p className="text-xs text-neutral-500">
          Jarak dari tepi label ke area yang boleh dicetak. Kalau teks kepotong di tepi, naikkan
          margin sisi itu; kalau teksnya terlalu kecil/banyak ruang kosong, turunkan.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-700">Atas</span>
            <input
              type="number"
              name="labelMarginTopMm"
              min={0}
              step={0.5}
              defaultValue={defaultValues?.labelMarginTopMm ?? 3}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-700">Bawah</span>
            <input
              type="number"
              name="labelMarginBottomMm"
              min={0}
              step={0.5}
              defaultValue={defaultValues?.labelMarginBottomMm ?? 1}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-700">Kiri</span>
            <input
              type="number"
              name="labelMarginLeftMm"
              min={0}
              step={0.5}
              defaultValue={defaultValues?.labelMarginLeftMm ?? 1}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-700">Kanan</span>
            <input
              type="number"
              name="labelMarginRightMm"
              min={0}
              step={0.5}
              defaultValue={defaultValues?.labelMarginRightMm ?? 1}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-700">Jarak antar baris</span>
            <input
              type="number"
              name="labelLineGapMm"
              min={0}
              step={0.5}
              defaultValue={defaultValues?.labelLineGapMm ?? 1}
              className={inputClass}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3">
        <p className="text-sm font-medium text-neutral-700">Ukuran Font (mult)</p>
        <p className="text-xs text-neutral-500">
          Kosongkan untuk Otomatis (menyesuaikan ruang yang tersisa). Isi angka untuk memaksa
          ukuran itu persis, tidak peduli sisa ruang.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-700">Nama Produk</span>
            <input
              type="number"
              name="labelNameMult"
              min={2}
              placeholder="Auto"
              defaultValue={defaultValues?.labelNameMult ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-700">Prep / OOF</span>
            <input
              type="number"
              name="labelRow1Mult"
              min={2}
              placeholder="Auto"
              defaultValue={defaultValues?.labelRow1Mult ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-700">EXP / Prep By</span>
            <input
              type="number"
              name="labelRow2Mult"
              min={2}
              placeholder="Auto"
              defaultValue={defaultValues?.labelRow2Mult ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-700">Clerk</span>
            <input
              type="number"
              name="labelClerkMult"
              min={2}
              placeholder="Auto"
              defaultValue={defaultValues?.labelClerkMult ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-700">Status (Thawing)</span>
            <input
              type="number"
              name="labelStatusMult"
              min={2}
              placeholder="Auto"
              defaultValue={defaultValues?.labelStatusMult ?? ""}
              className={inputClass}
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}
