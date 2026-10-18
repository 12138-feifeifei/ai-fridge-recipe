import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import { AppShell, PageHeader, StickyFooter } from '../components/AppShell.jsx'
import { ScanOverlay } from '../components/ScanOverlay.jsx'
import { useToast } from '../components/Toast.jsx'
import { AlbumIcon, ArrowRightIcon, CameraIcon, CheckIcon, SparkleIcon, UploadIcon } from '../components/icons.jsx'
import { Button, Card, cx } from '../components/ui.jsx'

const RECOGNIZE_TIPS = ['光线充足、没有反光时识别更准', '食材平铺摆放，尽量不要互相遮挡', '识别结果可以手动增删改']

const FLOW_STEPS = [
  { emoji: '📷', title: '拍照上传', desc: '冰箱内的食材' },
  { emoji: '🧾', title: '确认清单', desc: '勾选与增删改' },
  { emoji: '🍳', title: '生成食谱', desc: '含步骤与热量' },
]

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024) return '不到 1 KB'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function HomePage() {
  const {
    previewUrl,
    imageName,
    imageBytes,
    isSampleImage,
    status,
    progress,
    progressText,
    selectImage,
    selectSampleImage,
    clearImage,
    startRecognition,
    dataSource,
  } = useApp()
  const navigate = useNavigate()
  const showToast = useToast()
  const cameraInputRef = useRef(null)
  const albumInputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [reading, setReading] = useState(false)

  const handleFiles = async (fileList) => {
    const file = fileList?.[0]
    if (!file) return
    setReading(true)
    try {
      await selectImage(file)
      showToast('照片已就绪，点击「开始识别」')
    } catch (error) {
      showToast(error?.message || '图片读取失败，请换一张试试')
    } finally {
      setReading(false)
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      if (albumInputRef.current) albumInputRef.current.value = ''
    }
  }

  const handleStart = async () => {
    if (!previewUrl) {
      showToast('请先拍照或从相册选择一张照片')
      return
    }
    const result = await startRecognition()
    if (result.ok) {
      navigate('/ingredients')
      return
    }
    if (result.reason === 'STALE') return
    // error.message 已经由请求层归一化成友好文案（401 / 500 / 超时 / 断网…）
    showToast(result.error?.message || '识别失败，请重试', { duration: 3600 })
  }

  let dropzoneStateClass = 'border-slate-300/90 bg-white/60 hover:border-brand-400 hover:bg-brand-50/40'
  if (dragging) dropzoneStateClass = 'border-brand-400 bg-brand-50/70'

  const sizeLabel = isSampleImage ? '' : formatBytes(imageBytes)

  return (
    <AppShell
      footer={
        <StickyFooter>
          <Button size="lg" className="w-full" onClick={handleStart} disabled={!previewUrl || reading}>
            <SparkleIcon className="h-5 w-5" />
            {previewUrl ? '开始识别' : '先选择一张照片'}
          </Button>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            {dataSource === 'mock'
              ? '照片仅用于识别食材，当前为 Mock 数据，不会真实上传'
              : '照片仅用于识别食材与生成食谱，仅发送给我们自己的识别服务'}
          </p>
        </StickyFooter>
      }
    >
      <PageHeader
        brand
        title="冰箱食光"
        subtitle="拍一张冰箱照片，帮你决定今晚吃什么"
      />

      <main className="flex-1 space-y-5 px-5 pb-8 pt-5">
        <section className="animate-rise">
          <h2 className="text-2xl font-bold leading-snug text-slate-800">
            冰箱里有什么，
            <br />
            <span className="text-brand-600">拍一张就知道</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            上传或拍摄冰箱内部照片，AI 会识别出食材清单，并按你勾选的食材生成带步骤和热量的食谱。
          </p>
        </section>

        <Card className="p-4">
          {/* 本地缩略图预览：选完照片立刻能看到，还能看到文件名和体积 */}
          {previewUrl ? (
            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-2.5">
              <img
                src={previewUrl}
                alt="已选照片的本地缩略图"
                className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-card"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-slate-700">
                  {isSampleImage ? '示例冰箱照片' : imageName || '冰箱照片'}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-0.5 font-medium text-brand-600">
                    <CheckIcon className="h-3.5 w-3.5" />
                    本地预览已就绪
                  </span>
                  {sizeLabel ? <span>· {sizeLabel}</span> : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => albumInputRef.current?.click()}
                disabled={reading}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-card transition hover:text-brand-600 active:scale-95 disabled:opacity-50"
              >
                更换
              </button>
            </div>
          ) : null}

          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              handleFiles(event.dataTransfer?.files)
            }}
            className={cx(
              'relative overflow-hidden rounded-3xl border-2 border-dashed transition duration-200',
              previewUrl ? 'border-transparent' : dropzoneStateClass,
            )}
          >
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="待识别的照片" className="h-56 w-full rounded-3xl object-cover" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 rounded-b-3xl bg-linear-to-t from-slate-900/70 to-transparent" />
                <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-medium text-slate-600 backdrop-blur-sm">
                    {isSampleImage ? '示例照片 · ' : ''}
                    {imageName || '冰箱照片'}
                  </span>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-rose-500 backdrop-blur-sm transition hover:bg-white active:scale-95"
                  >
                    删除
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-3xl bg-linear-to-br from-brand-100 to-sky-100 text-brand-600">
                  <UploadIcon className="h-7 w-7" />
                </span>
                <p className="mt-4 text-[15px] font-semibold text-slate-700">上传冰箱照片</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  支持 JPG / PNG / HEIC，桌面端也可以直接把图片拖进来
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="secondary" size="lg" onClick={() => cameraInputRef.current?.click()} disabled={reading}>
              <CameraIcon className="h-5 w-5" />
              拍照
            </Button>
            <Button variant="secondary" size="lg" onClick={() => albumInputRef.current?.click()} disabled={reading}>
              <AlbumIcon className="h-5 w-5" />
              从相册选择
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                selectSampleImage()
                showToast('已载入示例照片，可以直接开始识别')
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition hover:text-brand-700"
            >
              没有照片？用示例照片试试
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 拍照：优先调起后置摄像头 */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
          <input
            ref={albumInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </Card>

        <section className="animate-rise" style={{ animationDelay: '80ms' }}>
          <div className="grid grid-cols-3 gap-2">
            {FLOW_STEPS.map((item, index) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-900/5 bg-white/80 px-3 py-3 text-center shadow-card"
              >
                <span className="text-xl" aria-hidden="true">
                  {item.emoji}
                </span>
                <p className="mt-1.5 text-xs font-bold text-slate-700">
                  {index + 1}. {item.title}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <Card className="animate-rise bg-cream-50/90 p-4" style={{ animationDelay: '140ms' }}>
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700">
            <span aria-hidden="true">💡</span> 拍摄小贴士
          </p>
          <ul className="mt-2 space-y-1.5">
            {RECOGNIZE_TIPS.map((tip) => (
              <li key={tip} className="flex gap-2 text-xs leading-relaxed text-slate-500">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                {tip}
              </li>
            ))}
          </ul>
        </Card>
      </main>

      <ScanOverlay
        open={status === 'recognizing'}
        imageUrl={previewUrl}
        progress={progress}
        text={progressText}
        title="AI 正在努力识别你的冰箱"
        caption="一边扫描照片，一边清点食材"
        tips={RECOGNIZE_TIPS}
        funEmojis={['🧊', '🥬', '🍅', '🥚', '🥕']}
      />
    </AppShell>
  )
}
