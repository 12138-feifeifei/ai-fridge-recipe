/**
 * ============================================================================
 *  API 请求层（前后端数据契约）
 * ============================================================================
 * 这是前端唯一直接和「后端 / Cloudflare Pages Functions」通信的地方，
 * 页面与 store 都只调用本文件导出的两个业务函数：
 *
 *   recognizeIngredients(imageFile)      → 上传冰箱照片，返回食材列表
 *   generateRecipes(selectedIngredients) → 传入勾选的食材，返回食谱列表
 *
 * 当前 USE_MOCK_API 为 true：函数内部使用 Mock 数据 + 模拟网络延迟，
 * 但依然返回 Promise、依然经过统一的错误处理与加载状态，
 * 接口形状和真实后端完全一致，方便随时切换。
 *
 * 后端就绪后只需要改配置，业务代码一行都不用动：
 *   1. 复制 .env.example 为 .env.local
 *   2. 设置 VITE_API_BASE_URL（Cloudflare Pages Functions 部署域名，例如
 *      https://fridge-chef.pages.dev；同源部署可留空或设为 /api）
 *   3. 设置 VITE_USE_MOCK_API=false
 *
 * ----------------------------------------------------------------------------
 *  接口一：识别食材
 * ----------------------------------------------------------------------------
 *  POST  {VITE_API_BASE_URL}/ingredients/recognize
 *  请求  Content-Type: multipart/form-data
 *        字段 image: File（用户上传/拍摄的图片）
 *
 *  成功响应 200：
 *  {
 *    "success": true,
 *    "data": [
 *      { "id": "1", "name": "番茄", "confidence": 0.98 }
 *    ]
 *  }
 *
 *  data[] 字段说明：
 *    - id         string   必填，食材唯一标识
 *    - name       string   必填，食材名称（中文）
 *    - confidence number   必填，置信度 0~1
 *    - emoji      string   可选，后端不给就由前端按名称匹配
 *    - quantity   string   可选，例如 "2 个" / "1 把"，默认 "适量"
 *    - category   string   可选，"蔬菜" | "肉类" | "菌菇" | "蛋奶" | "调味" | "其他"
 *    - selected   boolean  可选，默认 true（默认全选）
 *
 * ----------------------------------------------------------------------------
 *  接口二：生成食谱
 * ----------------------------------------------------------------------------
 *  POST  {VITE_API_BASE_URL}/recipes/generate
 *  请求  Content-Type: application/json
 *        {
 *          "ingredients": ["番茄", "鸡蛋"],  // 勾选的食材名称
 *          "refreshKey": 0                   // 「换一批」时递增，用于翻页/去重
 *        }
 *
 *  成功响应 200：
 *  {
 *    "success": true,
 *    "data": [
 *      {
 *        "id": "r1",
 *        "title": "番茄炒蛋",
 *        "calories": 300,
 *        "time": "15分钟",
 *        "steps": ["步骤1", "步骤2"]
 *      }
 *    ],
 *    "meta": { "total": 9, "refreshKey": 0 }
 *  }
 *
 *  data[] 字段说明：
 *    - id        string   必填，食谱唯一标识
 *    - title     string   必填，菜名
 *    - calories  number   必填，热量（kcal，按 2 人份）
 *    - time      string   必填，预计用时，例如 "15分钟" / "1小时"
 *    - steps     array    必填，做法步骤；元素可以是字符串，
 *                         也可以是 { "text": "热锅倒油", "minutes": 2 }
 *    - emoji / cover / difficulty / servings / intro / tip  string  可选，缺省时前端兜底
 *    - ingredients  string[]  可选，这道菜用到的食材
 *    - matched      string[]  可选，其中命中了用户勾选的食材
 *    - pantry       string[]  可选，需要用户自备的调料
 *    - matchRate    number    可选，匹配度 0~100，缺省时前端按 matched/ingredients 计算
 *    - minutes      number    可选，用时的数字版本（前端优先用它排序/展示）
 *
 *  meta.total 可选：本次命中的食谱总数（用于「匹配到 N 道，先看这 M 道」）。
 *
 * ----------------------------------------------------------------------------
 *  失败响应（HTTP 非 2xx 或 success=false 都会抛出 ApiError）
 * ----------------------------------------------------------------------------
 *  {
 *    "success": false,
 *    "message": "识别失败，请重新上传",
 *    "code": "RECOGNIZE_FAILED"
 *  }
 * ============================================================================
 */

