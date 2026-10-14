/**
 * 读取本地图片，并在需要时压缩到 maxEdge 以内。
 * 手机拍的原图动辄 5-10MB，先缩到 1280px 再上传/预览，可以明显减少流量和内存占用。
 * 返回 { previewUrl, width, height, bytes }，previewUrl 是 dataURL，可直接当图片地址用。
 */

export const MAX_EDGE = 1280

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片解析失败'))
    image.src = src
  })
}

export async function prepareImage(file, { maxEdge = MAX_EDGE, quality = 0.82 } = {}) {
  if (!file) throw new Error('没有拿到图片文件')
  if (file.type && !file.type.startsWith('image/')) throw new Error('请选择图片文件')

  const original = await readAsDataURL(file)

  try {
    const image = await loadImage(original)
    const { width, height } = image
    const scale = Math.min(1, maxEdge / Math.max(width, height))
    const smallEnough = file.size < 1.2 * 1024 * 1024

    // 尺寸不大、文件也不大时直接用原图，避免二次压缩损失画质
    if (scale === 1 && smallEnough) {
      return { previewUrl: original, width, height, bytes: file.size }
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const compressed = canvas.toDataURL('image/jpeg', quality)
    const previewUrl = compressed.length < original.length ? compressed : original
    return { previewUrl, width: canvas.width, height: canvas.height, bytes: previewUrl.length }
  } catch {
    // HEIC 等浏览器无法解码的格式：退回原图，交给后端处理
    return { previewUrl: original, width: 0, height: 0, bytes: file.size }
  }
}
