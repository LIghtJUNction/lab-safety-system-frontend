import { ReactNode } from "react";

export type Language = "zh" | "en";
export type ThemeMode = "light" | "dark";
export type TableRow = string[] | { cells: string[]; actions?: ReactNode };
export type SensorStatus = "normal" | "warning" | "danger";