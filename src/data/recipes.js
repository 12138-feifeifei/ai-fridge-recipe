// 假数据：食谱库 + 基于所选食材的匹配排序（模拟「AI 生成食谱」）

export const MOCK_RECIPES = [
  {
    id: 'rcp-tomato-egg',
    name: '番茄炒蛋',
    emoji: '🍅',
    cover: 'from-rose-200 via-orange-100 to-amber-50',
    calories: 186,
    minutes: 12,
    difficulty: '新手友好',
    servings: '2 人份',
    intro: '酸甜开胃的国民下饭菜，12 分钟搞定。',
    tip: '鸡蛋先炒到七分熟盛出，最后再回锅，口感更嫩。',
    uses: ['番茄', '鸡蛋', '小葱'],
    seasonings: ['盐', '白糖', '食用油'],
    steps: [
      { text: '番茄顶部划十字，热水烫 30 秒后去皮切块；鸡蛋打散加一小撮盐。', minutes: 3 },
      { text: '热锅倒油，倒入蛋液快炒至七分熟盛出备用。', minutes: 2 },
      { text: '锅内留底油，下番茄块中火炒出红汁，加 1 小勺白糖提鲜。', minutes: 3 },
      { text: '倒回鸡蛋快速翻匀，让蛋块裹上番茄汁，加盐调味。', minutes: 2 },
      { text: '出锅前撒小葱花，趁热装盘。', minutes: 1 },
    ],
  },
  {
    id: 'rcp-garlic-broccoli',
    name: '蒜蓉西兰花',
    emoji: '🥦',
    cover: 'from-emerald-200 via-lime-100 to-teal-50',
    calories: 128,
    minutes: 10,
    difficulty: '新手友好',
    servings: '2 人份',
    intro: '低卡高纤维，保留脆嫩口感的快手菜。',
    tip: '焯水时加几滴油和一点盐，西兰花颜色会更翠绿。',
    uses: ['西兰花', '大蒜'],
    seasonings: ['盐', '食用油', '蚝油'],
    steps: [
      { text: '西兰花切小朵，淡盐水泡 5 分钟后冲洗干净。', minutes: 3 },
      { text: '水开加少许盐和油，西兰花焯 60-90 秒后立刻过凉水。', minutes: 2 },
      { text: '蒜切末，热锅冷油小火爆香蒜末。', minutes: 2 },
      { text: '倒入西兰花大火快炒，加盐和少许蚝油，翻匀出锅。', minutes: 3 },
    ],
  },
  {
    id: 'rcp-pepper-potato',
    name: '青椒土豆丝',
    emoji: '🥔',
    cover: 'from-lime-200 via-emerald-100 to-yellow-50',
    calories: 214,
    minutes: 15,
    difficulty: '新手友好',
    servings: '2 人份',
    intro: '爽脆微辣，米饭杀手级家常菜。',
    tip: '土豆丝切好后泡水去掉淀粉，炒出来才够脆不粘锅。',
    uses: ['土豆', '青椒', '大蒜'],
    seasonings: ['白醋', '盐', '食用油'],
    steps: [
      { text: '土豆切细丝，清水冲洗两遍后泡 5 分钟沥干。', minutes: 5 },
      { text: '青椒去籽切丝，蒜切末备用。', minutes: 2 },
      { text: '热锅热油爆香蒜末，下土豆丝大火翻炒 2 分钟。', minutes: 3 },
      { text: '加青椒丝继续翻炒，沿锅边淋半勺白醋。', minutes: 3 },
      { text: '加盐调味，土豆丝断生但仍有脆感时出锅。', minutes: 2 },
    ],
  },
  {
    id: 'rcp-mushroom-chicken',
    name: '香菇滑鸡',
    emoji: '🍗',
    cover: 'from-amber-200 via-orange-100 to-rose-50',
    calories: 326,
    minutes: 25,
    difficulty: '有点耐心',
    servings: '2 人份',
    intro: '高蛋白低脂，香菇的鲜味全被鸡肉吸走。',
    tip: '鸡肉提前用淀粉抓匀腌 10 分钟，成品更滑嫩。',
    uses: ['鸡胸肉', '香菇', '大蒜'],
    seasonings: ['生抽', '蚝油', '淀粉'],
    steps: [
      { text: '鸡胸肉切片，加生抽、淀粉和一点油抓匀腌 10 分钟。', minutes: 10 },
      { text: '香菇去蒂切片，大蒜切末。', minutes: 3 },
      { text: '热锅滑油，鸡肉下锅快速划散至变色八成熟，盛出。', minutes: 3 },
      { text: '底油爆香蒜末，下香菇炒软并炒出香味。', minutes: 4 },
      { text: '鸡肉回锅，加蚝油和小半碗水，中火收汁 3 分钟。', minutes: 5 },
    ],
  },
  {
    id: 'rcp-vegetable-soup',
    name: '胡萝卜蛋花汤',
    emoji: '🥚',
    cover: 'from-sky-200 via-emerald-100 to-white',
    calories: 92,
    minutes: 12,
    difficulty: '新手友好',
    servings: '2 人份',
    intro: '清甜暖胃的一碗汤，热量几乎可以忽略。',
    tip: '蛋液沿筷子缓缓倒入并轻轻推散，蛋花才够漂亮。',
    uses: ['鸡蛋', '胡萝卜', '小葱'],
    seasonings: ['盐', '香油', '白胡椒'],
    steps: [
      { text: '胡萝卜切细丝（或擦丝），小葱切末。', minutes: 3 },
      { text: '清水加胡萝卜丝煮开，转中火煮 4 分钟出甜味。', minutes: 5 },
      { text: '鸡蛋打散，沿锅边缓缓淋入并轻轻推散成蛋花。', minutes: 2 },
      { text: '加盐和白胡椒调味，滴几滴香油，撒葱花出锅。', minutes: 2 },
    ],
  },
  {
    id: 'rcp-creamy-broccoli',
    name: '奶香西兰花浓汤',
    emoji: '🥛',
    cover: 'from-teal-200 via-emerald-100 to-white',
    calories: 238,
    minutes: 20,
    difficulty: '有点耐心',
    servings: '2 人份',
    intro: '把西兰花和牛奶打成顺滑浓汤，早餐也很合适。',
    tip: '牛奶最后再倒，小火加热不要煮沸，避免起皮分离。',
    uses: ['西兰花', '牛奶', '洋葱'],
    seasonings: ['黄油', '黑胡椒', '盐'],
    steps: [
      { text: '西兰花切小朵，洋葱切丁。', minutes: 4 },
      { text: '锅中放黄油，小火把洋葱炒到透明微甜。', minutes: 4 },
      { text: '加西兰花和没过食材的清水，煮 8 分钟至软烂。', minutes: 8 },
      { text: '稍微放凉后用料理机打成细腻糊状（或用锅铲压碎）。', minutes: 3 },
      { text: '倒回锅中加牛奶，小火加热并加盐、黑胡椒调味。', minutes: 3 },
    ],
  },
  {
    id: 'rcp-tomato-potato-chicken',
    name: '番茄土豆炖鸡',
    emoji: '🍲',
    cover: 'from-orange-200 via-rose-100 to-amber-50',
    calories: 384,
    minutes: 35,
    difficulty: '值得花时间',
    servings: '3 人份',
    intro: '一锅炖的浓香主菜，汤汁拌饭特别香。',
    tip: '土豆晚一点下锅，避免炖到最后化在汤里。',
    uses: ['番茄', '土豆', '鸡胸肉'],
    seasonings: ['生抽', '盐', '黑胡椒'],
    steps: [
      { text: '鸡胸肉切块，用盐和黑胡椒抓匀；番茄切块、土豆滚刀切。', minutes: 6 },
      { text: '热锅倒油，鸡肉煎到表面微焦后盛出。', minutes: 5 },
      { text: '底油炒番茄至出沙，加生抽炒匀。', minutes: 5 },
      { text: '加热水和鸡肉，中小火炖 10 分钟。', minutes: 12 },
      { text: '下土豆继续炖到软糯，最后加盐调味并收汁。', minutes: 8 },
    ],
  },
  {
    id: 'rcp-onion-carrot-egg',
    name: '洋葱胡萝卜炒蛋',
    emoji: '🧅',
    cover: 'from-yellow-200 via-amber-100 to-orange-50',
    calories: 202,
    minutes: 15,
    difficulty: '新手友好',
    servings: '2 人份',
    intro: '甜味很足的一道快手菜，孩子也很喜欢。',
    tip: '洋葱先用中小火炒出甜味，再和鸡蛋混合会更香。',
    uses: ['洋葱', '胡萝卜', '鸡蛋'],
    seasonings: ['盐', '食用油'],
    steps: [
      { text: '洋葱、胡萝卜切细丝，鸡蛋加少许盐打散。', minutes: 4 },
      { text: '热锅倒油，蛋液下锅炒散至凝固后盛出。', minutes: 3 },
      { text: '底油下洋葱丝炒到微微发黄出甜味。', minutes: 4 },
      { text: '加胡萝卜丝炒软，倒回鸡蛋翻匀并加盐调味。', minutes: 4 },
    ],
  },
  {
    id: 'rcp-mushroom-omelette',
    name: '香菇蔬菜煎蛋饼',
    emoji: '🍳',
    cover: 'from-emerald-100 via-amber-100 to-white',
    calories: 268,
    minutes: 18,
    difficulty: '新手友好',
    servings: '2 人份',
    intro: '把边角料蔬菜煎成蛋饼，早餐晚餐都合适。',
    tip: '蔬菜先炒熟再拌进蛋液，蛋饼受热更均匀。',
    uses: ['香菇', '鸡蛋', '胡萝卜', '小葱'],
    seasonings: ['面粉', '盐', '白胡椒'],
    steps: [
      { text: '香菇、胡萝卜切小丁，小葱切末。', minutes: 4 },
      { text: '热锅加油，把蔬菜丁炒软并加盐调味，盛出放温。', minutes: 5 },
      { text: '鸡蛋打散，加 1 勺面粉和炒好的蔬菜拌匀。', minutes: 3 },
      { text: '平底锅刷油，倒入蛋液小火煎 3 分钟至底部定型。', minutes: 4 },
      { text: '翻面再煎 2 分钟，切块装盘。', minutes: 2 },
    ],
  },
]

