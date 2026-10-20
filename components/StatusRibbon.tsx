import { AlertCircle, CheckCircle2, FlaskConical, Loader2 } from "lucide-react";

export type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string; details?: string[] };

type Props = {
  mode: "sample" | "new" | "saved";
  isValid: boolean;
  isSaved: boolean;
  dirty: boolean;
  save: SaveState;
};

const intro = {
  sample: "Fictional sample data. Edit anything, then save to keep it.",
  new: "New invoice. Fill in the details, then save.",
  saved: "Editing a saved invoice.",
} as const;

export function StatusRibbon({ mode, isValid, isSaved, dirty, save }: Props) {
  let indicator;
  if (save.status === "saving") {
    indicator = (
      <>
        <Loader2 size={16} aria-hidden="true" className="animate-spin text-secondary" />
        <span className="text-on-surface-variant">Saving…</span>
      </>
    );
  } else if (!isValid) {
    indicator = (
      <>
        <AlertCircle size={16} aria-hidden="true" className="text-error" />
        <span className="text-error">Fix the highlighted fields</span>
      </>
    );
  } else if (isSaved && !dirty) {
    indicator = (
      <>
        <CheckCircle2 size={16} aria-hidden="true" className="text-emerald-700" />
        <span className="text-emerald-800">All changes saved</span>
      </>
    );
  } else {
    indicator = (
      <>
        <span className="h-2 w-2 rounded-full bg-secondary" />
        <span className="text-on-surface-variant">{isSaved ? "Unsaved changes" : "Not saved yet"}</span>
      </>
    );
  }

  return (
    <div className="mb-space-lg print:hidden border-b border-surface-container-highest pb-space-md">
      <div className="flex flex-wrap items-center justify-between gap-x-space-md gap-y-space-xs">
        <div className="flex items-center gap-space-xs text-on-surface-variant">
          {mode === "sample" && <FlaskConical size={16} aria-hidden="true" />}
          <span className="text-body-sm">{intro[mode]}</span>
        </div>
        <div role="status" className="flex items-center gap-space-xs font-mono text-label-sm uppercase tracking-wider">
          {indicator}
        </div>
      </div>
      {save.status === "error" && (
        <div
          role="alert"
          className="mt-space-md rounded-md border border-error bg-error-container/40 p-space-md text-body-sm text-on-surface"
        >
          <p className="font-semibold text-error">{save.message}</p>
          {save.details && save.details.length > 0 && (
            <ul className="mt-space-xs list-disc pl-space-lg">
              {save.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
