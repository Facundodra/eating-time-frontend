"use client";

type PanelErrorProps = {
  message: string;
  onRetry: () => void;
};

export default function PanelError({ message, onRetry }: PanelErrorProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 dark:border-red-500/30 dark:bg-red-500/10">
      <p className="text-sm font-bold text-red-600 dark:text-red-300">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 h-9 rounded-lg bg-red-600 px-4 text-xs font-extrabold text-white transition hover:bg-red-700"
      >
        Reintentar
      </button>
    </div>
  );
}
