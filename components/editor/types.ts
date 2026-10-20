import type { Dispatch, SetStateAction } from "react";
import type { Invoice } from "@/lib/types";

export type SetInvoice = Dispatch<SetStateAction<Invoice>>;
