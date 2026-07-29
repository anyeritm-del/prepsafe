interface ItemFormProps {
  action: (formData: FormData) => Promise<void>;
  categories: Array<{ id: string; name: string }>;
  defaultValues?: {
    categoryId: string;
    buttonText: string;
    labelText: string;
    batchRequired: boolean;
    defrostLifeHours: number;
    directDefrostHours: number;
    shelfLifeHours: number;
    todayPlusShelfLife: boolean;
    imageUrl: string | null;
    active: boolean;
  };
  submitLabel: string;
}

const inputClass = "rounded-md border border-neutral-300 px-3 py-2 text-sm";

export function ItemForm({ action, categories, defaultValues, submitLabel }: ItemFormProps) {
  return (
    <form action={action} encType="multipart/form-data" className="flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Category</span>
        <select name="categoryId" defaultValue={defaultValues?.categoryId ?? ""} required className={inputClass}>
          <option value="" disabled>
            - SELECT CATEGORY -
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Item Name (Button Text)</span>
        <input type="text" name="buttonText" defaultValue={defaultValues?.buttonText} required className={inputClass} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Label Text</span>
        <input type="text" name="labelText" defaultValue={defaultValues?.labelText} required className={inputClass} />
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" name="batchRequired" defaultChecked={defaultValues?.batchRequired} className="h-4 w-4" />
        <span className="text-sm font-medium text-neutral-700">Batch Required</span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Defrost Life (hours)</span>
        <input
          type="number"
          name="defrostLifeHours"
          defaultValue={defaultValues?.defrostLifeHours ?? 0}
          min={0}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Direct Defrost (hours)</span>
        <input
          type="number"
          name="directDefrostHours"
          defaultValue={defaultValues?.directDefrostHours ?? 0}
          min={0}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Shelf Life (hours)</span>
        <input
          type="number"
          name="shelfLifeHours"
          defaultValue={defaultValues?.shelfLifeHours ?? 0}
          min={0}
          className={inputClass}
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="todayPlusShelfLife"
          defaultChecked={defaultValues?.todayPlusShelfLife}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium text-neutral-700">TodayPlusShelfLife</span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Image</span>
        {defaultValues?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={defaultValues.imageUrl} alt="" className="h-16 w-16 rounded object-cover" />
        )}
        <input type="file" name="image" accept="image/*" className={inputClass} />
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" name="active" defaultChecked={defaultValues?.active ?? true} className="h-4 w-4" />
        <span className="text-sm font-medium text-neutral-700">Active</span>
      </label>

      <button type="submit" className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
        {submitLabel}
      </button>
    </form>
  );
}
