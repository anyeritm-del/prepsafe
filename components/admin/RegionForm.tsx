interface RegionFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: { name: string };
  submitLabel: string;
}

export function RegionForm({ action, defaultValues, submitLabel }: RegionFormProps) {
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
      <button
        type="submit"
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}
