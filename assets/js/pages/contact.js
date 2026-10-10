/* ============================================================
   ASHWA RACING — contact.js
   Handles: form validation, enquiry type sync, char counter,
   Gmail compose URL submission, scroll reveal
   ============================================================ */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

  // ─── Enquiry → recipient routing ─────────────────────────
  const RECIPIENTS = {
    general:     "ashwaracing@rvce.edu.in",
    sponsorship: "ashwa.smp@gmail.com",
    recruitment: "ashwa.hr@gmail.com",
    media:       "ashwa.hr@gmail.com"
  };

  // ─── DOM refs ─────────────────────────────────────────────
  const form         = document.getElementById("ct-form");
  const submitBtn    = document.getElementById("ct-submit-btn");
  const submitText   = submitBtn?.querySelector(".ct-submit-text");
  const submitLoading= submitBtn?.querySelector(".ct-submit-loading");
  const successEl    = document.getElementById("ct-success");
  const resetBtn     = document.getElementById("ct-reset-btn");
  const enquiryHidden= document.getElementById("ct-enquiry-type");
  const charNum      = document.getElementById("ct-char-num");
  const messageArea  = document.getElementById("ct-message");

  // ─── Auto-select enquiry type from URL ─────────────────────
const params = new URLSearchParams(window.location.search);
const urlType = params.get("type");

const packageName = params.get("package");
const enquiryTopics = {
  general: "a general enquiry",
  sponsorship: "a sponsorship or partnership enquiry",
  recruitment: "joining the team",
  media: "a media or press enquiry"
};

function updateWhatsAppLinks() {
  const enquiryType = enquiryHidden?.value || urlType || "general";
  const topic = enquiryType === "sponsorship" && packageName
    ? `the ${packageName} sponsorship package`
    : enquiryTopics[enquiryType] || enquiryTopics.general;

  document.querySelectorAll("[data-whatsapp-contact]").forEach(link => {
    const name = link.dataset.whatsappName || "Ashwa Racing";
    const message = `Hi ${name}, I'm contacting Ashwa Racing about ${topic}.`;
    link.href = `https://wa.me/${link.dataset.whatsappContact}?text=${encodeURIComponent(message)}`;
  });
}

if (urlType === "sponsorship" && packageName) {
  const subjectInput = document.getElementById("ct-subject");
  if (subjectInput) subjectInput.value = `${packageName} Sponsorship Package`;
}
if (urlType && RECIPIENTS[urlType]) {
  enquiryHidden.value = urlType;

  // Activate correct pill
  document.querySelectorAll(".ct-eq-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.eq === urlType);
  });

  // Update subject placeholder
  const subjectInput = document.getElementById("ct-subject");
  const labels = {
    general:     "",
    sponsorship: "Sponsorship & Marketing Enquiry",
    recruitment: "Recruitment Enquiry",
    media:       "Media / Press Enquiry"
  };

  if (subjectInput && labels[urlType]) {
    subjectInput.placeholder = labels[urlType];
  }

  // Optional: scroll to form smoothly
  document.getElementById("ct-form")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
