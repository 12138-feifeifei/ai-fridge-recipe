/**
 * 数据访问层（唯一与「后端」打交道的地方）
 *
 * 现在后端还没好，所以用 mock 假数据 + 模拟延迟把流程跑通。
 * 后端就绪后只需要：
 *   1. 把 DATA_SOURCE 改成 'http'
 *   2. 在 .env.local 里配置 VITE_API_BASE_URL（默认 /api，可配合 vite.config.js 的 proxy）
 * 页面组件完全不用改，接口返回的字段结构保持一致即可。
 */

import { MOCK_INGREDIENTS } from '../data/ingredients.js'
import { rankRecipes } from '../data/recipes.js'

export const DATA_SOURCE = 'mock' // 'mock' | 'http'
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const RECOGNIZE_TEXTS = ['正在读取照片…', '识别食材中…', '匹配常见食材库…', '整理识别结果…']
const GENERATE_TEXTS = ['分析食材搭配…', '计算营养与热量…', '搭配合适的菜式…', '生成烹饪步骤…']

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 让进度条平滑走完，同时按阶段切换文案。
 * 真实接口通常是「一次性返回 + 无进度」，这里保留回调是为了 UI 提前适配。
 */
async function animateProgress({ duration, texts, onProgress }) {
  const startedAt = Date.now()
  while (true) {
    const elapsed = Date.now() - startedAt
    const ratio = Math.min(1, elapsed / duration)
    const eased = 1 - Math.pow(1 - ratio, 2)
    const textIndex = Math.min(texts.length - 1, Math.floor(ratio * texts.length))
    onProgress?.({ progress: eased * 100, text: texts[textIndex] })
    if (ratio >= 1) break
    await wait(60)
  }
  onProgress?.({ progress: 100, text: texts[texts.length - 1] })
}

/**
 * 识别食材
 * @param {{ previewUrl?: string, file?: File }} payload
 * @returns {Promise<{ ingredients: Array, imageUrl: string|null, recognizedAt: string }>}
 */
export async function recognizeIngredients(payload = {}, { onProgress } = {}) {
  if (DATA_SOURCE === 'mock') {
    await animateProgress({ duration: 2200, texts: RECOGNIZE_TEXTS, onProgress })
    return {
      imageUrl: payload.previewUrl ?? null,
      ingredients: MOCK_INGREDIENTS.map((item) => ({ ...item })),
      recognizedAt: new Date().toISOString(),
    }
  }

  // ---- 真实后端 ----
  if (!payload.file) throw new Error('缺少要上传的图片')
  const formData = new FormData()
  formData.append('image', payload.file)

  const response = await fetch(`${API_BASE}/ingredients/recognize`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) throw new Error(`识别失败（${response.status}）`)

  const data = await response.json()
  const ingredients = (data.ingredients ?? []).map((item, index) => ({
    id: item.id ?? `ing-${Date.now()}-${index}`,
    name: item.name,
    emoji: item.emoji ?? '🥗',
    quantity: item.quantity ?? '适量',
    category: item.category ?? '其他',
    confidence: item.confidence ?? null,
    selected: item.selected ?? true,
  }))

  return { imageUrl: payload.previewUrl ?? null, ingredients, recognizedAt: new Date().toISOString() }
}

/**
 * 生成食谱
 * @param {{ ingredients?: Array, refreshKey?: number }} payload
 * @returns {Promise<{ recipes: Array, generatedAt: string }>}
 */
export async function generateRecipes(payload = {}, { onProgress } = {}) {
  const ingredients = payload.ingredients ?? []

  if (DATA_SOURCE === 'mock') {
    await animateProgress({ duration: 1800, texts: GENERATE_TEXTS, onProgress })
    return {
      recipes: rankRecipes(ingredients, { refreshKey: payload.refreshKey ?? 0 }),
      generatedAt: new Date().toISOString(),
    }
  }

  // ---- 真实后端 ----
  const response = await fetch(`${API_BASE}/recipes/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients: ingredients.map((item) => item.name) }),
  })
  if (!response.ok) throw new Error(`生成食谱失败（${response.status}）`)

  const data = await response.json()
  return { recipes: data.recipes ?? [], generatedAt: new Date().toISOString() }
}
