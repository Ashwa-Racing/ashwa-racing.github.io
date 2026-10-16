/**
 * Google Form -> DOCX -> Markdown -> GitHub blog publisher.
 *
 * Add this file to the Apps Script project attached to the publishing Form.
 * The matching form question titles are documented in SETUP.md.
 */

const BLOG_FORM = {
  route: 'What would you like to submit?',
  routeTeam: 'Team data',
  routeBlog: 'Blog / Newsletter',
  routeNewsletter: 'Newsletter only',
  uploadQuestion: 'Article file (.docx)',
  title: 'Article title',
  date: 'Publication date',
  author: 'Author',
  subsystem: 'Subsystem',
  excerpt: 'Short summary',
  featured: 'Feature this article?',
  newsletterPdf: 'Newsletter PDF',
  newsletterYear: 'Newsletter year',
  newsletterMonth: 'Newsletter month',
  newsletterType: 'Newsletter type'
};

const TEAM_FORM = {
  name: 'Full Name (In normal, e.g. : Ashwa Racing )',
  email: 'Ashwa Email ID (xxx.ashwa@gmail.com)',
  year: 'Select Batch (Passing Year)',
  prototypes: 'Select Prototype(s) you worked on per Role (leave blank if N/A)',
  subsystems: 'Select your Role in each Subsystem (leave blank if N/A)',
  experience: 'Please list your contributions in a paragraph. If None, kindly write NA.',
  photo: 'Kindly upload your pictures here',
  linkedin: 'LinkedIN Account URL',
  github: 'GitHUB Account URL'
};

const BLOG_REPOSITORY = {
  owner: 'Ashwa-Racing',
  repo: 'ashwa-racing.github.io',
  branch: 'main',
  directory: 'content/blog'
};

const ALLOWED_EMAIL_SUFFIX = '.ashwa@gmail.com';

function installBlogPublisher() {
  const form = FormApp.getActiveForm();
  if (!form) throw new Error('Open this script from the blog submission Google Form.');

  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('GITHUB_CONTENTS_TOKEN')) {
    throw new Error('Add GITHUB_CONTENTS_TOKEN in Apps Script Project Settings before setup.');
  }
  ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
    .forEach(name => {
      if (!properties.getProperty(name)) {
        throw new Error('Add ' + name + ' in Apps Script Project Settings before setup.');
      }
    });
  if (!properties.getProperty('TEAM_SHEET_ID')) {
    throw new Error('Add TEAM_SHEET_ID in Apps Script Project Settings before setup.');
  }
  ensureTeamSheet_();

  form.setCollectEmail(true);
  const existing = ScriptApp.getProjectTriggers().some(trigger =>
    trigger.getHandlerFunction() === 'publishBlogSubmission'
  );
  if (!existing) {
    ScriptApp.newTrigger('publishBlogSubmission')
      .forForm(form)
      .onFormSubmit()
      .create();
  }
  console.log('Blog publisher installed for form: ' + form.getEditUrl());
}

