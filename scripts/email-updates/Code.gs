const SUBSCRIBERS_TAB = 'Subscribers';
const DRAFT_TAB = 'Sponsor Update Draft';
const SUBSCRIBER_HEADERS = ['Email', 'Audience', 'Name', 'Company', 'Status', 'Token', 'Requested At', 'Confirmed At'];
const SITE_ORIGIN = 'https://ashwaracing.org';

function setupEmailUpdates() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open this script from the updates spreadsheet, then run setupEmailUpdates.');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheet.getId());
  const subscribers = getSubscribersSheet_();
  if (subscribers.getLastRow() === 0) subscribers.appendRow(SUBSCRIBER_HEADERS);
  subscribers.setFrozenRows(1);
  subscribers.getRange(1, 1, 1, SUBSCRIBER_HEADERS.length).setFontWeight('bold');
  const draft = spreadsheet.getSheetByName(DRAFT_TAB) || spreadsheet.insertSheet(DRAFT_TAB);
  if (draft.getLastRow() === 0) {
    draft.appendRow(['Subject', 'Summary', 'Link']);
    draft.appendRow(['Ashwa Racing update', 'Add the sponsor progress update here.', SITE_ORIGIN]);
    draft.setFrozenRows(1);
  }
  seedKnownContent_();
  ScriptApp.getProjectTriggers().filter(trigger => trigger.getHandlerFunction() === 'notifyReadersOfNewContent').forEach(ScriptApp.deleteTrigger);
  ScriptApp.newTrigger('notifyReadersOfNewContent').timeBased().everyHours(1).create();
  SpreadsheetApp.getUi().alert('Updates are ready. Deploy this script as a Web app, then paste its URL into assets/data/email-updates-config.json in the website repository.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Ashwa Updates')
    .addItem('Send sponsor briefing', 'sendSponsorBriefingFromDraft')
    .addToUi();
}

function doPost(event) {
  const values = event && event.parameter ? event.parameter : {};
  if (values.website) return responsePage_('Thanks', 'If you entered a valid email, check your inbox for a confirmation link.');
  const email = String(values.email || '').trim().toLowerCase();
  const audience = values.audience === 'sponsor' ? 'sponsor' : 'reader';
  if (!values.consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return responsePage_('Check your details', 'Enter a valid email address and tick the consent box to request updates.');
  }

  const sheet = getSubscribersSheet_();
  const rows = sheet.getDataRange().getValues();
  const existing = rows.findIndex((row, index) => index > 0 && String(row[0]).toLowerCase() === email && row[1] === audience);
  if (existing >= 0 && rows[existing][4] === 'active') {
    return responsePage_('You’re already subscribed', 'This email is already receiving these updates. You can unsubscribe from any update email.');
  }
  if (existing >= 0 && rows[existing][4] === 'pending' && Date.now() - new Date(rows[existing][6]).getTime() < 10 * 60 * 1000) {
    return responsePage_('Check your inbox', 'A confirmation link was recently sent. Check your inbox before requesting another one.');
  }
  const token = Utilities.getUuid();
  const now = new Date();
  const record = [email, audience, String(values.name || '').trim(), String(values.company || '').trim(), 'pending', token, now, ''];
  if (existing >= 0) sheet.getRange(existing + 1, 1, 1, record.length).setValues([record]);
  else sheet.appendRow(record);
  const confirmUrl = `${ScriptApp.getService().getUrl()}?action=confirm&token=${encodeURIComponent(token)}`;
  const label = audience === 'sponsor' ? 'Ashwa Racing partner briefings' : 'Ashwa Racing stories and newsletters';
  MailApp.sendEmail({
    to: email,
    subject: `Confirm your subscription to ${label}`,
    body: `Please confirm that you want to receive ${label}:\n\n${confirmUrl}\n\nIf you did not request this, ignore this email.`,
    htmlBody: `<p>Please confirm that you want to receive <strong>${escapeHtml_(label)}</strong>.</p><p><a href="${confirmUrl}">Confirm subscription</a></p><p>If you did not request this, ignore this email.</p>`
  });
  return responsePage_('Check your inbox', 'We’ve sent a confirmation link. Your subscription starts after you confirm your email.');
}

