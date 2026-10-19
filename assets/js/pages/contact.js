
/* ============================================================
   ASHWA RACING — contact.js
   Handles:
   - Form validation
   - Enquiry type and subject synchronization
   - WhatsApp links
   - Character counter
   - Phone number inclusion
   - Gmail compose
   - Form reset
   - Scroll reveal
   ============================================================ */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

  // ─── Enquiry recipient routing ────────────────────────────

  const RECIPIENTS = {
    general: "ashwaracing@rvce.edu.in",
    sponsorship: "ashwa.smp@gmail.com",
    recruitment: "ashwa.hr@gmail.com",
    media: "ashwa.hr@gmail.com"
  };

  // ─── DOM references ───────────────────────────────────────

  const form = document.getElementById("ct-form");
  const submitBtn = document.getElementById("ct-submit-btn");
  const submitText = submitBtn?.querySelector(".ct-submit-text");
  const submitLoading = submitBtn?.querySelector(".ct-submit-loading");
  const successEl = document.getElementById("ct-success");
  const resetBtn = document.getElementById("ct-reset-btn");
  const enquiryHidden = document.getElementById("ct-enquiry-type");
  const subjectInput = document.getElementById("ct-subject");
  const charNum = document.getElementById("ct-char-num");
  const messageArea = document.getElementById("ct-message");

  // ─── Enquiry categories ───────────────────────────────────

  const subjectLabels = {
    general: "General Enquiry",
    sponsorship: "Sponsorship & Marketing Enquiry",
    recruitment: "Recruitment Enquiry",
    media: "Media / Press Enquiry"
  };

  const enquiryTopics = {
    general: "a general enquiry",
    sponsorship: "a sponsorship or partnership enquiry",
    recruitment: "joining the team",
    media: "a media or press enquiry"
  };

  // ─── URL parameters ───────────────────────────────────────

  const params = new URLSearchParams(window.location.search);
  const urlType = params.get("type");
  const packageName = params.get("package");

  const initialType = Object.hasOwn(RECIPIENTS, urlType)
    ? urlType
    : "general";

  let autoPackageSubject = "";

  // ─── Update subject placeholder ──────────────────────────

  function updateSubjectPlaceholder(type) {
    if (!subjectInput) return;

    subjectInput.placeholder =
      subjectLabels[type] || subjectLabels.general;
  }

  // ─── Update WhatsApp links ────────────────────────────────

  function updateWhatsAppLinks() {
    const type = enquiryHidden?.value || "general";

    const topic =
      type === "sponsorship" && packageName
        ? `the ${packageName} sponsorship package`
        : enquiryTopics[type] || enquiryTopics.general;

    document
      .querySelectorAll("[data-whatsapp-contact]")
      .forEach(link => {
        const number = link.dataset.whatsappContact;
        const name = link.dataset.whatsappName || "Ashwa Racing";

        if (!number) return;

        const message =
          `Hi ${name}, I'm contacting Ashwa Racing about ${topic}.`;

        link.href =
          `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
      });
  }

  // ─── Synchronize enquiry category ────────────────────────

  function setEnquiryType(type) {
    const selectedType = Object.hasOwn(RECIPIENTS, type)
      ? type
      : "general";

    if (enquiryHidden) {
      enquiryHidden.value = selectedType;
    }

    document.querySelectorAll(".ct-eq-btn").forEach(btn => {
      const selected = btn.dataset.eq === selectedType;

      btn.classList.toggle("active", selected);
      btn.setAttribute("aria-pressed", String(selected));
    });

    // Clear only an automatically populated package subject.
    if (
      selectedType !== "sponsorship" &&
      subjectInput &&
      subjectInput.value === autoPackageSubject &&
      autoPackageSubject
    ) {
      subjectInput.value = "";
      autoPackageSubject = "";
    }

    updateSubjectPlaceholder(selectedType);
    updateWhatsAppLinks();
  }

  // ─── Initialize enquiry type ──────────────────────────────

  setEnquiryType(initialType);

  if (initialType === "sponsorship" && packageName && subjectInput) {
    autoPackageSubject = `${packageName} Sponsorship Package`;
    subjectInput.value = autoPackageSubject;
  }

  if (urlType && Object.hasOwn(RECIPIENTS, urlType)) {
    form?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  // ─── Enquiry category buttons ────────────────────────────

  document.querySelectorAll(".ct-eq-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      setEnquiryType(btn.dataset.eq);
    });
  });

  // ─── Character counter ────────────────────────────────────

  const MAX_CHARS = 1000;

  function updateCharacterCounter() {
    if (!messageArea) return;

    if (messageArea.value.length > MAX_CHARS) {
      messageArea.value = messageArea.value.slice(0, MAX_CHARS);
    }

    const length = messageArea.value.length;

    if (charNum) {
      charNum.textContent = length;
    }

    const countEl = messageArea
      .closest(".ct-field")
      ?.querySelector(".ct-char-count");

    if (countEl) {
      countEl.style.color =
        length > MAX_CHARS * 0.9
          ? "var(--red)"
          : "var(--text-muted)";
    }
  }

  messageArea?.addEventListener("input", updateCharacterCounter);
  updateCharacterCounter();

  // ─── Validation rules ─────────────────────────────────────

  const validators = {
    "ct-first": {
      check: value => value.trim().length >= 2,
      msg: "Please enter your first name (min. 2 characters)."
    },

    "ct-last": {
      check: value => value.trim().length >= 2,
      msg: "Please enter your last name (min. 2 characters)."
    },

    "ct-email": {
      check: value =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
      msg: "Please enter a valid email address."
    },

    "ct-message": {
      check: value =>
        value.trim().length >= 10 &&
        value.trim().length <= MAX_CHARS,
      msg: "Please enter a message (10–1000 characters)."
    }
  };

  // ─── Validate individual field ────────────────────────────

  function validateField(id) {
    const input = document.getElementById(id);
    const rule = validators[id];

    if (!input || !rule) return true;

    const errorId = `err-${id.replace("ct-", "")}`;
    const errorEl = document.getElementById(errorId);
    const field = input.closest(".ct-field");

    const valid = rule.check(input.value);

    field?.classList.toggle("has-error", !valid);
    input.setAttribute("aria-invalid", String(!valid));

    if (errorEl) {
      errorEl.textContent = valid ? "" : rule.msg;
    }

    return valid;
  }

  // ─── Live validation ──────────────────────────────────────

  Object.keys(validators).forEach(id => {
    const input = document.getElementById(id);

    if (!input) return;

    let touched = false;

    input.addEventListener("blur", () => {
      touched = true;
      validateField(id);
    });

    input.addEventListener("input", () => {
      if (touched) {
        validateField(id);
      }
    });
  });

  function clearValidation() {
    Object.keys(validators).forEach(id => {
      const input = document.getElementById(id);
      const errorEl = document.getElementById(
        `err-${id.replace("ct-", "")}`
      );

      input?.closest(".ct-field")?.classList.remove("has-error");
      input?.removeAttribute("aria-invalid");

      if (errorEl) {
        errorEl.textContent = "";
      }
    });
  }

  // ─── Build Gmail compose URL ──────────────────────────────

  function buildGmailUrl({ to, subject, body }) {
    const base = "https://mail.google.com/mail/?view=cm&fs=1";

    return (
      base +
      `&to=${encodeURIComponent(to)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`
    );
  }

  // ─── Submission notice ────────────────────────────────────

  let statusEl = null;

  if (form && submitBtn) {
    statusEl = document.createElement("p");
    statusEl.id = "ct-compose-status";
    statusEl.setAttribute("role", "status");
    statusEl.setAttribute("aria-live", "polite");

    statusEl.style.marginTop = "12px";
    statusEl.style.lineHeight = "1.6";
    statusEl.hidden = true;

    submitBtn.insertAdjacentElement("afterend", statusEl);
  }

  function showStatus(message) {
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.hidden = false;
  }

  function resetSubmitButton() {
    if (submitBtn) {
      submitBtn.disabled = false;
    }

    if (submitText) {
      submitText.hidden = false;
    }

    if (submitLoading) {
      submitLoading.hidden = true;
    }
  }

  // ─── Form submission ──────────────────────────────────────

  form?.addEventListener("submit", event => {
    event.preventDefault();

    // Basic honeypot check
    const honey = form.querySelector('input[name="_honey"]');

    if (honey?.value) return;

    // Validate all required fields
    const valid = Object.keys(validators)
      .map(id => validateField(id))
      .every(Boolean);

    if (!valid) {
      const firstInvalid = form.querySelector(
        ".ct-field.has-error input, .ct-field.has-error textarea"
      );

      firstInvalid?.focus();
      firstInvalid?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      return;
    }

    // ─── Extract form values ────────────────────────────────

    const data = new FormData(form);

    const firstName = String(data.get("firstName") || "").trim();
    const lastName = String(data.get("lastName") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const message = String(data.get("message") || "").trim();
    const subjectRaw = String(data.get("subject") || "").trim();

    const rawType = enquiryHidden?.value || "general";

    const enquiryType = Object.hasOwn(RECIPIENTS, rawType)
      ? rawType
      : "general";

    // ─── Resolve recipient ──────────────────────────────────

    const to = RECIPIENTS[enquiryType];

    const enquiryLabel =
      enquiryType.charAt(0).toUpperCase() + enquiryType.slice(1);

    // ─── Build subject ──────────────────────────────────────

    const subject = subjectRaw
      ? `[${enquiryLabel}] ${subjectRaw}`
      : `[${enquiryLabel}] ${subjectLabels[enquiryType]}`;

    // ─── Build email body ───────────────────────────────────

    const body = [
      "Ashwa Racing Website Contact Form",
      "",
      `Enquiry Type: ${enquiryLabel}`,
      "",
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      ...(phone ? [`Phone: ${phone}`] : []),
      "",
      "Message:",
      message,
      "",
      "----------------------------------------",
      "Prepared via Ashwa Racing Contact Form"
    ].join("\n");

    // ─── Open Gmail ─────────────────────────────────────────

    if (submitBtn) {
      submitBtn.disabled = true;
    }

    if (submitText) {
      submitText.hidden = true;
    }

    if (submitLoading) {
      submitLoading.hidden = false;
    }

    const gmailUrl = buildGmailUrl({
      to,
      subject,
      body
    });

    try {
      window.open(gmailUrl, "_blank", "noopener");

      // Opening a draft is NOT confirmation of delivery.
      showStatus(
        "A Gmail draft was requested in a new tab. " +
        "Please check that it opened and click Send in Gmail " +
        "to complete your enquiry. If no tab opened, " +
        "allow pop-ups and try again."
      );

    } catch (error) {
      console.error("Unable to open Gmail:", error);

      showStatus(
        "Unable to open Gmail. Please allow pop-ups " +
        "and try again."
      );
    }

    // Keep the form visible until a real backend is added.
    resetSubmitButton();
  });

  // ─── Reset / Send another ─────────────────────────────────

  function resetContactForm() {
    form?.reset();

    autoPackageSubject = "";

    clearValidation();
    setEnquiryType("general");
    updateCharacterCounter();
    resetSubmitButton();

    if (statusEl) {
      statusEl.textContent = "";
      statusEl.hidden = true;
    }

    if (form) {
      form.hidden = false;
    }

    if (successEl) {
      successEl.hidden = true;
    }
  }

  resetBtn?.addEventListener("click", resetContactForm);

  // ─── Scroll reveal ────────────────────────────────────────

  if ("IntersectionObserver" in window) {
    const revealObs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    document.querySelectorAll(".reveal").forEach(element => {
      revealObs.observe(element);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(element => {
      element.classList.add("visible");
    });
  }

});