const BATCH_SIZE = 3

/**
 * 按「命中食材比例」给食谱打分排序，并用 refreshKey 支持「换一批」。
 * 接入真实后端后，这里可以整体替换为接口返回结果。
 */
export function rankRecipes(ingredients = [], { limit = BATCH_SIZE, refreshKey = 0 } = {}) {
  const names = new Set(
    ingredients.map((item) => (typeof item === 'string' ? item : item?.name)).filter(Boolean),
  )

  const scored = MOCK_RECIPES.map((recipe) => {
    const matched = recipe.uses.filter((name) => names.has(name))
    const pantry = recipe.seasonings.filter((name) => names.has(name))
    const seasoningsHit = recipe.seasonings.filter((name) => !names.has(name))
    const score =
      (matched.length / recipe.uses.length) * 0.8 +
      (pantry.length / Math.max(1, recipe.seasonings.length)) * 0.2
    return { recipe, matched, pantry: seasoningsHit, score }
  })

  const minMatch = 2
  const qualified = scored.filter((item) => item.matched.length >= Math.min(minMatch, item.recipe.uses.length))
  const pool = (qualified.length ? qualified : scored)
    .slice()
    .sort((a, b) => b.score - a.score || b.matched.length - a.matched.length)

  const offset = pool.length ? (((refreshKey % pool.length) + pool.length) % pool.length) : 0
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)]

  return rotated.slice(0, limit).map((item, index) => {
    const uses = item.recipe.uses
    const matchRate = Math.round((item.matched.length / uses.length) * 100)
    return {
      ...item.recipe,
      matched: item.matched,
      pantry: item.pantry,
      matchRate,
      matchedCount: item.matched.length,
      totalUsed: uses.length,
      batchIndex: index,
    }
  })
}
