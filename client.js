/**
 * Full-window wallpaper for the Harness Web GUI.
 *
 * Paints one fixed background layer behind everything (sidebar, conversation,
 * and the in-frame title bar), makes the base surfaces translucent through a
 * theme-token override layer, and contributes a Settings > General row for
 * choosing an image and tuning the scrim. The chosen image is kept in the
 * browser's local storage; no image leaves this machine.
 */
window.__ModuleLoader__.load({
  id: 'dsh-window-wallpaper',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const PLUGIN_ID = 'dsh-window-wallpaper'
    const LOCALE_NS = 'plugin.wallpaper'
    const STORAGE_KEY = 'dsh-wallpaper.v1'
    const STORAGE_VERSION = 2
    const DEFAULT_DIM = 30
    const DEFAULT_SURFACE = 28
    const DEFAULT_BLUR = 8
    const MIN_SURFACE = 10
    const MAX_SURFACE = 80
    const MAX_BLUR = 30
    const MAX_DATA_LENGTH = 2_000_000
    const MAX_IMAGE_EDGE = 2560

    const zh = {
      'wallpaper.title': '背景图片',
      'wallpaper.description': '为整个窗口设置背景图片，覆盖侧栏、会话与标题栏；面板浓度越低，背景越明显。',
      'wallpaper.choose': '选择图片',
      'wallpaper.reset': '恢复默认',
      'wallpaper.dim': '背景遮罩',
      'wallpaper.surface': '面板浓度',
      'wallpaper.blur': '背景模糊',
      'wallpaper.hint': '支持 JPG、PNG、WebP；图片只保存在本机浏览器，过大时会自动压缩。',
      'wallpaper.current': '当前图片：',
      'wallpaper.default': '默认渐变',
      'wallpaper.loading': '正在处理图片…',
      'wallpaper.error.read': '无法读取这张图片，请换一张试试。',
      'wallpaper.error.type': '请选择图片文件（JPG、PNG 或 WebP）。',
      'wallpaper.error.tooLarge': '图片太大，压缩后仍无法保存，请换一张更小的图片。',
      'wallpaper.error.storage': '图片已生效，但浏览器存储不可用，重启后可能丢失。',
    }

    const en = {
      'wallpaper.title': 'Background image',
      'wallpaper.description': 'Sets a background image across the whole window, including the sidebar, conversation, and title bar. Lower panel opacity shows more of it.',
      'wallpaper.choose': 'Choose image',
      'wallpaper.reset': 'Use default',
      'wallpaper.dim': 'Scrim',
      'wallpaper.surface': 'Panel opacity',
      'wallpaper.blur': 'Background blur',
      'wallpaper.hint': 'JPG, PNG, or WebP. The image stays in this browser; large files are compressed automatically.',
      'wallpaper.current': 'Current image: ',
      'wallpaper.default': 'Default gradient',
      'wallpaper.loading': 'Processing image…',
      'wallpaper.error.read': 'Could not read that image. Try another file.',
      'wallpaper.error.type': 'Choose an image file (JPG, PNG, or WebP).',
      'wallpaper.error.tooLarge': 'That image is too large to save even after compression. Try a smaller file.',
      'wallpaper.error.storage': 'The image is applied, but browser storage is unavailable, so it may not survive a restart.',
    }

    // A calm aurora gradient for the dark palette, and a soft daylight version
    // for the light palette; both keep the shell text legible.
    const DEFAULT_SVG_DARK = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">',
      '<defs>',
      '<linearGradient id="dshwp-base" x1="0" y1="0" x2="1" y2="1">',
      '<stop offset="0" stop-color="#0b1026"/>',
      '<stop offset="0.38" stop-color="#18264b"/>',
      '<stop offset="0.68" stop-color="#322a60"/>',
      '<stop offset="1" stop-color="#0d2b3e"/>',
      '</linearGradient>',
      '<radialGradient id="dshwp-blue" cx="0.72" cy="0.26" r="0.62">',
      '<stop offset="0" stop-color="#3f8cff" stop-opacity="0.5"/>',
      '<stop offset="1" stop-color="#3f8cff" stop-opacity="0"/>',
      '</radialGradient>',
      '<radialGradient id="dshwp-violet" cx="0.2" cy="0.78" r="0.58">',
      '<stop offset="0" stop-color="#b06cff" stop-opacity="0.32"/>',
      '<stop offset="1" stop-color="#b06cff" stop-opacity="0"/>',
      '</radialGradient>',
      '<radialGradient id="dshwp-teal" cx="0.52" cy="1.02" r="0.7">',
      '<stop offset="0" stop-color="#10b9a0" stop-opacity="0.2"/>',
      '<stop offset="1" stop-color="#10b9a0" stop-opacity="0"/>',
      '</radialGradient>',
      '</defs>',
      '<rect width="1920" height="1080" fill="url(#dshwp-base)"/>',
      '<rect width="1920" height="1080" fill="url(#dshwp-blue)"/>',
      '<rect width="1920" height="1080" fill="url(#dshwp-violet)"/>',
      '<rect width="1920" height="1080" fill="url(#dshwp-teal)"/>',
      '</svg>',
    ].join('')

    const DEFAULT_SVG_LIGHT = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">',
      '<defs>',
      '<linearGradient id="dshwp-light-base" x1="0" y1="0" x2="1" y2="1">',
      '<stop offset="0" stop-color="#f1f6fd"/>',
      '<stop offset="0.42" stop-color="#dceaf9"/>',
      '<stop offset="0.74" stop-color="#e8e2f8"/>',
      '<stop offset="1" stop-color="#d8eef2"/>',
      '</linearGradient>',
      '<radialGradient id="dshwp-light-blue" cx="0.76" cy="0.2" r="0.62">',
      '<stop offset="0" stop-color="#8cc0ff" stop-opacity="0.42"/>',
      '<stop offset="1" stop-color="#8cc0ff" stop-opacity="0"/>',
      '</radialGradient>',
      '<radialGradient id="dshwp-light-peach" cx="0.18" cy="0.78" r="0.56">',
      '<stop offset="0" stop-color="#ffc7a3" stop-opacity="0.36"/>',
      '<stop offset="1" stop-color="#ffc7a3" stop-opacity="0"/>',
      '</radialGradient>',
      '<radialGradient id="dshwp-light-violet" cx="0.56" cy="1.04" r="0.72">',
      '<stop offset="0" stop-color="#bda8ff" stop-opacity="0.3"/>',
      '<stop offset="1" stop-color="#bda8ff" stop-opacity="0"/>',
      '</radialGradient>',
      '</defs>',
      '<rect width="1920" height="1080" fill="url(#dshwp-light-base)"/>',
      '<rect width="1920" height="1080" fill="url(#dshwp-light-blue)"/>',
      '<rect width="1920" height="1080" fill="url(#dshwp-light-peach)"/>',
      '<rect width="1920" height="1080" fill="url(#dshwp-light-violet)"/>',
      '</svg>',
    ].join('')

    function svgUrl(svg) {
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
    }

    const DEFAULT_IMAGE_DARK = svgUrl(DEFAULT_SVG_DARK)
    const DEFAULT_IMAGE_LIGHT = svgUrl(DEFAULT_SVG_LIGHT)

    const WALLPAPER_CSS = `
html, body { background-color: transparent !important; }
#root { background: transparent !important; }

body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background-color: #0b1026;
  background-image: var(--dsh-wallpaper-image);
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;
  filter: blur(var(--dsh-wallpaper-blur, ${DEFAULT_BLUR}px));
  transform: scale(1.04);
}

body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: rgb(8 10 18 / var(--dsh-wallpaper-dim, ${DEFAULT_DIM / 100}));
}

.dshwp-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
}

.dshwp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.dshwp-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dshwp-title {
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: var(--dsw-alias-label-primary);
}

.dshwp-desc {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
}

.dshwp-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dshwp-btn {
  box-sizing: border-box;
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-module-platform);
  font: inherit;
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
  white-space: nowrap;
}

@media (hover: hover) {
  .dshwp-btn:hover:not(:disabled) {
    background: var(--dsw-alias-interactive-bg-hover);
  }
}

.dshwp-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.dshwp-btn-ghost {
  background: transparent;
  color: var(--dsw-alias-label-secondary);
}

.dshwp-main {
  display: flex;
  align-items: stretch;
  gap: 14px;
  flex-wrap: wrap;
}

.dshwp-preview {
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  flex: 0 0 148px;
  min-height: 83px;
  border: 0.5px solid var(--dsw-alias-border-l3);
  border-radius: var(--dsw-radius-md);
  background-color: #0b1026;
}

.dshwp-preview-image {
  position: absolute;
  inset: -6%;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;
}

.dshwp-preview-layer {
  position: absolute;
  inset: 0;
}

.dshwp-controls {
  flex: 1 1 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  min-width: 180px;
}

.dshwp-slider {
  display: grid;
  grid-template-columns: 76px minmax(80px, 1fr) 40px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
}

.dshwp-range {
  width: 100%;
  height: 20px;
  margin: 0;
  accent-color: var(--dsw-alias-state-business-primary);
  cursor: pointer;
}

.dshwp-value {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-secondary);
}

.dshwp-hint,
.dshwp-error {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
  overflow-wrap: anywhere;
}

.dshwp-error {
  color: var(--dsw-alias-state-error-primary);
}
`

    // The Windows frame and each column paint their surface once, so keep the
    // per-paint alpha low: two stacked 22% layers still show the wallpaper.
    // Light mode adds a little white so dark labels keep their contrast.
    const SURFACE_TOKENS = {
      '--dsw-alias-bg-base': {
        light: `color-mix(in srgb, var(--dsw-static-neutral-bluish-00) var(--dsh-wallpaper-surface-light, 67%), transparent)`,
        dark: `color-mix(in srgb, var(--dsw-static-neutral-bluish-950) var(--dsh-wallpaper-surface, ${DEFAULT_SURFACE}%), transparent)`,
      },
      '--dsw-specific-sidebar-fill': {
        light: `color-mix(in srgb, var(--dsw-static-neutral-bluish-50) var(--dsh-wallpaper-surface-light, 73%), transparent)`,
        dark: `color-mix(in srgb, var(--dsw-static-neutral-bluish-900) var(--dsh-wallpaper-sidebar, 53%), transparent)`,
      },
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value))
    }

    function normalize(raw) {
      const value = raw !== null && typeof raw === 'object' ? raw : {}
      const image = typeof value.image === 'string' && value.image.startsWith('data:image/')
        ? value.image
        : null
      const dim = Number.isFinite(value.dim) ? value.dim : DEFAULT_DIM
      const surface = Number.isFinite(value.surface) ? value.surface : DEFAULT_SURFACE
      return {
        image,
        name: image !== null && typeof value.name === 'string' ? value.name.slice(0, 200) : '',
        dim: clamp(Math.round(dim), 0, 80),
        surface: clamp(Math.round(surface), MIN_SURFACE, MAX_SURFACE),
        blur: clamp(Math.round(Number.isFinite(value.blur) ? value.blur : DEFAULT_BLUR), 0, MAX_BLUR),
        scheme: value.scheme === 'light' ? 'light' : 'dark',
        dimCustom: value.dimCustom === true,
        version: STORAGE_VERSION,
        storage: value.storage === 'failed' ? 'failed' : 'ok',
      }
    }

    function readStored() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        return raw === null ? null : JSON.parse(raw)
      } catch {
        return null
      }
    }

    const storedState = readStored()
    let state = normalize(storedState)
    if (storedState !== null && storedState.version !== STORAGE_VERSION) {
      // The first version shipped a very transparent panel default; bump it
      // once so an existing wallpaper stays readable, without touching images.
      state = { ...state, surface: Math.max(state.surface, DEFAULT_SURFACE) }
    }
    let saveTimer = null
    const listeners = new Set()

    function getState() {
      return state
    }

    function subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    }

    function emit() {
      for (const listener of [...listeners]) listener()
    }

    function imageCss() {
      if (state.image !== null) return `url("${state.image}")`
      return state.scheme === 'light' ? DEFAULT_IMAGE_LIGHT : DEFAULT_IMAGE_DARK
    }

    function applyVariables() {
      if (typeof document === 'undefined') return
      const root = document.documentElement
      root.style.setProperty('--dsh-wallpaper-image', imageCss())
      root.style.setProperty('--dsh-wallpaper-dim', String(state.dim / 100))
      root.style.setProperty('--dsh-wallpaper-surface', `${state.surface}%`)
      root.style.setProperty('--dsh-wallpaper-surface-light', `${Math.min(100, state.surface + 45)}%`)
      root.style.setProperty('--dsh-wallpaper-sidebar', `${Math.min(92, state.surface + 25)}%`)
      root.style.setProperty('--dsh-wallpaper-blur', `${state.blur}px`)
    }

    function clearVariables() {
      if (typeof document === 'undefined') return
      const root = document.documentElement
      root.style.removeProperty('--dsh-wallpaper-image')
      root.style.removeProperty('--dsh-wallpaper-dim')
      root.style.removeProperty('--dsh-wallpaper-surface')
      root.style.removeProperty('--dsh-wallpaper-surface-light')
      root.style.removeProperty('--dsh-wallpaper-sidebar')
      root.style.removeProperty('--dsh-wallpaper-blur')
    }

    function saveNow() {
      saveTimer = null
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        if (state.storage !== 'ok') {
          state = { ...state, storage: 'ok' }
          emit()
        }
      } catch {
        if (state.storage !== 'failed') {
          state = { ...state, storage: 'failed' }
          emit()
        }
      }
    }

    function update(patch, immediate) {
      state = normalize({ ...state, ...patch })
      applyVariables()
      emit()
      if (immediate === true) {
        if (saveTimer !== null) {
          clearTimeout(saveTimer)
          saveTimer = null
        }
        saveNow()
      } else if (saveTimer !== null) {
        clearTimeout(saveTimer)
        saveTimer = setTimeout(saveNow, 300)
      } else {
        saveTimer = setTimeout(saveNow, 300)
      }
    }

    function readAsDataUrl(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error ?? new Error('read failed'))
        reader.readAsDataURL(blob)
      })
    }

    function canvasToBlob(canvas, quality) {
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob === null) reject(new Error('encode failed'))
          else resolve(blob)
        }, 'image/jpeg', quality)
      })
    }

    async function decodeImage(file) {
      if (typeof createImageBitmap === 'function') return await createImageBitmap(file)
      const url = URL.createObjectURL(file)
      try {
        return await new Promise((resolve, reject) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.onerror = () => reject(new Error('decode failed'))
          image.src = url
        })
      } finally {
        URL.revokeObjectURL(url)
      }
    }

    function measureLuminance(source) {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 32
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (context === null) return 0.35
        context.drawImage(source, 0, 0, 32, 32)
        const pixels = context.getImageData(0, 0, 32, 32).data
        let sum = 0
        for (let index = 0; index < pixels.length; index += 4) {
          sum += (0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2]) / 255
        }
        return sum / (pixels.length / 4)
      } catch {
        return 0.35
      }
    }

    async function compressSource(source) {
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(source.width, source.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(source.width * scale))
      canvas.height = Math.max(1, Math.round(source.height * scale))
      const context = canvas.getContext('2d')
      if (context === null) return null
      context.fillStyle = '#0b1026'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(source, 0, 0, canvas.width, canvas.height)
      let quality = 0.86
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const blob = await canvasToBlob(canvas, quality)
        const encoded = await readAsDataUrl(blob)
        if (encoded.length <= MAX_DATA_LENGTH) return encoded
        quality -= 0.12
      }
      return null
    }

    async function analyzeImage(file) {
      const direct = await readAsDataUrl(file)
      const source = await decodeImage(file)
      try {
        const luminance = measureLuminance(source)
        let dataUrl = direct
        if (dataUrl.length > MAX_DATA_LENGTH) {
          const compressed = await compressSource(source)
          if (compressed === null) {
            const error = new Error('image too large to store')
            error.code = 'too-large'
            throw error
          }
          dataUrl = compressed
        }
        return { dataUrl, luminance }
      } finally {
        if (typeof source.close === 'function') source.close()
      }
    }

    function useWallpaper() {
      return React.useSyncExternalStore(subscribe, getState, getState)
    }

    function WallpaperRow({ t }) {
      const tr = typeof t === 'function' ? t : (key) => key
      const store = useWallpaper()
      const inputRef = React.useRef(null)
      const dimLabelId = `${React.useId()}-dim`
      const surfaceLabelId = `${React.useId()}-surface`
      const blurLabelId = `${React.useId()}-blur`
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState('')

      const onFile = (event) => {
        const file = event.target.files !== null && event.target.files.length > 0
          ? event.target.files[0]
          : null
        event.target.value = ''
        if (file === null) return
        if (!file.type.startsWith('image/')) {
          setError(tr('wallpaper.error.type'))
          return
        }
        setError('')
        setBusy(true)
        analyzeImage(file).then(({ dataUrl, luminance }) => {
          // A bright photo needs a stronger default scrim; once the user moves
          // the slider, their value stays authoritative for later images.
          const suggested = clamp(Math.round(5 + luminance * 62), 15, 70)
          const dim = state.dimCustom ? state.dim : suggested
          update({ image: dataUrl, name: file.name, dim, storage: 'ok' }, true)
        }, (failure) => {
          setError(failure !== null && failure !== undefined && failure.code === 'too-large'
            ? tr('wallpaper.error.tooLarge')
            : tr('wallpaper.error.read'))
        }).finally(() => { setBusy(false) })
      }

      const panelAlpha = 1 - Math.pow(1 - (store.scheme === 'dark'
        ? store.surface / 100
        : (store.surface + 45) / 100), 2)
      const panelColor = store.scheme === 'dark' ? '21 21 23' : '255 255 255'
      const atDefaults = store.image === null && !store.dimCustom
        && store.dim === DEFAULT_DIM && store.surface === DEFAULT_SURFACE && store.blur === DEFAULT_BLUR

      return h('div', { className: 'dshwp-group' },
        h('div', { className: 'dshwp-head' },
          h('div', { className: 'dshwp-copy' },
            h('div', { className: 'dshwp-title' }, tr('wallpaper.title')),
            h('div', { className: 'dshwp-desc' }, tr('wallpaper.description')),
          ),
          h('div', { className: 'dshwp-actions' },
            h('button', {
              type: 'button',
              className: 'dshwp-btn',
              disabled: busy,
              'aria-busy': busy,
              onClick: () => { if (inputRef.current !== null) inputRef.current.click() },
            }, busy ? tr('wallpaper.loading') : tr('wallpaper.choose')),
            h('button', {
              type: 'button',
              className: 'dshwp-btn dshwp-btn-ghost',
              disabled: atDefaults,
              onClick: () => {
                setError('')
                update({ image: null, name: '', dim: DEFAULT_DIM, surface: DEFAULT_SURFACE, blur: DEFAULT_BLUR, dimCustom: false, storage: 'ok' }, true)
              },
            }, tr('wallpaper.reset')),
          ),
        ),
        h('input', {
          ref: inputRef,
          type: 'file',
          accept: 'image/jpeg,image/png,image/webp,image/gif,image/avif',
          hidden: true,
          'aria-label': tr('wallpaper.choose'),
          onChange: onFile,
        }),
        h('div', { className: 'dshwp-main' },
          h('div', {
            className: 'dshwp-preview',
            role: 'img',
            'aria-label': store.image === null ? tr('wallpaper.default') : store.name,
          },
            h('div', {
              className: 'dshwp-preview-image',
              style: { backgroundImage: imageCss(), filter: `blur(${store.blur / 2}px)` },
            }),
            h('div', {
              className: 'dshwp-preview-layer',
              style: { background: `rgb(8 10 18 / ${store.dim / 100})` },
            }),
            h('div', {
              className: 'dshwp-preview-layer',
              style: { background: `rgb(${panelColor} / ${panelAlpha})` },
            }),
          ),
          h('div', { className: 'dshwp-controls' },
            h('div', { className: 'dshwp-slider' },
              h('span', { id: dimLabelId }, tr('wallpaper.dim')),
              h('input', {
                className: 'dshwp-range',
                type: 'range',
                min: 0,
                max: 80,
                step: 5,
                value: store.dim,
                'aria-labelledby': dimLabelId,
                'aria-valuetext': `${store.dim}%`,
                onChange: (event) => { update({ dim: Number(event.target.value), dimCustom: true }) },
              }),
              h('span', { className: 'dshwp-value', 'aria-hidden': true }, `${store.dim}%`),
            ),
            h('div', { className: 'dshwp-slider' },
              h('span', { id: surfaceLabelId }, tr('wallpaper.surface')),
              h('input', {
                className: 'dshwp-range',
                type: 'range',
                min: MIN_SURFACE,
                max: MAX_SURFACE,
                step: 1,
                value: store.surface,
                'aria-labelledby': surfaceLabelId,
                'aria-valuetext': `${store.surface}%`,
                onChange: (event) => { update({ surface: Number(event.target.value) }) },
              }),
              h('span', { className: 'dshwp-value', 'aria-hidden': true }, `${store.surface}%`),
            ),
            h('div', { className: 'dshwp-slider' },
              h('span', { id: blurLabelId }, tr('wallpaper.blur')),
              h('input', {
                className: 'dshwp-range',
                type: 'range',
                min: 0,
                max: MAX_BLUR,
                step: 1,
                value: store.blur,
                'aria-labelledby': blurLabelId,
                'aria-valuetext': `${store.blur}px`,
                onChange: (event) => { update({ blur: Number(event.target.value) }) },
              }),
              h('span', { className: 'dshwp-value', 'aria-hidden': true }, `${store.blur}px`),
            ),
          ),
        ),
        h('div', { className: 'dshwp-hint', role: 'status', 'aria-live': 'polite' },
          store.image === null
            ? tr('wallpaper.hint')
            : `${tr('wallpaper.current')}${store.name}`,
        ),
        error === ''
          ? null
          : h('div', { className: 'dshwp-error', role: 'alert' }, error),
        store.storage === 'failed'
          ? h('div', { className: 'dshwp-error', role: 'alert' }, tr('wallpaper.error.storage'))
          : null,
      )
    }

    return {
      inject: ['slots', 'locale', 'theme'],
      apply(ctx) {
        const initialScheme = ctx.theme.getTheme().active.colorScheme
        if (initialScheme !== state.scheme) state = { ...state, scheme: initialScheme }

        ctx.on('theme/change', (snapshot) => {
          const scheme = snapshot.active.colorScheme
          if (scheme === state.scheme) return
          state = { ...state, scheme }
          applyVariables()
          emit()
        })

        ctx.effect(() => {
          const tag = document.createElement('style')
          tag.dataset.plugin = PLUGIN_ID
          tag.dataset.pluginCss = `${PLUGIN_ID}/wallpaper.css`
          tag.textContent = WALLPAPER_CSS
          document.head.appendChild(tag)
          return () => { tag.remove() }
        }, 'wallpaper: global styles')

        ctx.effect(() => {
          applyVariables()
          return () => { clearVariables() }
        }, 'wallpaper: wallpaper variables')

        ctx.effect(() => ctx.theme.overrideTokens(PLUGIN_ID, SURFACE_TOKENS), 'wallpaper: translucent surfaces')

        ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }), 'wallpaper: dictionaries')

        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
          name: 'settings.general.item',
          id: 'wallpaper',
          order: 12,
          locale: LOCALE_NS,
        }, WallpaperRow))
      },
    }
  },
})
