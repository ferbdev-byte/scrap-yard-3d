import { describe, expect, it } from 'vitest'
import { BIN_HEIGHT, binFill, heapHeight, LANE_WIDTH, LANE_Z, layoutYard, MAX_HEAP_HEIGHT, MIN_HEAP_HEIGHT, overlaps, SAMPLE_STOCK, totals, TRUCK_WIDTH } from './yard'

describe('heapHeight', () => {
  it('đống lớn nhất cao đúng mức tối đa', () => {
    expect(heapHeight(60_000, 60_000)).toBe(MAX_HEAP_HEIGHT)
  })

  it('tăng theo khối lượng nhưng chậm hơn tuyến tính (căn bậc ba)', () => {
    const a = heapHeight(7_500, 60_000)
    const b = heapHeight(60_000, 60_000)
    expect(a).toBeLessThan(b)
    expect(a).toBeCloseTo(MAX_HEAP_HEIGHT / 2, 5) // 7,5 tấn = 1/8 của 60 tấn → cao bằng nửa
  })

  it('không thấp hơn mức tối thiểu để vẫn nhìn và bấm được', () => {
    expect(heapHeight(1, 60_000)).toBe(MIN_HEAP_HEIGHT)
  })

  it('kg 0 hoặc âm thì không có đống', () => {
    expect(heapHeight(0, 60_000)).toBe(0)
    expect(heapHeight(-5, 60_000)).toBe(0)
  })
})

describe('binFill', () => {
  it('giới hạn trong 0–1', () => {
    expect(binFill(2_500)).toBe(0.5)
    expect(binFill(9_000)).toBe(1)
    expect(binFill(-1)).toBe(0)
  })
})

describe('layoutYard', () => {
  const piles = layoutYard(SAMPLE_STOCK)

  it('có đủ mọi loại có tồn kho', () => {
    expect(piles).toHaveLength(SAMPLE_STOCK.length)
  })

  it('không có hai đống nào chồng lên nhau', () => {
    for (let i = 0; i < piles.length; i++)
      for (let j = i + 1; j < piles.length; j++)
        expect(overlaps(piles[i], piles[j]), `${piles[i].code} × ${piles[j].code}`).toBe(false)
  })

  it('đống ở dãy sau, thùng ở dãy trước, chừa lối cho xe ở giữa', () => {
    const heaps = piles.filter((p) => p.kind === 'heap')
    const bins = piles.filter((p) => p.kind === 'bin')
    const lane = Math.min(...bins.map((b) => b.z - b.radius)) - Math.max(...heaps.map((h) => h.z + h.radius))
    expect(lane).toBeGreaterThan(1.5)
    bins.forEach((b) => expect(b.height).toBe(BIN_HEIGHT))
  })

  it('lối xe không bị đống hay thùng nào lấn vào, đủ rộng cho xe tải', () => {
    expect(LANE_WIDTH).toBeGreaterThan(TRUCK_WIDTH + 1)
    for (const p of piles) {
      const gap = Math.abs(p.z - LANE_Z) - p.radius - LANE_WIDTH / 2
      expect(gap, p.code).toBeGreaterThanOrEqual(0.5)
    }
  })

  it('thùng đầy nhất ~85%, thùng khác tỉ lệ theo lượng tồn', () => {
    const bins = piles.filter((p) => p.kind === 'bin')
    expect(Math.max(...bins.map((b) => b.fill))).toBeCloseTo(0.85, 5)
    const copper = bins.find((b) => b.code === 'dong-cap')!
    const alu = bins.find((b) => b.code === 'nhom-dac')!
    expect(copper.fill).toBeLessThan(alu.fill)
    piles.filter((p) => p.kind === 'heap').forEach((h) => expect(h.fill).toBe(1))
  })

  it('đống lớn nhất là sắt vụn, cao nhất', () => {
    const tallest = [...piles].sort((a, b) => b.height - a.height)[0]
    expect(tallest.code).toBe('sat-vun')
  })

  it('bỏ qua loại không có trong danh mục hoặc hết hàng', () => {
    expect(layoutYard([{ code: 'vang-9999', kg: 10 }, { code: 'sat-vun', kg: 0 }])).toEqual([])
  })

  it('tổng khối lượng và giá trị', () => {
    const t = totals(piles)
    expect(t.kg).toBe(SAMPLE_STOCK.reduce((s, x) => s + x.kg, 0))
    expect(t.value).toBeGreaterThan(0)
  })
})
