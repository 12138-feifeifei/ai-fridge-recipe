import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { generateRecipes as requestRecipes, recognizeIngredients } from '../api/client.js'
import { guessCategory, guessEmoji } from '../data/ingredients.js'
import { SAMPLE_PHOTO_DATA_URL } from '../data/samplePhoto.js'
import { prepareImage } from '../utils/image.js'

/**
 * 全局状态：图片 → 识别 → 食材清单 → 生成食谱
 * status: idle | recognizing | ready | generating | done
 */

const STORAGE_KEY = 'fridge-chef.state.v1'

const INITIAL_STATE = {
  status: 'idle',
  progress: 0,
  progressText: '',
  previewUrl: null,
  imageName: '',
  isSampleImage: false,
  ingredients: [],
  recipes: [],
  refreshKey: 0,
  recognizedAt: null,
  generatedAt: null,
  error: null,
}

const AppContext = createContext(null)

function loadPersistedState() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      recipes: Array.isArray(parsed.recipes) ? parsed.recipes : [],
      refreshKey: Number.isInteger(parsed.refreshKey) ? parsed.refreshKey : 0,
      recognizedAt: parsed.recognizedAt ?? null,
      generatedAt: parsed.generatedAt ?? null,
    }
  } catch {
    return null
  }
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function AppProvider({ children }) {
  const [state, setState] = useState(() => ({ ...INITIAL_STATE, ...(loadPersistedState() ?? {}) }))
  // 用递增的任务号丢弃过期请求的结果（连续点击 / 中途返回时不会串数据）
  const taskRef = useRef(0)
  // 让回调里始终能读到最新 state，同时保持回调身份稳定（避免子组件无意义重渲染）
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // 刷新页面后保留食材与食谱（图片 dataURL 太大，不写入 sessionStorage）
  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ingredients: state.ingredients,
          recipes: state.recipes,
          refreshKey: state.refreshKey,
          recognizedAt: state.recognizedAt,
          generatedAt: state.generatedAt,
        }),
      )
    } catch {
      // 隐私模式下 sessionStorage 可能不可用，忽略即可
    }
  }, [state.ingredients, state.recipes, state.refreshKey, state.recognizedAt, state.generatedAt])

  /* ----------------------------- 图片 ----------------------------- */

  const selectImage = useCallback(async (file) => {
    const { previewUrl } = await prepareImage(file)
    setState((prev) => ({
      ...prev,
      status: 'idle',
      progress: 0,
      progressText: '',
      previewUrl,
      imageName: file.name || '冰箱照片',
      isSampleImage: false,
      ingredients: [],
      recipes: [],
      recognizedAt: null,
      generatedAt: null,
      error: null,
    }))
    return previewUrl
  }, [])

  const selectSampleImage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: 'idle',
      progress: 0,
      progressText: '',
      previewUrl: SAMPLE_PHOTO_DATA_URL,
      imageName: '示例冰箱照片',
      isSampleImage: true,
      ingredients: [],
      recipes: [],
      recognizedAt: null,
      generatedAt: null,
      error: null,
    }))
  }, [])

  const clearImage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: 'idle',
      progress: 0,
      progressText: '',
      previewUrl: null,
      imageName: '',
      isSampleImage: false,
    }))
  }, [])

  const resetAll = useCallback(() => {
    taskRef.current += 1
    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setState({ ...INITIAL_STATE })
  }, [])

  /* ---------------------------- 识别食材 ---------------------------- */

  const startRecognition = useCallback(async () => {
    const current = stateRef.current
    if (!current.previewUrl) return false

    const taskId = ++taskRef.current
    setState((prev) => ({ ...prev, status: 'recognizing', progress: 0, progressText: '准备中…', error: null }))

    try {
      const result = await recognizeIngredients(
        { previewUrl: current.previewUrl, imageName: current.imageName },
        {
          onProgress: ({ progress, text }) => {
            if (taskRef.current !== taskId) return
            setState((prev) => ({ ...prev, progress, progressText: text }))
          },
        },
      )
      if (taskRef.current !== taskId) return false

      setState((prev) => ({
        ...prev,
        status: 'ready',
        progress: 100,
        progressText: '',
        ingredients: result.ingredients,
        recipes: [],
        refreshKey: 0,
        recognizedAt: result.recognizedAt,
        generatedAt: null,
      }))
      return true
    } catch (error) {
      if (taskRef.current === taskId) {
        setState((prev) => ({ ...prev, status: 'idle', progress: 0, progressText: '', error: error.message }))
      }
      return false
    }
  }, [])

  /* ---------------------------- 食材增删改 ---------------------------- */

  const toggleIngredient = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((item) =>
        item.id === id ? { ...item, selected: item.selected === false } : item,
      ),
    }))
  }, [])

  const setAllSelected = useCallback((selected) => {
    setState((prev) => ({ ...prev, ingredients: prev.ingredients.map((item) => ({ ...item, selected })) }))
  }, [])

  const addIngredient = useCallback(({ name, quantity = '适量', category, emoji }) => {
    const trimmed = String(name ?? '').trim()
    if (!trimmed) return null
    const ingredient = {
      id: createId('ing'),
      name: trimmed,
      emoji: emoji || guessEmoji(trimmed),
      quantity: String(quantity || '适量').trim(),
      category: category || guessCategory(trimmed),
      confidence: null,
      selected: true,
      addedManually: true,
    }
    setState((prev) => ({ ...prev, ingredients: [...prev.ingredients, ingredient] }))
    return ingredient
  }, [])

  const updateIngredient = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((item) => {
        if (item.id !== id) return item
        const next = { ...item, ...patch }
        if (patch.name && !patch.emoji) next.emoji = guessEmoji(patch.name)
        return next
      }),
    }))
  }, [])

  const removeIngredient = useCallback((id) => {
    setState((prev) => ({ ...prev, ingredients: prev.ingredients.filter((item) => item.id !== id) }))
  }, [])

  const restoreIngredient = useCallback((ingredient, index = -1) => {
    setState((prev) => {
      if (prev.ingredients.some((item) => item.id === ingredient.id)) return prev
      const next = prev.ingredients.slice()
      next.splice(index < 0 ? next.length : Math.min(index, next.length), 0, ingredient)
      return { ...prev, ingredients: next }
    })
  }, [])

  /* ---------------------------- 生成食谱 ---------------------------- */

  const runGeneration = useCallback(async ({ refresh = false } = {}) => {
    const current = stateRef.current
    const selected = current.ingredients.filter((item) => item.selected !== false)
    if (!selected.length) return false

    const taskId = ++taskRef.current
    setState((prev) => ({ ...prev, status: 'generating', progress: 0, progressText: '准备中…', error: null }))

    try {
      const result = await requestRecipes(
        { ingredients: selected, refreshKey: refresh ? current.refreshKey + 1 : 0 },
        {
          onProgress: ({ progress, text }) => {
            if (taskRef.current !== taskId) return
            setState((prev) => ({ ...prev, progress, progressText: text }))
          },
        },
      )
      if (taskRef.current !== taskId) return false

      setState((prev) => ({
        ...prev,
        status: 'done',
        progress: 100,
        progressText: '',
        recipes: result.recipes,
        refreshKey: refresh ? prev.refreshKey + 1 : 0,
        generatedAt: result.generatedAt,
      }))
      return true
    } catch (error) {
      if (taskRef.current === taskId) {
        setState((prev) => ({
          ...prev,
          status: prev.recipes.length ? 'done' : 'ready',
          progress: 0,
          progressText: '',
          error: error.message,
        }))
      }
      return false
    }
  }, [])

  const generateRecipesForSelection = useCallback(() => runGeneration({ refresh: false }), [runGeneration])
  const regenerateRecipes = useCallback(() => runGeneration({ refresh: true }), [runGeneration])

  /* ------------------------------- 派生值 ------------------------------- */

  const selectedIngredients = useMemo(
    () => state.ingredients.filter((item) => item.selected !== false),
    [state.ingredients],
  )

  const value = useMemo(
    () => ({
      ...state,
      selectedIngredients,
      selectedCount: selectedIngredients.length,
      hasSelection: selectedIngredients.length > 0,
      isBusy: state.status === 'recognizing' || state.status === 'generating',
      selectImage,
      selectSampleImage,
      clearImage,
      resetAll,
      startRecognition,
      toggleIngredient,
      setAllSelected,
      addIngredient,
      updateIngredient,
      removeIngredient,
      restoreIngredient,
      generateRecipes: generateRecipesForSelection,
      regenerateRecipes,
    }),
    [
      state,
      selectedIngredients,
      selectImage,
      selectSampleImage,
      clearImage,
      resetAll,
      startRecognition,
      toggleIngredient,
      setAllSelected,
      addIngredient,
      updateIngredient,
      removeIngredient,
      restoreIngredient,
      generateRecipesForSelection,
      regenerateRecipes,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp 必须在 <AppProvider> 内部使用')
  return context
}