import { useSyncExternalStore } from 'react'
import { MOCK_INGREDIENTS } from '../data/ingredients.js'
import { rankRecipes } from '../data/recipes.js'

/* -------------------------------------------------------------------------- */
/*  配置                                                                       */
/* -------------------------------------------------------------------------- */

const rawBaseUrl = import.meta.env?.VITE_API_BASE_URL ?? '/api'

/** 接口基址，例如 https://fridge-chef.pages.dev 或 /api（同源） */
export const API_BASE_URL = String(rawBaseUrl).replace(/\/+$/, '')

/** 是否使用 Mock 数据。设为 VITE_USE_MOCK_API=false 即切到真实后端 */
export const USE_MOCK_API = String(import.meta.env?.VITE_USE_MOCK_API ?? 'true') !== 'false'

/** 接口路径（相对 API_BASE_URL） */
export const ENDPOINTS = {
  recognizeIngredients: '/ingredients/recognize',
  generateRecipes: '/recipes/generate',
}

/** 默认请求超时（毫秒） */
export const DEFAULT_TIMEOUT = 20000

/* -------------------------------------------------------------------------- */
/*  错误                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * 统一的接口错误类型。
 * 页面里可以 `error instanceof ApiError` 后按 `error.code` 区分处理。
 */
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function normalizeError(error) {
  if (error instanceof ApiError) return error
  if (error?.name === 'AbortError') return new ApiError('请求已取消', { code: 'ABORTED' })
  if (error?.name === 'TimeoutError') return new ApiError('请求超时，请检查网络后重试', { code: 'TIMEOUT' })
  if (error instanceof TypeError) {
    return new ApiError('网络异常，暂时连不上服务，请稍后再试', { code: 'NETWORK_ERROR', details: error })
  }
  return new ApiError(error?.message || '未知错误', { code: 'UNKNOWN', details: error })
}

/* -------------------------------------------------------------------------- */
/*  加载状态（供全局使用，例如顶部进度条 / 按钮禁用）                            */
/* -------------------------------------------------------------------------- */

const loadingListeners = new Set()
const loadingLabels = []
let loadingSnapshot = { loading: false, pending: 0, label: '' }

function publishLoading() {
  const next = {
    loading: loadingLabels.length > 0,
    pending: loadingLabels.length,
    label: loadingLabels[loadingLabels.length - 1] ?? '',
  }
  if (
    next.loading === loadingSnapshot.loading &&
    next.pending === loadingSnapshot.pending &&
    next.label === loadingSnapshot.label
  ) {
    return
  }
  loadingSnapshot = next
  loadingListeners.forEach((listener) => listener())
}

/**
 * 标记一次请求开始，返回一个「结束标记」函数。
 * 支持并发：内部用计数器累计，所有请求结束后 loading 才会变回 false。
 */
export function beginLoading(label = '') {
  loadingLabels.push(label)
  publishLoading()

  let finished = false
  return () => {
    if (finished) return
    finished = true
    const index = loadingLabels.lastIndexOf(label)
    if (index >= 0) loadingLabels.splice(index, 1)
    publishLoading()
  }
}

export function subscribeApiLoading(listener) {
  loadingListeners.add(listener)
  return () => loadingListeners.delete(listener)
}

export function getApiLoadingSnapshot() {
  return loadingSnapshot
}

/**
 * 给任意异步任务套上统一的加载状态。
 * Mock 分支和真实请求都走这里，保证「加载状态」的行为一致。
 *
 * @template T
 * @param {string} label 加载文案，例如 "识别食材"
 * @param {() => Promise<T>} task
 * @returns {Promise<T>}
 */
export async function withLoading(label, task) {
  const finishLoading = beginLoading(label)
  try {
    return await task()
  } finally {
    finishLoading()
  }
}

/** React 绑定：`const { loading, pending, label } = useApiLoading()` */
export function useApiLoading() {
  return useSyncExternalStore(subscribeApiLoading, getApiLoadingSnapshot, getApiLoadingSnapshot)
}

