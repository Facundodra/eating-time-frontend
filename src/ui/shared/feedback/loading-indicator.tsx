type LoadingIndicatorProps = {
  label?: string;
};

export default function LoadingIndicator({
  label = "Cargando...",
}: LoadingIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-100 border-t-orange-600" />
      <span className="text-sm font-bold">{label}</span>
    </div>
  );
}