function publishBlogSubmission(event) {
  const respondent = String(event.response.getRespondentEmail() || '').trim().toLowerCase();
  let selectedRoute = '';

  try {
    const answers = {};
    const uploads = {};
    const responseLabels = [];
    let uploadedFileIds = [];
    event.response.getItemResponses().forEach(itemResponse => {
      const title = String(itemResponse.getItem().getTitle() || '').trim();
      const normalizedTitle = normalizeQuestion_(title);
      const response = itemResponse.getResponse();
      responseLabels.push(title || '(untitled question)');
      if ([BLOG_FORM.uploadQuestion, BLOG_FORM.newsletterPdf].some(q => normalizedTitle === normalizeQuestion_(q))) {
        uploads[normalizedTitle] = Array.isArray(response) ? response : [response];
      } else {
        answers[normalizedTitle] = response;
      }
    });

    const route = String(answers[normalizeQuestion_(BLOG_FORM.route)] || '').trim();
    selectedRoute = route;
    if (normalizeQuestion_(route) === normalizeQuestion_(BLOG_FORM.routeTeam)) {
      publishTeamSubmission_(answers, uploads, respondent);
      return;
    }
    const newsletterOnly = normalizeQuestion_(route) === normalizeQuestion_(BLOG_FORM.routeNewsletter);
    if (newsletterOnly) {
      const newsletterUploads = uploads[normalizeQuestion_(BLOG_FORM.newsletterPdf)] || [];
      if (!respondent.endsWith(ALLOWED_EMAIL_SUFFIX)) {
        trashUploads_(newsletterUploads);
        throw new Error('Only Google accounts ending in ' + ALLOWED_EMAIL_SUFFIX + ' can submit newsletters. The uploaded file was removed.');
      }
      if (!newsletterUploads.find(Boolean)) throw new Error('Attach one newsletter PDF to the form submission.');
      publishNewsletter_(answers, uploads);
      if (respondent) {
        MailApp.sendEmail(respondent, 'Your Ashwa Racing newsletter was published',
          'Your newsletter was accepted and sent to the website build. It should appear in the newsletter archive after the Cloudflare build completes.');
      }
      return;
    }
    if (route && normalizeQuestion_(route) !== normalizeQuestion_(BLOG_FORM.routeBlog)) {
      throw new Error('Choose Team data, Blog / Newsletter, or Newsletter only at the start of the form.');
    }
    uploadedFileIds = uploads[normalizeQuestion_(BLOG_FORM.uploadQuestion)] || [];

    if (!respondent.endsWith(ALLOWED_EMAIL_SUFFIX)) {
      trashUploads_(uploadedFileIds);
      throw new Error('Only Google accounts ending in ' + ALLOWED_EMAIL_SUFFIX + ' can submit articles. The uploaded file was removed.');
    }

    const fileId = uploadedFileIds.find(Boolean);
    if (!fileId) throw new Error('Attach one DOCX file to the form submission.');

    const title = requiredAnswer_(answers, BLOG_FORM.title, responseLabels);
    const date = normalizeDate_(answerFor_(answers, BLOG_FORM.date));
    const author = requiredAnswer_(answers, BLOG_FORM.author, responseLabels);
    const subsystem = requiredAnswer_(answers, BLOG_FORM.subsystem, responseLabels);
    const excerpt = requiredAnswer_(answers, BLOG_FORM.excerpt, responseLabels);
    const upload = DriveApp.getFileById(fileId);
    if (!/\.docx$/i.test(upload.getName())) {
      throw new Error('The upload must be a .docx file.');
    }

    const slug = slugify_(date + ' ' + title);
    const convertedArticle = convertDocxToMarkdown_(upload, slug);
    const firstImage = convertedArticle.images[0] || null;
    const markdown = makeMarkdown_( {
      title: title,
      date: date,
      author: author,
      category: subsystem,
      excerpt: excerpt,
      cover: firstImage ? firstImage.url : '',
      coverAlt: firstImage ? firstImage.alt : '',
      featured: /^yes$/i.test(String(answers[BLOG_FORM.featured] || '').trim())
    }, convertedArticle.markdown);

    convertedArticle.images.forEach(writeAssetToR2_);
    writeMarkdownToR2_(slug, markdown);
    writePostToGitHub_(slug, markdown);
    if ((uploads[normalizeQuestion_(BLOG_FORM.newsletterPdf)] || []).some(Boolean)) {
      publishNewsletter_(answers, uploads);
    }
    if (respondent) {
      MailApp.sendEmail(respondent, 'Your Ashwa Racing article was published',
        '“' + title + '” was accepted and sent to the website build. It should appear on the blog after the Cloudflare build completes.');
    }
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    if (respondent) {
      const isTeam = normalizeQuestion_(selectedRoute) === normalizeQuestion_(BLOG_FORM.routeTeam);
      const isNewsletter = normalizeQuestion_(selectedRoute) === normalizeQuestion_(BLOG_FORM.routeNewsletter);
      MailApp.sendEmail(respondent, isTeam ? 'Your Ashwa Racing team submission needs attention' : isNewsletter ? 'Your Ashwa Racing newsletter needs attention' : 'Your Ashwa Racing article needs attention',
        (isTeam ? 'The team data was not added.' : isNewsletter ? 'The newsletter was not published.' : 'The article was not published.') + '\n\n' + String(error.message || error) + '\n\nPlease correct the form details or upload and submit again.');
    }
    throw error;
  }
}

