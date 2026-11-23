// Dữ liệu và bố cục bãi: thuần hàm, không phụ thuộc Three.js, nên test được bằng Vitest.

export type PileKind = 'heap' | 'bin'

export interface Material {
  code: string
  name: string
  color: string
  kind: PileKind // sắt, inox… đổ thành đống; đồng, nhôm lon… để trong thùng
  pricePerKg: number // giá vốn mẫu, đồng/kg
}

export interface Stock {
  code: string
  kg: number
}

export interface Pile extends Material {
  kg: number
  /** mức đầy của thùng (0–1); đống ngoài trời luôn là 1 */
  fill: number
  value: number
  x: number
  z: number
  height: number
  radius: number
}

export const MATERIALS: Material[] = [
  { code: 'sat-vun', name: 'Sắt vụn', color: '#8b8f96', kind: 'heap', pricePerKg: 7_800 },
  { code: 'sat-dac', name: 'Sắt đặc', color: '#6d7179', kind: 'heap', pricePerKg: 9_200 },
  { code: 'inox-304', name: 'Inox 304', color: '#c9ced6', kind: 'heap', pricePerKg: 32_000 },
  { code: 'giay-carton', name: 'Giấy carton', color: '#b08d57', kind: 'heap', pricePerKg: 3_200 },
  { code: 'nhom-dac', name: 'Nhôm đặc', color: '#a9c6db', kind: 'bin', pricePerKg: 48_000 },
  { code: 'nhom-lon', name: 'Nhôm lon', color: '#d5e3ee', kind: 'bin', pricePerKg: 31_000 },
  { code: 'dong-cap', name: 'Đồng cáp', color: '#d9822b', kind: 'bin', pricePerKg: 178_000 },
  { code: 'dong-vang', name: 'Đồng vàng', color: '#d6b13a', kind: 'bin', pricePerKg: 112_000 },
]

/** Tồn kho mẫu cố định (kg). Không phải số liệu thật. */
export const SAMPLE_STOCK: Stock[] = [
  { code: 'sat-vun', kg: 61_400 },
  { code: 'sat-dac', kg: 38_900 },
  { code: 'inox-304', kg: 7_250 },
  { code: 'giay-carton', kg: 12_600 },
  { code: 'nhom-dac', kg: 4_180 },
  { code: 'nhom-lon', kg: 2_340 },
  { code: 'dong-cap', kg: 960 },
  { code: 'dong-vang', kg: 610 },
]

export const MAX_HEAP_HEIGHT = 6 // mét trong cảnh
export const MIN_HEAP_HEIGHT = 0.8
export const BIN_HEIGHT = 2.2
/** Lối xe chạy dọc bãi (trục x), tâm ở z = LANE_Z, rộng LANE_WIDTH. */
export const LANE_Z = 0
export const LANE_WIDTH = 4
export const TRUCK_WIDTH = 2.2

/**
 * Chiều cao đống theo căn bậc ba của khối lượng (thể tích ~ kg), chuẩn hoá theo đống lớn nhất.
 * Nhờ vậy đống 60 tấn không cao gấp 60 lần đống 1 tấn, nhưng thứ tự lớn nhỏ vẫn đúng.
 */
export function heapHeight(kg: number, maxKg: number): number {
  if (kg <= 0 || maxKg <= 0) return 0
  const h = (Math.cbrt(kg) / Math.cbrt(maxKg)) * MAX_HEAP_HEIGHT
  return Math.max(MIN_HEAP_HEIGHT, Math.min(MAX_HEAP_HEIGHT, h))
}

/** Mức đầy của thùng (0–1) so với sức chứa danh nghĩa 5 tấn. */
export function binFill(kg: number, capacityKg = 5_000): number {
  return Math.max(0, Math.min(1, kg / capacityKg))
}

/**
 * Xếp đống hàng thành hai dãy: đống lớn ở dãy sau, thùng ở dãy trước, cách đều nhau,
 * để không chồng lên nhau và luôn chừa lối cho xe.
 */
export function layoutYard(stock: Stock[], materials: Material[] = MATERIALS): Pile[] {
  const byCode = new Map(materials.map((m) => [m.code, m]))
  const rows = stock
    .filter((s) => s.kg > 0 && byCode.has(s.code))
    .map((s) => ({ ...(byCode.get(s.code) as Material), kg: s.kg }))
  const maxHeapKg = Math.max(0, ...rows.filter((r) => r.kind === 'heap').map((r) => r.kg))
  const heaps = rows.filter((r) => r.kind === 'heap').sort((a, b) => b.kg - a.kg)
  const bins = rows.filter((r) => r.kind === 'bin').sort((a, b) => b.kg * b.pricePerKg - a.kg * a.pricePerKg)

  const place = <T extends (typeof rows)[number]>(list: T[], z: number, gap: number) =>
    list.map((r, i) => {
      const x = (i - (list.length - 1) / 2) * gap
      const height = r.kind === 'heap' ? heapHeight(r.kg, maxHeapKg) : BIN_HEIGHT
      const radius = r.kind === 'heap' ? 1.6 + height * 0.55 : 1.4
      return { ...r, x, z, height, radius, value: r.kg * r.pricePerKg, fill: 1 }
    })

  // thùng đầy nhất đạt ~85%, các thùng khác so theo nó
  const binCapacity = Math.max(1, ...bins.map((b) => b.kg)) / 0.85
  const placed = [...place(heaps, -10, 11), ...place(bins, 5.5, 4.4)]
  return placed.map((p) => ({ ...p, fill: p.kind === 'bin' ? binFill(p.kg, binCapacity) : 1 }))
}

export function totals(piles: Pile[]): { kg: number; value: number } {
  return piles.reduce((t, p) => ({ kg: t.kg + p.kg, value: t.value + p.value }), { kg: 0, value: 0 })
}

/** Hai đống có chạm nhau không (so khoảng cách tâm với tổng bán kính). */
export function overlaps(a: Pile, b: Pile): boolean {
  return Math.hypot(a.x - b.x, a.z - b.z) < a.radius + b.radius
}

export const vnd = (n: number) => Math.round(n).toLocaleString('vi-VN')
export const tons = (kg: number) => (kg / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })
