// POST /api/recipes/generate
// 收前端 JSON {ingredients:["番茄","鸡蛋"...], refreshKey?:number},调智谱文本模型生成菜谱。
// 返回字段严格对齐前端契约:name/minutes/calories/difficulty/servings/intro/tip/uses/seasonings/steps[{text,minutes}]。
// 额外附 caloriesBreakdown(卡路里按食材拆分,前端忽略不影响)。
// 无 ZHIPU_API_KEY 环境变量时返回 mock 数据(mock:true)。

const ZHIPU_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `你是资深家常菜谱师,任务是帮用户消耗冰箱里的剩余食材、减少食物浪费。
用户给出食材清单,你生成 2~3 道家常菜谱。规则:
- 优先多用用户清单里的食材;基础调料免费使用(油、盐、糖、酱油、醋、葱、姜、蒜、料酒、淀粉、胡椒),也可加少量常见辅料(水、米饭、面条)
- 菜谱要家常、可操作,适合一两人在家快速做
- calories 是"每人份"估算千卡,取整数,家常菜通常每份 150~650 千卡
- difficulty 只能是 "新手友好" 或 "有点耐心"
- steps 3~5 步,每步的 minutes 之和约等于总 minutes

只输出一个 JSON 对象,不要任何解释、前后缀或 markdown 代码块,格式:
{"recipes":[{"name":"菜名","minutes":总分钟数,"calories":每份千卡,"difficulty":"新手友好","servings":"2 人份","intro":"一句话介绍","tip":"一个实用小技巧","uses":["用到的用户食材"],"seasonings":["需要的调料"],"steps":[{"text":"具体步骤","minutes":3}],"caloriesBreakdown":[{"item":"鸡蛋 2 个(约100克)","kcal":144}]}]}

uses 只能包含用户清单里出现过的食材。`;

// 前端 mock 里出现过的 Tailwind 渐变类,字面量在已构建的 bundle 里,后端复用安全
const COVERS = [
  "from-rose-200 via-orange-100 to-amber-50",
  "from-emerald-200 via-lime-100 to-teal-50",
  "from-lime-200 via-emerald-100 to-yellow-50",
  "from-amber-200 via-orange-100 to-rose-50",
];

const EMOJI_RULES = [
  ["蛋", "🍳"], ["汤", "🍲"], ["面", "🍜"], ["饭", "🍚"], ["粥", "🥣"],
  ["鸡", "🍗"], ["鸭", "🦆"], ["鱼", "🐟"], ["虾", "🦐"], ["牛", "🥩"],
  ["豆腐", "🍲"], ["土豆", "🥔"], ["菇", "🍄"], ["沙拉", "🥗"], ["奶", "🥛"],
];
function pickEmoji(name) {
  for (const [kw, emoji] of EMOJI_RULES) if (name.includes(kw)) return emoji;
  return "🥘";
}