function publishTeamSubmission_(answers, uploads, respondent) {
  const name = requiredAnswer_(answers, TEAM_FORM.name, []);
  const ashwaEmail = requiredAnswer_(answers, TEAM_FORM.email, []).toLowerCase();
  if (!ashwaEmail.endsWith('.ashwa@gmail.com')) throw new Error('Enter your Ashwa email address in the team email field.');
  const year = requiredAnswer_(answers, TEAM_FORM.year, []);
  const photoIds = uploads[normalizeQuestion_(TEAM_FORM.photo)] || [];
  if (!photoIds.find(Boolean)) throw new Error('Upload one team photo.');
  const prototypeResponse = answers[normalizeQuestion_(TEAM_FORM.prototypes)] || [];
  const subsystemResponse = answers[normalizeQuestion_(TEAM_FORM.subsystems)] || [];
  const prototypes = parsePrototypeGrid_(prototypeResponse);
  const subsystemRoles = parseSubsystemGrid_(subsystemResponse);
  const chosenRoles = [...new Set(Object.values(prototypes))];
  if (!chosenRoles.length) chosenRoles.push('Member / Part of team');
  const sheetId = PropertiesService.getScriptProperties().getProperty('TEAM_SHEET_ID');
  if (!sheetId) throw new Error('Set TEAM_SHEET_ID in Apps Script Script Properties to the roster spreadsheet.');
  const sheet = ensureTeamSheet_();
  const photo = DriveApp.getFileById(photoIds.find(Boolean));
  photo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const row = [name, year, chosenRoles.join(', '), subsystemRoles.join(', '), JSON.stringify(prototypes), String(answerFor_(answers, TEAM_FORM.experience) || ''), String(answerFor_(answers, TEAM_FORM.linkedin) || ''), String(answerFor_(answers, TEAM_FORM.github) || ''), ashwaEmail, '', '', photo.getId()];
  sheet.appendRow(row);
  if (respondent) MailApp.sendEmail(respondent, 'Your Ashwa Racing team data was received', 'Your team details were added to the roster update sheet.');
}

function ensureTeamSheet_() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('TEAM_SHEET_ID');
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  let sheet = spreadsheet.getSheetByName('Parsed Team Data');
  if (!sheet) sheet = spreadsheet.insertSheet('Parsed Team Data');
  const headers = ['Name', 'Year', 'Roles', 'Subsystems', 'Prototype Roles', 'Experience', 'LinkedIn', 'GitHub', 'Email', 'Testimony', 'Current Job', 'Photo File ID'];
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  if (headers.some((header, index) => existingHeaders[index] !== header)) throw new Error('Parsed Team Data headers do not match the publisher setup guide.');
  return sheet;
}

function parsePrototypeGrid_(value) {
  const prototypes = ['Combustion', 'Hybrid', 'Electric', 'Hyperloop', 'Driverless'];
  const roles = ['Member / Part of team', 'Team Captain', 'Chief Engineer', 'Project Manager'];
  const responses = Array.isArray(value) ? value : String(value || '').split(/\s*,\s*/);
  const result = {};
  prototypes.forEach((prototype, index) => {
    const role = String(responses[index] || '').trim();
    if (roles.indexOf(role) !== -1) result[prototype] = role;
  });
  return result;
}

function parseSubsystemGrid_(value) {
  const subsystems = ['Chassis & Workshop Management', 'Suspension & Admin', 'Drivetrain & Human Resources', 'Brakes & Logistics', 'Engine', 'Electrical & Testing', 'Sponsorship, Marketing & Public Relations', 'Finance', 'IT', 'Aero'];
  const responses = Array.isArray(value) ? value : String(value || '').split(/\s*,\s*/);
  const selected = [];
  subsystems.forEach((subsystem, index) => {
    const role = String(responses[index] || '').trim();
    if (role) selected.push(subsystem);
    if (/lead/i.test(role) && selected.indexOf('Leads') === -1) selected.push('Leads');
  });
  return selected;
}