/* -------------------------------------------------------------------------- */
/*  基础请求（统一 fetch：错误处理 + 超时 + 加载状态）                            */
/* -------------------------------------------------------------------------- */

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function createAbortBundle(externalSignal, timeout) {
  const controller = new AbortController()
  const timer =
    timeout > 0
      ? setTimeout(() => controller.abort(new DOMException('请求超时', 'TimeoutError')), timeout)
      : null

  const forwardAbort = () => controller.abort(externalSignal?.reason)
  if (externalSignal) {
    if (externalSignal.aborted) forwardAbort()
    else externalSignal.addEventListener('abort', forwardAbort, { once: true })
  }

  return {
    signal: controller.signal,
    cleanup() {
      if (timer) clearTimeout(timer)
      externalSignal?.removeEventListener?.('abort', forwardAbort)
    },
  }
}

async function parseResponse(response) {
  const raw = await response.text()
  let payload = null
  if (raw) {
    try {
      payload = JSON.parse(raw)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    throw new ApiError(payload?.message || `请求失败（HTTP ${response.status}）`, {
      status: response.status,
      code: payload?.code || `HTTP_${response.status}`,
      details: payload,
    })
  }

  if (payload === null) {
    throw new ApiError('服务端返回了无法解析的内容', { status: response.status, code: 'INVALID_RESPONSE' })
  }

  if (payload.success === false) {
    throw new ApiError(payload.message || '接口返回失败', {
      status: response.status,
      code: payload.code || 'BUSINESS_ERROR',
      details: payload,
    })
  }

  return payload
}

/**
 * 统一的基础请求方法。真实接口调用都会经过这里，
 * 所以错误处理、超时、加载状态只需要维护一份。
 *
 * @param {string} path 接口路径（或完整 URL）
 * @param {{
 *   method?: string,
 *   body?: unknown,
 *   headers?: Record<string, string>,
 *   signal?: AbortSignal,
 *   timeout?: number,
 *   loadingLabel?: string,
 * }} [options]
 * @returns {Promise<{ success: boolean, data: any, meta?: object, message?: string }>}
 */
export async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    signal: externalSignal,
    timeout = DEFAULT_TIMEOUT,
    loadingLabel = '',
  } = options

  const finishLoading = loadingLabel ? beginLoading(loadingLabel) : () => {}
  const { signal, cleanup } = createAbortBundle(externalSignal, timeout)
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  try {
    const response = await fetch(buildUrl(path), {
      method,
      signal,
      body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        ...(isFormData || body === undefined ? null : { 'Content-Type': 'application/json' }),
        ...headers,
      },
    })
    return await parseResponse(response)
  } catch (error) {
    throw normalizeError(error)
  } finally {
    cleanup()
    finishLoading()
  }
}

/** 发送 JSON（POST/PUT 等） */
export function requestJSON(path, data, options = {}) {
  return request(path, { ...options, method: options.method ?? 'POST', body: data })
}

/** 发送 FormData（文件上传，浏览器会自动带上 multipart 边界） */
export function requestForm(path, formData, options = {}) {
  return request(path, { ...options, method: options.method ?? 'POST', body: formData })
}

/* -------------------------------------------------------------------------- */
/*  Mock 实现（保留 Promise / 进度 / 可取消的样子）                              */
/* -------------------------------------------------------------------------- */

const MOCK_RECOGNIZE_DURATION = 2000
const MOCK_GENERATE_DURATION = 1800

const RECOGNIZE_TEXTS = [
  'AI 正在努力识别你的冰箱…',
  '先看看蔬菜抽屉里藏了什么…',
  '再翻翻冷冻层和门上格…',
  '马上就好，正在整理食材清单…',
]

const GENERATE_TEXTS = ['分析食材搭配…', '计算营养与热量…', '搭配合适的菜式…', '生成烹饪步骤…']

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      clearTimeout(timer)
      reject(new ApiError('请求已取消', { code: 'ABORTED' }))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener?.('abort', handleAbort)
      resolve()
    }, ms)

    if (signal) {
      if (signal.aborted) handleAbort()
      else signal.addEventListener('abort', handleAbort, { once: true })
    }
  })
}

