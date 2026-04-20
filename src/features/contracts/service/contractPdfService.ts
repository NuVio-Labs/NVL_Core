import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib'
import type { ContractWithDetails, ContractExtras, ContractSecondRenter } from '../types'

const BLACK = rgb(0, 0, 0)
const GRAY = rgb(0.4, 0.4, 0.4)
const LIGHT = rgb(0.9, 0.9, 0.9)
const DARK = rgb(0.15, 0.15, 0.15)
const WHITE = rgb(1, 1, 1)

function fmt(v: number | null | undefined): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)
}

function fmtNum(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('de-DE')
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('de-DE')
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

interface DrawContext {
  page: PDFPage
  bold: PDFFont
  regular: PDFFont
  width: number
  height: number
}

function drawRect(ctx: DrawContext, x: number, y: number, w: number, h: number, fill = LIGHT, stroke = GRAY) {
  ctx.page.drawRectangle({ x, y, width: w, height: h, color: fill, borderColor: stroke, borderWidth: 0.5 })
}

function drawLabel(ctx: DrawContext, text: string, x: number, y: number, size = 6) {
  ctx.page.drawText(text, { x, y, size, font: ctx.regular, color: GRAY })
}

function drawValue(ctx: DrawContext, text: string, x: number, y: number, size = 8) {
  ctx.page.drawText(text, { x, y, size, font: ctx.bold, color: DARK })
}

function drawLine(ctx: DrawContext, x1: number, y1: number, x2: number, y2: number) {
  ctx.page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.5, color: GRAY })
}

function cell(ctx: DrawContext, label: string, value: string, x: number, y: number, w: number, h = 20) {
  drawRect(ctx, x, y, w, h, WHITE, GRAY)
  drawLabel(ctx, label, x + 2, y + h - 7)
  drawValue(ctx, value, x + 2, y + 3)
}

function headerCell(ctx: DrawContext, text: string, x: number, y: number, w: number, h = 14) {
  drawRect(ctx, x, y, w, h, DARK, DARK)
  ctx.page.drawText(text, { x: x + 3, y: y + 3, size: 7, font: ctx.bold, color: WHITE })
}

function checkbox(ctx: DrawContext, checked: boolean, label: string, x: number, y: number) {
  drawRect(ctx, x, y, 8, 8, WHITE, GRAY)
  if (checked) {
    ctx.page.drawText('✓', { x: x + 1, y: y + 1, size: 7, font: ctx.bold, color: BLACK })
  }
  ctx.page.drawText(label, { x: x + 11, y: y + 1, size: 7, font: ctx.regular, color: DARK })
}

