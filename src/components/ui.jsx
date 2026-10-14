import { useEffect } from 'react'
import { CloseIcon } from './icons.jsx'

const BUTTON_VARIANTS = {
  primary:
    'bg-linear-to-br from-brand-400 to-brand-600 text-white shadow-float hover:from-brand-500 hover:to-brand-700',
  secondary: 'border border-slate-900/10 bg-white text-slate-700 shadow-card hover:bg-slate-50',
  ghost: 'text-slate-500 hover:bg-slate-900/5 hover:text-slate-700',
  danger: 'bg-rose-500 text-white shadow-[0_16px_30px_-18px_rgba(244,63,94,0.9)] hover:bg-rose-600',
}

const BUTTON_SIZES = {
  sm: 'h-9 gap-1.5 px-3 text-sm',
  md: 'h-11 gap-2 px-4 text-[15px]',
  lg: 'h-12 gap-2 px-5 text-base',
}

export function cx(...values) {
  return values.filter(Boolean).join(' ')
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center rounded-2xl font-semibold transition duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function IconButton({ label, className, children, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-900/5 hover:text-slate-700 active:scale-95 disabled:opacity-40',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Card({ className, children, ...rest }) {
  return (
    <div className={cx('rounded-3xl border border-slate-900/5 bg-white shadow-card', className)} {...rest}>
      {children}
    </div>
  )
}

export function Chip({ className, children, ...rest }) {
  const Component = rest.onClick ? 'button' : 'span'
  return (
    <Component
      {...rest}
      className={cx(
        'inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-2.5 py-1 text-xs font-medium text-slate-600',
        rest.onClick && 'transition hover:bg-slate-900/10 active:scale-95',
        className,
      )}
    >
      {children}
    </Component>
  )
}

export function SectionTitle({ icon, title, hint, action }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon ? <span className="text-brand-500">{icon}</span> : null}
        <h2 className="text-[15px] font-bold text-slate-800">{title}</h2>
        {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ emoji = '🥬', title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300/80 bg-white/70 px-6 py-10 text-center">
      <span className="animate-breathe text-5xl" aria-hidden="true">
        {emoji}
      </span>
      <p className="mt-4 text-base font-semibold text-slate-700">{title}</p>
      {description ? <p className="mt-1.5 max-w-[16rem] text-sm text-slate-400">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

/** 底部弹层：移动端从底部滑入，桌面端居中限宽 */
export function Sheet({ open, onClose, title, description, children, footer }) {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="animate-fade absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-rise safe-bottom relative flex max-h-[88dvh] w-full max-w-[520px] flex-col rounded-t-[28px] bg-white px-5 pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-slate-200" />
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-800">{title}</h2>
            {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
          </div>
          <IconButton label="关闭" onClick={onClose}>
            <CloseIcon className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="no-scrollbar mt-4 flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="mt-4 border-t border-slate-900/5 pt-4">{footer}</div> : null}
      </div>
    </div>
  )
}
