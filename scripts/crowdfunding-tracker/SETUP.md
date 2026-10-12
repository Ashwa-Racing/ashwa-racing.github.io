# Crowdfunding bank transfer tracker

This workflow uses a multi-section Google Form for contributor details, a UPI QR payment step, and payment proof, plus a private Google Sheet for finance admins. Every submission enters as **Reported**. The dashboard counts money only after an admin matches it to the bank/UPI account and marks it **Verified**.

## Set it up

1. Use a durable Ashwa Racing Google account that the finance team can retain access to. Avoid an individual student account that may be lost when they graduate.
2. Open [Google Apps Script](https://script.google.com/) while signed into that account and create a project.
3. Replace the starter contents of `Code.gs` with the contents of this folder's `Code.gs`.
4. In the `TRACKER.rewards` settings near the top of the file, set the approved shirt threshold in INR and the Google Drive file ID of the approved UPI QR image. Share the QR image with the account running the script. The script refuses setup until both values are supplied.
5. Select `setupCrowdfundingTracker` and click **Run**. Review and grant the requested Google permissions.
6. Open the generated form in the Forms editor. Find **Payment confirmation screenshot**, change its type from short answer to **File upload**, make it required, and restrict uploads to image files. This manual change is needed because Apps Script cannot create file-upload questions.
7. Open the execution log. Save the **Admin ledger** URL privately for finance admins and share the **Public transfer report form** URL with contributors. Keep the form editor URL restricted to trusted team maintainers.
8. In Drive, check sharing permissions for the form, QR image, and spreadsheet. Share the ledger only with finance admins; form access and spreadsheet access are managed separately.
9. Submit one clearly labeled test report. Confirm the QR appears between the details and proof sections, the image upload works, the report reaches `Tracker` as **Reported**, and the verified total stays unchanged. Remove the test row and linked test response before launch.
10. Match the payment against the bank/UPI account. In `Tracker`, enter the actual credited amount, bank credited date, and verifier, then change Status to **Verified**. Set **Shirt eligible** based on the approved threshold. Use **Needs follow-up** when details do not match and **Duplicate** for a repeated report.
11. For eligible supporters, send the custom reward email and shirt sizing form, mark **Reward confirmation email sent** and **Sizing form sent** as `Yes`, then record shipment date/details in **Admin notes**, set **Goodies shipped** to `Yes`, and add the shipment reference.

## What admins see

- **Dashboard:** verified amount, verified transfer count, reports awaiting a bank match, and reports needing follow-up.
- **Tracker:** one row per form submission, with a generated contribution ID, contact and optional shipping details, public name preference, payment proof link, verification fields, and reward email/shipping progress.
- **Form Responses:** the raw Google Forms response sheet, kept in the same private spreadsheet for troubleshooting.

The UPI reference and screenshot help locate a transfer, but they are not proof of receipt by themselves. Confirm the credit and amount in the account before marking a report verified. The dashboard uses the verified amount, which can differ from the amount a contributor reported. Google Forms file upload requires contributors to sign in to a Google account; test this with the intended audience before launch. Forms with file upload questions need to be kept in the form owner's My Drive (file uploads are not supported from a Shared Drive).

## Before adding a live website button

The generated form URL only exists after setup. Add it to the crowdfunding page once the team has reviewed the form, approved the shirt threshold, and checked that the QR points to the correct Ashwa Racing UPI account. Do not put bank account details in public source code or form text.

This workflow does not connect to the bank, confirm payments automatically, issue tax receipts, or send confirmation emails. Admins send the custom confirmation and sizing-form email after verification, then record fulfilment in the ledger. It stores donor names, email addresses, shipping addresses, transfer references, and uploaded proof, so keep the spreadsheet and its linked upload files restricted to the small finance team and follow the team's retention policy.
