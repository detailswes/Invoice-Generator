import Link from "next/link";
import type { ReactNode } from "react";
import { User } from "lucide-react";

function FolioMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8">
      <rect width="32" height="32" rx="6" fill="#000" />
      <path d="M11 9h10M11 9v14M11 16h7" stroke="#fff" strokeWidth="2.2" strokeLinecap="square" fill="none" />
    </svg>
  );
}

type Props = {
  active: "editor" | "invoices";
  invoiceNumber?: string;
  status?: string;
  /** Right-hand action buttons. */
  actions?: ReactNode;
};

const navLink = "whitespace-nowrap text-body-sm text-on-surface-variant transition-colors hover:text-on-surface";

export function AppHeader({ active, invoiceNumber, status, actions }: Props) {
  return (
    <header className="fixed top-0 z-50 print:hidden w-full bg-surface/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="flex h-16 w-full items-center justify-between px-gutter-sm sm:px-gutter-lg">
        <div className="flex min-w-0 items-center gap-space-lg">
          <Link href="/" className="flex items-center gap-space-sm" aria-label="Folio home">
            <FolioMark />
            <span className="hidden text-title-lg tracking-tight text-on-surface sm:inline">Folio</span>
          </Link>
          <div className="hidden h-4 w-px bg-surface-container-highest md:block" />
          <nav aria-label="Primary" className="flex items-center gap-space-md">
            <Link
              href="/invoices"
              aria-current={active === "invoices" ? "page" : undefined}
              className={active === "invoices" ? "whitespace-nowrap text-title-md text-on-surface" : navLink}
            >
              <span className="hidden sm:inline">← </span>All Invoices
            </Link>
            <Link
              href="/"
              aria-current={active === "editor" ? "page" : undefined}
              className={active === "editor" ? "whitespace-nowrap text-title-md text-on-surface" : navLink}
            >
              Editor
            </Link>
          </nav>
          {invoiceNumber !== undefined && (
            <div className="hidden items-center gap-space-sm pl-space-sm lg:flex">
              <div className="flex items-center gap-space-xs rounded-md bg-surface-container-lowest px-space-sm py-space-xs shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">Doc:</span>
                <span className="max-w-48 truncate font-mono text-tabular-md text-on-surface">
                  {invoiceNumber || "—"}
                </span>
              </div>
              {status && (
                <div className="flex items-center gap-space-xs rounded-md bg-surface-container px-space-sm py-space-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  <span className="font-mono text-label-sm uppercase text-on-surface-variant">{status}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-space-sm">
          {actions}
          <div
            aria-hidden="true"
            className="ml-space-xs flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary"
          >
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
