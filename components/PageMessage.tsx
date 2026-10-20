import Link from "next/link";
import { AppHeader } from "./AppHeader";

/** Full-page notice (not found / load failure) that keeps the app shell and offers a way out. */
export function PageMessage({ title, children }: { title: string; children: string }) {
  return (
    <>
      <AppHeader active="editor" />
      <main className="flex w-full flex-1 items-center justify-center bg-surface px-gutter-sm pt-16">
        <div role="alert" className="max-w-md rounded-lg bg-surface-container-lowest p-space-lg text-center shadow-sm">
          <h1 className="font-serif text-headline-sm">{title}</h1>
          <p className="mt-space-sm text-body-md text-on-surface-variant">{children}</p>
          <div className="mt-space-lg flex justify-center gap-space-sm">
            <Link href="/invoices" className="rounded-md bg-primary px-space-md py-space-sm text-label-md text-on-primary">
              All invoices
            </Link>
            <Link
              href="/?new=1"
              className="rounded-md border border-outline-variant px-space-md py-space-sm text-label-md text-on-surface"
            >
              New invoice
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
