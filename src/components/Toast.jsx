import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const showToast = useCallback((message, options = {}) => {
    if (!message) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ id: Date.now(), message, ...options })
    timerRef.current = setTimeout(() => setToast(null), options.duration ?? 2600)
  }, [])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-5">
          <div
            key={toast.id}
            role="status"
            className="animate-pop pointer-events-auto flex max-w-[420px] items-center gap-3 rounded-2xl bg-slate-900/90 px-4 py-3 text-sm text-white shadow-[0_20px_40px_-20px_rgba(15,23,42,0.9)] backdrop-blur-sm"
          >
            <span className="leading-snug">{toast.message}</span>
            {toast.actionLabel ? (
              <button
                type="button"
                className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-brand-200 transition hover:bg-white/20 active:scale-95"
                onClick={() => {
                  toast.onAction?.()
                  setToast(null)
                }}
              >
                {toast.actionLabel}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
