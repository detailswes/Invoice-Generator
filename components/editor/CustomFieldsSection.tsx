"use client";

import { Eye, EyeOff, Plus, X } from "lucide-react";
import { useState } from "react";
import type { CustomField } from "@/lib/types";
import { EditorSection } from "./EditorSection";
import { inputClass } from "./Field";
import type { SetInvoice } from "./types";

type Props = { fields: CustomField[]; setInvoice: SetInvoice };

export function CustomFieldsSection({ fields, setInvoice }: Props) {
  const [focusId, setFocusId] = useState<string | null>(null);

  const updateField = (id: string, patch: Partial<CustomField>) =>
    setInvoice((prev) => ({
      ...prev,
      customFields: prev.customFields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));

  const addField = () => {
    const id = crypto.randomUUID();
    setFocusId(id);
    setInvoice((prev) => ({
      ...prev,
      customFields: [...prev.customFields, { id, label: "", value: "", visible: true }],
    }));
  };

  const removeField = (id: string) =>
    setInvoice((prev) => ({ ...prev, customFields: prev.customFields.filter((f) => f.id !== id) }));

  return (
    <EditorSection
      number="05"
      title="Custom Fields"
      aside={
        <button
          type="button"
          onClick={addField}
          className="flex items-center gap-space-xs rounded-md font-mono text-label-sm text-secondary transition-colors hover:text-on-surface"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Add custom field</span>
        </button>
      }
    >
      {fields.length === 0 && (
        <p className="py-space-sm text-body-sm text-on-surface-variant">
          No custom fields. Add one for things like a PO number or project code.
        </p>
      )}
      <ul className="space-y-space-sm">
        {fields.map((field, i) => (
          <li
            key={field.id}
            className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-space-sm gap-y-space-sm rounded-md bg-surface-container-low p-space-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto_auto] ${
              field.visible ? "" : "opacity-80"
            }`}
          >
            <input
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
              placeholder="Label"
              aria-label={`Custom field ${i + 1} label`}
              autoFocus={field.id === focusId}
              className={`${inputClass} col-span-3 bg-surface-container-lowest sm:col-span-1`}
            />
            <input
              value={field.value}
              onChange={(e) => updateField(field.id, { value: e.target.value })}
              placeholder="Value"
              aria-label={`Custom field ${i + 1} value`}
              className={`${inputClass} col-span-3 bg-surface-container-lowest sm:col-span-1`}
            />
            <button
              type="button"
              aria-pressed={field.visible}
              onClick={() => updateField(field.id, { visible: !field.visible })}
              className="col-span-2 flex items-center gap-1 justify-self-start rounded-md px-space-sm sm:col-span-1 py-space-sm font-mono text-label-sm text-on-surface-variant transition-colors hover:text-on-surface"
            >
              {field.visible ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
              <span>{field.visible ? "Shown on invoice" : "Hidden"}</span>
              <span className="sr-only">. Toggle visibility of custom field {i + 1}</span>
            </button>
            <button
              type="button"
              onClick={() => removeField(field.id)}
              aria-label={`Remove custom field ${i + 1}`}
              className="rounded-md p-1 text-on-surface-variant transition-colors hover:text-error"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-space-sm font-mono text-label-sm text-secondary">
        Only fields marked “Shown on invoice” appear in the preview and printout. They never affect the totals.
      </p>
    </EditorSection>
  );
}
