/**
 * ProTech ERP - Invoice PDF Generator
 * Uses pdf-lib (browser CDN) to create downloadable invoices
 * featuring the official ProTech Automobile letterhead.
 *
 * Layout per page:
 *   - Header: full-width banner image (protech-header.png)  ~130pt
 *   - Footer: full-width footer stripe (protech-footer.png) ~35pt
 *   - Watermark: centred logo at 40% opacity (protech-logo.jpg)
 */

window.ProTechPDF = {

  // ─── IMAGE LOADER ────────────────────────────────────────────────
  _loadImage: async function (doc, filename, embedFn) {
    const bases = ['assets/images/', '../assets/images/', '../../assets/images/'];
    for (const base of bases) {
      try {
        const res = await fetch(base + filename);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        return await embedFn(doc, buf);
      } catch (_) { /* try next */ }
    }
    console.warn('[PDF] Could not load image:', filename);
    return null;
  },

  loadImages: async function (doc) {
    const [header, footer, logo] = await Promise.all([
      this._loadImage(doc, 'protech-header.png', (d, b) => d.embedPng(b)),
      this._loadImage(doc, 'protech-footer.png', (d, b) => d.embedPng(b)),
      this._loadImage(doc, 'protech-logo.jpg',   (d, b) => d.embedJpg(b)),
    ]);
    return { header, footer, logo };
  },

  // ─── MAIN ENTRY POINT ────────────────────────────────────────────
  generateInvoice: async function (jc) {
    if (!jc) { alert('No job card data available.'); return; }

    try {
      const { PDFDocument, rgb, StandardFonts } = PDFLib;
      const doc   = await PDFDocument.create();
      const imgs  = await this.loadImages(doc);

      const boldFont    = await doc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await doc.embedFont(StandardFonts.Helvetica);
      const italicFont  = await doc.embedFont(StandardFonts.HelveticaOblique);

      const W       = 595;   // A4 width  (pt)
      const H       = 842;   // A4 height (pt)
      const margin  = 28;
      const contentW = W - margin * 2;

      // ── colour palette ──────────────────────────────────────────
      const darkBlue  = rgb(0.11, 0.20, 0.40);
      const midBlue   = rgb(0.15, 0.38, 0.70);
      const lightBlue = rgb(0.80, 0.88, 0.97);
      const rowAlt    = rgb(0.94, 0.96, 0.99);
      const white     = rgb(1, 1, 1);
      const black     = rgb(0, 0, 0);
      const grey      = rgb(0.55, 0.55, 0.55);
      const golden    = rgb(0.85, 0.70, 0.10);

      // ── layout constants ────────────────────────────────────────
      const HEADER_H  = 130;  // height of the banner image
      const FOOTER_H  = 38;   // height of the footer stripe
      const FOOTER_Y  = FOOTER_H + 4; // bottom anchor of footer stripe
      const BOTTOM_MARGIN = FOOTER_Y + 10; // content must stay above this

      let page;  // reassigned on each new page – all helpers use it via closure
      let y;     // current drawing cursor (top of next element)

      // ── helper: draw a full letterhead page background ──────────
      const applyLetterhead = () => {
        // Header banner image (full width, top of page)
        if (imgs.header) {
          page.drawImage(imgs.header, { x: 0, y: H - HEADER_H, width: W, height: HEADER_H });
        } else {
          // Fallback solid banner
          page.drawRectangle({ x: 0, y: H - HEADER_H, width: W, height: HEADER_H, color: darkBlue });
          page.drawText('PRO TECH AUTOMOBILE', {
            x: 140, y: H - 70, font: boldFont, size: 22, color: white
          });
        }

        // Centred logo watermark
        if (imgs.logo) {
          const wSize = 280;
          page.drawImage(imgs.logo, {
            x: (W - wSize) / 2,
            y: (H - wSize) / 2 - 20,
            width: wSize,
            height: wSize,
            opacity: 0.08
          });
        }

        // Footer stripe image (full width, bottom of page)
        if (imgs.footer) {
          page.drawImage(imgs.footer, { x: 0, y: 0, width: W, height: FOOTER_Y });
        } else {
          page.drawRectangle({ x: 0, y: 0, width: W, height: FOOTER_Y, color: midBlue });
          page.drawText('SMART  |  FAST  |  RELIABLE', {
            x: 200, y: 14, font: boldFont, size: 9, color: white
          });
        }
      };

      // ── helper: start a new page with letterhead ─────────────────
      const newPage = () => {
        page = doc.addPage([W, H]);
        applyLetterhead();
        y = H - HEADER_H - 8;
      };

      // ── draw helpers (all reference the `page` closure var) ──────
      const drawRect = (x, yTop, w, h, color) =>
        page.drawRectangle({ x, y: yTop - h, width: w, height: h, color });

      const drawRectBorder = (x, yTop, w, h, borderColor, borderWidth = 0.5) =>
        page.drawRectangle({ x, y: yTop - h, width: w, height: h,
          color: undefined, borderColor, borderWidth });

      const _vy = (yTop, sz, rowH) =>
        rowH > 0 ? yTop - (rowH - sz) / 2 - sz : yTop - sz;

      const text = (str, x, yTop, { font = regularFont, size = 9, color = black, rowH = 0 } = {}) =>
        page.drawText(String(str || ''), { x, y: _vy(yTop, size, rowH), font, size, color });

      const textCenter = (str, x, yTop, w, opts = {}) => {
        const { font = regularFont, size = 9, color = black, rowH = 0 } = opts;
        const tw = font.widthOfTextAtSize(String(str || ''), size);
        page.drawText(String(str || ''), {
          x: x + (w - tw) / 2, y: _vy(yTop, size, rowH), font, size, color
        });
      };

      const textRight = (str, x, yTop, w, opts = {}) => {
        const { font = regularFont, size = 9, color = black, rowH = 0 } = opts;
        const tw = font.widthOfTextAtSize(String(str || ''), size);
        page.drawText(String(str || ''), {
          x: x + w - tw, y: _vy(yTop, size, rowH), font, size, color
        });
      };

      const drawLine = (x1, y1, x2, y2, color = grey, thickness = 0.5) =>
        page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });

      const lkr = (v) => `LKR ${(Number(v) || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const num = (v) => (Number(v) || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // ── pagination ───────────────────────────────────────────────
      let onNewPage = null;

      const checkPage = (neededH = 20) => {
        if (y - neededH < BOTTOM_MARGIN) {
          newPage();
          if (onNewPage) onNewPage();
        }
      };

      // ── PAGE 1 ──────────────────────────────────────────────────
      newPage();

      // ═══════════════════════════════════════════════════════════
      // 2. CUSTOMER & INVOICE INFO SECTION
      // ═══════════════════════════════════════════════════════════
      const infoH = 52;
      drawRect(0, y, W, infoH, lightBlue);
      y -= 14;

      // Left: customer details
      text('CUSTOMER NAME  :-', margin, y, { font: boldFont, size: 9, color: black });
      text(jc.customer_name || '-', margin + 112, y, { font: boldFont, size: 9, color: darkBlue });

      text('CONTACT NUMBER :-', margin, y - 19, { font: boldFont, size: 9, color: black });
      text(jc.customer_phone || '-', margin + 112, y - 19, { font: regularFont, size: 9, color: black });

      // Right: invoice details
      const invX = W / 2 + 35;
      text('IN. NO. :-', invX, y, { font: boldFont, size: 9, color: black });
      text(jc.job_card_id || jc.id || '-', invX + 62, y, { font: boldFont, size: 9, color: darkBlue });

      const today = new Date().toLocaleDateString('en-LK');
      text('DATE.   :-', invX, y - 19, { font: boldFont, size: 9, color: black });
      text(today, invX + 62, y - 19, { font: regularFont, size: 9, color: black });

      y -= (infoH - 14) + 8;

      // ═══════════════════════════════════════════════════════════
      // 3. VEHICLE INFO TABLE
      // ═══════════════════════════════════════════════════════════
      const colPlate = contentW * 0.40;
      const colModel = contentW * 0.35;
      const colMile  = contentW * 0.25;
      const vehHeaderH = 18;

      drawRect(margin, y, colPlate, vehHeaderH, darkBlue);
      drawRect(margin + colPlate, y, colModel, vehHeaderH, darkBlue);
      drawRect(margin + colPlate + colModel, y, colMile, vehHeaderH, darkBlue);
      textCenter('VEHICLE REGISTRATION NUMBER', margin, y, colPlate, { font: boldFont, size: 8, color: white, rowH: vehHeaderH });
      textCenter('MODEL', margin + colPlate, y, colModel, { font: boldFont, size: 8, color: white, rowH: vehHeaderH });
      textCenter('MILEAGE', margin + colPlate + colModel, y, colMile, { font: boldFont, size: 8, color: white, rowH: vehHeaderH });
      y -= vehHeaderH;

      const vehRowH = 18;
      drawRect(margin, y, colPlate, vehRowH, rowAlt);
      drawRect(margin + colPlate, y, colModel, vehRowH, white);
      drawRect(margin + colPlate + colModel, y, colMile, vehRowH, white);
      drawRectBorder(margin, y + 1, contentW, vehRowH, rgb(0.5, 0.5, 0.5));

      const makeModelParts = (jc.vehicle_make_model || '').split(' ');
      const modelName = makeModelParts.slice(1).join(' ') || jc.vehicle_make_model || '-';
      textCenter(jc.vehicle_plate || '-', margin, y, colPlate, { font: boldFont, size: 9, color: darkBlue, rowH: vehRowH });
      textCenter(modelName, margin + colPlate, y, colModel, { font: boldFont, size: 9, color: black, rowH: vehRowH });
      textCenter(jc.mileage_at_intake ? jc.mileage_at_intake.toLocaleString() + ' Km' : '-', margin + colPlate + colModel, y, colMile, { font: regularFont, size: 9, color: black, rowH: vehRowH });
      y -= vehRowH + 4;

      // ═══════════════════════════════════════════════════════════
      // 4. CUSTOMER REQUEST ROW
      // ═══════════════════════════════════════════════════════════
      const reqH = 18;
      const reqLabelW = contentW * 0.35;
      drawRect(margin, y, reqLabelW, reqH, darkBlue);
      drawRect(margin + reqLabelW, y, contentW - reqLabelW, reqH, lightBlue);
      textCenter('CUSTOMER REQUEST', margin, y, reqLabelW, { font: boldFont, size: 8.5, color: white, rowH: reqH });
      text((jc.problem || '').toUpperCase(), margin + reqLabelW + 8, y, { font: boldFont, size: 8.5, color: black, rowH: reqH });
      y -= reqH + 6;

      // ═══════════════════════════════════════════════════════════
      // 5. PRODUCTS / PARTS TABLE
      // ═══════════════════════════════════════════════════════════
      const pColSno  = 28;
      const pColDesc = contentW * 0.42;
      const pColQty  = contentW * 0.09;
      const pColUnit = contentW * 0.14;
      const pColDisc = contentW * 0.10;
      const pColNet  = contentW - pColSno - pColDesc - pColQty - pColUnit - pColDisc;

      const pHeaderH = 17;
      const partsHeaderCols = [
        { w: pColSno,  label: 'S.NO.' },
        { w: pColDesc, label: 'PRODUCT DESCRIPTION' },
        { w: pColQty,  label: 'QTY' },
        { w: pColUnit, label: 'UNIT PRICE' },
        { w: pColDisc, label: 'DISCOUNT' },
        { w: pColNet,  label: 'NET AMOUNT' },
      ];

      const drawPartsHeader = () => {
        let px = margin;
        partsHeaderCols.forEach(col => {
          drawRect(px, y, col.w, pHeaderH, darkBlue);
          textCenter(col.label, px, y, col.w, { font: boldFont, size: 7.5, color: white, rowH: pHeaderH });
          px += col.w;
        });
        y -= pHeaderH;
      };

      checkPage(pHeaderH + 16 * 2);
      drawPartsHeader();

      const parts = jc.parts || [];
      let partsTotal = 0;
      const minPartRows = Math.max(parts.length, 4);
      onNewPage = drawPartsHeader;

      for (let i = 0; i < minPartRows; i++) {
        const p = parts[i];
        const rowH = 16;
        checkPage(rowH);
        const bg = i % 2 === 0 ? white : rowAlt;
        drawRect(margin, y, contentW, rowH, bg);
        drawRectBorder(margin, y + 1, contentW, rowH, rgb(0.75, 0.75, 0.75));
        if (p) {
          const lineTotal = (p.sell_price || 0) * (p.qty || 1);
          partsTotal += lineTotal;
          let px2 = margin;
          textCenter(String(i + 1), px2, y, pColSno, { size: 8.5, rowH }); px2 += pColSno;
          textCenter(p.part_name || '', px2, y, pColDesc, { size: 8, rowH }); px2 += pColDesc;
          textCenter(String(p.qty || 1), px2, y, pColQty, { size: 8.5, rowH }); px2 += pColQty;
          textRight(num(p.sell_price), px2, y, pColUnit - 4, { size: 8.5, rowH }); px2 += pColUnit;
          textCenter('-', px2, y, pColDisc, { size: 8.5, color: grey, rowH }); px2 += pColDisc;
          textRight(num(lineTotal), px2, y, pColNet - 4, { size: 8.5, font: boldFont, rowH });
        }
        y -= rowH;
      }

      onNewPage = null;

      // Parts sub-amount row (same width as labor totals block)
      checkPage(17 + 20);
      const pSubH = 17;
      const pSubW = contentW * 0.50;
      const pSubX = margin + contentW * 0.50;
      const pValW = pSubW * 0.42;
      const pLblW = pSubW - pValW;
      drawRect(pSubX, y, pSubW, pSubH, lightBlue);
      drawRectBorder(pSubX, y + 1, pSubW, pSubH, rgb(0.5, 0.5, 0.5));
      textCenter('SUB AMOUNT', pSubX, y, pLblW, { font: boldFont, size: 8, color: darkBlue, rowH: pSubH });
      textRight(num(partsTotal), pSubX + pLblW, y, pValW - 4, { font: boldFont, size: 8.5, color: darkBlue, rowH: pSubH });
      y -= pSubH + 8;

      // ═══════════════════════════════════════════════════════════
      // 6. SERVICES / LABOR TABLE
      // ═══════════════════════════════════════════════════════════
      const labor = jc.labor || [];
      const lColSno  = 28;
      const lColDesc = contentW * 0.52;
      const lColHrs  = contentW * 0.10;
      const lColRate = contentW * 0.17;
      const lColNet  = contentW - lColSno - lColDesc - lColHrs - lColRate;

      const lHeaderH = 17;
      const laborHeaderCols = [
        { w: lColSno,  label: 'S.NO.' },
        { w: lColDesc, label: 'SERVICE DESCRIPTION' },
        { w: lColHrs,  label: 'HOURS' },
        { w: lColRate, label: 'UNIT PRICE' },
        { w: lColNet,  label: 'NET AMOUNT' },
      ];

      const drawLaborHeader = () => {
        let lx = margin;
        laborHeaderCols.forEach(col => {
          drawRect(lx, y, col.w, lHeaderH, darkBlue);
          textCenter(col.label, lx, y, col.w, { font: boldFont, size: 7.5, color: white, rowH: lHeaderH });
          lx += col.w;
        });
        y -= lHeaderH;
      };

      checkPage(lHeaderH + 16 * 2);
      drawLaborHeader();

      let laborTotal = 0;
      const minLaborRows = Math.max(labor.length, 4);
      onNewPage = drawLaborHeader;

      for (let i = 0; i < minLaborRows; i++) {
        const l = labor[i];
        const rowH = 16;
        checkPage(rowH);
        const bg = i % 2 === 0 ? white : rowAlt;
        drawRect(margin, y, contentW, rowH, bg);
        drawRectBorder(margin, y + 1, contentW, rowH, rgb(0.75, 0.75, 0.75));
        if (l) {
          const lineTotal = (l.hours || 0) * (l.rate || 0);
          laborTotal += lineTotal;
          let lx2 = margin;
          textCenter(String(i + 1), lx2, y, lColSno, { size: 8.5, rowH }); lx2 += lColSno;
          textCenter(l.description || '', lx2, y, lColDesc, { size: 8, rowH }); lx2 += lColDesc;
          textCenter(String(l.hours || ''), lx2, y, lColHrs, { size: 8.5, rowH }); lx2 += lColHrs;
          textRight(num(l.rate), lx2, y, lColRate - 4, { size: 8.5, rowH }); lx2 += lColRate;
          textRight(num(lineTotal), lx2, y, lColNet - 4, { font: boldFont, size: 8.5, rowH });
        }
        y -= rowH;
      }

      onNewPage = null;

      // ═══════════════════════════════════════════════════════════
      // 7. TOTALS SUMMARY BLOCK
      // ═══════════════════════════════════════════════════════════
      const grandTotal = partsTotal + laborTotal;
      const totalLabelX = margin + contentW * 0.50;
      const totalW = contentW * 0.50;

      const drawTotalRow = (label, value, bgColor, textColor = black, isLast = false) => {
        const rowH = 17;
        drawRect(totalLabelX, y, totalW, rowH, bgColor);
        drawRectBorder(totalLabelX, y + 1, totalW, rowH, rgb(0.5, 0.5, 0.5));
        const valW = totalW * 0.42;
        const lblW = totalW - valW;
        textCenter(label, totalLabelX, y, lblW, { font: boldFont, size: isLast ? 8.5 : 8, color: textColor, rowH });
        textRight(value, totalLabelX + lblW, y, valW - 4, { font: boldFont, size: isLast ? 9.5 : 8.5, color: textColor, rowH });
        y -= rowH;
      };

      checkPage(74);
      drawTotalRow('SUB AMOUNT', num(laborTotal), lightBlue, darkBlue);
      y -= 6;
      drawTotalRow('INVOICE TOTAL AMOUNT', num(grandTotal), darkBlue, white);
      drawTotalRow('ADVANCE PAYMENT', '-', rowAlt, black);
      drawTotalRow('NET AMOUNT TO PAY', lkr(grandTotal), darkBlue, golden, true);

      // ═══════════════════════════════════════════════════════════
      // 8. SIGNATURE BOXES
      // ═══════════════════════════════════════════════════════════
      const sigY = BOTTOM_MARGIN + 55;
      const sigW = 155;
      const sigH = 32;

      drawRect(margin, sigY, sigW, sigH, rgb(0.93, 0.93, 0.93));
      drawRectBorder(margin, sigY, sigW, sigH, rgb(0.6, 0.6, 0.6));
      text('......................................', margin + 18, sigY - 8, { color: grey, size: 8 });
      textCenter('Prepared By', margin, sigY - 22, sigW, { font: boldFont, size: 8.5, color: black });

      drawRect(margin + sigW + 20, sigY, sigW, sigH, rgb(0.93, 0.93, 0.93));
      drawRectBorder(margin + sigW + 20, sigY, sigW, sigH, rgb(0.6, 0.6, 0.6));
      text('......................................', margin + sigW + 38, sigY - 8, { color: grey, size: 8 });
      textCenter('Authorised By', margin + sigW + 20, sigY - 22, sigW, { font: boldFont, size: 8.5, color: black });

      // ═══════════════════════════════════════════════════════════
      // PAGE 2 – SPECIAL NOTES & SERVICE CHECKLIST
      // ═══════════════════════════════════════════════════════════
      newPage();

      // ── text-wrap helper ────────────────────────────────────────
      const wrapText = (str, maxW, fnt, sz) => {
        const words = String(str || '').split(' ');
        const lines = [];
        let cur = '';
        for (const w of words) {
          const test = cur ? cur + ' ' + w : w;
          if (fnt.widthOfTextAtSize(test, sz) > maxW) { if (cur) lines.push(cur); cur = w; }
          else { cur = test; }
        }
        if (cur) lines.push(cur);
        return lines;
      };

      // ── 2A. SPECIAL NOTES TABLE ──────────────────────────────
      const snColSno   = 35;
      const snColNotes = contentW - snColSno;
      const snHeaderH  = 20;

      drawRect(margin, y, snColSno, snHeaderH, darkBlue);
      drawRect(margin + snColSno, y, snColNotes, snHeaderH, darkBlue);
      textCenter('S.NO.', margin, y, snColSno, { font: boldFont, size: 8, color: white, rowH: snHeaderH });
      textCenter('SPECIAL NOTES', margin + snColSno, y, snColNotes, { font: boldFont, size: 9, color: white, rowH: snHeaderH });
      y -= snHeaderH;

      const rawDiag = Array.isArray(jc.special_notes) ? jc.special_notes.filter(Boolean) : [];
      const minNoteRows = Math.max(rawDiag.length, 8);
      for (let i = 0; i < minNoteRows; i++) {
        const note = rawDiag[i] || '';
        const noteRowH = 18;
        const bg2 = i % 2 === 0 ? white : rowAlt;
        drawRect(margin, y, snColSno, noteRowH, bg2);
        drawRect(margin + snColSno, y, snColNotes, noteRowH, bg2);
        drawRectBorder(margin, y + 1, contentW, noteRowH, rgb(0.75, 0.75, 0.75));
        textCenter(String(i + 1), margin, y, snColSno, { size: 8, rowH: noteRowH, color: note ? black : rgb(0.78, 0.78, 0.78) });
        if (note) text(note, margin + snColSno + 6, y, { size: 8, rowH: noteRowH });
        y -= noteRowH;
      }

      y -= 12;

      // ── 2B. REMEMBER BLOCK ───────────────────────────────────
      const remH = 22;
      drawRect(margin, y, contentW, remH, rgb(0.82, 0.10, 0.10));
      textCenter('REMEMBER', margin, y, contentW, { font: boldFont, size: 11, color: white, rowH: remH });
      y -= remH + 6;

      const warnStr = 'AFTER INSTALING THE SPARE PARTS BROUGHT BY THE CUSTOMER, IN THE EVENT OF ANY DEFECT ( DUE TO A DEFECT IN THOSE SPARE PARTS ), A FEE WILL BE CHARGED FOR THE DISASSEMBLE AND REASSEMBLE.';
      for (const wl of wrapText(warnStr, contentW - 16, italicFont, 8.5)) {
        text(wl, margin + 8, y, { font: italicFont, size: 8.5, color: rgb(0.78, 0.08, 0.08) });
        y -= 16;
      }
      y -= 18;

      // ── 2C. SERVICE FUNCTIONS HEADER ─────────────────────────
      const sfH = 18;
      drawRect(margin, y, contentW, sfH, darkBlue);
      textCenter('SERVICE FUNCTIONS', margin, y, contentW, { font: boldFont, size: 9, color: white, rowH: sfH });
      y -= sfH + 8;

      const drawSectionTitle = (label) => {
        const sh = 17;
        drawRect(margin, y, contentW, sh, rgb(0.88, 0.88, 0.88));
        text(label, margin + 5, y, { font: boldFont, size: 7.5, color: black, rowH: sh });
        y -= sh + 8;
      };

      const drawListItems = (items) => {
        items.forEach((item, idx) => {
          const isSpecial = idx === items.length - 1 && item.startsWith('CHEMICALS');
          const prefix = isSpecial ? '-' : `${idx + 1}`;
          const fnt = isSpecial ? italicFont : regularFont;
          text(`${prefix}    ${item}`, margin + 10, y, { font: fnt, size: 7.5, color: black });
          y -= 15;
        });
        y -= 12;
      };

      drawSectionTitle('>> NORMAL LUBE SERVICE WITH GENUINE ENGINE OIL AND GENUINE OIL FILTER :-');
      drawListItems([
        'REPLACE GENUINE ENGINE OIL WITH DRAIN GASKET',
        'REPLACE GENUINE ENGINE OIL FILTER',
        'CLEANE / REPLACE AIR FILTER',
        'CHECK FRONT AND REAR BRAKES AND ROTATE WHEELS',
        'CHECK / TOPUP RADIATOR COOLANT AND INVETER/INTERCOOLER COOLANT',
        'CHECK / TOPUP ATF FLUID',
        'CHECK / TOPUP BRAKE FLUID',
        'CHECK / TOPUP AUXILARY BATTERY DISTIL WATER LEVEL',
        'CHECK FRONT AND REAR SUSPENSSION SYSTEM',
        'CHECK DRIVE BELT, WIPER BLADES, BULBS, MIRROR AND SHUTTER CONDITION',
        'CLEAN / REPLACE AC FILTER',
        'CLEAN HV BATTERY BLOWER'
      ]);

      drawSectionTitle('>> TUNE - UP ENGINE WITH USING "O" RING , GLOWMAT AND CHEMICALS :-');
      drawListItems([
        'REMOVE , CLEAN , CHECK AND REFIT FUEL INJECTORS USING O RINGS AND GLOWMATS',
        'REMOVE , CLEAN  AND REFIT SPARK PLUGS AND TUNE-UP ENGINE',
        'REMOVE , CLEAN AND REFIT EGR VALVE AND EGR COOLER',
        'REMOVE , CLEAN AND REFIT INLET MANIFOLD ASSY',
        'REMOVE , CLEAN AND REFIT TROTLE BODY',
        'CHECK , RESET AND INITIALIZE EFI SYSTEM',
        'CHEMICALS :- INJECTOR / TROTLE BODY CLEANER, ENGINE CONDITIONER, BRAKE PARTS CLEANER....'
      ]);

      // ─── SAVE & DOWNLOAD ────────────────────────────────────────
      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const filename = `ProTech_Invoice_${jc.job_card_id || jc.id}_${jc.vehicle_plate}.pdf`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      console.log('[PDF] Downloaded:', filename);

    } catch (err) {
      console.error('[PDF] Generation error:', err);
      alert('PDF generation failed: ' + err.message);
    }
  }
};
