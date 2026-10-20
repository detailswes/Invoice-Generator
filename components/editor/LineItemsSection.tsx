"use client";

import { PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Calculation } from "@/lib/calculations";
import { formatCents } from "@/lib/money";
import type { Invoice, LineItem } from "@/lib/types";
import { EditorSection } from "./EditorSection";
import { FieldError, inputClass, labelClass } from "./Field";
import type { SetInvoice } from "./types";

const GRID = "md:grid-cols-[minmax(0,1fr)_5rem_7rem_7rem_2.5rem]";
// Labels are visible on mobile (rows are stacked) and replaced by the column header from md up.
const rowLabel = `${labelClass} md:sr-only`;

type Props = { items: Invoice["items"]; calc: Calculation; setInvoice: SetInvoice };

export function LineItemsSection({ items, calc, setInvoice }: Props) {
  // Only a row the user just added grabs focus; initial rows must not.
  const [focusId, setFocusId] = useState<string | null>(null);

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));

  const addItem = () => {
    const id = crypto.randomUUID();
    setFocusId(id);
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { id, description: "", quantity: "1", unitPrice: "" }],
    }));
  };

  const removeItem = (id: string) =>
    setInvoice((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));

  return (
    <EditorSection
      number="04"
      title="Line Items"
      aside={
        <span className="rounded-md bg-surface-container-low px-space-sm py-1 font-mono text-label-sm text-secondary">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      }
    >
      <div
        aria-hidden="true"
        className={`hidden gap-space-sm rounded-md bg-surface-container-low px-space-sm py-space-sm font-mono text-label-sm uppercase tracking-wider text-on-surface-variant md:grid ${GRID}`}
      >
        <span>Description</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Unit price</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {items.length === 0 && (
        <p className="py-space-md text-center text-body-sm text-on-surface-variant">
          No line items yet. Add one below.
        </p>
      )}

      <ul className="mb-space-md divide-y divide-surface-container">
        {items.map((item, i) => {
          const errors = calc.errors.items[item.id];
          const n = i + 1;
          return (
            <li
              key={item.id}
              className={`grid grid-cols-3 gap-x-space-sm gap-y-space-sm py-space-md md:items-start md:px-space-sm md:py-space-sm ${GRID}`}
            >
              <div className="col-span-3 md:col-span-1">
                <label htmlFor={`${item.id}-description`} className={rowLabel}>
                  Item {n} description
                </label>
                <input
                  id={`${item.id}-description`}
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  placeholder="Description"
                  autoFocus={item.id === focusId}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor={`${item.id}-quantity`} className={rowLabel}>
                  Qty
                </label>
                <input
                  id={`${item.id}-quantity`}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
                  inputMode="decimal"
                  aria-label={`Item ${n} quantity`}
                  aria-invalid={errors?.quantity ? true : undefined}
                  aria-describedby={errors?.quantity ? `${item.id}-quantity-error` : undefined}
                  className={`${inputClass} font-mono text-tabular-md md:text-right`}
                />
              </div>
              <div>
                <label htmlFor={`${item.id}-price`} className={rowLabel}>
                  Unit price
                </label>
                <input
                  id={`${item.id}-price`}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, { unitPrice: e.target.value })}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label={`Item ${n} unit price in dollars`}
                  aria-invalid={errors?.unitPrice ? true : undefined}
                  aria-describedby={errors?.unitPrice ? `${item.id}-price-error` : undefined}
                  className={`${inputClass} font-mono text-tabular-md md:text-right`}
                />
              </div>
              <div>
                <span className={rowLabel}>Amount</span>
                <p className="py-space-sm font-mono text-tabular-md font-semibold md:text-right">
                  {formatCents(calc.lines[i]?.totalCents ?? 0)}
                </p>
              </div>
              <div className="col-span-3 flex justify-end md:col-span-1 md:pt-space-xs">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove item ${n}`}
                  className="flex items-center gap-space-xs rounded-md p-1 text-label-md text-on-surface-variant transition-colors hover:text-error"
                >
                  <Trash2 size={18} aria-hidden="true" />
                  <span className="md:hidden">Remove</span>
                </button>
              </div>
              {(errors?.quantity || errors?.unitPrice) && (
                <div className="col-span-3 md:col-span-full">
                  <FieldError id={`${item.id}-quantity-error`}>
                    {errors.quantity && `Quantity: ${errors.quantity}`}
                  </FieldError>
                  <FieldError id={`${item.id}-price-error`}>
                    {errors.unitPrice && `Unit price: ${errors.unitPrice}`}
                  </FieldError>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={addItem}
        className="flex w-full items-center justify-center gap-space-xs rounded-md border border-dashed border-outline-variant bg-surface-container-low/50 px-space-md py-space-sm text-label-md text-secondary transition-colors hover:border-primary hover:text-primary"
      >
        <PlusCircle size={18} aria-hidden="true" />
        <span>Add line item</span>
      </button>
    </EditorSection>
  );
}