/** 模拟真实请求的分段进度，让 loading 文案动起来 */
async function simulateProgress({ duration, texts, onProgress, signal, label }) {
  const stages = texts?.length ? texts : ['处理中…']
  const startedAt = Date.now()

  for (;;) {
    const elapsed = Date.now() - startedAt
    const ratio = Math.min(1, elapsed / duration)
    const eased = 1 - Math.pow(1 - ratio, 2)
    const text = stages[Math.min(stages.length - 1, Math.floor(ratio * stages.length))]
    onProgress?.({ progress: Math.round(eased * 100), text, label })
    if (ratio >= 1) break
    await sleep(80, signal)
  }

  onProgress?.({ progress: 100, text: stages[stages.length - 1], label })
}

function toIngredientDto(item) {
  return {
    id: String(item.id),
    name: item.name,
    confidence: item.confidence ?? null,
    emoji: item.emoji,
    quantity: item.quantity,
    category: item.category,
    selected: item.selected !== false,
  }
}

function toRecipeDto(recipe) {
  return {
    id: String(recipe.id),
    title: recipe.name,
    calories: recipe.calories,
    time: `${recipe.minutes}分钟`,
    // 契约里 steps 允许字符串数组；这里顺便带上每步耗时，前端会做兼容
    steps: (recipe.steps ?? []).map((step) => ({ text: step.text, minutes: step.minutes ?? null })),
    minutes: recipe.minutes,
    emoji: recipe.emoji,
    cover: recipe.cover,
    difficulty: recipe.difficulty,
    servings: recipe.servings,
    intro: recipe.intro,
    tip: recipe.tip,
    ingredients: recipe.uses,
    matched: recipe.matched,
    pantry: recipe.pantry,
    matchRate: recipe.matchRate,
    matchedCount: recipe.matchedCount,
    totalUsed: recipe.totalUsed,
  }
}

function assertImageFile(imageFile) {
  const isFileLike =
    imageFile &&
    typeof imageFile === 'object' &&
    (typeof File === 'undefined' || imageFile instanceof File || imageFile instanceof Blob) &&
    typeof imageFile.size === 'number'

  if (!isFileLike) {
    throw new ApiError('请先拍照或选择一张冰箱照片', { code: 'INVALID_IMAGE' })
  }
  if (imageFile.type && !imageFile.type.startsWith('image/')) {
    throw new ApiError('请选择图片格式的文件', { code: 'INVALID_IMAGE_TYPE' })
  }
}

/** 把「食材对象或名称字符串」统一成 { id, name } 数组 */
function normalizeIngredientList(selectedIngredients) {
  if (!Array.isArray(selectedIngredients)) return []
  return selectedIngredients
    .map((item) =>
      typeof item === 'string'
        ? { id: item, name: item }
        : { id: item?.id ?? item?.name, name: item?.name },
    )
    .filter((item) => Boolean(item.name))
}

async function mockRecognizeIngredients(imageFile, { onProgress, signal } = {}) {
  assertImageFile(imageFile)
  await simulateProgress({
    duration: MOCK_RECOGNIZE_DURATION,
    texts: RECOGNIZE_TEXTS,
    onProgress,
    signal,
    label: '识别食材',
  })
  return {
    success: true,
    data: MOCK_INGREDIENTS.map(toIngredientDto),
    meta: { count: MOCK_INGREDIENTS.length, recognizedAt: new Date().toISOString() },
  }
}

async function mockGenerateRecipes(selectedIngredients, { refreshKey = 0, onProgress, signal } = {}) {
  const list = normalizeIngredientList(selectedIngredients)
  if (!list.length) {
    throw new ApiError('请至少勾选一种食材', { code: 'NO_INGREDIENTS' })
  }

  await simulateProgress({
    duration: MOCK_GENERATE_DURATION,
    texts: GENERATE_TEXTS,
    onProgress,
    signal,
    label: '生成食谱',
  })

  const { recipes, total } = rankRecipes(list, { refreshKey })
  return {
    success: true,
    data: recipes.map(toRecipeDto),
    meta: { total, refreshKey, generatedAt: new Date().toISOString() },
  }
}

/* -------------------------------------------------------------------------- */
/*  对外业务接口                                                                */
/* -------------------------------------------------------------------------- */

