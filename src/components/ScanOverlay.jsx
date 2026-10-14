/**
 * 全屏加载层：识别 / 生成食谱共用。
 * 图片上叠加雷达扫描线 + 进度条 + 动态状态文案。
 */
export function ScanOverlay({
  open,
  imageUrl,
  progress = 0,
  text = '',
  title = '正在识别食材',
  caption = 'AI 正在分析这张照片',
  tips = [],
  funEmojis = ['🧊', '🥬', '🍅', '🥚', '🍗'],
}) {
  if (!open) return null

  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5" role="dialog" aria-live="polite" aria-busy="true">
      <div className="animate-fade absolute inset-0 bg-slate-950/55 backdrop-blur-md" aria-hidden="true" />

      <div className="animate-pop relative w-full max-w-[380px] rounded-[28px] bg-white p-4 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.8)]">
        <div className="relative overflow-hidden rounded-3xl bg-slate-100">
          {imageUrl ? (
            <img src={imageUrl} alt={caption} className="h-52 w-full object-cover" />
          ) : (
            <div className="grid h-52 w-full place-items-center bg-linear-to-br from-brand-50 to-sky-50">
              <span className="animate-breathe text-6xl" aria-hidden="true">
                🧊
              </span>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-brand-400/10 via-transparent to-slate-900/25" />
          <div className="pointer-events-none absolute inset-x-0 h-12 animate-scanline bg-linear-to-b from-transparent via-brand-400/55 to-transparent" />
          <div className="pointer-events-none absolute inset-3 rounded-2xl border border-white/55" />

          <span className="pointer-events-none absolute left-3 top-3 h-5 w-5 rounded-tl-lg border-l-2 border-t-2 border-white/90" />
          <span className="pointer-events-none absolute right-3 top-3 h-5 w-5 rounded-tr-lg border-r-2 border-t-2 border-white/90" />
          <span className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 rounded-bl-lg border-b-2 border-l-2 border-white/90" />
          <span className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 rounded-br-lg border-b-2 border-r-2 border-white/90" />

          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/55 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {caption}
          </span>
        </div>

        <div className="mt-4 px-1">
          <div className="flex items-center gap-2">
            <span
              className="animate-breathe grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-sm"
              aria-hidden="true"
            >
              👨‍🍳
            </span>
            <p className="text-base font-bold text-slate-800">{title}</p>
            <span className="ml-auto text-sm font-semibold text-brand-600">{safeProgress}%</span>
          </div>

          <p className="mt-2 flex h-5 items-center text-sm font-medium text-slate-500">
            {text || '处理中…'}
            <span className="ml-0.5 inline-flex" aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <span key={index} className="animate-hop" style={{ animationDelay: `${index * 160}ms` }}>
                  .
                </span>
              ))}
            </span>
          </p>

          {/* 一排「排队进锅」的小食材，等待时看起来更有趣 */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {funEmojis.map((emoji, index) => (
              <span
                key={`${emoji}-${index}`}
                className="animate-hop text-lg"
                style={{ animationDelay: `${index * 150}ms` }}
                aria-hidden="true"
              >
                {emoji}
              </span>
            ))}
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-linear-to-r from-brand-400 to-brand-600 transition-[width] duration-200 ease-out"
              style={{ width: `${safeProgress}%` }}
            />
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className="animate-breathe h-1.5 w-1.5 rounded-full bg-brand-400"
                style={{ animationDelay: `${index * 180}ms` }}
              />
            ))}
            <span className="text-[11px] text-slate-400">请稍等几秒，不要关闭页面</span>
          </div>
        </div>

        {tips.length ? (
          <ul className="mt-4 space-y-1.5 rounded-2xl bg-brand-50/80 p-3 text-[11px] leading-relaxed text-brand-800">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-1.5">
                <span aria-hidden="true">·</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
