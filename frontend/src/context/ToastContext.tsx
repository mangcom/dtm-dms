import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(""), 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div
          className="animate-toastin fixed bottom-7 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2.5 rounded-[10px] bg-[#161c26] px-[22px] py-[13px] text-sm font-medium text-white shadow-[0_8px_28px_rgba(0,0,0,.25)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2.2}>
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
