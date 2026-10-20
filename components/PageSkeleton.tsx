import { AppHeader } from "./AppHeader";

/** Static shell shown while a page's data streams in. */
export function PageSkeleton({ active }: { active: "editor" | "invoices" }) {
  return (
    <>
      <AppHeader active={active} />
      <main aria-busy="true" className="w-full flex-1 bg-surface pt-16">
        <p role="status" className="px-gutter-sm py-space-lg font-mono text-label-sm uppercase tracking-wider text-on-surface-variant sm:px-gutter-lg">
          Loading…
        </p>
      </main>
    </>
  );
}
