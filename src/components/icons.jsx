// 轻量内联 SVG 图标（避免引入图标库依赖，风格统一为 1.8 描边）

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ className = 'h-5 w-5', children, ...rest }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" {...strokeProps} {...rest}>
      {children}
    </svg>
  )
}

export function CameraIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="6.5" width="18" height="13" rx="3.2" />
      <circle cx="12" cy="13" r="3.4" />
      <path d="M9 6.5l1.1-1.9h3.8L15 6.5" />
    </Svg>
  )
}

export function AlbumIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="3.2" />
      <circle cx="8.6" cy="9.8" r="1.5" />
      <path d="M4 17.2l4.3-4.1a2 2 0 0 1 2.8 0l3.6 3.5" />
      <path d="M13.6 14.2l1.3-1.2a2 2 0 0 1 2.8 0L20 15.2" />
    </Svg>
  )
}

export function SparkleIcon(props) {
  return (
    <Svg {...props}>
      <path d="M11 3.5l1.6 4.4L17 9.5l-4.4 1.6L11 15.5 9.4 11.1 5 9.5l4.4-1.6z" />
      <path d="M18.4 14.6l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </Svg>
  )
}

export function ChevronLeftIcon(props) {
  return (
    <Svg {...props}>
      <path d="M15 4.8L8.2 12l6.8 7.2" />
    </Svg>
  )
}

export function ChevronDownIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5.5 9l6.5 6.4L18.5 9" />
    </Svg>
  )
}

export function ArrowRightIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4.5 12h14" />
      <path d="M12.8 6.2l5.7 5.8-5.7 5.8" />
    </Svg>
  )
}

export function PlusIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 5.2v13.6M5.2 12h13.6" />
    </Svg>
  )
}

export function CheckIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 12.8l4.2 4.2L19 6.6" />
    </Svg>
  )
}

export function CloseIcon(props) {
  return (
    <Svg {...props}>
      <path d="M6.2 6.2l11.6 11.6M17.8 6.2L6.2 17.8" />
    </Svg>
  )
}

export function TrashIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.6A1.6 1.6 0 0 1 11.1 4h1.8a1.6 1.6 0 0 1 1.6 1.6V7" />
      <path d="M6.6 7l.8 11.2A2 2 0 0 0 9.4 20h5.2a2 2 0 0 0 2-1.8L17.4 7" />
      <path d="M10.4 10.8v5.4M13.6 10.8v5.4" />
    </Svg>
  )
}

export function EditIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 20h4.2L19 9.2a2.9 2.9 0 0 0-4.1-4.1L4 16z" />
      <path d="M13.6 6.4l4 4" />
    </Svg>
  )
}

export function ClockIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.6V12l3 1.9" />
    </Svg>
  )
}

export function FlameIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 3.2s4.6 3.9 4.6 8.3a4.6 4.6 0 0 1-9.2 0c0-1.6 1.3-2.8 1.3-2.8s.4 1.5 1.6 1.5c1.3 0 1.7-3.4 1.7-7z" />
      <path d="M10.2 13.6a1.9 1.9 0 0 0 2.4 2.8" />
    </Svg>
  )
}

export function FridgeIcon(props) {
  return (
    <Svg {...props}>
      <rect x="6" y="2.8" width="12" height="18.4" rx="3.2" />
      <path d="M6.2 10.4h11.6" />
      <path d="M9.6 6.2v1.8M9.6 13v2.4" />
    </Svg>
  )
}

export function RefreshIcon(props) {
  return (
    <Svg {...props}>
      <path d="M20.2 12a8.2 8.2 0 1 1-2.4-5.8" />
      <path d="M20.4 3.8v4.6h-4.6" />
    </Svg>
  )
}

export function InfoIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11.2v5.4" />
      <path d="M12 7.9h.01" />
    </Svg>
  )
}

export function UploadIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 15.8V4.2" />
      <path d="M7.6 8.6L12 4.2l4.4 4.4" />
      <path d="M4.6 15v2.6A2.4 2.4 0 0 0 7 20h10a2.4 2.4 0 0 0 2.4-2.4V15" />
    </Svg>
  )
}

export function ListIcon(props) {
  return (
    <Svg {...props}>
      <path d="M9 6.4h11M9 12h11M9 17.6h11" />
      <path d="M4.2 6.4l1.2 1.2 2-2.2" />
      <path d="M4.2 12h1.4M4.2 17.6h1.4" />
    </Svg>
  )
}

export function SpinnerIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="2.4" opacity="0.18" />
      <path
        d="M20.6 12A8.6 8.6 0 0 0 12 3.4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