function doGet(event) {
  const action = String(event?.parameter?.action || '');
  const token = String(event?.parameter?.token || '');
  if (!token || !['confirm', 'unsubscribe'].includes(action)) return responsePage_('Ashwa Racing updates', 'Use the signup form on ashwaracing.org to choose your updates.');
  const sheet = getSubscribersSheet_();
  const rows = sheet.getDataRange().getValues();
  const index = rows.findIndex((row, rowIndex) => rowIndex > 0 && row[5] === token);
  if (index < 1) return responsePage_('Link expired', 'This link is invalid. You can submit the signup form again if you still want updates.');
  const row = rows[index];
  if (action === 'confirm') {
    sheet.getRange(index + 1, 5).setValue('active');
    sheet.getRange(index + 1, 8).setValue(new Date());
    const unsubscribeUrl = `${ScriptApp.getService().getUrl()}?action=unsubscribe&token=${encodeURIComponent(token)}`;
    MailApp.sendEmail({ to: row[0], subject: 'You’re subscribed to Ashwa Racing updates', body: `Thanks for subscribing. You can unsubscribe any time: ${unsubscribeUrl}` });
    return responsePage_('Subscription confirmed', 'You’ll receive Ashwa Racing updates. You can unsubscribe at any time using the link in each email.');
  }
  sheet.getRange(index + 1, 5).setValue('unsubscribed');
  sheet.getRange(index + 1, 6).setValue(Utilities.getUuid());
  return responsePage_('You’re unsubscribed', 'You will not receive further updates for this subscription.');
}

function notifyReadersOfNewContent() {
  const data = fetchWebsiteContent_();
  const properties = PropertiesService.getScriptProperties();
  const knownPosts = new Set(JSON.parse(properties.getProperty('KNOWN_POSTS') || '[]'));
  const knownNewsletters = new Set(JSON.parse(properties.getProperty('KNOWN_NEWSLETTERS') || '[]'));
  const newPosts = data.posts.filter(post => post.slug && !knownPosts.has(post.slug));
  const newNewsletters = data.newsletters.filter(file => !knownNewsletters.has(file));
  const readers = getSubscribers_().filter(subscriber => subscriber.audience === 'reader' && subscriber.status === 'active');
  newPosts.forEach(post => {
    const url = `${SITE_ORIGIN}/blog/${encodeURIComponent(post.slug)}`;
    const summary = String(post.excerpt || 'A new story from the Ashwa Racing team.');
    sendUpdateTo_(readers, `New on the Ashwa Racing blog: ${post.title}`, `${summary}\n\nRead the story: ${url}`, url);
  });
  newNewsletters.forEach(file => {
    const match = String(file).match(/^(\d{4})-(\d{2})-([a-z]+)\.pdf$/i);
    if (!match) return;
    const [, year, month, type] = match;
    const url = `${SITE_ORIGIN}/newsletters/${year}-${month}-${type}`;
    sendUpdateTo_(readers, `New Ashwa Racing newsletter: ${monthName_(month)} ${year}`, `A new ${type} edition is available in the newsletter archive.\n\nRead it here: ${url}`, url);
  });
  properties.setProperty('KNOWN_POSTS', JSON.stringify(data.posts.map(post => post.slug).filter(Boolean)));
  properties.setProperty('KNOWN_NEWSLETTERS', JSON.stringify(data.newsletters));
}

