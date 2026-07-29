interface StoreFormProps {
  action: (formData: FormData) => Promise<void>;
  regions: Array<{ id: string; name: string }>;
  defaultValues?: { name: string; regionId: string | null };
  submitLabel: string;
}

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
          <option value="">- None -</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
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
