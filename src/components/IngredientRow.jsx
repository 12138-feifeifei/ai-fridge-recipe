import { CheckIcon, EditIcon, TrashIcon } from './icons.jsx'
import { cx, IconButton } from './ui.jsx'

function ConfidenceBadge({ value }) {
  // 手动添加的食材没有置信度：不渲染任何标签，与 AI 识别的食材保持一致的展示
  if (typeof value !== 'number') return null
  const percent = Math.round(value * 100)
  const tone = percent >= 90 ? 'bg-brand-50 text-brand-600' : percent >= 80 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
  return <span className={cx('rounded-full px-1.5 py-0.5 text-[10px] font-medium', tone)}>置信度 {percent}%</span>
}

export function IngredientRow({ ingredient, index = 0, onToggle, onEdit, onDelete }) {
  const selected = ingredient.selected !== false

  return (
    <li className="animate-rise" style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}>
      <div
        className={cx(
          'flex items-center gap-2.5 rounded-2xl border p-2.5 transition duration-200',
          selected ? 'border-brand-200/80 bg-white shadow-card' : 'border-slate-900/5 bg-slate-50/70',
        )}
      >
        <button
          type="button"
          onClick={() => onToggle?.(ingredient)}
          aria-pressed={selected}
          aria-label={`${selected ? '取消选择' : '选择'} ${ingredient.name}`}
          className={cx(
            'grid h-6 w-6 shrink-0 place-items-center rounded-lg border transition duration-200',
            selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 bg-white text-transparent',
          )}
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onToggle?.(ingredient)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            className={cx(
              'grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-2xl transition',
              selected ? 'bg-brand-50' : 'bg-white',
              !selected && 'opacity-70 grayscale',
            )}
            aria-hidden="true"
          >
            {ingredient.emoji || '🥗'}
          </span>
          <span className="min-w-0">
            <span
              className={cx(
                'block truncate text-[15px] font-semibold',
                selected ? 'text-slate-800' : 'text-slate-400 line-through',
              )}
            >
              {ingredient.name}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span>{ingredient.quantity || '适量'}</span>
              <ConfidenceBadge value={ingredient.confidence} />
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center">
          <IconButton label={`编辑 ${ingredient.name}`} onClick={() => onEdit?.(ingredient)}>
            <EditIcon className="h-4 w-4" />
          </IconButton>
          <IconButton
            label={`删除 ${ingredient.name}`}
            onClick={() => onDelete?.(ingredient)}
            className="hover:bg-rose-50 hover:text-rose-500"
          >
            <TrashIcon className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </li>
  )
}
