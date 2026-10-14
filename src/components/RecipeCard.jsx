import { useState } from 'react'
import { ChevronDownIcon, ClockIcon, FlameIcon, SparkleIcon } from './icons.jsx'
import { cx } from './ui.jsx'

function Metric({ icon, label, value, tone }) {
  const tones = {
    amber: 'text-amber-500',
    sky: 'text-sky-500',
    brand: 'text-brand-600',
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cx('flex items-center gap-1 text-[11px] text-slate-400', tones[tone])}>
        {icon}
        {label}
      </span>
      <span className="text-[13px] font-bold text-slate-700">{value}</span>
    </div>
  )
}

const VISIBLE_STEP_COUNT = 3

export function RecipeCard({ recipe, index = 0 }) {
  const [expanded, setExpanded] = useState(false)
  const steps = recipe.steps ?? []
  const visibleSteps = expanded ? steps : steps.slice(0, VISIBLE_STEP_COUNT)
  const hasMore = steps.length > VISIBLE_STEP_COUNT

  return (
    <article
      className="animate-rise overflow-hidden rounded-[28px] border border-slate-900/5 bg-white shadow-card"
      style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
    >
      <div className={cx('relative h-32 bg-linear-to-br', recipe.cover || 'from-brand-100 to-brand-50')}>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-slate-600 backdrop-blur-sm">
          <ClockIcon className="h-3.5 w-3.5" />
          {recipe.minutes} 分钟
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-brand-700 backdrop-blur-sm">
          匹配 {recipe.matchRate ?? 100}%
        </span>
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 select-none text-6xl drop-shadow-[0_6px_12px_rgba(15,23,42,0.18)]"
          aria-hidden="true"
        >
          {recipe.emoji}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-slate-800">{recipe.name}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{recipe.intro}</p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-900/5 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {recipe.difficulty}
          </span>
        </div>

        <dl className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-slate-50 px-2 py-2.5">
          <Metric icon={<FlameIcon className="h-3.5 w-3.5" />} label="热量" value={`${recipe.calories} kcal`} tone="amber" />
          <Metric icon={<ClockIcon className="h-3.5 w-3.5" />} label="用时" value={`${recipe.minutes} 分钟`} tone="sky" />
          <Metric
            icon={<SparkleIcon className="h-3.5 w-3.5" />}
            label="食材"
            value={`${recipe.matchedCount ?? recipe.matched?.length ?? 0}/${recipe.totalUsed ?? recipe.uses?.length ?? 0}`}
            tone="brand"
          />
        </dl>

        {recipe.matched?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recipe.matched.map((item) => (
              <span key={item} className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                ✓ {item}
              </span>
            ))}
            {recipe.pantry?.length
              ? recipe.pantry.map((item) => (
                  <span key={item} className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                    需自备 {item}
                  </span>
                ))
              : null}
          </div>
        ) : null}

        <ol className="mt-4 space-y-3">
          {visibleSteps.map((step, stepIndex) => (
            <li key={`${recipe.id}-step-${stepIndex}`} className="flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                {stepIndex + 1}
              </span>
              <p className="text-sm leading-relaxed text-slate-600">
                {step.text}
                {step.minutes ? <span className="ml-1.5 whitespace-nowrap text-xs text-slate-400">约 {step.minutes} 分钟</span> : null}
              </p>
            </li>
          ))}
        </ol>

        {hasMore ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-900/10 active:scale-95"
          >
            {expanded ? '收起步骤' : `展开全部 ${steps.length} 步`}
            <ChevronDownIcon className={cx('h-3.5 w-3.5 transition', expanded && 'rotate-180')} />
          </button>
        ) : null}

        {recipe.tip ? (
          <p className="mt-3 rounded-2xl bg-cream-100/80 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
            <span className="font-semibold text-amber-600">小技巧 · </span>
            {recipe.tip}
          </p>
        ) : null}
      </div>
    </article>
  )
}
