import { expect, test, type Page } from '@playwright/test'

let pageErrors: string[] = []

test.beforeEach(async ({ page }) => {
  pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(e.message))
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Tồn kho trực quan' })).toBeVisible()
})

test.afterEach(() => {
  expect(pageErrors).toEqual([])
})

/** Cảnh 3D thật sự đã vẽ: canvas có nhiều màu khác nhau, không phải một màn trơn. */
async function sceneIsDrawn(page: Page) {
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible({ timeout: 30_000 })
  await expect.poll(async () => {
    const shot = await canvas.screenshot()
    return new Set(shot.subarray(0, 60_000)).size
  }, { timeout: 30_000 }).toBeGreaterThan(40)
}

test('dựng cảnh 3D và hiện tổng tồn', async ({ page }) => {
  await sceneIsDrawn(page)
  await expect(page.getByText('Tổng tồn')).toBeVisible()
  await expect(page.getByText('128,2')).toBeVisible()
})

test('chọn bằng bàn phím mở thẻ chi tiết, Esc để đóng', async ({ page, isMobile }) => {
  const btn = page.getByRole('button', { name: /Đồng cáp/ })
  await btn.focus()
  await page.keyboard.press('Enter')
  const card = page.getByRole('dialog', { name: 'Chi tiết Đồng cáp' })
  await expect(card).toContainText('960 kg')
  await expect(card).toContainText('171 triệu đ')
  if (!isMobile) await expect(btn).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Escape')
  await expect(card).toBeHidden()
  await expect(btn).toBeVisible()
})

test('bấm lại cùng loại thì bỏ chọn', async ({ page, isMobile }) => {
  test.skip(isMobile, 'điện thoại: danh sách ẩn khi mở thẻ, đã có test riêng')
  const btn = page.getByRole('button', { name: /Sắt vụn/ })
  await btn.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await btn.click()
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('điện thoại: thẻ chi tiết thay chỗ danh sách, nút Đóng trả lại danh sách', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'chỉ áp dụng màn hình hẹp')
  const list = page.getByRole('list', { name: 'Các loại phế liệu trong bãi' })
  await page.getByRole('button', { name: /Nhôm lon/ }).click()
  await expect(page.getByRole('dialog', { name: 'Chi tiết Nhôm lon' })).toBeVisible()
  await expect(list).toBeHidden()
  await page.getByRole('button', { name: 'Đóng' }).click()
  await expect(list).toBeVisible()
})

test('chế độ giảm hiệu ứng: bật được và nhớ sau khi tải lại', async ({ page }) => {
  const toggle = page.getByRole('button', { name: /hiệu ứng/i })
  const before = await toggle.getAttribute('aria-pressed')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true')
  await page.reload()
  await expect(page.getByRole('button', { name: /hiệu ứng/i })).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true')
  await sceneIsDrawn(page)
})

test('tôn trọng prefers-reduced-motion của hệ điều hành', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto('http://localhost:4173/')
  await expect(page.getByRole('button', { name: 'Giảm hiệu ứng' })).toHaveAttribute('aria-pressed', 'true')
  await ctx.close()
})

test('không tràn ngang', async ({ page }) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
})

test('có thẻ Open Graph và ảnh xem trước', async ({ page, request }) => {
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toMatch(/^https:\/\/.+\/og\.png$/)
  const res = await request.get(new URL('og.png', page.url()).href)
  expect(res.ok()).toBe(true)
})
