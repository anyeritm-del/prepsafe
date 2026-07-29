interface CategoryFormProps {
  action: (formData: FormData) => Promise<void>;
  regions: Array<{ id: string; name: string }>;
  defaultValues?: { name: string; order: number; regionId: string | null };
  submitLabel: string;
}

export function CategoryForm({ action, regions, defaultValues, submitLabel }: CategoryFormProps) {
  return (
    <form action={action} className="flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Name</span>
        <input
          type="text"
          name="name"
          defaultValue={defaultValues?.name}
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Region</span>
        <select
          name="regionId"
          defaultValue={defaultValues?.regionId ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">- None (semua region) -</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Order</span>
        <input
          type="number"
          name="order"
          defaultValue={defaultValues?.order ?? 10}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}
