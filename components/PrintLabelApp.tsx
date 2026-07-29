"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LabelPreview } from "@/components/LabelPreview";
import { PrinterConnect } from "@/components/PrinterConnect";
import { addHours, startOfToday } from "@/lib/format";
import { generateLabelTspl } from "@/lib/tspl";
import { LabelData } from "@/lib/types";
import { PrinterConnection, sendToPrinter } from "@/lib/webusb";

export interface PrintStore {
  id: string;
  name: string;
}

export interface PrintClerk {
  id: string;
  storeId: string;
  screenName: string;
  printName: string;
  imageUrl: string | null;
  order: number;
}

export interface PrintCategory {
  id: string;
  name: string;
  order: number;
}

export interface PrintItem {
  id: string;
  categoryId: string;
  buttonText: string;
  labelText: string;
  shelfLifeHours: number;
  todayPlusShelfLife: boolean;
}

export interface PrintPageData {
  stores: PrintStore[];
  clerks: PrintClerk[];
  categories: PrintCategory[];
  items: PrintItem[];
}

type PrintStatus =
  | { state: "idle" }
  | { state: "printing" }
  | { state: "success" }
  | { state: "error"; message: string };

export default function PrintLabelApp({ data }: { data: PrintPageData }) {
  const [storeId, setStoreId] = useState(data.stores[0]?.id ?? "");
  const [clerkId, setClerkId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [connection, setConnection] = useState<PrinterConnection | null>(null);
  const [printStatus, setPrintStatus] = useState<PrintStatus>({ state: "idle" });

  const storeClerks = useMemo(
    () => data.clerks.filter((c) => c.storeId === storeId),
    [data.clerks, storeId],
  );
  const selectedClerk = data.clerks.find((c) => c.id === clerkId) ?? null;
  const categoryItems = useMemo(
    () => data.items.filter((i) => i.categoryId === categoryId),
    [data.items, categoryId],
  );
  const selectedItem = data.items.find((i) => i.id === itemId) ?? null;

  const labelData: LabelData | null = useMemo(() => {
    if (!selectedClerk || !selectedItem) return null;
    const preparedAt = new Date();
    const base = selectedItem.todayPlusShelfLife ? startOfToday(preparedAt) : preparedAt;
    return {
      productName: selectedItem.labelText,
      preparedBy: selectedClerk.printName,
      preparedAt,
      expiresAt: addHours(base, selectedItem.shelfLifeHours),
    };
  }, [selectedClerk, selectedItem]);

  async function handlePrint() {
    if (!labelData || !connection) return;
    setPrintStatus({ state: "printing" });
    try {
      const tspl = generateLabelTspl(labelData, 1);
      await sendToPrinter(connection, tspl);
      setPrintStatus({ state: "success" });
      setCategoryId(null);
      setItemId(null);
    } catch (err) {
      setPrintStatus({
        state: "error",
        message: err instanceof Error ? err.message : "Gagal mencetak label.",
      });
    }
  }

  if (data.stores.length === 0) {
    return (
      <EmptyState message="Belum ada Store. Tambahkan Store dulu di Data Master." />
    );
  }
  if (data.categories.length === 0) {
    return (
      <EmptyState message="Belum ada Category. Tambahkan Category & Item dulu di Data Master." />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Print Label</h1>
        <p className="text-sm text-neutral-500">Cetak label ke printer GS 2208D (55mm x 30mm)</p>
      </div>

      <PrinterConnect connection={connection} onConnectionChange={setConnection} />

      {data.stores.length > 1 && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Store</span>
          <select
            value={storeId}
            onChange={(e) => {
              setStoreId(e.target.value);
              setClerkId(null);
            }}
            className="max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {data.stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <PickerSection title="Clerk">
        {storeClerks.length === 0 ? (
          <p className="text-sm text-neutral-400">
            Belum ada Clerk untuk store ini.{" "}
            <Link href="/admin/clerks" className="underline">
              Tambahkan di Data Master
            </Link>
            .
          </p>
        ) : (
          <TileGrid>
            {storeClerks.map((clerk) => (
              <Tile
                key={clerk.id}
                selected={clerk.id === clerkId}
                onClick={() => setClerkId(clerk.id)}
                label={clerk.screenName}
                imageUrl={clerk.imageUrl}
              />
            ))}
          </TileGrid>
        )}
      </PickerSection>

      {selectedClerk && (
        <PickerSection title="Category">
          <TileGrid>
            {data.categories.map((category) => (
              <Tile
                key={category.id}
                selected={category.id === categoryId}
                onClick={() => {
                  setCategoryId(category.id);
                  setItemId(null);
                }}
                label={category.name}
              />
            ))}
          </TileGrid>
        </PickerSection>
      )}

      {selectedClerk && categoryId && (
        <PickerSection title="Item">
          {categoryItems.length === 0 ? (
            <p className="text-sm text-neutral-400">
              Belum ada Item aktif di category ini.{" "}
              <Link href="/admin/items" className="underline">
                Tambahkan di Data Master
              </Link>
              .
            </p>
          ) : (
            <TileGrid>
              {categoryItems.map((item) => (
                <Tile
                  key={item.id}
                  selected={item.id === itemId}
                  onClick={() => setItemId(item.id)}
                  label={item.buttonText}
                />
              ))}
            </TileGrid>
          )}
        </PickerSection>
      )}

      {labelData && (
        <div className="flex flex-col items-start gap-4">
          <LabelPreview data={labelData} />
          <button
            type="button"
            onClick={handlePrint}
            disabled={!connection || printStatus.state === "printing"}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {printStatus.state === "printing" ? "Mencetak..." : "Cetak Label"}
          </button>
          {printStatus.state === "success" && (
            <p className="text-sm text-green-600">Label berhasil dikirim ke printer.</p>
          )}
          {printStatus.state === "error" && (
            <p className="text-sm text-red-600">{printStatus.message}</p>
          )}
        </div>
      )}
    </main>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <p className="text-sm text-neutral-500">{message}</p>
      <Link href="/admin" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
        Buka Data Master
      </Link>
    </main>
  );
}

function PickerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-neutral-700">{title}</p>
      {children}
    </div>
  );
}

function TileGrid({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Tile({
  label,
  imageUrl,
  selected,
  onClick,
}: {
  label: string;
  imageUrl?: string | null;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-24 flex-col items-center gap-1 rounded-md border p-2 text-center text-xs font-medium ${
        selected ? "border-neutral-900 bg-neutral-100" : "border-neutral-300 hover:bg-neutral-50"
      }`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-14 w-14 rounded object-cover" />
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded bg-neutral-200 text-neutral-400">
          ?
        </span>
      )}
      <span className="line-clamp-2">{label}</span>
    </button>
  );
}
