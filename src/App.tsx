import { Boxes, Coins, Gauge, MousePointerClick, Sparkles, X } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { layoutYard, SAMPLE_STOCK, tons, totals, vnd } from './lib/yard'

// three.js nặng: tải sau khi giao diện chữ đã hiện
const Yard = lazy(() => import('./components/Yard'))

function initialReduced(): boolean {
  try {
    const saved = localStorage.getItem('reduced')
    if (saved === '1' || saved === '0') return saved === '1'
  } catch { /* localStorage có thể bị chặn */ }
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export default function App() {
  const piles = useMemo(() => layoutYard(SAMPLE_STOCK), [])
  const total = totals(piles)
  const [selected, setSelected] = useState<string | null>(null)
  const [reduced, setReduced] = useState(initialReduced)
  const current = piles.find((p) => p.code === selected) ?? null

  useEffect(() => {
    try { localStorage.setItem('reduced', reduced ? '1' : '0') } catch { /* bỏ qua */ }
  }, [reduced])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div className="absolute inset-0 isolate">
        <Suspense fallback={<div className="grid h-full place-items-center text-sm text-ink-500">Đang dựng bãi 3D…</div>}>
          <Yard piles={piles} selected={selected} onSelect={setSelected} reduced={reduced} />
        </Suspense>
      </div>

      {/* Thanh trên */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 p-4 sm:p-6">
        <div className="pointer-events-auto rounded-2xl border border-ink-700/70 bg-ink-900/80 px-4 py-3 backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Bãi phế liệu · 3D</div>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">Tồn kho trực quan</h1>
          <p className="mt-0.5 text-xs text-ink-300">
            Chiều cao đống theo lượng tồn · <span className="rounded bg-ink-800 px-1 py-0.5">dữ liệu mẫu</span>
          </p>
        </div>
        <button
          onClick={() => setReduced((r) => !r)}
          aria-pressed={reduced}
          className="pointer-events-auto flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900/80 px-3 py-2 text-sm text-ink-300 backdrop-blur transition hover:border-gold hover:text-gold"
        >
          {reduced ? <Gauge size={15} /> : <Sparkles size={15} />}
          {reduced ? 'Giảm hiệu ứng' : 'Hiệu ứng đầy đủ'}
        </button>
      </header>

      {/* Bảng danh sách: dùng được bằng bàn phím thay cho bấm vào cảnh 3D.
          Điện thoại: dải ngang ở đáy, ẩn khi đang mở thẻ chi tiết. */}
      <aside className={`absolute inset-x-3 bottom-3 rounded-2xl border border-ink-700/70 bg-ink-900/85 p-3 backdrop-blur sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-80 sm:p-4 ${current ? 'max-sm:hidden' : ''}`}>
        <div className="mb-2 grid grid-cols-2 gap-3 sm:mb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-ink-300"><Boxes size={13} className="text-gold" /> Tổng tồn</div>
            <div className="text-lg font-semibold">{tons(total.kg)} <span className="text-xs font-normal text-ink-300">tấn</span></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-ink-300"><Coins size={13} className="text-gold" /> Giá vốn</div>
            <div className="text-lg font-semibold">{vnd(total.value / 1e6)} <span className="text-xs font-normal text-ink-300">triệu đ</span></div>
          </div>
        </div>
        <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:max-h-[38vh] sm:flex-col sm:space-y-1 sm:gap-0 sm:overflow-x-visible sm:overflow-y-auto sm:px-0 sm:pb-0" aria-label="Các loại phế liệu trong bãi">
          {piles.map((p) => (
            <li key={p.code} className="shrink-0">
              <button
                onClick={() => setSelected(selected === p.code ? null : p.code)}
                aria-pressed={selected === p.code}
                className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-sm transition max-sm:border max-sm:border-ink-700 ${selected === p.code ? 'bg-gold/15 text-gold' : 'text-ink-300 hover:bg-ink-800'}`}
              >
                <span className="flex items-center gap-2">
                  <i className="size-2.5 rounded-sm" style={{ background: p.color }} />
                  {p.name}
                </span>
                <span className="tabular-nums">{tons(p.kg)} t</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 hidden items-center gap-1.5 text-[11px] text-ink-500 sm:flex"><MousePointerClick size={12} /> Kéo để xoay · cuộn để phóng to · bấm vào đống để xem</p>
      </aside>

      {/* Thẻ chi tiết */}
      {current && (
        <section
          role="dialog"
          aria-label={`Chi tiết ${current.name}`}
          className="absolute inset-x-3 bottom-3 rounded-2xl border border-gold/40 sm:inset-x-auto sm:w-[300px] bg-ink-900/90 p-4 backdrop-blur sm:bottom-6 sm:right-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-ink-500">{current.kind === 'heap' ? 'Đống ngoài trời' : 'Thùng chứa'}</div>
              <h2 className="text-lg font-semibold">{current.name}</h2>
            </div>
            <button onClick={() => setSelected(null)} aria-label="Đóng" className="rounded-lg p-1 text-ink-300 hover:text-gold"><X size={16} /></button>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-ink-300">Khối lượng</dt><dd className="text-right font-medium tabular-nums">{vnd(current.kg)} kg</dd>
            <dt className="text-ink-300">Giá vốn</dt><dd className="text-right tabular-nums">{vnd(current.pricePerKg)} đ/kg</dd>
            <dt className="text-ink-300">Giá trị</dt><dd className="text-right font-semibold text-gold tabular-nums">{vnd(current.value / 1e6)} triệu đ</dd>
            <dt className="text-ink-300">Tỉ trọng</dt><dd className="text-right tabular-nums">{((current.value / total.value) * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% giá trị bãi</dd>
          </dl>
        </section>
      )}
    </div>
  )
}
