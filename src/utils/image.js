/**
 * 读取本地图片，并在需要时压缩到 maxEdge 以内。
 * 手机拍的原图动辄 5-10MB，先缩到 1280px 再上传/预览，可以明显减少流量和内存占用。
 * 返回 { previewUrl, file, width, height, bytes }：
 *  - previewUrl 是 dataURL，可直接当 <img> 地址做本地预览；
 *  - file 是可以直接塞进 FormData 上传的 File（已压缩，没有压缩时就是原文件）。
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

/** dataURL → Blob（用于把压缩后的图片包装成可上传的文件） */
function dataUrlToBlob(dataUrl) {
  const [meta, base64 = ''] = String(dataUrl).split(',')
  const mime = /data:([^;]+)/.exec(meta)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new Blob([bytes], { type: mime })
}

/** 包装成带文件名的 File（个别环境没有 File 构造函数时退化成 Blob） */
function toUploadFile(blob, originalName, extension) {
  const baseName = String(originalName || 'fridge-photo').replace(/\.[^./\\]+$/, '') || 'fridge-photo'
  const name = `${baseName}.${extension}`
  try {
    return new File([blob], name, { type: blob.type || 'image/jpeg' })
  } catch {
    return blob
  }
}

/**
 * 把 dataURL 转成可上传的 File。
 * 用于「示例照片」这类只有 dataURL、没有原始 File 的场景。
 */
export async function dataUrlToFile(dataUrl, baseName = 'image') {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const extension = (blob.type.split('/')[1] || 'png').split('+')[0].split(';')[0]
  return toUploadFile(blob, baseName, extension)
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
      return { previewUrl: original, file, width, height, bytes: file.size }
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const compressed = canvas.toDataURL('image/jpeg', quality)
    // 压缩后反而更大（比如原图本来就很小）就用原图，避免画质白损失
    if (compressed.length >= original.length) {
      return { previewUrl: original, file, width, height, bytes: file.size }
    }

    const uploadFile = toUploadFile(dataUrlToBlob(compressed), file.name, 'jpg')
    return {
      previewUrl: compressed,
      file: uploadFile,
      width: canvas.width,
      height: canvas.height,
      bytes: uploadFile.size ?? compressed.length,
    }
  } catch {
    // HEIC 等浏览器无法解码的格式：退回原图，交给后端处理
    return { previewUrl: original, file, width: 0, height: 0, bytes: file.size }
  }
}
