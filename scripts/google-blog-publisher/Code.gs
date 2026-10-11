/**
 * Google Form -> DOCX -> Markdown -> GitHub blog publisher.
 *
 * Add this file to the Apps Script project attached to the publishing Form.
 * The matching form question titles are documented in SETUP.md.
 */

const BLOG_FORM = {
  uploadQuestion: 'Article file (.docx)',
  title: 'Article title',
  date: 'Publication date',
  author: 'Author',
  category: 'Category',
  excerpt: 'Short summary',
  featured: 'Feature this article?'
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
  if (!properties.getProperty('GITHUB_TOKEN')) {
    throw new Error('Add GITHUB_TOKEN in Apps Script Project Settings before setup.');
  }
  ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
    .forEach(name => {
      if (!properties.getProperty(name)) {
        throw new Error('Add ' + name + ' in Apps Script Project Settings before setup.');
      }
    });

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

  try {
    const answers = {};
    const responseLabels = [];
    let uploadedFileIds = [];
    event.response.getItemResponses().forEach(itemResponse => {
      const title = String(itemResponse.getItem().getTitle() || '').trim();
      const normalizedTitle = normalizeQuestion_(title);
      const response = itemResponse.getResponse();
      responseLabels.push(title || '(untitled question)');
      if (normalizedTitle === normalizeQuestion_(BLOG_FORM.uploadQuestion)) {
        uploadedFileIds = Array.isArray(response) ? response : [response];
      } else {
        answers[normalizedTitle] = Array.isArray(response) ? response.join(', ') : response;
      }
    });

    if (!respondent.endsWith(ALLOWED_EMAIL_SUFFIX)) {
      trashUploads_(uploadedFileIds);
      throw new Error('Only Google accounts ending in ' + ALLOWED_EMAIL_SUFFIX + ' can submit articles. The uploaded file was removed.');
    }

    const fileId = uploadedFileIds.find(Boolean);
    if (!fileId) throw new Error('Attach one DOCX file to the form submission.');

    const title = requiredAnswer_(answers, BLOG_FORM.title, responseLabels);
    const date = normalizeDate_(requiredAnswer_(answers, BLOG_FORM.date, responseLabels));
    const author = requiredAnswer_(answers, BLOG_FORM.author, responseLabels);
    const category = requiredAnswer_(answers, BLOG_FORM.category, responseLabels);
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
      category: category,
      excerpt: excerpt,
      cover: firstImage ? firstImage.url : '',
      coverAlt: firstImage ? firstImage.alt : '',
      featured: /^yes$/i.test(String(answers[BLOG_FORM.featured] || '').trim())
    }, convertedArticle.markdown);

    convertedArticle.images.forEach(writeAssetToR2_);
    writeMarkdownToR2_(slug, markdown);
    writePostToGitHub_(slug, markdown);
    if (respondent) {
      MailApp.sendEmail(respondent, 'Your Ashwa Racing article was published',
        '“' + title + '” was accepted and sent to the website build. It should appear on the blog after the Cloudflare build completes.');
    }
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    if (respondent) {
      MailApp.sendEmail(respondent, 'Your Ashwa Racing article needs attention',
        'The article was not published.\n\n' + String(error.message || error) + '\n\nPlease correct the form details or DOCX and submit again.');
    }
    throw error;
  }
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
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
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
  const value = String(answers[normalizeQuestion_(question)] || '').trim();
  if (!value) {
    throw new Error('Please complete the form field: ' + question +
      '. Questions received by the trigger: ' + responseLabels.join(' | '));
  }
  return value;
}

function normalizeDate_(value) {
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