updateWhatsAppLinks();

  // ─── Enquiry type pills ───────────────────────────────────
  document.querySelectorAll(".ct-eq-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".ct-eq-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (enquiryHidden) enquiryHidden.value = btn.dataset.eq;
      updateWhatsAppLinks();

      // Update form subject placeholder to match context
      const subjectInput = document.getElementById("ct-subject");
      const labels = {
        general:     "",
        sponsorship: "Sponsorship & Marketing Enquiry",
        recruitment: "Recruitment Enquiry",
        media:       "Media / Press Enquiry"
      };
      if (subjectInput && labels[btn.dataset.eq]) {
        subjectInput.placeholder = labels[btn.dataset.eq];
      }
    });
  });

  // ─── Character counter ────────────────────────────────────
  const MAX_CHARS = 1000;
  messageArea?.addEventListener("input", () => {
    const len = messageArea.value.length;
    if (charNum) charNum.textContent = len;

    // Warn at 90%
    const countEl = messageArea.closest(".ct-field")?.querySelector(".ct-char-count");
    if (countEl) {
      countEl.style.color = len > MAX_CHARS * 0.9
        ? "var(--red)"
        : "var(--text-muted)";
    }

    // Hard cap
    if (len > MAX_CHARS) {
      messageArea.value = messageArea.value.slice(0, MAX_CHARS);
      if (charNum) charNum.textContent = MAX_CHARS;
    }
  });

  // ─── Validation helpers ───────────────────────────────────
  const validators = {
    "ct-first": {
      check: v => v.trim().length >= 2,
      msg:   "Please enter your first name (min. 2 characters)."
    },
    "ct-last": {
      check: v => v.trim().length >= 2,
      msg:   "Please enter your last name (min. 2 characters)."
    },
    "ct-email": {
      check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      msg:   "Please enter a valid email address."
    },
    "ct-message": {
      check: v => v.trim().length >= 10,
      msg:   "Please enter a message (min. 10 characters)."
    }
  };

  function validateField(id) {
    const input  = document.getElementById(id);
    const errEl  = document.getElementById(`err-${id.replace("ct-", "")}`);
    const field  = input?.closest(".ct-field");
    const rule   = validators[id];

    if (!input || !rule) return true;

    const valid = rule.check(input.value);
    field?.classList.toggle("has-error", !valid);
    if (errEl) errEl.textContent = valid ? "" : rule.msg;
    return valid;
  }

  // Live validation — validate on blur, clear error on first keystroke
  Object.keys(validators).forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("blur", () => validateField(id));
    input.addEventListener("input", () => {
      const errEl = document.getElementById(`err-${id.replace("ct-", "")}`);
      const field = input.closest(".ct-field");
      field?.classList.remove("has-error");
      if (errEl) errEl.textContent = "";
    });
  });

  // ─── Build Gmail compose URL ──────────────────────────────
  function buildGmailUrl({ to, subject, body }) {
    const base = "https://mail.google.com/mail/?view=cm&fs=1";
    return (
      `${base}` +
      `&to=${encodeURIComponent(to)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`
    );
  }

  // ─── Form submission ──────────────────────────────────────
  form?.addEventListener("submit", e => {
    e.preventDefault();

    // Honeypot check
    const honey = form.querySelector('input[name="_honey"]');
    if (honey?.value) return;

    // Validate all required fields
    const valid = Object.keys(validators)
      .map(id => validateField(id))
      .every(Boolean);

    if (!valid) {
      form.querySelector(".ct-field.has-error input, .ct-field.has-error textarea")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Extract values
    const data        = new FormData(form);
    const firstName   = (data.get("firstName")   || "").trim();
    const lastName    = (data.get("lastName")    || "").trim();
    const email       = (data.get("email")       || "").trim();
    const message     = (data.get("message")     || "").trim();
    const enquiryType = (data.get("enquiryType") || "general").trim();
    const subjectRaw  = (data.get("subject")     || "").trim();

    // Resolve recipient
    const to = RECIPIENTS[enquiryType] ?? RECIPIENTS.general;

    // Build subject line
    const enquiryLabel = enquiryType.charAt(0).toUpperCase() + enquiryType.slice(1);
    const subject = subjectRaw
      ? `[${enquiryLabel}] ${subjectRaw}`
      : `[${enquiryLabel}] Contact Form Submission`;

    // Build body
    const body = [
      "Ashwa Racing Website Contact Form",
      "",
      `Enquiry Type: ${enquiryLabel}`,
      "",
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      "",
      "Message:",
      message,
      "",
      "----------------------------------------",
      "Sent via ashwaracing.in"
    ].join("\n");

    // Brief loading state while tab opens
    submitBtn.disabled = true;
    if (submitText)    submitText.hidden    = true;
    if (submitLoading) submitLoading.hidden = false;

    // Open Gmail compose in new tab
    const gmailUrl = buildGmailUrl({ to, subject, body });
    window.open(gmailUrl, "_blank", "noopener");

    // Restore button + show success state
    submitBtn.disabled = false;
    if (submitText)    submitText.hidden    = false;
    if (submitLoading) submitLoading.hidden = true;

    if (form)      form.hidden      = true;
    if (successEl) successEl.hidden = false;
  });

  // ─── Reset / send another ─────────────────────────────────
  resetBtn?.addEventListener("click", () => {
    form?.reset();
    if (charNum) charNum.textContent = "0";
    if (form)      form.hidden      = false;
    if (successEl) successEl.hidden = true;
    submitBtn.disabled = false;
    if (submitText)    submitText.hidden    = false;
    if (submitLoading) submitLoading.hidden = true;

    // Reset enquiry pills
    document.querySelectorAll(".ct-eq-btn").forEach((b, i) => {
      b.classList.toggle("active", i === 0);
    });
    if (enquiryHidden) enquiryHidden.value = "general";
  });

  // ─── Scroll reveal ────────────────────────────────────────
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".reveal").forEach(el => revealObs.observe(el));

});
