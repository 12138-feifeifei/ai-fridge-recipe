import { useEffect, useState } from 'react'
import { COMMON_INGREDIENTS, INGREDIENT_CATEGORIES, guessEmoji } from '../data/ingredients.js'
import { PlusIcon } from './icons.jsx'
import { Button, Sheet, cx } from './ui.jsx'

/** 新增 / 编辑食材的底部弹层 */
export function IngredientSheet({ open, mode = 'create', ingredient, existingNames = [], onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [category, setCategory] = useState('蔬菜')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(ingredient?.name ?? '')
    setQuantity(ingredient?.quantity ?? '')
    setCategory(ingredient?.category ?? '蔬菜')
    setError('')
  }, [open, ingredient])

  const isEdit = mode === 'edit'

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('请填写食材名称')
      return
    }
    const duplicated =
      !isEdit && existingNames.some((item) => item.trim().toLowerCase() === trimmed.toLowerCase())
    if (duplicated) {
      setError('这个食材已经在清单里了')
      return
    }
    onSubmit?.({ name: trimmed, quantity: quantity.trim() || '适量', category })
  }

  const quickAdd = (preset) => {
    setName(preset.name)
    setQuantity(preset.quantity)
    setCategory(preset.category)
    setError('')
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? '编辑食材' : '添加食材'}
      description={isEdit ? '修改名称、数量或分类，修改后会自动更新清单' : '补充识别遗漏的食材，它也会参与食谱生成'}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            {isEdit ? '保存修改' : '添加到清单'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ingredient-name" className="mb-1.5 block text-xs font-medium text-slate-500">
            食材名称
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-900/10 bg-slate-50/70 px-3 focus-within:border-brand-400 focus-within:bg-white">
            <span className="text-2xl" aria-hidden="true">
              {name.trim() ? guessEmoji(name) : '🥗'}
            </span>
            <input
              id="ingredient-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setError('')
              }}
              placeholder="例如：豆腐、娃娃菜"
              autoComplete="off"
              className="h-12 w-full bg-transparent text-[15px] text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ingredient-quantity" className="mb-1.5 block text-xs font-medium text-slate-500">
            数量
          </label>
          <input
            id="ingredient-quantity"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="例如：2 个 / 1 把 / 适量"
            autoComplete="off"
            className="h-12 w-full rounded-2xl border border-slate-900/10 bg-slate-50/70 px-3 text-[15px] text-slate-800 transition focus:border-brand-400 focus:bg-white placeholder:text-slate-400"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">分类</p>
          <div className="flex flex-wrap gap-2">
            {INGREDIENT_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cx(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95',
                  category === item
                    ? 'bg-brand-500 text-white shadow-float'
                    : 'bg-slate-900/5 text-slate-500 hover:bg-slate-900/10',
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {!isEdit ? (
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">常用食材（点一下快速填入）</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_INGREDIENTS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => quickAdd(preset)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-900/10 bg-white px-2.5 py-1.5 text-xs text-slate-600 transition hover:border-brand-300 hover:text-brand-600 active:scale-95"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {error ? <p className="text-xs font-medium text-rose-500">{error}</p> : null}

        {/* 让回车键可以提交表单 */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Sheet>
  )
}
