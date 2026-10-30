# Carve Workspace receipt generator

Status: proposed design for approval, 30 October 2026.

## Intent

Give the front desk one place to create a polished receipt for either studio,
inside the existing public Carve Workspace. Staff enter a client's name and
purchases, check the 8% SST calculation, and download a PDF. The user selected
generate/download first rather than shared receipt history, and requested an
incrementing receipt number for each generation.

## Agreed requirements

- Add Receipt as the second active tool, immediately after Heater Schedule.
- Keep tool navigation and source code in the existing website/repository.
- Choose Carve @ Society MK or Carve Labs @ Steppes MK before issuing.
- Use the existing Carve wordmark for both outlets.
- Require a nonblank client name; phone and email are optional.
- Support one or more purchased items, each with a description and price.
- Staff enter prices before SST. Show subtotal, SST (8%), and total separately.
- Generate a downloadable, printable receipt, with an incrementing number.
- Preserve the existing design, heater functionality, and four-second gallery.

## Approaches

1. Browser-only PDF generator (user selected): stays on GitHub Pages, needs no
   login or server, and keeps customer input on the device. It cannot coordinate
   receipt numbers or retain shared history across different devices.
2. Shared issuance and history: authenticated backend and private database,
   providing centrally allocated numbers across devices. Deferred by the user.

## Proposed defaults requiring approval

- Independent outlet sequences, starting at CARVE-000001 and LABS-000001.
  These prefixes are a design proposal, not an existing company numbering policy.
- Numbers increase by one within each outlet's sequence and do not reset annually.
- Counters persist in this browser on this device. Separate computers/profiles
  have separate counters. Clearing website data loses the saved counters.
- A small Numbering section shows the next number and lets staff set a higher
  starting number when continuing an existing series or recovering from a cleared
  browser. Never silently reset a corrupt counter or lower a saved sequence.
- Date defaults to today in Asia/Kuala_Lumpur and can be changed before issuance.
- Quantity defaults to one; staff may change it for repeated purchases. Prices
  and totals are in MYR, with two decimal places.
- Label the document Receipt. Do not claim to issue a validated e-Invoice.

## Outlet details

Carve @ Society MK

- KYU BRANDS SDN. BHD.
- Company registration: 202201044053 (1489750-D)
- S-B3-05, Society @ Mont Kiara, 4, Jalan Kiara 1, Mont Kiara,
  50480 Kuala Lumpur

Carve Labs @ Steppes MK

- KYU LABS SDN. BHD.
- Company registration: 202501054659 (1656065-T)
- UG-03-1, Steppes, 32, Jalan Kiara 3, Mont Kiara, 51200 Kuala Lumpur,
  Wilayah Persekutuan

Both outlets: +60 14 365 7688; admin@carve.my.

Company names and registration numbers were checked against the supplied
incorporation certificates. Only the business details above belong in product
source; the certificates, QR codes, source paths, and portal user IDs do not.
An SSM company registration number must not be labelled an SST registration
number. No SST registration number was supplied; do not invent one or imply
tax/e-Invoice compliance. Apply the user's requested 8% to all entered purchases.

## User experience

The Receipt page has an outlet chooser, a clear form, and a paper-style receipt
preview. On desktop the form and preview sit alongside each other; on phones
they stack. Use the workspace's ivory, charcoal, and bronze palette, generous
white space, and the existing fonts/wordmark. The downloaded receipt uses a white
background, dark type, fine rules, and a restrained total block.

Fields: outlet, receipt date, required client name, optional phone/email, and
repeatable item rows with description, quantity, and price before SST. Blank
name, blank item description, missing/invalid price, invalid quantity, or invalid
supplied email blocks generation with a specific accessible message. Reject
negative/nonfinite prices and fractional quantities. At least one item must
remain. Zero-price items are allowed. Use integer sen for arithmetic; round
8% SST once on the full subtotal to the nearest sen, half up.

Generating validates the draft and creates a frozen receipt snapshot with the
allocated outlet number. Only successful PDF preparation advances the persisted
counter. Save the counter before offering the download, so cancellation of the
browser download does not reuse an issued number. Disable repeat submission
while preparing. After issuance, show Download again, Print, and New receipt;
re-download/print use the same snapshot and number. Editing requires New receipt
and another issued number. The preview must distinguish a draft's next number
from an issued number. Changing outlets updates company details and next number.

The PDF includes wordmark, outlet, legal company name/registration, outlet
address/contact, receipt number/date, client details if supplied, item table,
subtotal, SST rate/amount, total, and a short thank-you footer. Long names/items
wrap; lengthy receipts paginate without clipped rows or missing totals. Every
page retains receipt identity. Printing uses the generated receipt rather than
the workspace navigation or editable form. No external tool page opens.

## Persistence and failure handling

Only sequence metadata is persisted locally, not client names, contact details,
items, PDFs, or receipt history. Drafts and the current issued receipt live in
memory; reloading discards them. Explain that downloads should be saved before
leaving, and that numbering is limited to the current browser/device.

Allocate numbers under a same-origin browser lock, rereading persistent state
inside the lock so multiple tabs do not allocate the same outlet number. Protect
numbering edits with the same lock. If reliable persistence/locking is unavailable
or a counter is corrupt, block issuance with a useful recovery message instead
of silently generating potentially duplicate numbers. A failed PDF must not
consume a number; a failed save must not offer an unrecorded issued receipt.

No network requests contain receipt/customer data. Package required PDF assets
with the repository rather than submitting information to a PDF conversion
service. Treat user text as text, never HTML. Preserve Unicode client names and
item text in the downloaded output, or show a clear supported-input validation
error rather than silently losing glyphs. Rendering technique/library selection
is left to the builder, using a pinned, locally served, licensed dependency if
needed. Existing brand assets should be reused.

## Non-goals

Shared records/counters across devices; accounts; payment collection; refunds;
accounting integration; automatic email or WhatsApp sending; SST registration
verification; government e-Invoice submission. No original certificate uploads.

## Verification and release

Test required client-name validation, optional contacts, multiple items,
quantities, exact decimal arithmetic/SST rounding, both outlet identities,
counter increment/persistence, re-download identity, same-browser tab allocation,
and failed preparation/storage. Test long/multilingual names and multipage
receipts. Visually inspect generated PDFs and the form/preview at desktop and
phone widths. Run existing heater tests as regression checks. Check exported
files contain no unrelated/customer test data in the public source.

Publish to the existing public GitHub repository and GitHub Pages after approval,
implementation, and verification. Refresh content versions for changed imports
and styles so returning front desks receive the update.
