/**
 * ProTech ERP - Invoice PDF Generator
 * Uses pdf-lib (browser CDN) to create downloadable invoices
 * featuring the ProTech Automobile official letterhead (letterhead.jpeg).
 */

window.ProTechPDF = {

  loadLetterheadImage: async function (doc) {
    const paths = [
      'assets/images/letterhead.jpeg',
      '../assets/images/letterhead.jpeg',
      '../../assets/images/letterhead.jpeg'
    ];

    for (const p of paths) {
      try {
        const res = await fetch(p);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const img = await doc.embedJpg(buffer);
          console.log('[PDF] Successfully loaded letterhead image from:', p);
          return img;
        }
      } catch (err) {
        // try next candidate path
      }
    }
    console.warn('[PDF] Letterhead image fetch failed across candidate paths.');
    return null;
  },

  /**
   * Generate and download a ProTech branded invoice PDF from a job card object.
   * @param {Object} jc - The job card data object
   */
  generateInvoice: async function (jc) {
    if (!jc) {
      alert('No job card data available to generate invoice.');
      return;
    }

    const { PDFDocument, rgb, StandardFonts } = PDFLib;

    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]); // A4 Page

    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await doc.embedFont(StandardFonts.Helvetica);
    const italicFont = await doc.embedFont(StandardFonts.HelveticaOblique);

    const W = 595;
    const margin = 30;
    const contentW = W - margin * 2;

    // ─── COLOR PALETTE ───────────────────────────────────────────
    const darkBlue = rgb(0.11, 0.20, 0.40);  // #1C3366
    const midBlue = rgb(0.15, 0.38, 0.70);  // Accent table headers
    const lightBlue = rgb(0.80, 0.88, 0.97);  // Section highlights
    const tableHeaderBg = rgb(0.11, 0.20, 0.40);
    const rowAlt = rgb(0.94, 0.96, 0.99);
    const white = rgb(1, 1, 1);
    const black = rgb(0, 0, 0);
    const grey = rgb(0.55, 0.55, 0.55);
    const golden = rgb(0.85, 0.70, 0.10);

    // ─── HELPER FUNCTIONS ────────────────────────────────────────
    const drawRect = (x, y, w, h, color) => {
      page.drawRectangle({ x, y: y - h, width: w, height: h, color });
    };

    const drawRectBorder = (x, y, w, h, borderColor, borderWidth = 0.5) => {
      page.drawRectangle({
        x, y: y - h, width: w, height: h,
        color: undefined,
        borderColor,
        borderWidth
      });
    };

    const text = (str, x, y, { font = regularFont, size = 9, color = black } = {}) => {
      page.drawText(String(str || ''), { x, y: y - size, font, size, color });
    };

    const textCenter = (str, x, y, w, { font = regularFont, size = 9, color = black } = {}) => {
      const textW = font.widthOfTextAtSize(String(str || ''), size);
      const cx = x + (w - textW) / 2;
      page.drawText(String(str || ''), { x: cx, y: y - size, font, size, color });
    };

    const textRight = (str, x, y, w, { font = regularFont, size = 9, color = black } = {}) => {
      const textW = font.widthOfTextAtSize(String(str || ''), size);
      page.drawText(String(str || ''), { x: x + w - textW, y: y - size, font, size, color });
    };

    const lkr = (amount) => `LKR ${(Number(amount) || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const num = (amount) => (Number(amount) || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const drawLine = (x1, y1, x2, y2, color = rgb(0.7, 0.7, 0.7), thickness = 0.5) => {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
    };

    let y = 842;

    // ═══════════════════════════════════════════════════════════
    // 1. TOP LETTERHEAD HEADER (letterhead.jpeg)
    // ═══════════════════════════════════════════════════════════
    const letterheadImg = await this.loadLetterheadImage(doc);

    if (letterheadImg) {
      const headerH = 145; // Height of official letterhead banner
      page.drawImage(letterheadImg, {
        x: 0,
        y: y - headerH,
        width: W,
        height: headerH
      });
      y -= headerH;
    } else {
      // Fallback programmatic banner if image is not accessible
      const headerH = 80;
      drawRect(0, y, W, headerH, darkBlue);
      y -= 5;
      text('PRO TECH AUTOMOBILE', margin + 5, y - 8, { font: boldFont, size: 22, color: white });
      text('Smart  >  Fast  >  Reliable', margin + 8, y - 32, { font: italicFont, size: 10, color: rgb(0.75, 0.85, 1.0) });
      text('No.276/1/A, Udumulla, Mulleriyawa New Town.', margin + 8, y - 47, { font: regularFont, size: 8, color: rgb(0.85, 0.90, 1.0) });

      const rightColX = W - 190;
      text('+94773532095', rightColX, y - 8, { font: boldFont, size: 9, color: white });
      text('protechautomobile07@gmail.com', rightColX, y - 22, { font: regularFont, size: 8, color: rgb(0.85, 0.90, 1.0) });
      text('Pro Tech Automobile', rightColX, y - 36, { font: regularFont, size: 8, color: rgb(0.85, 0.90, 1.0) });
      y -= headerH - 5;
    }

    // Thin accent line below header
    drawRect(0, y, W, 4, midBlue);
    y -= 4 + 6; // 6pt padding above customer info box

    // ═══════════════════════════════════════════════════════════
    // 2. CUSTOMER & INVOICE INFO SECTION
    // ═══════════════════════════════════════════════════════════
    const infoH = 50; // Increased height for inner top/bottom padding
    drawRect(0, y, W, infoH, lightBlue);
    y -= 13; // 13pt top padding inside info box

    // Customer Info
    text('CUSTOMER NAME  :-', margin, y, { font: boldFont, size: 9, color: black });
    text(`${jc.customer_name || 'MR. SHAKIL RIDMIKE'}`, margin + 110, y, { font: boldFont, size: 9, color: darkBlue });

    text('CONTACT NUMBER :-', margin, y - 18, { font: boldFont, size: 9, color: black });
    text(`${jc.customer_phone || '0766368845'}`, margin + 110, y - 18, { font: regularFont, size: 9, color: black });

    // Invoice Info
    const invX = W / 2 + 40;
    text('IN. NO. :-', invX, y, { font: boldFont, size: 9, color: black });
    text(`${jc.job_card_id || jc.id || '43'}`, invX + 60, y, { font: boldFont, size: 9, color: darkBlue });

    const today = new Date().toLocaleDateString('en-LK');
    text('DATE.   :-', invX, y - 18, { font: boldFont, size: 9, color: black });
    text(today, invX + 60, y - 18, { font: regularFont, size: 9, color: black });

    y -= (infoH - 13) + 8; // 8pt padding below customer info box

    // ═══════════════════════════════════════════════════════════
    // 3. VEHICLE INFO TABLE
    // ═══════════════════════════════════════════════════════════
    const colPlate = contentW * 0.40;
    const colModel = contentW * 0.35;
    const colMile = contentW * 0.25;

    const vehHeaderH = 18;
    drawRect(margin, y, colPlate, vehHeaderH, darkBlue);
    drawRect(margin + colPlate, y, colModel, vehHeaderH, darkBlue);
    drawRect(margin + colPlate + colModel, y, colMile, vehHeaderH, darkBlue);

    textCenter('VEHICLE REGISTRATION NUMBER', margin, y, colPlate, { font: boldFont, size: 8, color: white });
    textCenter('MODEL', margin + colPlate, y, colModel, { font: boldFont, size: 8, color: white });
    textCenter('MILEAGE', margin + colPlate + colModel, y, colMile, { font: boldFont, size: 8, color: white });
    y -= vehHeaderH;

    const vehRowH = 18;
    drawRect(margin, y, colPlate, vehRowH, rowAlt);
    drawRect(margin + colPlate, y, colModel, vehRowH, white);
    drawRect(margin + colPlate + colModel, y, colMile, vehRowH, white);
    drawRectBorder(margin, y + 1, contentW, vehRowH, rgb(0.5, 0.5, 0.5));

    const parts = jc.parts || [];
    const makeModelParts = (jc.vehicle_make_model || '').split(' ');
    const modelName = makeModelParts.slice(1).join(' ') || jc.vehicle_make_model || 'AQUA';

    textCenter(jc.vehicle_plate || 'WP KY-5728', margin, y, colPlate, { font: boldFont, size: 9, color: darkBlue });
    textCenter(modelName, margin + colPlate, y, colModel, { font: boldFont, size: 9, color: black });
    textCenter(`${jc.mileage_at_intake ? jc.mileage_at_intake.toLocaleString() + ' Km' : '176 705 Km'}`, margin + colPlate + colModel, y, colMile, { font: regularFont, size: 9, color: black });
    y -= vehRowH + 4;

    // ═══════════════════════════════════════════════════════════
    // 4. CUSTOMER REQUEST ROW
    // ═══════════════════════════════════════════════════════════
    const reqH = 18;
    const reqLabelW = contentW * 0.35;
    drawRect(margin, y, reqLabelW, reqH, darkBlue);
    drawRect(margin + reqLabelW, y, contentW - reqLabelW, reqH, lightBlue);

    textCenter('CUSTOMER REQUEST', margin, y, reqLabelW, { font: boldFont, size: 8.5, color: white });
    text((jc.problem || 'REPAIR BRAKE FLUID LEAK').toUpperCase(), margin + reqLabelW + 8, y, { font: boldFont, size: 8.5, color: black });
    y -= reqH + 2;

    // ═══════════════════════════════════════════════════════════
    // 5. PRODUCTS / PARTS TABLE
    // ═══════════════════════════════════════════════════════════
    const pColSno = 28;
    const pColDesc = contentW * 0.42;
    const pColQty = contentW * 0.09;
    const pColUnit = contentW * 0.14;
    const pColDisc = contentW * 0.10;
    const pColNet = contentW - pColSno - pColDesc - pColQty - pColUnit - pColDisc;

    // Header
    const pHeaderH = 17;
    let px = margin;
    const partsHeaderCols = [
      { w: pColSno, label: 'S. NO.' },
      { w: pColDesc, label: 'PRODUCT DESCRIPTION' },
      { w: pColQty, label: 'QUANTITY' },
      { w: pColUnit, label: 'UNIT PRICE' },
      { w: pColDisc, label: 'DISCOUNT' },
      { w: pColNet, label: 'NET AMOUNT' }
    ];

    partsHeaderCols.forEach(col => {
      drawRect(px, y, col.w, pHeaderH, darkBlue);
      textCenter(col.label, px, y, col.w, { font: boldFont, size: 7.5, color: white });
      px += col.w;
    });
    y -= pHeaderH;

    // Parts Data Rows
    let partsTotal = 0;
    const minPartRows = Math.max((parts.length || 0), 4);
    for (let i = 0; i < minPartRows; i++) {
      const p = parts[i];
      const rowH = 16;
      const bg = i % 2 === 0 ? white : rowAlt;
      drawRect(margin, y, contentW, rowH, bg);
      drawRectBorder(margin, y + 1, contentW, rowH, rgb(0.75, 0.75, 0.75));

      if (p) {
        const lineTotal = (p.sell_price || 0) * (p.qty || 1);
        partsTotal += lineTotal;
        let px2 = margin;
        textCenter(String(i + 1), px2, y, pColSno, { size: 8.5 }); px2 += pColSno;
        text(p.part_name || '', px2 + 3, y, { size: 8 }); px2 += pColDesc;
        textCenter(String(p.qty || 1), px2, y, pColQty, { size: 8.5 }); px2 += pColQty;
        textRight(num(p.sell_price), px2, y, pColUnit - 4, { size: 8.5 }); px2 += pColUnit;
        textCenter('-', px2, y, pColDisc, { size: 8.5, color: grey }); px2 += pColDisc;
        textRight(num(lineTotal), px2, y, pColNet - 4, { size: 8.5, font: boldFont });
      }
      y -= rowH;
    }

    // Sub amount row for parts
    const subRowH = 16;
    const subLabelX = margin + pColSno + pColDesc + pColQty + pColUnit + pColDisc;
    drawRect(margin + pColSno + pColDesc + pColQty, y, contentW - pColSno - pColDesc - pColQty, subRowH, lightBlue);
    drawRectBorder(margin + pColSno + pColDesc + pColQty, y + 1, contentW - pColSno - pColDesc - pColQty, subRowH, rgb(0.5, 0.5, 0.5));
    textRight('SUB AMOUNT', margin, y, subLabelX - margin - 4, { font: boldFont, size: 8.5, color: darkBlue });
    textRight(num(partsTotal), subLabelX, y, pColNet - 4, { font: boldFont, size: 9, color: darkBlue });
    y -= subRowH + 2;

    // ═══════════════════════════════════════════════════════════
    // 6. SERVICES / LABOR TABLE
    // ═══════════════════════════════════════════════════════════
    const labor = jc.labor || [];
    const lColSno = 28;
    const lColDesc = contentW * 0.52;
    const lColHrs = contentW * 0.10;
    const lColRate = contentW * 0.17;
    const lColNet = contentW - lColSno - lColDesc - lColHrs - lColRate;

    // Header
    const lHeaderH = 17;
    let lx = margin;
    const laborHeaderCols = [
      { w: lColSno, label: 'S.NO.' },
      { w: lColDesc, label: 'SERVICE DESCRIPTION' },
      { w: lColHrs, label: 'HOURS' },
      { w: lColRate, label: 'UNIT PRICE' },
      { w: lColNet, label: 'NET AMOUNT' }
    ];

    laborHeaderCols.forEach(col => {
      drawRect(lx, y, col.w, lHeaderH, darkBlue);
      textCenter(col.label, lx, y, col.w, { font: boldFont, size: 7.5, color: white });
      lx += col.w;
    });
    y -= lHeaderH;

    // Labor Data Rows
    let laborTotal = 0;
    const minLaborRows = Math.max((labor.length || 0), 4);
    for (let i = 0; i < minLaborRows; i++) {
      const l = labor[i];
      const rowH = 16;
      const bg = i % 2 === 0 ? white : rowAlt;
      drawRect(margin, y, contentW, rowH, bg);
      drawRectBorder(margin, y + 1, contentW, rowH, rgb(0.75, 0.75, 0.75));

      if (l) {
        const lineTotal = (l.hours || 0) * (l.rate || 0);
        laborTotal += lineTotal;
        let lx2 = margin;
        textCenter(String(i + 1), lx2, y, lColSno, { size: 8.5 }); lx2 += lColSno;
        text(l.description || '', lx2 + 3, y, { size: 8 }); lx2 += lColDesc;
        textCenter(String(l.hours || ''), lx2, y, lColHrs, { size: 8.5 }); lx2 += lColHrs;
        textRight(num(l.rate), lx2, y, lColRate - 4, { size: 8.5 }); lx2 += lColRate;
        textRight(num(lineTotal), lx2, y, lColNet - 4, { font: boldFont, size: 8.5 });
      }
      y -= rowH;
    }

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
      textCenter(label, totalLabelX, y, lblW, { font: boldFont, size: isLast ? 8.5 : 8, color: textColor });
      textRight(value, totalLabelX + lblW, y, valW - 4, { font: boldFont, size: isLast ? 9.5 : 8.5, color: textColor });
      y -= rowH;
    };

    drawTotalRow('SUB AMOUNT', num(laborTotal), lightBlue, darkBlue);
    drawTotalRow('INVOICE TOTAL AMOUNT', num(grandTotal), darkBlue, white);
    drawTotalRow('ADVANCE PAYMENT', '-', rowAlt, black);
    drawTotalRow('NET AMOUNT TO PAY', lkr(grandTotal), darkBlue, golden, true);

    // ═══════════════════════════════════════════════════════════
    // 8. SIGNATURE BOXES
    // ═══════════════════════════════════════════════════════════
    y -= 10;
    const sigW = 160;
    const sigH = 34;

    drawRect(margin, y, sigW, sigH, rgb(0.92, 0.92, 0.92));
    drawRectBorder(margin, y + 1, sigW, sigH, rgb(0.6, 0.6, 0.6));
    text('......................................', margin + 20, y - 8, { color: grey, size: 8 });
    textCenter('Prepared By', margin, y - 24, sigW, { font: boldFont, size: 8.5, color: black });

    drawRect(margin + sigW + 20, y, sigW, sigH, rgb(0.92, 0.92, 0.92));
    drawRectBorder(margin + sigW + 20, y + 1, sigW, sigH, rgb(0.6, 0.6, 0.6));
    text('......................................', margin + sigW + 40, y - 8, { color: grey, size: 8 });
    textCenter('Authorised By', margin + sigW + 20, y - 24, sigW, { font: boldFont, size: 8.5, color: black });

    y -= sigH + 18;

    // ═══════════════════════════════════════════════════════════
    // 9. BACKGROUND WATERMARK
    // ═══════════════════════════════════════════════════════════
    page.drawText('PRO TECH AUTOMOBILE', {
      x: 60, y: 280,
      font: boldFont, size: 40,
      color: rgb(0.85, 0.88, 0.94),
      opacity: 0.15,
      rotate: { type: 'degrees', angle: 25 }
    });

    // ═══════════════════════════════════════════════════════════
    // 10. FOOTER THANK YOU MESSAGE
    // ═══════════════════════════════════════════════════════════
    drawLine(margin, y, W - margin, y, midBlue, 1.5);
    y -= 14;
    textCenter('THANK YOU FOR YOUR CHOISE !!!', margin, y, contentW, { font: boldFont, size: 10, color: midBlue });
    y -= 12;
    textCenter('COME AGAIN....', margin, y, contentW, { font: italicFont, size: 9, color: midBlue });
    y -= 8;
    drawLine(margin, y, W - margin, y, midBlue, 1.5);

    // ─── SAVE AND TRIGGER DOWNLOAD ───────────────────────────
    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `ProTech_Invoice_${jc.job_card_id || jc.id}_${jc.vehicle_plate}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    console.log(`[PDF] Downloaded ProTech letterhead PDF: ProTech_Invoice_${jc.job_card_id}.pdf`);
  }
};
