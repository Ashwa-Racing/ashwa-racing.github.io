/**
 * Ashwa Racing bank-transfer contribution tracker.
 *
 * Run setupCrowdfundingTracker() once from a new Apps Script project.
 * It creates a public transfer-report form and a private admin ledger.
 */

const TRACKER = {
  formTitle: "Ashwa Racing | Report a Bank Transfer",
  spreadsheetTitle: "Ashwa Racing | Crowdfunding Ledger",
  trackerSheet: "Tracker",
  dashboardSheet: "Dashboard",
  statuses: ["Reported", "Verified", "Needs follow-up", "Duplicate"],
  // Fill these before setup; the script will stop rather than publish a fake payment page.
  rewards: {
    shirtThresholdInr: 0,
    upiQrDriveFileId: ""
  },
  properties: {
    spreadsheetId: "CROWDFUNDING_SPREADSHEET_ID",
    responseFormId: "CROWDFUNDING_FORM_ID"
  }
};

const TRACKER_HEADERS = [
  "Contribution ID",
  "Reported at",
  "Donor name",
  "Email",
  "Name on bank transfer",
  "Reported amount (INR)",
  "Transfer date (reported)",
  "UTR / transaction reference",
  "Donor note",
  "Name for car display",
  "Car name display approved",
  "Shipping address",
  "Status",
  "Verified amount (INR)",
  "Bank credited date",
  "Verified by",
  "Shirt eligible",
  "Sizing form sent",
  "Goodies shipped",
  "Shipment reference",
  "Admin notes",
  "Payment proof file",
  "Reward confirmation email sent",
  "Source response row"
];

/** Creates the form, ledger, dashboard, and submission trigger. */
function setupCrowdfundingTracker() {
  if (!(TRACKER.rewards.shirtThresholdInr > 0)) {
    throw new Error("Set TRACKER.rewards.shirtThresholdInr to the approved shirt reward threshold before setup.");
  }
  if (!TRACKER.rewards.upiQrDriveFileId) {
    throw new Error("Set TRACKER.rewards.upiQrDriveFileId to the approved UPI QR image in Drive before setup.");
  }
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty(TRACKER.properties.spreadsheetId);
  if (existingId) {
    const existingFormId = properties.getProperty(TRACKER.properties.responseFormId);
    Logger.log("Tracker is already set up.");
    Logger.log("Admin ledger: " + SpreadsheetApp.openById(existingId).getUrl());
    if (existingFormId) {
      Logger.log("Transfer report form: " + FormApp.openById(existingFormId).getPublishedUrl());
    }
    return;
  }

  const spreadsheet = SpreadsheetApp.create(TRACKER.spreadsheetTitle);
  const dashboard = spreadsheet.getSheets()[0];
  dashboard.setName(TRACKER.dashboardSheet);
  const trackerSheet = spreadsheet.insertSheet(TRACKER.trackerSheet);
  prepareTrackerSheet_(trackerSheet);
  prepareDashboard_(dashboard);

  const form = createTransferReportForm_();
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());

  properties.setProperties({
    [TRACKER.properties.spreadsheetId]: spreadsheet.getId(),
    [TRACKER.properties.responseFormId]: form.getId()
  });

  ScriptApp.newTrigger("recordCrowdfundingSubmission")
    .forSpreadsheet(spreadsheet)
    .onFormSubmit()
    .create();

  Logger.log("Setup complete.");
  Logger.log("Admin ledger (keep private): " + spreadsheet.getUrl());
  Logger.log("Public transfer report form: " + form.getPublishedUrl());
  Logger.log("Form editor: " + form.getEditUrl());
}

