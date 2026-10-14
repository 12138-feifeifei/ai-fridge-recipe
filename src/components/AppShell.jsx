import { Link } from 'react-router-dom'
import { ChevronLeftIcon, FridgeIcon } from './icons.jsx'
import { cx } from './ui.jsx'

const STEPS = ['上传照片', '确认食材', '生成食谱']

/** 页面外壳：手机栏布局 + 背景光斑 + 可选的 sticky 底部操作区 */
export function AppShell({ children, footer }) {
  return (
    <div className="app-shell">
      <div className="app-bg pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
      <div className="app-panel">
        {children}
        {footer}
      </div>
    </div>
  )
}

/** 顶部吸顶栏：返回按钮 + 标题 + 右侧操作 + 步骤条 */
export function PageHeader({ title, subtitle, backTo, step, right, brand = false }) {
  return (
    <header className="glass sticky top-0 z-30 border-b border-slate-900/5 md:rounded-t-[36px]">
      <div className="safe-top flex items-center gap-3 px-4 pb-3">
        {backTo ? (
          <IconLink to={backTo} label="返回" />
        ) : brand ? (
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-linear-to-br from-brand-400 to-brand-600 text-white shadow-float">
            <FridgeIcon className="h-5 w-5" />
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <h1 className={cx('truncate font-bold text-slate-800', brand ? 'text-lg' : 'text-base')}>{title}</h1>
          {subtitle ? <p className="truncate text-xs text-slate-400">{subtitle}</p> : null}
        </div>

        {right}
      </div>

      {typeof step === 'number' ? (
        <div className="flex gap-2 px-4 pb-3">
          {STEPS.map((label, index) => {
            const active = index <= step
            return (
              <div key={label} className="flex-1">
                <div className={cx('h-1 rounded-full transition', active ? 'bg-brand-500' : 'bg-slate-900/10')} />
                <p className={cx('mt-1.5 text-[11px]', active ? 'font-medium text-brand-600' : 'text-slate-400')}>
                  {label}
                </p>
              </div>
            )
          })}
        </div>
      ) : null}
    </header>
  )
}

function IconLink({ to, label }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/70 text-slate-500 shadow-card transition hover:bg-white hover:text-slate-700 active:scale-95"
    >
      <ChevronLeftIcon className="h-5 w-5" />
    </Link>
  )
}

/** 吸顶底部操作区 */
export function StickyFooter({ children, className }) {
  return (
    <div
      className={cx(
        'glass safe-bottom sticky bottom-0 z-20 mt-auto border-t border-slate-900/5 px-5 pt-3 md:rounded-b-[36px]',
        className,
      )}
    >
      {children}
    </div>
  )
}
