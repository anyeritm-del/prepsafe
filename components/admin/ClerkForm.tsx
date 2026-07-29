interface ClerkFormProps {
  action: (formData: FormData) => Promise<void>;
  stores: Array<{ id: string; name: string }>;
  defaultValues?: {
    storeId: string;
    screenName: string;
    printName: string;
    imageUrl: string | null;
    order: number;
  };
  submitLabel: string;
}

const inputClass = "rounded-md border border-neutral-300 px-3 py-2 text-sm";

export function ClerkForm({ action, stores, defaultValues, submitLabel }: ClerkFormProps) {
  return (
    <form action={action} encType="multipart/form-data" className="flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Store</span>
        <select name="storeId" defaultValue={defaultValues?.storeId ?? ""} required className={inputClass}>
          <option value="" disabled>
            - SELECT STORE -
          </option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Screen Name</span>
        <input type="text" name="screenName" defaultValue={defaultValues?.screenName} required className={inputClass} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Print Name</span>
        <input type="text" name="printName" defaultValue={defaultValues?.printName} required className={inputClass} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Image</span>
        {defaultValues?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={defaultValues.imageUrl} alt="" className="h-16 w-16 rounded object-cover" />
        )}
        <input type="file" name="image" accept="image/*" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Order</span>
        <input type="number" name="order" defaultValue={defaultValues?.order ?? 1} className={inputClass} />
      </label>

      <button type="submit" className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
        {submitLabel}
      </button>
    </form>
  );
}
