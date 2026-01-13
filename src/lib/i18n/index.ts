export * from "./en";
export * from "./tr";

import { en } from "./en";
import { tr } from "./tr";

export type Language = "en" | "tr";
export type Translation = typeof en;

export const translations = {
    en,
    tr,
};
