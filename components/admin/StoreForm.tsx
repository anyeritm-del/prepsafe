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
