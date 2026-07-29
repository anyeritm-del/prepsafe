import { LabelData, SHELF_LIFE_PRESETS } from "@/lib/types";
import {
  addHours,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/format";

interface LabelFormProps {
  data: LabelData;
  onChange: (data: LabelData) => void;
  copies: number;
  onCopiesChange: (copies: number) => void;
  selectedPresetLabel: string;
  onPresetChange: (label: string) => void;
}

export function LabelForm({
  data,
  onChange,
  copies,
  onCopiesChange,
  selectedPresetLabel,
  onPresetChange,
}: LabelFormProps) {
  const isCustomExpiry =
    SHELF_LIFE_PRESETS.find((p) => p.label === selectedPresetLabel)?.hours ===
    null;

  function handlePresetChange(label: string) {
    onPresetChange(label);
    const preset = SHELF_LIFE_PRESETS.find((p) => p.label === label);
    if (preset && preset.hours !== null) {
      onChange({ ...data, expiresAt: addHours(data.preparedAt, preset.hours) });
    }
  }

  function handlePreparedAtChange(value: string) {
    const preparedAt = fromDatetimeLocalValue(value);
    const preset = SHELF_LIFE_PRESETS.find((p) => p.label === selectedPresetLabel);
    const expiresAt =
      preset && preset.hours !== null ? addHours(preparedAt, preset.hours) : data.expiresAt;
    onChange({ ...data, preparedAt, expiresAt });
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Nama Produk</span>
        <input
          type="text"
          value={data.productName}
          onChange={(e) => onChange({ ...data, productName: e.target.value })}
          placeholder="Mis. Nasi Goreng"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          maxLength={40}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Disiapkan Oleh (Inisial)</span>
        <input
          type="text"
          value={data.preparedBy}
          onChange={(e) => onChange({ ...data, preparedBy: e.target.value })}
          placeholder="Mis. RF"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          maxLength={20}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Tanggal & Jam Disiapkan</span>
        <input
          type="datetime-local"
          value={toDatetimeLocalValue(data.preparedAt)}
          onChange={(e) => handlePreparedAtChange(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Masa Simpan</span>
        <select
          value={selectedPresetLabel}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          {SHELF_LIFE_PRESETS.map((preset) => (
            <option key={preset.label} value={preset.label}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      {isCustomExpiry && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Tanggal & Jam Kedaluwarsa</span>
          <input
            type="datetime-local"
            value={toDatetimeLocalValue(data.expiresAt)}
            onChange={(e) =>
              onChange({ ...data, expiresAt: fromDatetimeLocalValue(e.target.value) })
            }
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Jumlah Label</span>
        <input
          type="number"
          min={1}
          max={99}
          value={copies}
          onChange={(e) => onCopiesChange(Number(e.target.value))}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>
    </div>
  );
}
