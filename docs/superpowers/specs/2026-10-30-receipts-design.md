# Carve Workspace receipt generator

Status: revised per user direction, 30 October 2026. No receipt numbers; editable generation date.

## Intent

Give the front desk one place to create a polished receipt for either studio,
inside the existing public Carve Workspace. Staff enter a client's name and
purchases, check the 8% SST calculation, and download a PDF. The user selected
generate/download first rather than shared receipt history, and subsequently removed receipt numbering entirely.

## Agreed requirements

- Add Receipt as the second active tool, immediately after Heater Schedule.
- Keep tool navigation and source code in the existing website/repository.
- Choose Carve @ Society MK or Carve Labs @ Steppes MK before issuing.
- Use the existing Carve wordmark for both outlets.
- Require a nonblank client name; phone and email are optional.
- Support one or more purchased items, each with a description and price.
- Staff enter prices before SST. Show subtotal, SST (8%), and total separately.
- Generate a downloadable, printable receipt without a receipt number.
- Default the receipt date to the date of generation in Malaysia; allow staff to change it.
- Preserve the existing design, heater functionality, and four-second gallery.

## Approaches

1. Browser-only PDF generator (user selected): stays on GitHub Pages, needs no
   login or server, and keeps customer input on the device. It cannot coordinate
   receipt numbers or retain shared history across different devices.
2. Shared issuance and history: authenticated backend and private database,
   providing centrally allocated numbers across devices. Deferred by the user.

## Design decisions

- No receipt numbers, numbering counters, database, sign-in, or shared history.
- Date defaults to the generation date in Asia/Kuala_Lumpur. Refresh the automatic
  date when generating if midnight has passed since opening the form. Staff can
  explicitly change the date; a Use today action restores the automatic date.
- Quantity defaults to one; prices and totals are in MYR with two decimal places.
- Label the document Receipt, without claiming validated e-Invoice status.
- Keep all receipt/customer data in memory and in files staff choose to download.

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

Both outlets: 60143657688; admin@carve.my.

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

Generating validates the current draft, refreshes an automatic date, and creates
an immutable snapshot for that PDF download. The form remains editable; staff
can make changes and generate again. Disable repeated submission while preparing.
The live preview is labelled Preview, never Issued. Changing outlets updates the
company details. Offer PDF download, Print, and Clear form, with confirmation
before clearing entered information. No receipt number is shown or generated.

The PDF includes wordmark, outlet, legal company name/registration, outlet
address/contact, receipt date, client details if supplied, item table, subtotal,
SST rate/amount, total, and a short thank-you footer. Long names/items wrap;
lengthy receipts paginate without clipped rows or missing totals. Every page
retains outlet/date identity. Printing shows only the receipt, without navigation
or editable fields. No external tool page opens.

## Data and failure handling

No client data or counters are persisted in local/session storage, uploaded,
placed in URLs, or committed as fixtures. Drafts live in memory; reloading
clears them. If PDF generation fails, preserve the draft and offer a clear retry
message. Use text-safe rendering for all client/item fields.

Locally vendor the existing bundled pdf-lib 1.17.1 with its MIT license. A
browser canvas renderer using locally served brand fonts, the logo and system
font fallbacks renders high-resolution pages into the PDF, preserving Unicode
without uploading content to an external PDF service. The screen/print receipt
remains semantic HTML. The download contains image-based PDF pages; text
selection/search in downloaded PDFs is not part of this version.

## Non-goals

Receipt numbers; shared records/counters across devices; accounts; payment collection; refunds;
accounting integration; automatic email or WhatsApp sending; SST registration
verification; government e-Invoice submission. No original certificate uploads.

## Verification and release

Test required client-name validation, optional contacts, multiple items,
quantities, exact decimal arithmetic/SST rounding, both outlet identities,
automatic dates across Malaysia midnight, explicit date overrides,
and failed PDF preparation. Test long/multilingual names and multipage
receipts. Visually inspect generated PDFs and the form/preview at desktop and
phone widths. Run existing heater tests as regression checks. Check exported
files contain no unrelated/customer test data in the public source.

Publish to the existing public GitHub repository and GitHub Pages after approval,
implementation, and verification. Refresh content versions for changed imports
and styles so returning front desks receive the update.