export async function generateContractPdf(
  contract: ContractWithDetails,
  signatures: {
    renter1?: string | null
    renter2?: string | null
    lessor?: string | null
  } = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const { width, height } = page.getSize()
  const ctx: DrawContext = { page, bold, regular, width, height }

  const extras = (contract.extras ?? {}) as ContractExtras
  const sr = contract.second_renter as ContractSecondRenter | null
  const resourceMeta = (contract.resource?.metadata ?? {}) as Record<string, unknown>

  const kmDriven = (contract.km_end ?? 0) - (contract.km_start ?? 0)
  const kmFree = contract.km_free ?? 0
  const kmExtra = Math.max(0, kmDriven - kmFree)
  const pricePerKm = contract.price_per_km ?? 0
  const kmCost = kmExtra * pricePerKm
  const priceBase = contract.price_base ?? 0
  let extrasTotal = 0
  if (extras.vk_sb_reduction) extrasTotal += extras.vk_sb_amount ?? 0
  if (extras.km_package_100) extrasTotal += extras.km_package_100_amount ?? 0
  if (extras.km_package_300) extrasTotal += extras.km_package_300_amount ?? 0
  if (extras.km_package_500) extrasTotal += extras.km_package_500_amount ?? 0
  if (extras.km_package_1000) extrasTotal += extras.km_package_1000_amount ?? 0
  const taxRate = contract.tax_rate ?? 0
  const net = priceBase + kmCost + extrasTotal
  const tax = net * (taxRate / 100)
  const gross = net + tax

  let y = height - 10

  // ── Header ──────────────────────────────────────────────────────────────────
  drawRect(ctx, 10, y - 40, width - 20, 40, DARK, DARK)
  page.drawText('MIETVERTRAG UND RECHNUNG', { x: 15, y: y - 15, size: 12, font: bold, color: WHITE })
  page.drawText('PKW · LKW · TRANSPORTER · ANHÄNGER', { x: 15, y: y - 27, size: 7, font: regular, color: rgb(0.8, 0.8, 0.8) })

  const contractNo = String(contract.contract_number ?? '').padStart(4, '0')
  page.drawText(`No. ${contractNo}`, { x: width - 80, y: y - 20, size: 14, font: bold, color: WHITE })
  page.drawText(fmtDate(new Date().toISOString()), { x: width - 80, y: y - 32, size: 7, font: regular, color: rgb(0.8, 0.8, 0.8) })
  y -= 48

  // ── Fahrzeug ────────────────────────────────────────────────────────────────
  const colW = (width - 20) / 3
  headerCell(ctx, 'WAGENTYP', 10, y - 12, colW)
  headerCell(ctx, 'GRUPPE', 10 + colW, y - 12, colW)
  headerCell(ctx, 'AMTL. KENNZEICHEN', 10 + 2 * colW, y - 12, colW)
  y -= 12
  cell(ctx, '', contract.resource?.name ?? '—', 10, y - 20, colW)
  cell(ctx, '', String(resourceMeta.gruppe ?? '—'), 10 + colW, y - 20, colW)
  cell(ctx, '', String(resourceMeta.kennzeichen ?? '—'), 10 + 2 * colW, y - 20, colW)
  y -= 28

  // ── Mieter 1 + Zeiten ───────────────────────────────────────────────────────
  const leftW = (width - 20) * 0.55
  const rightW = (width - 20) * 0.45

  headerCell(ctx, 'MIETER (1)', 10, y - 12, leftW)
  headerCell(ctx, 'FAHRZEITEN & KILOMETER', 10 + leftW, y - 12, rightW)
  y -= 12

  const renterName = `${contract.first_name ?? ''} ${contract.last_name ?? ''}`.trim()
  cell(ctx, 'Name', renterName, 10, y - 20, leftW)

  // Übergabe
  const col4 = rightW / 4
  headerCell(ctx, 'FAHRZEUGÜBERGABE', 10 + leftW, y - 12, rightW, 12)
  y -= 12
  cell(ctx, 'Datum', fmtDate(contract.handover_at), 10 + leftW, y - 20, col4 * 2)
  cell(ctx, 'Zeit', fmtTime(contract.handover_at), 10 + leftW + col4 * 2, y - 20, col4)
  cell(ctx, 'Ort', contract.handover_location ?? '—', 10 + leftW + col4 * 3, y - 20, col4)
  y -= 20

  cell(ctx, 'Straße', contract.street ?? '—', 10, y - 20, leftW)
  headerCell(ctx, 'VEREINBARTE RÜCKGABE', 10 + leftW, y - 12, rightW, 12)
  y -= 12
  cell(ctx, 'Datum', fmtDate(contract.return_agreed_at), 10 + leftW, y - 20, col4 * 2)
  cell(ctx, 'Zeit', fmtTime(contract.return_agreed_at), 10 + leftW + col4 * 2, y - 20, col4)
  cell(ctx, 'Ort', contract.return_location ?? '—', 10 + leftW + col4 * 3, y - 20, col4)
  y -= 20

  cell(ctx, 'Ort / PLZ', contract.city ?? '—', 10, y - 20, leftW)
  headerCell(ctx, 'FAHRZEUGRÜCKGABE (IST)', 10 + leftW, y - 12, rightW, 12)
  y -= 12
  cell(ctx, 'Datum', fmtDate(contract.return_actual_at), 10 + leftW, y - 20, col4 * 2)
  cell(ctx, 'Zeit', fmtTime(contract.return_actual_at), 10 + leftW + col4 * 2, y - 20, col4)
  cell(ctx, '', '', 10 + leftW + col4 * 3, y - 20, col4)
  y -= 20

  cell(ctx, 'Telefon', contract.phone ?? '—', 10, y - 20, leftW)
  const col2 = rightW / 2
  cell(ctx, 'KM-Anfang (1.)', fmtNum(contract.km_start), 10 + leftW, y - 20, col2)
  cell(ctx, 'KM-Ende (2.)', fmtNum(contract.km_end), 10 + leftW + col2, y - 20, col2)
  y -= 20

  cell(ctx, 'Geburtsdatum', fmtDate(contract.date_of_birth), 10, y - 20, leftW / 2)
  cell(ctx, 'FS-Klasse', contract.license_class ?? '—', 10 + leftW / 2, y - 20, leftW / 4)
  cell(ctx, 'FS-Nr.', contract.license_number ?? '—', 10 + leftW * 0.75, y - 20, leftW * 0.25)
  cell(ctx, 'KM-Gesamt', fmtNum(kmDriven > 0 ? kmDriven : null), 10 + leftW, y - 20, col2)
  cell(ctx, 'Frei-KM', fmtNum(contract.km_free), 10 + leftW + col2, y - 20, col2)
  y -= 20

  cell(ctx, 'FS ausgestellt in', contract.license_issued_in ?? '—', 10, y - 20, leftW / 2)
  cell(ctx, 'FS ausgestellt am', fmtDate(contract.license_issued_at), 10 + leftW / 2, y - 20, leftW / 2)
  cell(ctx, 'KM à', pricePerKm > 0 ? `${fmt(pricePerKm)}/km` : '—', 10 + leftW, y - 20, col2)
  cell(ctx, 'Tage à', contract.price_per_day ? fmt(contract.price_per_day) : '—', 10 + leftW + col2, y - 20, col2)
  y -= 28

  // ── Mieter 2 ────────────────────────────────────────────────────────────────
  if (sr) {
    headerCell(ctx, 'MIETER (2)', 10, y - 12, leftW)
    y -= 12
    cell(ctx, 'Name', `${sr.first_name} ${sr.last_name}`, 10, y - 20, leftW)
    y -= 20
    cell(ctx, 'Adresse', [sr.street, sr.city].filter(Boolean).join(', ') || '—', 10, y - 20, leftW)
    y -= 20
    cell(ctx, 'Geburtsdatum', fmtDate(sr.date_of_birth), 10, y - 20, leftW / 2)
    cell(ctx, 'FS-Klasse', sr.license_class ?? '—', 10 + leftW / 2, y - 20, leftW / 4)
    cell(ctx, 'FS-Nr.', sr.license_number ?? '—', 10 + leftW * 0.75, y - 20, leftW * 0.25)
    y -= 28
  }

  // ── Extras & Preise ─────────────────────────────────────────────────────────
  const extW = leftW
  const priceW = rightW

  headerCell(ctx, 'EXTRAS / ZUSATZPAKETE', 10, y - 12, extW)
  headerCell(ctx, 'PREISÜBERSICHT', 10 + extW, y - 12, priceW)
  y -= 12

  const extrasRows: [boolean, string, number | undefined][] = [
    [extras.vk_sb_reduction ?? false, 'VK-SB-Reduzierung auf 300,– €', extras.vk_sb_amount],
    [extras.km_package_100 ?? false, 'KM-Paket +100', extras.km_package_100_amount],
    [extras.km_package_300 ?? false, 'KM-Paket +300', extras.km_package_300_amount],
    [extras.km_package_500 ?? false, 'KM-Paket +500', extras.km_package_500_amount],
    [extras.km_package_1000 ?? false, 'KM-Paket +1000', extras.km_package_1000_amount],
  ]

  const priceRows: [string, string][] = [
    ['Mietpreis', fmt(priceBase)],
    ['Mehrkilometer', kmCost > 0 ? fmt(kmCost) : '—'],
    ['Extras', extrasTotal > 0 ? fmt(extrasTotal) : '—'],
    [`MwSt. ${taxRate}%`, fmt(tax)],
  ]

  const rowH = 16
  const startY = y
  extrasRows.forEach(([checked, label, amount], i) => {
    const ry = startY - (i + 1) * rowH
    drawRect(ctx, 10, ry, extW, rowH, i % 2 === 0 ? WHITE : rgb(0.97, 0.97, 0.97), GRAY)
    checkbox(ctx, checked, label, 14, ry + 4)
    if (amount != null) page.drawText(fmt(amount), { x: 10 + extW - 45, y: ry + 4, size: 7, font: bold, color: DARK })
  })

  priceRows.forEach(([label, value], i) => {
    const ry = startY - (i + 1) * rowH
    drawRect(ctx, 10 + extW, ry, priceW, rowH, i % 2 === 0 ? WHITE : rgb(0.97, 0.97, 0.97), GRAY)
    page.drawText(label, { x: 10 + extW + 4, y: ry + 4, size: 7, font: regular, color: GRAY })
    page.drawText(value, { x: 10 + extW + priceW - 45, y: ry + 4, size: 7, font: bold, color: DARK })
  })

  y = startY - extrasRows.length * rowH - 4

  // Gesamtsumme
  drawRect(ctx, 10 + extW, y - 18, priceW, 18, DARK, DARK)
  page.drawText('GESAMTSUMME (BRUTTO)', { x: 10 + extW + 4, y: y - 13, size: 7, font: bold, color: WHITE })
  page.drawText(fmt(gross), { x: 10 + extW + priceW - 55, y: y - 13, size: 9, font: bold, color: WHITE })
  y -= 18

  cell(ctx, './. Anzahlung Miete', fmt(contract.advance_rent), 10 + extW, y - 16, priceW / 2, 16)
  cell(ctx, './. Anzahlung Kaution', fmt(contract.advance_deposit), 10 + extW + priceW / 2, y - 16, priceW / 2, 16)
  y -= 16

  const rest = gross - (contract.advance_rent ?? 0) - (contract.advance_deposit ?? 0)
  drawRect(ctx, 10 + extW, y - 18, priceW, 18, rgb(0.95, 1, 0.95), GRAY)
  page.drawText('RESTZAHLUNG', { x: 10 + extW + 4, y: y - 13, size: 7, font: bold, color: DARK })
  page.drawText(fmt(rest), { x: 10 + extW + priceW - 55, y: y - 13, size: 9, font: bold, color: DARK })
  y -= 26

  // ── Fahrzeugzustand ─────────────────────────────────────────────────────────
  headerCell(ctx, 'FAHRZEUGZUSTAND BEI ÜBERGABE', 10, y - 12, width - 20)
  y -= 12
  drawRect(ctx, 10, y - 24, width - 20, 24, WHITE, GRAY)
  const checks = [
    [contract.tank_full, 'Tank voll'],
    [contract.loading_gate, 'Ladebordwand erklärt'],
    [contract.tachograph, 'Fahrtenschreiber erklärt'],
    [contract.damage, 'Schäden vorhanden'],
  ] as [boolean | null, string][]
  checks.forEach(([v, label], i) => {
    checkbox(ctx, !!v, label, 15 + i * 130, y - 16)
  })
  if (contract.damage && contract.damage_notes) {
    page.drawText(`Schäden: ${contract.damage_notes}`, { x: 15, y: y - 22, size: 6, font: regular, color: DARK })
  }
  y -= 32

  // ── Notizen ─────────────────────────────────────────────────────────────────
  if (contract.notes) {
    headerCell(ctx, 'BEMERKUNG', 10, y - 12, width - 20)
    y -= 12
    drawRect(ctx, 10, y - 24, width - 20, 24, WHITE, GRAY)
    page.drawText(contract.notes.slice(0, 120), { x: 14, y: y - 14, size: 7, font: regular, color: DARK })
    y -= 32
  }

  // ── Unterschriften ──────────────────────────────────────────────────────────
  headerCell(ctx, 'UNTERSCHRIFTEN', 10, y - 12, width - 20)
  y -= 12

  const sigW = (width - 20) / (sr ? 3 : 2)
  const sigH = 55

  const sigLabels = sr
    ? ['Mieter (1)', 'Mieter (2)', 'Vermieter']
    : ['Mieter', 'Vermieter']
  const sigData = sr
    ? [signatures.renter1, signatures.renter2, signatures.lessor]
    : [signatures.renter1, signatures.lessor]

  for (let i = 0; i < sigLabels.length; i++) {
    const sx = 10 + i * sigW
    drawRect(ctx, sx, y - sigH, sigW, sigH, WHITE, GRAY)
    page.drawText(sigLabels[i], { x: sx + 4, y: y - sigH + 4, size: 6, font: regular, color: GRAY })
    drawLine(ctx, sx + 8, y - sigH + 18, sx + sigW - 8, y - sigH + 18)
    if (sigData[i]) {
      try {
        const imgBytes = await fetch(sigData[i]!).then(r => r.arrayBuffer())
        const img = await doc.embedPng(imgBytes)
        page.drawImage(img, { x: sx + 6, y: y - sigH + 20, width: sigW - 12, height: sigH - 26 })
      } catch { /* Unterschrift nicht einbettbar */ }
    }
  }
  y -= sigH + 8

  // ── Datenschutz & AGB ───────────────────────────────────────────────────────
  const agb = 'Der Mieter bestätigt, die AGB gelesen und eine Kopie dieses Vertrages erhalten zu haben. Datenschutzerklärung: core.nuviolabs.de/datenschutz'
  page.drawText(agb, { x: 10, y: y - 10, size: 5.5, font: regular, color: GRAY, maxWidth: width - 20 })
  y -= 18

  // ── Footer ──────────────────────────────────────────────────────────────────
  drawLine(ctx, 10, y, width - 10, y)
  page.drawText(
    'PAUSCHAL- ODER SONDERTARIFE GELTEN NUR BEI SOFORTIGER BARZAHLUNG, SPÄTESTENS BEI RÜCKGABE DES FAHRZEUGES.',
    { x: 10, y: y - 10, size: 5, font: regular, color: GRAY }
  )

  return doc.save()
}
