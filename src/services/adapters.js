/**
 * 数据适配层：把后端的接口字段（见 services/api.js 的接口契约）
 * 转换成页面组件直接使用的「视图模型」。
 *
 * 这样做的好处：
 *  - 后端字段怎么改（比如 time → minutes、steps 用字符串还是对象），只改这里；
 *  - 页面组件保持稳定，不用关心接口细节；
 *  - 后端没返回的可选字段（emoji / category / cover…）在这里兜底。
 */

import { INGREDIENT_CATEGORIES, guessCategory, guessEmoji } from '../data/ingredients.js'

/** 把 "15分钟" / "1.5小时" / 15 统一成数字分钟 */
export function parseMinutes(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value)
  if (typeof value !== 'string') return fallback

  const text = value.trim()
  const hourMatch = text.match(/([\d.]+)\s*(?:小时|h|hour)/i)
  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60)

  const minuteMatch = text.match(/([\d.]+)\s*(?:分钟|分|min|minute)/i)
  if (minuteMatch) return Math.round(Number(minuteMatch[1]))

  const digits = text.replace(/[^\d.]/g, '')
  const bare = Number(digits)
  return digits !== '' && Number.isFinite(bare) ? Math.round(bare) : fallback
}

/**
 * 后端食材 → 页面食材模型。
 * @param {object} dto 见 recognizeIngredients 的 data 字段说明
 * @param {number} [index]
 */
export function toIngredientModel(dto = {}, index = 0) {
  const name = String(dto.name ?? '').trim()
  const category = INGREDIENT_CATEGORIES.includes(dto.category)
    ? dto.category
    : guessCategory(name)

  return {
    id: String(dto.id ?? `ing-${Date.now().toString(36)}-${index}`),
    name,
    emoji: dto.emoji || guessEmoji(name),
    quantity: dto.quantity || '适量',
    category,
    confidence: typeof dto.confidence === 'number' ? dto.confidence : null,
    selected: dto.selected !== false, // 默认全选
  }
}

export function toIngredientModelList(list = []) {
  return (Array.isArray(list) ? list : []).filter((item) => item && item.name).map(toIngredientModel)
}

/** steps 允许 ["步骤1"] 或 [{ text, minutes }] 两种写法 */
function toStepList(steps) {
  if (!Array.isArray(steps)) return []
  return steps
    .map((step) => {
      if (typeof step === 'string') return { text: step.trim(), minutes: null }
      if (step && typeof step === 'object') {
        return { text: String(step.text ?? '').trim(), minutes: step.minutes ?? null }
      }
      return { text: '', minutes: null }
    })
    .filter((step) => step.text)
}

/**
 * 后端食谱 → 页面食谱模型。
 * @param {object} dto 见 generateRecipes 的 data 字段说明
 * @param {number} [index]
 */
export function toRecipeModel(dto = {}, index = 0) {
  const uses = Array.isArray(dto.ingredients) ? dto.ingredients : Array.isArray(dto.uses) ? dto.uses : []
  const matched = Array.isArray(dto.matched) ? dto.matched : []
  const matchedCount = typeof dto.matchedCount === 'number' ? dto.matchedCount : matched.length
  const totalUsed = typeof dto.totalUsed === 'number' ? dto.totalUsed : uses.length
  const matchRate =
    typeof dto.matchRate === 'number'
      ? dto.matchRate
      : totalUsed > 0
        ? Math.round((matchedCount / totalUsed) * 100)
        : 100

  return {
    id: String(dto.id ?? `rcp-${Date.now().toString(36)}-${index}`),
    name: dto.title ?? dto.name ?? '未命名食谱',
    emoji: dto.emoji || '🍽️',
    cover: dto.cover || 'from-brand-100 via-brand-50 to-white',
    calories: Number(dto.calories ?? 0),
    minutes: parseMinutes(dto.minutes ?? dto.time),
    difficulty: dto.difficulty || '家常',
    servings: dto.servings || '2 人份',
    intro: dto.intro || '',
    tip: dto.tip || '',
    uses,
    matched,
    pantry: Array.isArray(dto.pantry) ? dto.pantry : [],
    matchRate,
    matchedCount,
    totalUsed,
    steps: toStepList(dto.steps),
    batchIndex: typeof dto.batchIndex === 'number' ? dto.batchIndex : index,
  }
}

export function toRecipeModelList(list = []) {
  return (Array.isArray(list) ? list : []).map(toRecipeModel)
}