function answerFor_(answers, question) {
  const exact = normalizeQuestion_(question);
  if (answers[exact] !== undefined) return answers[exact];
  const key = Object.keys(answers).find(title => title.indexOf(exact) === 0 || exact.indexOf(title) === 0);
  return key ? answers[key] : '';
}

function publishNewsletter_(answers, uploads) {
  const fileIds = uploads[normalizeQuestion_(BLOG_FORM.newsletterPdf)] || [];
  const pdfId = fileIds.find(Boolean);
  if (!pdfId) return;
  const year = requiredAnswer_(answers, BLOG_FORM.newsletterYear, []);
  const month = requiredAnswer_(answers, BLOG_FORM.newsletterMonth, []);
  const type = requiredAnswer_(answers, BLOG_FORM.newsletterType, []);
  if (!/^20\d{2}$/.test(year) || !/^(0[1-9]|1[0-2])$/.test(month)) throw new Error('Newsletter year must be YYYY and month must be 01 through 12.');
  if (!/^(general|hybrid|combustion|alumni)$/i.test(type)) throw new Error('Choose a supported newsletter type: General, Hybrid, Combustion, or Alumni.');
  const filename = year + '-' + month + '-' + type.toLowerCase() + '.pdf';
  const pdf = DriveApp.getFileById(pdfId);
  if (pdf.getMimeType() !== 'application/pdf') throw new Error('Newsletter upload must be a PDF.');
  const cover = drivePdfThumbnail_(pdfId);
  putR2Object_('pdfs/newsletters/' + year + '/' + filename, pdf.getBlob().getBytes(), 'application/pdf');
  putR2Object_('images/newsletters/' + year + '/' + year + '-' + month + '.png', cover.getBytes(), 'image/png');
  const path = 'assets/data/newsletters.json';
  const current = UrlFetchApp.fetch('https://api.github.com/repos/' + BLOG_REPOSITORY.owner + '/' + BLOG_REPOSITORY.repo + '/contents/' + path + '?ref=' + encodeURIComponent(BLOG_REPOSITORY.branch), {headers:{Authorization:'Bearer ' + PropertiesService.getScriptProperties().getProperty('GITHUB_CONTENTS_TOKEN'), Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
  if (current.getResponseCode() !== 200) throw new Error('GitHub could not read the newsletter archive (' + current.getResponseCode() + ').');
  const entry = JSON.parse(current.getContentText());
  const list = JSON.parse(Utilities.newBlob(Utilities.base64Decode(entry.content.replace(/\n/g, ''))).getDataAsString());
  if (!list.includes(filename)) list.push(filename);
  writeGitHubFile_(path, Utilities.newBlob(JSON.stringify(list, null, 2) + '\n', 'application/json').getBytes(), 'Update newsletter archive for ' + year + '-' + month + '-' + type.toLowerCase());
}

function drivePdfThumbnail_(fileId) {
  let thumbnailLink = '';
  for (let attempt = 0; attempt < 4 && !thumbnailLink; attempt += 1) {
    const file = Drive.Files.get(fileId, { fields: 'thumbnailLink' });
    thumbnailLink = file.thumbnailLink || '';
    if (!thumbnailLink && attempt < 3) Utilities.sleep(1000);
  }
  if (!thumbnailLink) throw new Error('Google Drive has not generated a preview image for this PDF yet. Please try the submission again in a minute.');
  const highResolutionLink = thumbnailLink
    .replace(/=s\d+(?=$|[-?&])/i, '=s1600')
    .replace(/=w\d+-h\d+(?=$|[-?&])/i, '=w1600-h1600')
    .replace(/([?&]sz=)(?:w|h)?\d+/i, '$1w1600');
  const requestOptions = {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };
  let response = UrlFetchApp.fetch(highResolutionLink, requestOptions);
  if ((response.getResponseCode() < 200 || response.getResponseCode() >= 300) && highResolutionLink !== thumbnailLink) {
    response = UrlFetchApp.fetch(thumbnailLink, requestOptions);
  }
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Could not retrieve the newsletter PDF preview image (' + response.getResponseCode() + ').');
  }
  const contentType = response.getHeaders()['Content-Type'] || 'image/jpeg';
  if (!/^image\//i.test(contentType)) throw new Error('Google Drive returned a non-image PDF preview. Please try the submission again in a minute.');
  console.log('Retrieved newsletter cover preview (' + response.getContent().length + ' bytes).');
  return Utilities.newBlob(response.getContent(), contentType, 'newsletter-cover.png').getAs('image/png');
}

function trashUploads_(fileIds) {
  fileIds.filter(Boolean).forEach(fileId => {
    try {
      DriveApp.getFileById(fileId).setTrashed(true);
    } catch (error) {
      console.error('Could not remove rejected upload ' + fileId + ': ' + error);
    }
  });
}

function convertDocxToMarkdown_(wordFile, slug) {
  const converted = Drive.Files.create({
    name: wordFile.getName().replace(/\.docx$/i, ''),
    mimeType: 'application/vnd.google-apps.document'
  }, wordFile.getBlob(), { fields: 'id' });

  try {
    return googleDocToMarkdown_(converted.id, slug);
  } finally {
    DriveApp.getFileById(converted.id).setTrashed(true);
  }
}

function googleDocToMarkdown_(documentId, slug) {
  const body = DocumentApp.openById(documentId).getBody();
  const lines = [];
  const imageContext = { slug: slug, images: [] };

  for (let index = 0; index < body.getNumChildren(); index += 1) {
    const element = body.getChild(index);
    const type = element.getType();

    if (type === DocumentApp.ElementType.PARAGRAPH) {
      const paragraph = element.asParagraph();
      const text = styledElementToMarkdown_(paragraph, imageContext).trim();
      if (!text) continue;

      const heading = paragraph.getHeading();
      const headingLevels = {
        TITLE: 1,
        SUBTITLE: 2,
        HEADING1: 1,
        HEADING2: 2,
        HEADING3: 3,
        HEADING4: 4,
        HEADING5: 4,
        HEADING6: 4
      };
      const headingLevel = headingLevels[String(heading)];
      lines.push(headingLevel ? '#'.repeat(headingLevel) + ' ' + text : text);
    } else if (type === DocumentApp.ElementType.LIST_ITEM) {
      const item = element.asListItem();
      const text = styledElementToMarkdown_(item, imageContext).trim();
      if (text) lines.push('  '.repeat(item.getNestingLevel()) + '- ' + text);
    } else if (type === DocumentApp.ElementType.TABLE) {
      const table = element.asTable();
      for (let rowIndex = 0; rowIndex < table.getNumRows(); rowIndex += 1) {
        const row = table.getRow(rowIndex);
        const cells = [];
        for (let cellIndex = 0; cellIndex < row.getNumCells(); cellIndex += 1) {
          const cell = row.getCell(cellIndex);
          const cellParts = [];
          for (let childIndex = 0; childIndex < cell.getNumChildren(); childIndex += 1) {
            const child = cell.getChild(childIndex);
            if (child.getType() === DocumentApp.ElementType.PARAGRAPH ||
                child.getType() === DocumentApp.ElementType.LIST_ITEM) {
              const part = styledElementToMarkdown_(child, imageContext).trim();
              if (part) cellParts.push(part);
            }
          }
          const cellText = cellParts.join(' ').trim();
          if (cellText) cells.push(cellText);
        }
        if (cells.length) lines.push('- ' + cells.join(' — '));
      }
    }
  }

  const markdown = lines.join('\n\n').trim();
  if (!markdown) throw new Error('The DOCX converted, but no readable text was found.');
  return { markdown: markdown, images: imageContext.images };
}

function styledElementToMarkdown_(container, imageContext) {
  let output = '';
  for (let index = 0; index < container.getNumChildren(); index += 1) {
    const child = container.getChild(index);
    if (child.getType() === DocumentApp.ElementType.INLINE_IMAGE) {
      output += saveInlineImage_(child.asInlineImage(), imageContext);
      continue;
    }
    if (child.getType() !== DocumentApp.ElementType.TEXT) continue;

    const text = child.asText();
    const value = text.getText();
    const boundaries = text.getTextAttributeIndices();
    for (let run = 0; run < boundaries.length; run += 1) {
      const start = boundaries[run];
      const end = run + 1 < boundaries.length ? boundaries[run + 1] : value.length;
      let part = value.slice(start, end);
      const attributes = text.getAttributes(start);
      const link = attributes[DocumentApp.Attribute.LINK_URL];
      if (link) part = '[' + part + '](' + link + ')';
      if (attributes[DocumentApp.Attribute.BOLD]) part = '**' + part + '**';
      if (attributes[DocumentApp.Attribute.ITALIC]) part = '*' + part + '*';
      output += part;
    }
  }
  return output;
}

function saveInlineImage_(image, imageContext) {
  const blob = image.getBlob();
  const mimeType = String(blob.getContentType() || '').toLowerCase();
  const extensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  };
  const extension = extensions[mimeType];
  if (!extension) {
    throw new Error('An embedded image uses an unsupported format (' + (mimeType || 'unknown') + '). Use JPG, PNG, GIF, or WebP.');
  }

  const bytes = blob.getBytes();
  if (bytes.length > 10 * 1024 * 1024) {
    throw new Error('An embedded image is over 10 MB. Resize it in Word and submit again.');
  }

  const number = imageContext.images.length + 1;
  const key = 'images/blog/' + imageContext.slug + '-image-' + number + '.' + extension;
  const alt = String(image.getAltDescription() || image.getAltTitle() || ('Article image ' + number))
    .replace(/\]/g, '\\]').replace(/[\r\n]+/g, ' ');
  const url = 'https://assets.ashwaracing.org/' + key;
  imageContext.images.push({ key: key, url: url, alt: alt, mimeType: mimeType, bytes: bytes });
  return '![' + alt + '](' + url + ')';
}

function writePostToGitHub_(slug, markdown) {
  const path = BLOG_REPOSITORY.directory + '/' + slug + '.md';
  const bytes = Utilities.newBlob(markdown, 'text/plain').getBytes();
  writeGitHubFile_(path, bytes, 'Publish blog article: ' + slug);
}

function writeAssetToR2_(asset) {
  putR2Object_(asset.key, asset.bytes, asset.mimeType);
}

function writeMarkdownToR2_(slug, markdown) {
  const bytes = Utilities.newBlob(markdown, 'text/markdown').getBytes();
  putR2Object_('blog/articles/' + slug + '.md', bytes, 'text/markdown');
}

function putR2Object_(key, bytes, contentType) {
  const properties = PropertiesService.getScriptProperties();
  const accountId = properties.getProperty('R2_ACCOUNT_ID');
  const accessKey = properties.getProperty('R2_ACCESS_KEY_ID');
  const secretKey = properties.getProperty('R2_SECRET_ACCESS_KEY');
  const bucket = properties.getProperty('R2_BUCKET_NAME');
  const host = accountId + '.r2.cloudflarestorage.com';
  const encodedKey = key.split('/').map(awsEncodeURIComponent_).join('/');
  const canonicalUri = '/' + awsEncodeURIComponent_(bucket) + '/' + encodedKey;
  const now = new Date();
  const amzDate = Utilities.formatDate(now, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
  const dateStamp = Utilities.formatDate(now, 'UTC', 'yyyyMMdd');
  const payloadHash = sha256Hex_(bytes);
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = 'content-type:' + contentType.trim() + '\n' +
    'host:' + host + '\n' +
    'x-amz-content-sha256:' + payloadHash + '\n' +
    'x-amz-date:' + amzDate + '\n';
  const canonicalRequest = [
    'PUT', canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash
  ].join('\n');
  const scope = dateStamp + '/auto/s3/aws4_request';
  const stringToSign = [
    'AWS4-HMAC-SHA256', amzDate, scope,
    sha256Hex_(Utilities.newBlob(canonicalRequest).getBytes())
  ].join('\n');
  const dateKey = hmacSha256_(Utilities.newBlob(dateStamp).getBytes(), 'AWS4' + secretKey);
  const regionKey = hmacSha256_(Utilities.newBlob('auto').getBytes(), dateKey);
  const serviceKey = hmacSha256_(Utilities.newBlob('s3').getBytes(), regionKey);
  const signingKey = hmacSha256_(Utilities.newBlob('aws4_request').getBytes(), serviceKey);
  const signature = bytesToHex_(hmacSha256_(Utilities.newBlob(stringToSign).getBytes(), signingKey));
  const authorization = 'AWS4-HMAC-SHA256 Credential=' + accessKey + '/' + scope +
    ', SignedHeaders=' + signedHeaders + ', Signature=' + signature;
  const response = UrlFetchApp.fetch('https://' + host + canonicalUri, {
    method: 'put',
    contentType: contentType,
    headers: {
      Authorization: authorization,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash
    },
    payload: bytes,
    muteHttpExceptions: true
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Cloudflare R2 rejected ' + key + ' (' + response.getResponseCode() + '): ' + response.getContentText());
  }
}

function awsEncodeURIComponent_(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, character =>
    '%' + character.charCodeAt(0).toString(16).toUpperCase()
  );
}

function sha256Hex_(bytes) {
  return bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes));
}

