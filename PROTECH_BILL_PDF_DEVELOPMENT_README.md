# ProTech GarageFlow ERP — Bill / Invoice PDF Development Specification

## Purpose

This document extends the GarageFlow ERP development requirements with the **ProTech sample bill/invoice layout** supplied as `PRO TECH 43.pdf`.

The application must generate a **printable PDF bill/invoice** from job-card and payment data while preserving the structure and information shown in the ProTech sample.

### Sample reference data

- Invoice No: **43**
- Date: **7/27/2026**
- Customer: **MR. LALITH WICKRAMASINGHE**
- Contact: **0714408770**
- Vehicle Registration: **WP KY-5728**
- Model: **AQUA**
- Mileage: **176 705 Km**
- Customer Request/Repair: **BRAKE FLUID LEAK**
- Service Description: **REPLACE FRONT LHS BRAKE HOSE**
- Parts subtotal shown: **LKR 12,262.50**
- Invoice amount shown: **LKR 14,762.50**

The supplied bill also contains sections for parts/products, labor/service, sub amounts, advance payment, net amount to pay, invoice total, prepared by, authorised by, customer/vehicle details, and a thank-you message.

> The above values are reference/test data only. Never hard-code them into production code.

---

# 1. Core Requirement

The PDF must be a **real dynamically generated invoice**, not a screenshot or static template.

Required flow:

```text
Job Card
   ↓
Parts + Labor
   ↓
Invoice Calculation
   ↓
Invoice Record
   ↓
PDF Generator
   ↓
Printable ProTech Bill
```

Use `pdf-lib`, as specified by the original GarageFlow requirements.

---

# 2. Bill Layout

Treat `PRO TECH 43.pdf` as the visual reference.

The PDF should contain, in approximately the same order:

```text
Invoice Number / Date
Customer / Contact
Vehicle Registration / Model / Mileage
Customer Request / Repair
Service Description
Parts / Products Table
Parts Sub Amount
Labor / Service Table
Labor Sub Amount
Subtotal
Advance Payment
Net Amount To Pay
Invoice Total Amount
Prepared By
Authorised By
Thank-you message
```

### Parts table

```text
S.No | Product Description | Quantity | Unit Price | Discount | Net Amount
```

### Labor table

```text
S.No | Hours | Unit Price | Net Amount
```

Numeric columns should be right-aligned and descriptions left-aligned.

---

# 3. Invoice Data

The invoice must retain structured data sufficient to reproduce the bill.

Recommended fields:

```js
{
  invoiceNumber,
  jobCardId,
  vehiclePlate,
  vehicleId,
  customerId,
  customerName,
  customerPhone,
  model,
  mileage,
  customerRequest,
  serviceDescription,
  partsSubtotal,
  laborSubtotal,
  discount,
  tax,
  subtotal,
  advancePayment,
  netAmountToPay,
  invoiceTotal,
  paidAmount,
  balance,
  paymentStatus,
  preparedBy,
  authorisedBy,
  date,
  createdAt,
  updatedAt
}
```

Keep customer/vehicle information historically accurate on an invoice where required.

---

# 4. Parts Calculation

Each part contains:

```text
part_name
cost_price
sell_price
qty
discount
```

Recommended calculation:

```text
Net Amount = (Quantity × Unit Price) - Discount
```

Parts profit remains:

```text
Part Profit = (Sell Price - Cost Price) × Quantity
```

The sample contains:

```text
FLEXIBLE HOSE FRONT BRAKE LHS (GENUINE RECONDITION)
Qty: 1
Unit Price: LKR 8,500.00
Net Amount: LKR 8,500.00

BRAKE FLUID SEIKEN BF3 DOT3
Qty: 0.7
Unit Price: LKR 5,375.00
Net Amount: LKR 3,762.50
```

Parts subtotal:

```text
LKR 12,262.50
```

---

# 5. Labor Calculation

Labor remains separate from parts.

Required fields:

```text
Hours
Unit Price / Labor Rate
Net Amount
```

Recommended calculation:

```text
Labor Net Amount = Hours × Labor Rate
```

The supplied sample contains a labor row and totals that appear visually inconsistent. Therefore, **do not reproduce an apparent arithmetic inconsistency as application logic**.

The final labor calculation rule must be confirmed with the business if their actual billing process differs.

---

# 6. Financial Summary

Display:

```text
SUB AMOUNT
ADVANCE PAYMENT
NET AMOUNT TO PAY
INVOICE TOTAL AMOUNT
```

Recommended calculation:

```text
Parts Subtotal + Labor Subtotal = Subtotal

Subtotal - Discount + Tax = Invoice Total

Invoice Total - Advance/Paid Amount = Net Amount To Pay
```

