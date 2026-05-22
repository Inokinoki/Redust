import { useToastStore, type ToastType } from "../stores/toastStore";

const typeStyles: Record<ToastType, string> = {
  success: "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  error: "border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
  info: "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  warning: "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
};

const typeIcons: Record<ToastType, string> = {
  success: "\u2713",
  error: "\u2717",
  info: "i",
  warning: "!",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2 rounded-md border-l-4 px-4 py-3 shadow-lg animate-in slide-in-from-right ${typeStyles[toast.type]}`}
          style={{ minWidth: 280, maxWidth: 420 }}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold opacity-70">
            {typeIcons[toast.type]}
          </span>
          <span className="flex-1 text-sm">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 opacity-50 hover:opacity-100"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