/** Form response spreadsheet trigger. New reports begin unverified. */
function recordCrowdfundingSubmission(event) {
  if (!event || !event.range) throw new Error("This function runs from the form-submit trigger.");

  const responseRow = event.range.getRow();
  const responseValues = event.range.getValues()[0];
  const submittedAt = responseValues[0] instanceof Date ? responseValues[0] : new Date();
  const spreadsheetId = PropertiesService.getScriptProperties()
    .getProperty(TRACKER.properties.spreadsheetId);
  if (!spreadsheetId) throw new Error("Run setupCrowdfundingTracker() first.");

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(TRACKER.trackerSheet);
  if (!sheet) throw new Error("Tracker sheet is missing.");

  const id = contributionId_(submittedAt, responseRow);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const duplicateId = sheet.getRange(2, 1, lastRow - 1, 1)
      .createTextFinder(id)
      .matchEntireCell(true)
      .findNext();
    if (duplicateId) return;
  }

  // The linked response sheet columns follow the form question order below.
  const row = [
    id,
    submittedAt,
    safeText_(responseValues[1]),
    safeText_(responseValues[2]),
    "",
    parseAmount_(responseValues[3]),
    responseValues[7] || "",
    safeText_(responseValues[8]),
    safeText_(responseValues[10]),
    safeText_(responseValues[4]),
    responseValues[5] === "Yes" ? "Yes" : "No",
    safeText_(responseValues[6]),
    "Reported",
    "",
    "",
    "",
    "",
    "No",
    "No",
    "",
    "",
    safeText_(responseValues[9]),
    "No",
    responseRow
  ];

  sheet.appendRow(row);
  const appendedRow = sheet.getLastRow();
  sheet.getRange(appendedRow, 1, 1, TRACKER_HEADERS.length).setVerticalAlignment("middle");
  sheet.getRange(appendedRow, 2).setNumberFormat("dd mmm yyyy, hh:mm");
  sheet.getRange(appendedRow, 6).setNumberFormat("0.00");
  sheet.getRange(appendedRow, 7).setNumberFormat("dd mmm yyyy");
  sheet.getRange(appendedRow, 14).setNumberFormat("0.00");
  sheet.getRange(appendedRow, 15).setNumberFormat("dd mmm yyyy");
}

function createTransferReportForm_() {
  if (!TRACKER.rewards.upiQrDriveFileId) {
    throw new Error("Set TRACKER.rewards.upiQrDriveFileId before creating the public form.");
  }
  const form = FormApp.create(TRACKER.formTitle, true);
  form.setDescription([
    "Use this form to support Ashwa Racing and report your UPI payment.",
    "Your contribution is pending until the finance team matches it to the account. A competition shirt is available for verified contributions of INR " + TRACKER.rewards.shirtThresholdInr + " or more.",
    "The payment proof upload requires a Google account sign-in. Never upload a bank statement or share banking credentials."
  ].join("\n\n"));
  form.setConfirmationMessage(
    "Thanks. Your transfer report has been recorded as pending verification. The Ashwa Racing finance team will confirm it after matching it against the bank statement."
  );

  form.addTextItem().setTitle("Donor name").setRequired(true);

  const emailValidation = FormApp.createTextValidation()
    .requireTextIsEmail()
    .setHelpText("Enter a valid email address.")
    .build();
  form.addTextItem()
    .setTitle("Email address")
    .setRequired(true)
    .setValidation(emailValidation);

  form.addTextItem()
    .setTitle("Name shown on bank transfer (if different)")
    .setRequired(false);

  const amountValidation = FormApp.createTextValidation()
    .requireNumberGreaterThan(0)
    .setHelpText("Enter the amount in rupees, using numbers only.")
    .build();
  form.addTextItem()
    .setTitle("Amount sent (INR)")
    .setRequired(true)
    .setValidation(amountValidation);

  form.addMultipleChoiceItem()
    .setTitle("May we display your name on the car?")
    .setChoiceValues(["Yes", "No"])
    .setRequired(true);
  form.addTextItem()
    .setTitle("Name to display on the car (if yes)")
    .setRequired(false);
  form.addParagraphTextItem()
    .setTitle("Shipping address (only if your contribution qualifies for a shirt)")
    .setHelpText("Include recipient name, street, city, state, postal code, and phone for delivery. This is used only to send your reward.")
    .setRequired(false);

  form.addPageBreakItem()
    .setTitle("Pay by UPI")
    .setHelpText("Scan this Ashwa Racing QR code and complete your contribution. Keep the UPI transaction reference for the next step.");
  form.addImageItem()
    .setTitle("Ashwa Racing UPI payment QR")
    .setImage(DriveApp.getFileById(TRACKER.rewards.upiQrDriveFileId).getBlob());

  form.addPageBreakItem()
    .setTitle("Submit payment details")
    .setHelpText("The finance team will verify the payment before confirming your contribution or arranging any reward.");
  form.addDateItem().setTitle("Date of transfer").setIncludesYear(true).setRequired(true);
  form.addTextItem()
    .setTitle("UPI transaction reference / UTR")
    .setHelpText("Copy the UPI transaction ID from your payment app.")
    .setRequired(true);
  // Apps Script's Forms service cannot create a file-upload question. The form
  // owner must change this placeholder to "File upload" in the Forms editor.
  form.addTextItem()
    .setTitle("Payment confirmation screenshot")
    .setHelpText("Form owner: change this question to File upload and make it required. Contributors should upload the payment success screen only, not a bank statement.")
    .setRequired(false);
  form.addParagraphTextItem()
    .setTitle("Note for the finance team (optional)")
    .setRequired(false);

  return form;
}