For example:

```text
Parts: LKR 12,262.50
Labor: LKR 2,500.00
Subtotal: LKR 14,762.50
```

Use the finalized business calculation rules for the production application.

---

# 7. Payments

Support:

```text
Pending
Partially Paid
Paid
```

Recommended:

```text
Paid Amount = 0
→ Pending

0 < Paid Amount < Invoice Total
→ Partially Paid

Paid Amount >= Invoice Total
→ Paid
```

Display:

```text
INVOICE TOTAL AMOUNT
ADVANCE PAYMENT
NET AMOUNT TO PAY
PAYMENT STATUS
```

The original GarageFlow system supports full and partial payments.

For stronger accounting, consider:

```text
payments/{paymentId}

invoice_id
amount
payment_method
reference
received_by
date
notes
```

Then calculate total paid from payment records and optionally cache `paid_amount` on the invoice.

---

# 8. Customer & Vehicle Details

The PDF must dynamically display:

```text
CUSTOMER NAME
CONTACT NUMBER
VEHICLE REGISTRATION NUMBER
MODEL
MILEAGE
```

Example reference:

```text
CUSTOMER NAME :- MR. LALITH WICKRAMASINGHE
CONTACT NUMBER :- 0714408770

VEHICLE REGISTRATION NUMBER :- WP KY-5728
MODEL :- AQUA
MILEAGE :- 176 705 Km
```

Do not hard-code these values.

---

# 9. Repair Information

Map the job card data into:

```text
CUSTOMER REQUEST / REPAIR
SERVICE DESCRIPTION
```

Recommended mapping:

```text
Customer Request
    ← job_cards.problem

Service Description
    ← job/service description
```

---

# 10. Prepared By / Authorised By

The bill must contain:

```text
……………………………….
Prepared By

……………………………….
Authorised By
```

Recommended fields:

```text
preparedBy
authorisedBy
```

Use printed names and signature lines unless digital signatures are explicitly requested.

---

# 11. Invoice Numbering

The sample uses:

```text
IN. NO. :- 43
```

Invoice numbers must:

- Be unique.
- Be persisted.
- Remain unchanged when reprinting.
- Not be regenerated when a PDF is downloaded again.
- Be safe under concurrent staff operations.

Recommended Firestore transaction approach:

```text
Read invoice counter
      ↓
Increment counter
      ↓
Assign invoice number
      ↓
Create invoice
```

Confirm the final numbering format with ProTech before production.

---

# 12. Currency

The sample uses Sri Lankan Rupees.

Use:

```text
LKR
```

Example:

```text
LKR 14,762.50
```

Store monetary values as numbers, not strings containing currency symbols.

Create a centralized formatter:

```text
src/js/utils/currency.js
```

Example responsibility:

```text
formatLKR()
```

---

# 13. PDF Generator

Create:

```text
src/js/services/pdfInvoiceService.js
```

Recommended functions:

```text
generateInvoicePdf(invoiceId)
generateInvoicePdfFromData(invoiceData)
downloadInvoicePdf()
printInvoicePdf()
```

Keep PDF rendering separate from UI code.

Recommended flow:

```text
Invoice Screen
      ↓
Generate PDF
      ↓
Load Invoice
      ↓
Load Job Card
      ↓
Load Parts
      ↓
Load Labor
      ↓
Load Customer/Vehicle
      ↓
Calculate
      ↓
Render PDF
```

---

# 14. PDF Layout Helpers

Create reusable functions such as:

```text
drawHeader()
drawCustomerDetails()
drawVehicleDetails()
drawRepairDetails()
drawPartsTable()
drawLaborTable()
drawTotals()
drawPaymentDetails()
drawSignatures()
drawFooter()
drawWrappedText()
calculateTextHeight()
drawTableRow()
```

This prevents one huge PDF function and makes layout changes easier.

---

# 15. Text & Table Alignment

Use:

### Left alignment

```text
Customer Name
Product Description
Service Description
Repair Description
```

### Right alignment

```text
Quantity
Hours
Unit Price
Discount
Net Amount
Subtotal
Tax
Total
Paid
Balance
```

### Center alignment

```text
S.No
```

Long product descriptions must wrap without overlapping price columns.

---

# 16. Dynamic Rows

Never hard-code the sample's number of rows.

The PDF must support:

```text
1 part
2 parts
10 parts
25+ parts
```

and:

```text
1 labor item
2 labor items
10+ labor items
```

If content exceeds one page:

```text
Page 1
   ↓
Page 2
   ↓
Continue tables
   ↓
Final totals
```

Implement proper page-break logic.

---

# 17. Long Text

These fields may become long:

```text
Product Description
Customer Request
Service Description
Diagnosis
Internal Notes
```

Use wrapping.

Never allow:

```text
Text
  ↓
Overlaps next column
  ↓
Unreadable PDF
```

---

# 18. PDF Page Size

Do not assume the final bill is A4.

The supplied ProTech PDF must be visually inspected to determine the reference page proportions.

Before production, confirm:

- Physical paper size
- Printer model
- Printer driver
- Thermal/receipt versus normal paper
- Required margins

If ProTech uses a custom paper size, configure the `pdf-lib` page dimensions accordingly.

---

# 19. Invoice UI

The Invoice page should contain:

```text
Invoice Number
Invoice Date

Customer Name
Contact

Vehicle Registration
Model
Mileage

Customer Request
Service Description

Parts
Labor

Subtotal
Discount
Tax
Invoice Total

Advance / Paid
Balance
Payment Status

Prepared By
Authorised By

[Generate PDF]
[Print Invoice]
[Record Payment]
```

The existing UI reference already includes PDF export, invoice printing, payment recording, total paid, remaining balance, and payment transaction history.

---

# 20. Reprint

Previous invoices must be reprintable:

```text
Invoice History
      ↓
Open Invoice
      ↓
Generate PDF
```

Reprinting must:

- Preserve invoice number.
- Preserve original invoice data.
- Not create a new invoice.
- Not create a duplicate payment.
- Produce a printable PDF.

---

# 21. Security

Keep existing GarageFlow Admin/Staff permissions.

Admin-only:

```text
Apply Discount
Reopen Locked Job
Manage Users
Change Settings
```

Do not rely only on hidden buttons.

Firebase security rules must enforce authorization.

---

# 22. Audit Trail

Record important financial events:

```text
Invoice Created
Payment Recorded
Discount Applied
Invoice Corrected
Job Reopened
```

Recommended audit fields:

```js
{
  action,
  userId,
  userName,
  timestamp,
  invoiceId,
  jobCardId
}
```

---

# 23. Suggested Files

```text
src/
└── js/
    ├── services/
    │   ├── invoiceService.js
    │   ├── paymentService.js
    │   └── pdfInvoiceService.js
    │
    └── utils/
        ├── calculations.js
        ├── currency.js
        ├── date.js
        └── pdf.js
```

### `invoiceService.js`

```text
createInvoice()
getInvoice()
getInvoices()
updateInvoice()
```

### `paymentService.js`

```text
recordPayment()
getInvoicePayments()
calculatePaidAmount()
calculateBalance()
```

### `pdfInvoiceService.js`

```text
generateInvoicePdf()
drawHeader()
drawCustomerDetails()
drawPartsTable()
drawLaborTable()
drawTotals()
drawSignatures()
```

### `calculations.js`

```text
calculatePartTotal()
calculatePartProfit()
calculateLaborTotal()
calculateSubtotal()
calculateTax()
calculateInvoiceTotal()
calculateBalance()
```

---

# 24. Sample Test Case

Use the supplied ProTech sample as a manual PDF regression test.

### Customer

```text
MR. LALITH WICKRAMASINGHE
0714408770
```

### Vehicle

```text
WP KY-5728
AQUA
176 705 Km
```

### Repair

```text
BRAKE FLUID LEAK
```

### Service

```text
REPLACE FRONT LHS BRAKE HOSE
```

### Parts

```text
FLEXIBLE HOSE FRONT BRAKE LHS (GENUINE RECONDITION)
Qty: 1
Unit Price: LKR 8,500.00
Net: LKR 8,500.00

BRAKE FLUID SEIKEN BF3 DOT3
Qty: 0.7
Unit Price: LKR 5,375.00
Net: LKR 3,762.50
```

### Parts subtotal

```text
LKR 12,262.50
```

### Labor reference

```text
Hours: 1.25
Unit Price: LKR 2,500.00
```

### Sample displayed invoice amount

```text
LKR 14,762.50
```

Verify the intended labor calculation before making this a strict automated expected-value test.

---

# 25. PDF Acceptance Checklist

