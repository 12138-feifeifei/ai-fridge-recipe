import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import { AppShell, PageHeader, StickyFooter } from '../components/AppShell.jsx'
import { RecipeCard } from '../components/RecipeCard.jsx'
import { ScanOverlay } from '../components/ScanOverlay.jsx'
import { useToast } from '../components/Toast.jsx'
import { ArrowRightIcon, FlameIcon, RefreshIcon, SparkleIcon } from '../components/icons.jsx'
import { Button, Card, EmptyState, IconButton } from '../components/ui.jsx'

const GENERATE_TIPS = ['优先使用你勾选的食材', '辣度、口味可在后续版本里定制', '食谱为推荐结果，可按家里调料调整']

export default function RecipesPage() {
  const {
    recipes,
    ingredients,
    selectedIngredients,
    selectedCount,
    status,
    progress,
    progressText,
    previewUrl,
    regenerateRecipes,
    resetAll,
  } = useApp()
  const navigate = useNavigate()
  const showToast = useToast()

  const summary = useMemo(() => {
    if (!recipes.length) return null
    const totalCalories = recipes.reduce((sum, item) => sum + (item.calories ?? 0), 0)
    const averageCalories = Math.round(totalCalories / recipes.length)
    const shortest = Math.min(...recipes.map((item) => item.minutes ?? 0))
    return { averageCalories, shortest }
  }, [recipes])

  const handleRegenerate = async () => {
    const ok = await regenerateRecipes()
    showToast(ok ? '已换一批食谱' : '生成失败，请重试')
  }

  const handleRestart = () => {
    resetAll()
    navigate('/')
  }

  return (
    <AppShell
      footer={
        recipes.length ? (
          <StickyFooter>
            <div className="flex gap-3">
              <Button variant="secondary" size="lg" onClick={handleRestart}>
                重新拍照
              </Button>
              <Button size="lg" className="flex-1" onClick={() => navigate('/ingredients')}>
                调整食材
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </StickyFooter>
        ) : null
      }
    >
      <PageHeader
        title="推荐食谱"
        subtitle={recipes.length ? `根据你勾选的 ${selectedCount} 种食材生成` : '等待生成结果'}
        backTo="/ingredients"
        step={2}
        right={
          recipes.length ? (
            <IconButton label="换一批食谱" onClick={handleRegenerate} disabled={status === 'generating'}>
              <RefreshIcon className="h-5 w-5" />
            </IconButton>
          ) : null
        }
      />

      <main className="flex-1 space-y-5 px-5 pb-8 pt-4">
        {recipes.length === 0 ? (
          <EmptyState
            emoji="🍳"
            title="还没有生成食谱"
            description={
              ingredients.length
                ? '回到食材清单，勾选想要的食材再点「生成食谱」。'
                : '先上传一张冰箱照片，识别出食材后才能生成食谱。'
            }
            action={
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => navigate('/ingredients')}>
                  查看食材清单
                </Button>
                <Button onClick={() => navigate('/')}>去上传照片</Button>
              </div>
            }
          />
        ) : (
          <>
            <Card className="animate-rise p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-linear-to-br from-brand-400 to-brand-600 text-white">
                  <SparkleIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[15px] font-bold text-slate-800">为你准备了 {recipes.length} 道菜</p>
                  <p className="text-[11px] text-slate-400">
                    平均 {summary?.averageCalories} kcal · 最快 {summary?.shortest} 分钟上桌
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={status === 'generating'}
                  className="ml-auto inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-[11px] font-semibold text-brand-600 transition hover:bg-brand-100 active:scale-95 disabled:opacity-50"
                >
                  <RefreshIcon className="h-3.5 w-3.5" />
                  换一批
                </button>
              </div>

              {selectedIngredients.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedIngredients.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full bg-slate-900/5 px-2.5 py-1 text-[11px] font-medium text-slate-500"
                    >
                      {item.emoji} {item.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>

            <div className="space-y-4">
              {recipes.map((recipe, index) => (
                <RecipeCard key={recipe.id} recipe={recipe} index={index} />
              ))}
            </div>

            <Card className="animate-rise bg-cream-50/90 p-4">
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700">
                <FlameIcon className="h-4 w-4 text-amber-500" />
                热量参考
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                每道菜的热量按 2 人份估算，标有「需自备」的调料是冰箱里暂时没有的。
                想换口味就点右上角「换一批」，可以循环查看更多搭配。
              </p>
            </Card>
          </>
        )}
      </main>

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