function prepareTrackerSheet_(sheet) {
  sheet.getRange(1, 1, 1, TRACKER_HEADERS.length).setValues([TRACKER_HEADERS]);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  sheet.getRange(1, 1, 1, TRACKER_HEADERS.length)
    .setBackground("#111827")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setWrap(true);
  sheet.setRowHeight(1, 42);
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 165);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidth(4, 220);
  sheet.setColumnWidth(5, 190);
  sheet.setColumnWidth(6, 150);
  sheet.setColumnWidth(7, 145);
  sheet.setColumnWidth(8, 220);
  sheet.setColumnWidth(9, 260);
  sheet.setColumnWidth(10, 180);
  sheet.setColumnWidth(11, 165);
  sheet.setColumnWidth(12, 300);
  sheet.setColumnWidth(13, 155);
  sheet.setColumnWidth(14, 155);
  sheet.setColumnWidth(15, 150);
  sheet.setColumnWidth(16, 150);
  sheet.setColumnWidth(17, 125);
  sheet.setColumnWidth(18, 160);
  sheet.setColumnWidth(19, 145);
  sheet.setColumnWidth(20, 190);
  sheet.setColumnWidth(21, 300);
  sheet.setColumnWidth(22, 280);
  sheet.setColumnWidth(23, 155);
  sheet.setColumnWidth(24, 120);
  sheet.hideColumns(24);
  sheet.getRange(2, 13, sheet.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(TRACKER.statuses, true)
      .setAllowInvalid(false)
      .build()
  );
  sheet.getRange(2, 6, sheet.getMaxRows() - 1, 1).setNumberFormat("0.00");
  sheet.getRange(2, 14, sheet.getMaxRows() - 1, 1).setNumberFormat("0.00");
  sheet.getRange(1, 1, sheet.getMaxRows(), TRACKER_HEADERS.length).createFilter();
}

function prepareDashboard_(sheet) {
  sheet.clear();
  sheet.setColumnWidth(1, 265);
  sheet.setColumnWidth(2, 210);
  sheet.getRange("A1:B1").merge();
  sheet.getRange("A1")
    .setValue("ASHWA RACING  /  CONTRIBUTION TRACKER")
    .setBackground("#111827")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(14)
    .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 46);

  sheet.getRange("A3:A7").setValues([
    ["Verified contributions"],
    ["Verified transfers"],
    ["Awaiting bank match"],
    ["Needs follow-up"],
    ["Verified shirts to send"]
  ]).setFontWeight("bold");
  sheet.getRange("B3:B7").setFormulas([
    ['=SUMIF(Tracker!M:M,"Verified",Tracker!N:N)'],
    ['=COUNTIF(Tracker!M:M,"Verified")'],
    ['=COUNTIF(Tracker!M:M,"Reported")'],
    ['=COUNTIF(Tracker!M:M,"Needs follow-up")'],
    ['=COUNTIFS(Tracker!M:M,"Verified",Tracker!Q:Q,"Yes",Tracker!S:S,"<>Yes")']
  ]);
  sheet.getRange("B3").setNumberFormat('"INR "#,##0.00');
  sheet.getRange("A3:B7").setBorder(true, true, true, true, false, false, "#d1d5db", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("A9:B10").merge();
  sheet.getRange("A9")
    .setValue("Mark a transfer Verified only after it appears on the bank statement. Enter the actual credited amount, credit date, and verifier in Tracker. The total above includes verified amounts only.")
    .setWrap(true)
    .setFontColor("#4b5563");
  sheet.setRowHeight(9, 58);
  sheet.setFrozenRows(1);
}

function contributionId_(date, responseRow) {
  const day = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyyMMdd");
  return "AR-" + day + "-" + String(responseRow - 1).padStart(4, "0");
}

function parseAmount_(value) {
  const amount = Number(String(value || "").replace(/[,\s]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : "";
}

function safeText_(value) {
  const text = String(value || "");
  return /^[=+@\-]/.test(text) ? "'" + text : text;
}

