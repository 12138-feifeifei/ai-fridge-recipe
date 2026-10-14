// 内置「示例冰箱照片」：纯 SVG Data URL，不依赖任何图片资源，方便没有照片时跑通流程。

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e9f7ef"/>
      <stop offset="1" stop-color="#dcecfb"/>
    </linearGradient>
    <linearGradient id="fridge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#f1f7f4"/>
    </linearGradient>
  </defs>
  <rect width="960" height="720" fill="url(#bg)"/>
  <circle cx="140" cy="120" r="92" fill="#ffffff" opacity="0.55"/>
  <circle cx="836" cy="618" r="120" fill="#ffffff" opacity="0.45"/>
  <rect x="280" y="86" width="400" height="548" rx="46" fill="url(#fridge)" stroke="#cfe4da" stroke-width="5"/>
  <line x1="280" y1="300" x2="680" y2="300" stroke="#cfe4da" stroke-width="5"/>
  <rect x="606" y="150" width="16" height="86" rx="8" fill="#bfe0d2"/>
  <rect x="606" y="352" width="16" height="86" rx="8" fill="#bfe0d2"/>
  <text x="378" y="244" font-size="96" text-anchor="middle">🥦</text>
  <text x="492" y="248" font-size="96" text-anchor="middle">🍅</text>
  <text x="600" y="240" font-size="76" text-anchor="middle">🥛</text>
  <text x="372" y="472" font-size="96" text-anchor="middle">🥚</text>
  <text x="484" y="476" font-size="96" text-anchor="middle">🥕</text>
  <text x="592" y="470" font-size="92" text-anchor="middle">🍄</text>
</svg>
`

export const SAMPLE_PHOTO_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG.trim())}`
