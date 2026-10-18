/**
 * 数据适配层：把后端的接口字段（见 services/api.js 的接口契约）
 * 转换成页面组件直接使用的「视图模型」。
 *
 * 这样做的好处：
 *  - 后端字段怎么改（比如 time → minutes、steps 用字符串还是对象），只改这里；
 *  - 页面组件保持稳定，不用关心接口细节；
 *  - 后端没返回的可选字段（emoji / category / cover…）在这里兜底。
 *  - 匹配度这种「要结合用户勾选食材才算得出来」的字段，也在这里补算，
 *    保证页面上不会出现「匹配 0%」这种明显不对的值。
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

/* -------------------------------------------------------------------------- */
/*  食材名归一：匹配度按同一套规则算，前后端叫法不同也能对上                        */
/* -------------------------------------------------------------------------- */

/** 同物异名归一表：归一后「西红柿 / 番茄」「蒜末 / 大蒜」视为同一种食材 */
const INGREDIENT_ALIASES = new Map([
  ['西红柿', '番茄'],
  ['圣女果', '番茄'],
  ['马铃薯', '土豆'],
  ['洋芋', '土豆'],
  ['鸡胸肉', '鸡肉'],
  ['鸡腿肉', '鸡肉'],
  ['鸡脯肉', '鸡肉'],
  ['鸡腿', '鸡肉'],
  ['鸡翅', '鸡肉'],
  ['蒜', '大蒜'],
  ['蒜末', '大蒜'],
  ['蒜头', '大蒜'],
  ['蒜瓣', '大蒜'],
  ['葱花', '小葱'],
  ['香葱', '小葱'],
  ['葱', '小葱'],
  ['蛋', '鸡蛋'],
  ['猪里脊', '猪肉'],
  ['猪五花', '猪肉'],
])

/** 归一化食材名：去掉空白 / 括号 / 标点后转小写，再套别名表 */
export function ingredientKey(value) {
  const text = String(value ?? '')
    // eslint-disable-next-line no-useless-escape
    .replace(/[\s\u3000()（）\[\]【】,，、.。:：;；]/g, '')
    .toLowerCase()
  if (!text) return ''
  return INGREDIENT_ALIASES.get(text) ?? text
}

/** 两个名字是否指同一种食材：归一后相同，或较短的那个（≥2 字）被完整包含 */
export function isSameIngredient(a, b) {
  const keyA = ingredientKey(a)
  const keyB = ingredientKey(b)
  if (!keyA || !keyB) return false
  if (keyA === keyB) return true
  // 「土豆」⊂「土豆丝」算命中；但「葱」这种单字不参与包含判断，避免「洋葱」误命中
  const [shortKey, longKey] = keyA.length <= keyB.length ? [keyA, keyB] : [keyB, keyA]
  return shortKey.length >= 2 && longKey.includes(shortKey)
}

/* -------------------------------------------------------------------------- */
/*  匹配度：后端给了就用后端的，没给就用「食谱用到的食材 ∩ 勾选食材」现场算        */
/* -------------------------------------------------------------------------- */

function pickNumber(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

/** 后端字段命名可能是 camelCase 也可能是 snake_case，这里统一成字符串数组 */
function pickNameList(...candidates) {
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue
    const list = candidate.map((item) => String(item ?? '').trim()).filter(Boolean)
    if (list.length) return list
  }
  return []
}

/** 后端可能给 0~1 的小数（0.85），也可能给 0~100 的整数（85）；非法值一律丢弃 */
function normalizeRate(value) {
  if (value === null) return null
  const scaled = value > 0 && value <= 1 ? value * 100 : value
  if (!Number.isFinite(scaled) || scaled < 0 || scaled > 100) return null
  return Math.round(scaled)
}

/**
 * 计算一道菜的匹配信息。
 *
 * 取值优先级：
 *   1. 后端返回了合法的 matchRate（0~100 或 0~1 小数）→ 以它为准；
 *   2. 否则用「食谱用到的食材 ∩ 用户勾选的食材」现场算：matchedCount / totalUsed；
 *   3. 实在算不出 → matchRate = null，页面不显示匹配度标签（绝不显示 0%）。
 *
 * @param {object} source 后端 dto，或已经适配过的食谱视图模型
 * @param {Array<string | { name?: string }>} selectedNames 用户当前勾选的食材
 */
export function computeMatchInfo(source = {}, selectedNames = []) {
  const selected = (Array.isArray(selectedNames) ? selectedNames : [])
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .map((name) => String(name ?? '').trim())
    .filter(Boolean)

  const uses = pickNameList(source.ingredients, source.uses, source.usedIngredients, source.used_ingredients)
  const backendMatched = pickNameList(
    source.matched,
    source.matchedIngredients,
    source.matched_ingredients,
    source.hitIngredients,
  )
  const backendRate = normalizeRate(
    pickNumber(
      source.matchRate,
      source.match_rate,
      source.matchScore,
      source.match_score,
      source.matchPercent,
      source.match_percent,
    ),
  )

  const hasSelected = (name) => selected.some((item) => isSameIngredient(item, name))
  const matched = backendMatched.length ? backendMatched : uses.filter(hasSelected)

  const declaredTotal = pickNumber(
    source.totalUsed,
    source.total_used,
    source.totalIngredients,
    source.ingredientCount,
  )
  const totalUsed = Math.max(
    uses.length,
    declaredTotal && declaredTotal > 0 ? Math.round(declaredTotal) : 0,
    matched.length,
  )

  const computed = totalUsed > 0 ? Math.round((matched.length / totalUsed) * 100) : null
  // 0% 一律当作「算不出」：宁可隐藏标签，也不要在页面上出现 0%
  const matchRate = backendRate && backendRate > 0 ? backendRate : computed && computed > 0 ? computed : null

  // 需要用户自备的调料：后端给了 pantry 就用它，否则拿 seasonings 减掉用户已有的
  const pantry = pickNameList(source.pantry, source.seasonings).filter(
    (name) => !hasSelected(name) && !matched.some((hit) => isSameIngredient(hit, name)),
  )

  return {
    uses,
    matched,
    pantry,
    matchedCount: matched.length,
    totalUsed,
    matchRate,
  }
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
 * @param {{ selectedNames?: Array<string | { name?: string }> }} [context] 用户勾选的食材，
 *        用来在「后端没返回匹配度」时现场算匹配度（见 computeMatchInfo）
 */
export function toRecipeModel(dto = {}, index = 0, { selectedNames = [] } = {}) {
  const match = computeMatchInfo(dto, selectedNames)

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
    uses: match.uses,
    matched: match.matched,
    pantry: match.pantry,
    matchRate: match.matchRate,
    matchedCount: match.matchedCount,
    totalUsed: match.totalUsed,
    steps: toStepList(dto.steps),
    batchIndex: typeof dto.batchIndex === 'number' ? dto.batchIndex : index,
  }
}

export function toRecipeModelList(list = [], options = {}) {
  const { selectedNames = [] } = options
  return (Array.isArray(list) ? list : []).map((dto, index) => toRecipeModel(dto, index, { selectedNames }))
}

/**
 * 用最新的勾选食材重算已有食谱的匹配信息。
 * 页面刷新后从 sessionStorage 恢复的食谱可能带着旧算法算出的 0%/过期匹配，
 * 这里统一刷新一遍，避免旧数据把「匹配 0%」带到页面上。
 */
export function refreshRecipeMatches(recipes = [], selectedNames = []) {
  return (Array.isArray(recipes) ? recipes : []).map((recipe) => ({
    ...recipe,
    ...computeMatchInfo(recipe, selectedNames),
  }))
}
