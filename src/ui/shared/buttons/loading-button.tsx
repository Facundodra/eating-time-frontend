import { ButtonHTMLAttributes, ReactNode } from "react";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
};

export default function LoadingButton({
  isLoading,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={className}
    >
      {isLoading ? (
        <span className="flex min-w-0 items-center justify-center gap-2">
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {loadingText ? <span className="min-w-0 truncate">{loadingText}</span> : null}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
