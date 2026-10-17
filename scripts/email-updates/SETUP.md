# Ashwa Racing email updates

The site uses Google Sheets and Apps Script for signups and email delivery. Readers confirm their address before receiving automatic alerts about new blog posts and newsletters. Sponsor updates use a separate opt-in list and can be sent from a draft in the spreadsheet. Every message has an unsubscribe link.

## One-time setup

1. Create a private Google Sheet named **Ashwa Racing Email Updates**.
2. In the sheet, open **Extensions → Apps Script**. Replace `Code.gs` with the code in this folder and save it.
3. Run `setupEmailUpdates` from the Apps Script editor and approve the Google Sheets, email, and external request permissions. This creates the subscriber and sponsor-draft tabs and installs an hourly check for new site posts/newsletters. The initial check records current content without sending a launch email.
4. In Apps Script, choose **Deploy → New deployment → Web app**. Set **Execute as** to your account and access to **Anyone**. Deploy and copy the Web app URL ending in `/exec`.
5. In the website repository, set `endpoint` in `assets/data/email-updates-config.json` to that URL, then publish the website.
6. Reload the spreadsheet to see the **Ashwa Updates** menu. Add a subject, short summary, and public link to row 2 of **Sponsor Update Draft**, then choose **Ashwa Updates → Send sponsor briefing**.

Keep the spreadsheet private. The public site only needs the Apps Script Web app URL; do not put credentials or tokens in the website repository. If you edit `Code.gs` after deploying, create a new deployment version so the web app receives the change.

## How the lists work

- The site footer collects readers interested in blog, newsletter, and team updates.
- The sponsorship page has its own signup for current and prospective partners.
- New reader signups stay pending until the address owner clicks the confirmation email.
- New blog articles and newsletter issues are detected hourly and emailed to confirmed reader subscribers.
- Sponsor briefings are sent only to confirmed sponsor subscribers from the draft tab.
- Unsubscribing applies to the audience they joined. Each list can be unsubscribed separately.

The Apps Script account’s available email quota limits daily sends. The script sends messages individually so subscriber addresses are never exposed to other recipients.
