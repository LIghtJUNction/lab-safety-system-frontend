import { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { fieldBase } from "../../lib/theme";

export function FormInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function FormSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, className)} {...props}>
      {children}
    </select>
  );
}

export function UploadButton({
  label,
  icon,
  accept,
  onFile,
}: {
  label: string;
  icon: ReactNode;
  accept?: string;
  onFile: (file: File) => void;
}) {
  return (
    <label className="upload-button group flex cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-stone-200 bg-white/80 px-4 py-3 text-sm font-medium text-stone-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-stone-50 hover:shadow-md dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:bg-stone-800/50">
      <span className="text-stone-600 dark:text-stone-400">{icon}</span>
      {label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </label>
  );
}