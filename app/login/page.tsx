import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

async function loginAction(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw err;
  }
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <form action={loginAction} className="flex w-full max-w-sm flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Masuk</h1>
          <p className="text-sm text-neutral-500">Print Label &amp; Data Master</p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Email</span>
          <input
            type="email"
            name="email"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Password</span>
          <input
            type="password"
            name="password"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        {error && <p className="text-sm text-red-600">Email atau password salah.</p>}

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Masuk
        </button>
      </form>
    </main>
  );
}