function hmacSha256_(valueBytes, key) {
  const keyBytes = typeof key === 'string' ? Utilities.newBlob(key).getBytes() : key;
  return Utilities.computeHmacSha256Signature(valueBytes, keyBytes);
}

function bytesToHex_(bytes) {
  return bytes.map(value => ((value + 256) % 256).toString(16).padStart(2, '0')).join('');
}

function writeGitHubFile_(path, bytes, message) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_CONTENTS_TOKEN');
  const endpoint = 'https://api.github.com/repos/' + BLOG_REPOSITORY.owner + '/' +
    BLOG_REPOSITORY.repo + '/contents/' + path.split('/').map(encodeURIComponent).join('/');
  const headers = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  const existing = UrlFetchApp.fetch(endpoint + '?ref=' + encodeURIComponent(BLOG_REPOSITORY.branch), {
    method: 'get', headers: headers, muteHttpExceptions: true
  });
  let sha;
  if (existing.getResponseCode() === 200) {
    sha = JSON.parse(existing.getContentText()).sha;
  } else if (existing.getResponseCode() !== 404) {
    throw new Error('GitHub could not check the article path (' + existing.getResponseCode() + ').');
  }

  const payload = {
    message: (sha ? 'Update ' : 'Add ') + message,
    content: Utilities.base64Encode(bytes),
    branch: BLOG_REPOSITORY.branch
  };
  if (sha) payload.sha = sha;

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'put', headers: headers, contentType: 'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('GitHub rejected the article (' + response.getResponseCode() + '): ' + response.getContentText());
  }
}

