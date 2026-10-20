import type { ReactNode } from "react";

type EditorSectionProps = {
  number: string;
  title: string;
  /** Right-aligned header content (icon, count, action). */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function EditorSection({ number, title, aside, className = "", children }: EditorSectionProps) {
  return (
    <section className={`rounded-lg bg-surface-container-lowest p-space-lg shadow-sm ${className}`}>
      <div className="mb-space-md flex items-center justify-between gap-space-sm">
        <div className="flex min-w-0 items-center gap-space-sm">
          <span className="shrink-0 rounded-md bg-surface-container px-space-xs py-0.5 font-mono text-label-sm uppercase tracking-widest text-on-surface-variant">
            <span className="sm:hidden">{number}</span>
            <span className="hidden sm:inline">Section {number}</span>
          </span>
          <h2 className="text-title-md text-on-surface">{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
