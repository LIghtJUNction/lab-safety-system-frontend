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
    <label className="upload-button surface-interactive group flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.4rem] border border-dashed border-stone-300/80 bg-white/75 px-6 py-5 text-center text-base font-medium text-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:border-amber-400/70 hover:bg-amber-50/40 dark:border-stone-700 dark:bg-stone-900/70 dark:text-stone-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-500/[0.035]">
      <span className="text-stone-600 dark:text-stone-400">{icon}</span>
      <span>{label}</span>
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.currentTarget.value = "";
          }}
        />
    </label>
  );
}
