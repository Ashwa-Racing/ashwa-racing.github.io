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
  cover: 'Cover image URL (optional)',
  coverAlt: 'Cover image description (optional)',
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

    const body = convertDocxToMarkdown_(upload);
    const slug = slugify_(date + ' ' + title);
    const markdown = makeMarkdown_( {
      title: title,
      date: date,
      author: author,
      category: category,
      excerpt: excerpt,
      cover: String(answers[BLOG_FORM.cover] || '').trim(),
      coverAlt: String(answers[BLOG_FORM.coverAlt] || '').trim(),
      featured: /^yes$/i.test(String(answers[BLOG_FORM.featured] || '').trim())
    }, body);

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

function convertDocxToMarkdown_(wordFile) {
  const converted = Drive.Files.create({
    name: wordFile.getName().replace(/\.docx$/i, ''),
    mimeType: 'application/vnd.google-apps.document'
  }, wordFile.getBlob(), { fields: 'id' });

  try {
    return DriveApp.getFileById(converted.id)
      .getAs('text/markdown')
      .getDataAsString('UTF-8')
      .trim();
  } finally {
    DriveApp.getFileById(converted.id).setTrashed(true);
  }
}

function writePostToGitHub_(slug, markdown) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  const path = BLOG_REPOSITORY.directory + '/' + slug + '.md';
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
    message: (sha ? 'Update' : 'Add') + ' blog article: ' + slug,
    content: Utilities.base64Encode(Utilities.newBlob(markdown, 'text/plain').getBytes()),
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