function sendSponsorBriefingFromDraft() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getSpreadsheet_().getSheetByName(DRAFT_TAB);
  if (!sheet || sheet.getLastRow() < 2) return ui.alert('Add a subject, summary, and link to the Sponsor Update Draft sheet first.');
  const [subject, summary, url] = sheet.getRange(2, 1, 1, 3).getDisplayValues()[0];
  if (!subject || !summary || !url) return ui.alert('Complete the subject, summary, and link in row 2 of the Sponsor Update Draft sheet.');
  const sponsors = getSubscribers_().filter(subscriber => subscriber.audience === 'sponsor' && subscriber.status === 'active');
  if (!sponsors.length) return ui.alert('There are no confirmed sponsor-update subscribers yet.');
  const sent = sendUpdateTo_(sponsors, subject, `${summary}\n\n${url}`, url);
  ui.alert(`Sent the briefing to ${sent} confirmed sponsor subscriber${sent === 1 ? '' : 's'}.`);
}

function sendUpdateTo_(subscribers, subject, body, url) {
  let sent = 0;
  subscribers.forEach(subscriber => {
    const unsubscribeUrl = `${ScriptApp.getService().getUrl()}?action=unsubscribe&token=${encodeURIComponent(subscriber.token)}`;
    MailApp.sendEmail({
      to: subscriber.email,
      subject,
      body: `${body}\n\nYou receive this because you subscribed to Ashwa Racing updates. Unsubscribe: ${unsubscribeUrl}`,
      htmlBody: `<p>${escapeHtml_(body).replace(/\n/g, '<br>')}<br><a href="${escapeHtml_(url)}">Read the update</a></p><p><small>You receive this because you subscribed to Ashwa Racing updates. <a href="${unsubscribeUrl}">Unsubscribe</a>.</small></p>`
    });
    sent++;
  });
  return sent;
}

function fetchWebsiteContent_() {
  const blogResponse = UrlFetchApp.fetch(`${SITE_ORIGIN}/assets/data/blog.json`, { muteHttpExceptions: true });
  const newsletterResponse = UrlFetchApp.fetch(`${SITE_ORIGIN}/assets/data/newsletters.json`, { muteHttpExceptions: true });
  if (blogResponse.getResponseCode() !== 200 || newsletterResponse.getResponseCode() !== 200) throw new Error('Could not read the live Ashwa Racing blog and newsletter archives.');
  const blog = JSON.parse(blogResponse.getContentText());
  return { posts: Array.isArray(blog.posts) ? blog.posts : [], newsletters: JSON.parse(newsletterResponse.getContentText()) };
}

function seedKnownContent_() {
  const data = fetchWebsiteContent_();
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('KNOWN_POSTS', JSON.stringify(data.posts.map(post => post.slug).filter(Boolean)));
  properties.setProperty('KNOWN_NEWSLETTERS', JSON.stringify(data.newsletters));
}

function getSubscribers_() {
  return getSubscribersSheet_().getDataRange().getValues().slice(1).filter(row => row[0]).map(row => ({ email: row[0], audience: row[1], status: row[4], token: row[5] }));
}

function getSubscribersSheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(SUBSCRIBERS_TAB);
  if (!sheet) sheet = spreadsheet.insertSheet(SUBSCRIBERS_TAB);
  if (sheet.getLastRow() === 0) sheet.appendRow(SUBSCRIBER_HEADERS);
  return sheet;
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Run setupEmailUpdates from the linked Google Sheet first.');
  return SpreadsheetApp.openById(id);
}

function monthName_(month) {
  return new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2020, Number(month) - 1, 1)));
}

function responsePage_(title, message) {
  return HtmlService.createHtmlOutput(`<!doctype html><html><meta name="viewport" content="width=device-width"><title>${escapeHtml_(title)} | Ashwa Racing</title><body style="margin:0;background:#08090c;color:#f7f6f4;font:16px Arial,sans-serif"><main style="max-width:600px;margin:12vh auto;padding:32px;border-top:3px solid #e8001d;background:#191b22"><p style="color:#e8001d;font-weight:bold;letter-spacing:.14em;text-transform:uppercase">Ashwa Racing</p><h1>${escapeHtml_(title)}</h1><p style="line-height:1.6;color:#bbb">${escapeHtml_(message)}</p><a style="color:#fff" href="${SITE_ORIGIN}">Return to ashwaracing.org</a></main></body></html>`).setTitle(`${title} | Ashwa Racing`);
}

function escapeHtml_(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