/**
 * 识别食材：上传一张冰箱照片，返回识别出的食材列表。
 *
 * 真实接口：`POST {VITE_API_BASE_URL}/ingredients/recognize`（multipart/form-data，字段 image）
 *
 * @param {File | Blob} imageFile 用户上传/拍摄的图片文件（必填）
 * @param {{
 *   onProgress?: (progress: { progress: number, text: string, label?: string }) => void,
 *   signal?: AbortSignal,
 * }} [options] onProgress 用于渲染识别动画；signal 可用于取消请求
 * @returns {Promise<{
 *   success: true,
 *   data: Array<{
 *     id: string,
 *     name: string,
 *     confidence: number,
 *     emoji?: string,
 *     quantity?: string,
 *     category?: '蔬菜'|'肉类'|'菌菇'|'蛋奶'|'调味'|'其他',
 *     selected?: boolean,
 *   }>,
 *   meta?: { count: number, recognizedAt: string },
 * }>} 统一响应体，食材放在 data 里
 *
 * @example
 * const res = await recognizeIngredients(file, { onProgress: ({ progress, text }) => ... })
 * // res.data → [{ id: '1', name: '番茄', confidence: 0.98 }]
 */
export async function recognizeIngredients(imageFile, options = {}) {
  const { onProgress, signal } = options

  if (USE_MOCK_API) {
    return withLoading('识别食材', () => mockRecognizeIngredients(imageFile, { onProgress, signal }))
  }

  const formData = new FormData()
  formData.append('image', imageFile)
  try {
    return await requestForm(ENDPOINTS.recognizeIngredients, formData, {
      signal,
      loadingLabel: '识别食材',
    })
  } catch (error) {
    throw normalizeError(error)
  }
}

/**
 * 生成食谱：根据用户勾选的食材，返回匹配到的食谱列表。
 *
 * 真实接口：`POST {VITE_API_BASE_URL}/recipes/generate`
 * 请求体：`{ "ingredients": ["番茄", "鸡蛋"], "refreshKey": 0 }`
 *
 * @param {Array<{ id?: string, name: string } | string>} selectedIngredients 勾选的食材（对象或名称字符串）
 * @param {{
 *   refreshKey?: number,
 *   onProgress?: (progress: { progress: number, text: string, label?: string }) => void,
 *   signal?: AbortSignal,
 * }} [options] refreshKey 在点「换一批」时递增
 * @returns {Promise<{
 *   success: true,
 *   data: Array<{
 *     id: string,
 *     title: string,
 *     calories: number,
 *     time: string,
 *     steps: Array<string | { text: string, minutes?: number }>,
 *     emoji?: string,
 *     cover?: string,
 *     difficulty?: string,
 *     servings?: string,
 *     intro?: string,
 *     tip?: string,
 *     ingredients?: string[],
 *     matched?: string[],
 *     pantry?: string[],
 *     matchRate?: number,
 *     minutes?: number,
 *   }>,
 *   meta?: { total: number, refreshKey: number, generatedAt: string },
 * }>} 统一响应体，食谱放在 data 里
 *
 * @example
 * const res = await generateRecipes(['番茄', '鸡蛋'])
 * // res.data → [{ id: 'r1', title: '番茄炒蛋', calories: 300, time: '15分钟', steps: ['步骤1', '步骤2'] }]
 *
 * @example
 * const res = await generateRecipes([{ id: 'ing-01', name: '番茄' }], { refreshKey: 1 })
 */
export async function generateRecipes(selectedIngredients, options = {}) {
  const { refreshKey = 0, onProgress, signal } = options

  if (USE_MOCK_API) {
    return withLoading('生成食谱', () =>
      mockGenerateRecipes(selectedIngredients, { refreshKey, onProgress, signal }),
    )
  }

  const list = normalizeIngredientList(selectedIngredients)
  if (!list.length) {
    throw new ApiError('请至少勾选一种食材', { code: 'NO_INGREDIENTS' })
  }

  try {
    return await requestJSON(
      ENDPOINTS.generateRecipes,
      { ingredients: list.map((item) => item.name), refreshKey },
      { signal, loadingLabel: '生成食谱' },
    )
  } catch (error) {
    throw normalizeError(error)
  }
}
