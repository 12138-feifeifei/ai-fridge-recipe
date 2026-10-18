import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import { AppShell, PageHeader, StickyFooter } from '../components/AppShell.jsx'
import { IngredientRow } from '../components/IngredientRow.jsx'
import { IngredientSheet } from '../components/IngredientSheet.jsx'
import { ScanOverlay } from '../components/ScanOverlay.jsx'
import { useToast } from '../components/Toast.jsx'
import { CATEGORY_META, INGREDIENT_CATEGORIES } from '../data/ingredients.js'
import { ListIcon, PlusIcon, RefreshIcon, SparkleIcon } from '../components/icons.jsx'
import { Button, Card, EmptyState, cx } from '../components/ui.jsx'

const GENERATE_TIPS = ['优先使用你勾选的食材', '辣度、口味可在后续版本里定制', '食谱为推荐结果，可按家里调料调整']

export default function IngredientsPage() {
  const {
    ingredients,
    selectedCount,
    status,
    progress,
    progressText,
    previewUrl,
    toggleIngredient,
    setAllSelected,
    addIngredient,
    updateIngredient,
    removeIngredient,
    restoreIngredient,
    generateRecipes,
    resetAll,
    dataSource,
  } = useApp()
  const navigate = useNavigate()
  const showToast = useToast()
  const [sheet, setSheet] = useState(null)

  const grouped = useMemo(() => {
    return INGREDIENT_CATEGORIES.map((category) => ({
      category,
      items: ingredients.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0)
  }, [ingredients])

  const allSelected = ingredients.length > 0 && selectedCount === ingredients.length
  const manualCount = ingredients.filter((item) => item.addedManually).length

  const handleDelete = (ingredient) => {
    const index = ingredients.findIndex((item) => item.id === ingredient.id)
    removeIngredient(ingredient.id)
    showToast(`已删除「${ingredient.name}」`, {
      actionLabel: '撤销',
      onAction: () => restoreIngredient(ingredient, index),
    })
  }

  const handleSubmit = (values) => {
    if (sheet?.mode === 'edit') {
      updateIngredient(sheet.ingredient.id, values)
      showToast('食材信息已更新')
    } else {
      addIngredient(values)
      showToast(`已添加「${values.name}」`)
    }
    setSheet(null)
  }

  const handleGenerate = async () => {
    if (!selectedCount) {
      showToast('至少勾选一种食材才能生成食谱')
      return
    }
    const result = await generateRecipes()
    if (result.ok) {
      navigate('/recipes')
      return
    }
    if (result.reason === 'STALE') return
    // error.message 已经由请求层归一化成友好文案（401 / 500 / 超时 / 断网…）
    showToast(result.error?.message || '生成失败，请重试', { duration: 3600 })
  }

  const handleRestart = () => {
    resetAll()
    navigate('/')
  }

  return (
    <AppShell
      footer={
        ingredients.length ? (
          <StickyFooter>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setSheet({ mode: 'create' })}
                aria-label="添加食材"
              >
                <PlusIcon className="h-5 w-5" />
                添加
              </Button>
              <Button size="lg" className="flex-1" onClick={handleGenerate} disabled={!selectedCount}>
                <SparkleIcon className="h-5 w-5" />
                生成食谱（{selectedCount} 种）
              </Button>
            </div>
          </StickyFooter>
        ) : null
      }
    >
      <PageHeader
        title="食材清单"
        subtitle="确认一下识别结果，可以增删改"
        backTo="/"
        step={1}
        right={
          ingredients.length ? (
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-card transition hover:text-slate-700 active:scale-95"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              重新上传
            </button>
          ) : null
        }
      />

      <main className="flex-1 space-y-5 px-5 pb-8 pt-4">
        {ingredients.length === 0 ? (
          <EmptyState
            emoji="🧊"
            title="清单还是空的"
            description="先上传一张冰箱照片完成识别，或者手动添加食材。"
            action={
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setSheet({ mode: 'create' })}>
                  <PlusIcon className="h-4 w-4" />
                  手动添加
                </Button>
                <Button onClick={() => navigate('/')}>
                  <SparkleIcon className="h-4 w-4" />
                  去上传照片
                </Button>
              </div>
            }
          />
        ) : (
          <>
            <Card className="animate-rise border-0 bg-linear-to-br from-brand-500 to-brand-600 p-4 text-white shadow-float">
              <p className="text-[11px] text-white/80">
                识别完成 · 共 {ingredients.length} 种{manualCount ? `（含手动添加 ${manualCount} 种）` : ''}
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-bold leading-none">{ingredients.length}</span>
                <span className="pb-0.5 text-sm text-white/85">种食材</span>
                <span className="ml-auto rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
                  已选 {selectedCount} 种
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-300 ease-out"
                  style={{ width: `${ingredients.length ? (selectedCount / ingredients.length) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[11px] leading-relaxed text-white/75">
                  点击行即可勾选 / 取消，右侧按钮可编辑或删除
                </p>
                <button
                  type="button"
                  onClick={() => setAllSelected(!allSelected)}
                  className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/25 active:scale-95"
                >
                  {allSelected ? '全部取消' : '全选'}
                </button>
              </div>
            </Card>

            {selectedCount === 0 ? (
              <p className="animate-rise rounded-2xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
                还没有勾选任何食材，至少勾选一样才能生成食谱。
              </p>
            ) : null}

            <div className="space-y-4">
              {grouped.map((group, groupIndex) => (
                <section key={group.category} className="animate-rise" style={{ animationDelay: `${groupIndex * 50}ms` }}>
                  <div className="mb-2 flex items-center gap-2">
                    <span aria-hidden="true">{CATEGORY_META[group.category]?.emoji}</span>
                    <h2 className="text-[13px] font-bold text-slate-600">{group.category}</h2>
                    <span className="text-[11px] text-slate-400">{group.items.length} 项</span>
                  </div>
                  <ul className="space-y-2">
                    {group.items.map((item, index) => (
                      <IngredientRow
                        key={item.id}
                        ingredient={item}
                        index={index}
                        onToggle={(target) => toggleIngredient(target.id)}
                        onEdit={(target) => setSheet({ mode: 'edit', ingredient: target })}
                        onDelete={handleDelete}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSheet({ mode: 'create' })}
              className={cx(
                'flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-300/80 bg-white/50 py-4 text-sm font-semibold text-slate-500',
                'transition hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-600 active:scale-[0.99]',
              )}
            >
              <PlusIcon className="h-4 w-4" />
              还有食材没识别出来？手动添加
            </button>

            <Card className="bg-cream-50/90 p-4">
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700">
                <ListIcon className="h-4 w-4 text-brand-500" />
                下一步会用这些食材做什么？
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                点击底部「生成食谱」，会把已勾选的 {selectedCount} 种食材发送给
                {dataSource === 'mock' ? '本地 Mock' : '后端推荐'}服务，
                返回带热量、时长和分步骤做法的推荐菜谱。
              </p>
            </Card>
          </>
        )}
      </main>

      <IngredientSheet
        open={Boolean(sheet)}
        mode={sheet?.mode ?? 'create'}
        ingredient={sheet?.ingredient}
        existingNames={ingredients.map((item) => item.name)}
        onClose={() => setSheet(null)}
        onSubmit={handleSubmit}
      />

      <ScanOverlay
        open={status === 'generating'}
        imageUrl={previewUrl}
        progress={progress}
        text={progressText}
        title="正在生成食谱"
        caption={`基于 ${selectedCount} 种食材搭配`}
        tips={GENERATE_TIPS}
      />
    </AppShell>
  )
}