- [ ] Invoice number displayed.
- [ ] Date displayed.
- [ ] Customer name correct.
- [ ] Customer phone correct.
- [ ] Vehicle registration correct.
- [ ] Model correct.
- [ ] Mileage correct.
- [ ] Customer request displayed.
- [ ] Service description displayed.
- [ ] All parts displayed.
- [ ] All labor items displayed.
- [ ] Quantities correct.
- [ ] Hours correct.
- [ ] Unit prices correct.
- [ ] Discounts correct.
- [ ] Parts subtotal correct.
- [ ] Labor subtotal correct.
- [ ] Subtotal correct.
- [ ] Tax correct when applicable.
- [ ] Advance/paid amount correct.
- [ ] Balance correct.
- [ ] Invoice total correct.
- [ ] Payment status correct.
- [ ] Prepared By displayed.
- [ ] Authorised By displayed.
- [ ] Thank-you message displayed.
- [ ] LKR formatting correct.
- [ ] Tables aligned.
- [ ] Long text wraps correctly.
- [ ] No text overlaps.
- [ ] No content is clipped.
- [ ] Multiple parts work.
- [ ] Multiple labor items work.
- [ ] Multi-page invoices work.
- [ ] Reprinting preserves invoice number.
- [ ] PDF prints correctly.

---

# 26. PDF Visual QA

Do not consider the PDF feature complete just because `pdf-lib` produces a file.

Use this process:

```text
Generate PDF
     ↓
Open PDF
     ↓
Compare against PRO TECH 43.pdf
     ↓
Check:
  spacing
  alignment
  fonts
  table widths
  totals
  signatures
  footer
  page breaks
     ↓
Adjust
     ↓
Generate again
```

The goal is a **professional digital version of the ProTech bill**, not merely a technically valid PDF.

---

# 27. Development Tasks

## Phase A — Data

- [ ] Review existing invoice schema.
- [ ] Implement invoice numbering.
- [ ] Add customer/vehicle information.
- [ ] Add parts subtotal.
- [ ] Add labor subtotal.
- [ ] Add discount.
- [ ] Add tax.
- [ ] Add advance/paid amount.
- [ ] Add balance.
- [ ] Add payment status.
- [ ] Add prepared-by information.
- [ ] Add authorised-by information.

## Phase B — Invoice UI

- [ ] Build invoice details.
- [ ] Build parts table.
- [ ] Build labor table.
- [ ] Build financial summary.
- [ ] Build payment section.
- [ ] Add Generate PDF.
- [ ] Add Print Invoice.
- [ ] Add Record Payment.
- [ ] Add payment history.

## Phase C — PDF

- [ ] Create `pdfInvoiceService.js`.
- [ ] Measure/reference page size.
- [ ] Build header.
- [ ] Build customer/vehicle section.
- [ ] Build repair section.
- [ ] Build parts table.
- [ ] Build labor table.
- [ ] Build totals.
- [ ] Build payment information.
- [ ] Build signatures.
- [ ] Build footer.
- [ ] Add text wrapping.
- [ ] Add page breaks.
- [ ] Add multi-page table support.

## Phase D — QA

- [ ] Compare with ProTech sample.
- [ ] Test one part.
- [ ] Test multiple parts.
- [ ] Test one labor line.
- [ ] Test multiple labor lines.
- [ ] Test long descriptions.
- [ ] Test discount.
- [ ] Test tax.
- [ ] Test advance payment.
- [ ] Test partial payment.
- [ ] Test fully paid invoice.
- [ ] Test unpaid invoice.
- [ ] Test reprint.
- [ ] Test multi-page invoice.
- [ ] Test printing.

---

# 28. Important Development Rules

The coding agent must:

1. Read the existing GarageFlow README before changing the project.
2. Inspect existing invoice/job-card code before changing schemas.
3. Treat `PRO TECH 43.pdf` as the bill visual reference.
4. Never hard-code sample customer data.
5. Keep calculations centralized.
6. Keep PDF generation separate from UI.
7. Preserve Firebase architecture.
8. Preserve Admin/Staff permissions.
9. Use `pdf-lib`.
10. Generate PDFs dynamically from Firestore/application data.
11. Support arbitrary parts and labor rows.
12. Support partial payments.
13. Support invoice reprinting.
14. Preserve invoice numbers during reprinting.
15. Implement proper page breaks.
16. Test the generated PDF against the supplied ProTech sample.
17. Avoid changing unrelated modules.
18. Document all schema changes.
19. Do not silently change business calculations.
20. Ask for confirmation when the sample and requirements contain ambiguous financial rules.

---

# 29. Final Workflow

The completed system should provide:

```text
SEARCH VEHICLE
      ↓
CUSTOMER / VEHICLE
      ↓
JOB CARD
      ↓
DIAGNOSIS
      ↓
PARTS + LABOR
      ↓
READY
      ↓
LOCK JOB CARD
      ↓
CREATE INVOICE
      ↓
GENERATE PROTECH PDF BILL
      ↓
PAYMENT
      ↓
DELIVERY
      ↓
SERVICE REMINDER
```

The final objective is:

> **Convert the existing ProTech paper bill format into a dynamically generated, print-ready PDF invoice using the actual customer, vehicle, job-card, parts, labor, and payment information stored by GarageFlow ERP.**
