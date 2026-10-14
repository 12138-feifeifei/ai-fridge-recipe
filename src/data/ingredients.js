// 假数据：模拟「冰箱照片识别」的结果
// 真实后端接入后，这个文件可以只保留 EMOJI_BY_NAME / COMMON_INGREDIENTS 这类前端字典。

export const INGREDIENT_CATEGORIES = ['蔬菜', '肉类', '菌菇', '蛋奶', '调味', '其他']

export const CATEGORY_META = {
  蔬菜: { emoji: '🥬', label: '蔬菜' },
  肉类: { emoji: '🥩', label: '肉类' },
  菌菇: { emoji: '🍄', label: '菌菇' },
  蛋奶: { emoji: '🥛', label: '蛋奶' },
  调味: { emoji: '🧂', label: '调味' },
  其他: { emoji: '🍽️', label: '其他' },
}

// 添加食材时的 emoji 自动匹配（按名字查表）
export const EMOJI_BY_NAME = {
  番茄: '🍅',
  西红柿: '🍅',
  鸡蛋: '🥚',
  西兰花: '🥦',
  土豆: '🥔',
  青椒: '🫑',
  鸡胸肉: '🍗',
  鸡肉: '🍗',
  香菇: '🍄',
  洋葱: '🧅',
  小葱: '🌿',
  葱: '🌿',
  大蒜: '🧄',
  蒜: '🧄',
  牛奶: '🥛',
  胡萝卜: '🥕',
  白菜: '🥬',
  生菜: '🥬',
  菠菜: '🥬',
  黄瓜: '🥒',
  玉米: '🌽',
  茄子: '🍆',
  南瓜: '🎃',
  红薯: '🍠',
  苹果: '🍎',
  香蕉: '🍌',
  柠檬: '🍋',
  牛油果: '🥑',
  芝士: '🧀',
  培根: '🥓',
  火腿: '🥓',
  牛肉: '🥩',
  猪肉: '🥩',
  虾: '🦐',
  鱼: '🐟',
  米饭: '🍚',
  面包: '🍞',
  面条: '🍜',
  盐: '🧂',
  糖: '🍬',
  食用油: '🫗',
  香油: '🫗',
  黄油: '🧈',
  辣椒: '🌶️',
  干辣椒: '🌶️',
  黑胡椒: '🌶️',
}

// 底部弹层里的「常用食材」快捷添加
export const COMMON_INGREDIENTS = [
  { name: '盐', quantity: '适量', category: '调味' },
  { name: '生抽', quantity: '2 勺', category: '调味' },
  { name: '食用油', quantity: '适量', category: '调味' },
  { name: '蚝油', quantity: '1 勺', category: '调味' },
  { name: '白糖', quantity: '1 勺', category: '调味' },
  { name: '黑胡椒', quantity: '少许', category: '调味' },
  { name: '淀粉', quantity: '适量', category: '调味' },
  { name: '鸡蛋', quantity: '2 个', category: '蛋奶' },
  { name: '小葱', quantity: '1 把', category: '调味' },
  { name: '大蒜', quantity: '3 瓣', category: '调味' },
]

// 识别结果（假数据）：默认全部勾选，用户可以取消
export const MOCK_INGREDIENTS = [
  { id: 'ing-01', name: '番茄', emoji: '🍅', quantity: '2 个', category: '蔬菜', confidence: 0.96, selected: true },
  { id: 'ing-02', name: '鸡蛋', emoji: '🥚', quantity: '3 个', category: '蛋奶', confidence: 0.94, selected: true },
  { id: 'ing-03', name: '西兰花', emoji: '🥦', quantity: '1 颗', category: '蔬菜', confidence: 0.92, selected: true },
  { id: 'ing-04', name: '土豆', emoji: '🥔', quantity: '2 个', category: '蔬菜', confidence: 0.9, selected: true },
  { id: 'ing-05', name: '青椒', emoji: '🫑', quantity: '3 根', category: '蔬菜', confidence: 0.88, selected: true },
  { id: 'ing-06', name: '鸡胸肉', emoji: '🍗', quantity: '1 块', category: '肉类', confidence: 0.86, selected: true },
  { id: 'ing-07', name: '香菇', emoji: '🍄', quantity: '5 朵', category: '菌菇', confidence: 0.84, selected: true },
  { id: 'ing-08', name: '洋葱', emoji: '🧅', quantity: '1 个', category: '蔬菜', confidence: 0.81, selected: true },
  { id: 'ing-09', name: '小葱', emoji: '🌿', quantity: '1 把', category: '调味', confidence: 0.79, selected: true },
  { id: 'ing-10', name: '大蒜', emoji: '🧄', quantity: '半头', category: '调味', confidence: 0.77, selected: true },
  { id: 'ing-11', name: '牛奶', emoji: '🥛', quantity: '1 盒', category: '蛋奶', confidence: 0.75, selected: true },
  { id: 'ing-12', name: '胡萝卜', emoji: '🥕', quantity: '1 根', category: '蔬菜', confidence: 0.73, selected: true },
]

export function guessEmoji(name = '') {
  const key = String(name).trim()
  if (!key) return '🥗'
  if (EMOJI_BY_NAME[key]) return EMOJI_BY_NAME[key]
  const hit = Object.keys(EMOJI_BY_NAME).find((item) => key.includes(item) || item.includes(key))
  return hit ? EMOJI_BY_NAME[hit] : '🥗'
}

export function guessCategory(name = '') {
  const item = COMMON_INGREDIENTS.find((candidate) => candidate.name === name)
  if (item) return item.category
  const meat = ['肉', '鸡', '牛', '猪', '羊', '虾', '鱼', '培根', '火腿']
  const dairy = ['奶', '蛋', '芝士', '黄油']
  const mushroom = ['菇', '菌', '木耳']
  const seasoning = ['盐', '糖', '油', '酱', '醋', '椒', '葱', '蒜', '姜', '粉', '淀粉', '料酒']
  if (meat.some((word) => name.includes(word))) return '肉类'
  if (dairy.some((word) => name.includes(word))) return '蛋奶'
  if (mushroom.some((word) => name.includes(word))) return '菌菇'
  if (seasoning.some((word) => name.includes(word))) return '调味'
  return '蔬菜'
}
