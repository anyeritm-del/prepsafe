"use client";

interface DeleteButtonProps {
  action: () => Promise<void>;
  confirmMessage: string;
}

export function DeleteButton({ action, confirmMessage }: DeleteButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}