function makeMarkdown_(post, body) {
  const lines = [
    '---',
    'title: ' + yamlQuote_(post.title),
    'date: ' + post.date,
    'author: ' + yamlQuote_(post.author),
    'category: ' + yamlQuote_(post.category),
    'excerpt: ' + yamlQuote_(post.excerpt),
    'featured: ' + String(post.featured)
  ];
  if (post.cover) lines.push('cover: ' + yamlQuote_(post.cover));
  if (post.coverAlt) lines.push('cover_alt: ' + yamlQuote_(post.coverAlt));
  lines.push('---', '', body, '');
  return lines.join('\n');
}

function normalizeQuestion_(value) {
  return String(value || '').normalize('NFKC').replace(/\u00a0/g, ' ')
    .trim().replace(/\s+/g, ' ').toLowerCase();
}

function requiredAnswer_(answers, question, responseLabels) {
  const value = String(answerFor_(answers, question) || '').trim();
  if (!value) {
    throw new Error('Please complete the form field: ' + question +
      '. Questions received by the trigger: ' + responseLabels.join(' | '));
  }
  return value;
}

function normalizeDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const date = String(value).trim();
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error('Publication date must use YYYY-MM-DD.');
  const parsed = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (parsed.toISOString().slice(0, 10) !== date) throw new Error('Publication date is not a valid calendar date.');
  return date;
}

function slugify_(value) {
  const slug = String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) throw new Error('The article title did not produce a valid filename.');
  return slug;
}

function yamlQuote_(value) {
  return '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ') + '"';
}