const MOCK = {
  success: true,
  mock: true,
  data: [
    {
      id: "rcp-mock-1", name: "番茄炒蛋", emoji: "🍳", cover: COVERS[0],
      calories: 186, minutes: 12, difficulty: "新手友好", servings: "2 人份",
      intro: "酸香开胃的国民下饭菜,12 分钟搞定。",
      tip: "鸡蛋先炒到八分盛出,最后再回锅,口感更嫩。",
      uses: ["番茄", "鸡蛋"], seasonings: ["盐", "白糖", "食用油"],
      steps: [
        { text: "番茄顶部划十字,热水烫 30 秒后去皮切块;鸡蛋打散加一小撮盐。", minutes: 3 },
        { text: "热锅倒油,倒入蛋液快炒至八分盛出备用。", minutes: 2 },
        { text: "锅内留底油,下番茄块中火炒出红汁,加 1 小勺白糖提鲜。", minutes: 3 },
        { text: "倒回鸡蛋快速翻匀,让蛋块裹上番茄汁,加盐调味。", minutes: 2 },
      ],
      caloriesBreakdown: [
        { item: "鸡蛋 3 个(约150克)", kcal: 216 },
        { item: "番茄 2 个(约300克)", kcal: 54 },
        { item: "食用油 10 克", kcal: 90 },
      ],
    },
    {
      id: "rcp-mock-2", name: "青椒土豆丝", emoji: "🥘", cover: COVERS[2],
      calories: 214, minutes: 15, difficulty: "新手友好", servings: "2 人份",
      intro: "爽脆微辣,米饭杀手常菜。",
      tip: "土豆丝切好后泡水去掉淀粉,炒出来才够脆不粘锅。",
      uses: ["土豆", "青椒"], seasonings: ["白醋", "盐", "食用油"],
      steps: [
        { text: "土豆切细丝,清水冲洗两遍后泡 5 分钟沥干。", minutes: 5 },
        { text: "青椒去籽切丝,蒜切末备用。", minutes: 2 },
        { text: "热锅热油爆香蒜末,下土豆丝大火翻炒 2 分钟。", minutes: 3 },
        { text: "加青椒丝继续翻炒,沿锅边淋半勺白醋。", minutes: 3 },
        { text: "加盐调味,断生但仍带脆感时出锅。", minutes: 2 },
      ],
      caloriesBreakdown: [
        { item: "土豆 2 个(约400克)", kcal: 308 },
        { item: "青椒 3 根(约100克)", kcal: 22 },
        { item: "食用油 10 克", kcal: 90 },
      ],
    },
  ],
  meta: { total: 2, refreshKey: 0, generatedAt: new Date().toISOString() },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

function fail(status, code, message) {
  return json({ success: false, code, message }, status);
}

// 从模型回复里抠出 JSON(容忍 <think>、```json 围栏、前后废话)
function extractJSON(text) {
  if (!text) return null;
  let t = String(text).replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  for (const [open, close] of [
    ["{", "}"],
    ["[", "]"],
  ]) {
    const s = t.indexOf(open);
    if (s < 0) continue;
    let idx = t.indexOf(close, s);
    while (idx > 0) {
      try {
        return JSON.parse(t.slice(s, idx + 1));
      } catch {
        idx = t.indexOf(close, idx + 1);
      }
    }
  }
  return null;
}

async function callZhipu(key, payload, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(ZHIPU_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const txt = await r.text();
    if (!r.ok) {
      let msg = `智谱接口错误 ${r.status}`;
      try {
        msg = JSON.parse(txt)?.error?.message || msg;
      } catch {}
      return { ok: false, message: msg };
    }
    const content = JSON.parse(txt)?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return { ok: false, message: "AI 未返回内容" };
    }
    return { ok: true, content };
  } catch (e) {
    if (e && e.name === "AbortError") return { ok: false, message: "AI 响应超时,请重试", timeout: true };
    return { ok: false, message: "调用 AI 失败: " + (e?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

function normalizeRecipes(parsed, inputNames) {
  const arr = Array.isArray(parsed) ? parsed : parsed?.recipes || parsed?.data;
  if (!Array.isArray(arr) || !arr.length) return null;
  const stamp = Date.now().toString(36);
  const out = [];
  arr.slice(0, 3).forEach((r, i) => {
    if (!r || typeof r !== "object") return;
    const name = String(r.name || r.title || "").trim().slice(0, 40);
    if (!name) return;
    const steps = (Array.isArray(r.steps) ? r.steps : [])
      .map((s) => {
        const text = typeof s === "string" ? s : String(s?.text || "").trim();
        if (!text) return null;
        const minutes = Number(s?.minutes);
        return { text: text.slice(0, 300), minutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : null };
      })
      .filter(Boolean);
    if (!steps.length) return;
    const uses = (Array.isArray(r.uses) ? r.uses : [])
      .map((u) => String(u).trim())
      .filter((u) => u && inputNames.includes(u))
      .slice(0, 10);
    const breakdown = (Array.isArray(r.caloriesBreakdown) ? r.caloriesBreakdown : [])
      .map((b) => ({ item: String(b?.item || "").trim().slice(0, 60), kcal: toInt(b?.kcal, 0) }))
      .filter((b) => b.item && b.kcal > 0)
      .slice(0, 10);
    out.push({
      id: "rcp-" + stamp + "-" + (i + 1),
      name,
      emoji: pickEmoji(name),
      cover: COVERS[out.length % COVERS.length],
      calories: toInt(r.calories, 300),
      minutes: toInt(r.minutes, steps.reduce((a, s) => a + (s.minutes || 0), 0) || 15),
      difficulty: r.difficulty === "有点耐心" ? "有点耐心" : "新手友好",
      servings: String(r.servings || "2 人份").slice(0, 10),
      intro: String(r.intro || "").trim().slice(0, 100),
      tip: String(r.tip || "").trim().slice(0, 100),
      uses,
      seasonings: (Array.isArray(r.seasonings) ? r.seasonings : []).map((s) => String(s).trim()).filter(Boolean).slice(0, 8),
      steps,
      caloriesBreakdown: breakdown,
    });
  });
  return out.length ? out : null;
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return fail(405, "METHOD_NOT_ALLOWED", "只支持 POST");

  const key = env.ZHIPU_API_KEY || "";

  let body = null;
  try {
    body = await request.json();
  } catch {}
  const rawList = body?.ingredients || body?.selectedIngredients || [];
  const inputNames = (Array.isArray(rawList) ? rawList : [])
    .map((x) => (typeof x === "string" ? x : String(x?.name || "")))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  if (!inputNames.length) return fail(400, "NO_INGREDIENTS", "请至少勾选一种食材");

  const refreshKey = Number(body?.refreshKey) || 0;
  if (!key) return json({ ...MOCK, meta: { ...MOCK.meta, refreshKey, generatedAt: new Date().toISOString() } });

  try {
    const payload = {
      // 实测(2026-10): glm-4-air 5.8s / glm-4-flashx 8.9s / glm-4-flash 22s+超时,air 质量也最好;前端 20s 超时
      model: env.TEXT_MODEL || "glm-4-air",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `现有食材: ${inputNames.join("、")}\n请生成菜谱,只输出 JSON。` },
      ],
      temperature: refreshKey > 0 ? 0.9 : 0.6, // 前端点"换一批"时提高随机度
      max_tokens: 1400,
    };

    const result = await callZhipu(key, payload, 17000);
    if (!result.ok) return fail(result.timeout ? 504 : 502, result.timeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR", result.message);

    const recipes = normalizeRecipes(extractJSON(result.content), inputNames);
    if (!recipes) return fail(502, "UPSTREAM_ERROR", "AI 返回格式异常,请重试");

    return json({
      success: true,
      mock: false,
      data: recipes,
      meta: { total: recipes.length, refreshKey, generatedAt: new Date().toISOString() },
    });
  } catch (e) {
    return fail(500, "INTERNAL_ERROR", "服务异常: " + (e?.message || e));
  }
}
