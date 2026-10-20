const disabled = "disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButton = `hidden sm:inline-flex items-center rounded-md bg-surface-container-lowest px-space-md py-space-sm text-label-md text-on-surface shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-colors hover:bg-surface-container-low ${disabled}`;

export const primaryButton = `inline-flex whitespace-nowrap items-center gap-space-xs rounded-md bg-primary px-space-md py-space-sm text-label-md text-on-primary transition-colors hover:bg-on-surface-variant ${disabled}`;

/** Header actions are hidden on phones; these sit in the page body instead. */
export const mobileActionButton =
  "flex-1 rounded-md border border-outline-variant bg-surface-container-lowest px-space-md py-space-sm text-label-md text-on-surface transition-colors hover:bg-surface-container-low";
