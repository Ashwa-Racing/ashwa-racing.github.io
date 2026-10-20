/* ============================================================
   ASHWA RACING — contact.js
   Enquiry categories, accessible subsystem dropdown,
   validation, email drafts, form reset and scroll reveal.
   ============================================================ */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

  // Existing email addresses. No changes to routing yet.
  const RECIPIENTS = {
    general: "akshayurs.ashwa@gmail.com",
    sponsorship: "pranavramakrishnan.ashwa@gmail.com",
    recruitment: "akshayurs.ashwa@gmail.com",
    media: "pranavramakrishnan.ashwa@gmail.com"
  };

  // Replace empty strings ONLY with confirmed subsystem lead emails.
  const TECHNICAL_RECIPIENTS = {
    aero: "",
    brakes_logistics: "shravancs.ashwa@gmail.com",
    chassis_workshop: "sathviksnaik.ashwa@gmail.com",
    drivetrain_hr: "ranjithds.ashwa@gmail.com",
    electrical_testing: "aditeya.ashwa@gmail.com",
    engine: "talin.ashwa@gmail.com",
    steering_finance: "pranavramakrishnan.ashwa@gmail.com",
    suspension_admin: "aitijhya.ashwa@gmail.com",
    it: "aditeya.ashwa@gmail.com",
    smp: "pranavramakrishnan.ashwa@gmail.com"
  };
  const subjectLabels = {
    general: "General Enquiry",
    sponsorship: "Sponsorship & Marketing Enquiry",
    recruitment: "Recruitment Enquiry",
    media: "Media / Press Enquiry",
    technical: "Technical Enquiry"
  };

  const subsystemLabels = {
    aero: "Aero",
    brakes_logistics: "Brakes & Logistics",
    chassis_workshop: "Chassis & Workshop Management",
    drivetrain_hr: "Drivetrain & Human Resources",
    electrical_testing: "Electrical & Testing",
    engine: "Engine",
    steering_finance: "Steering & Finance",
    suspension_admin: "Suspension & Admin",
    it: "IT",
    smp: "Sponsorship, Marketing & Public Relations"
  };

  // DOM references
  const form = document.getElementById("ct-form");
  const submitBtn = document.getElementById("ct-submit-btn");
  const submitText = submitBtn?.querySelector(".ct-submit-text");
  const submitLoading = submitBtn?.querySelector(".ct-submit-loading");
  const successEl = document.getElementById("ct-success");
  const resetBtn = document.getElementById("ct-reset-btn");

  const enquiryHidden = document.getElementById("ct-enquiry-type");
  const subsystemHidden = document.getElementById("ct-subsystem");
  const technicalSection = document.getElementById("ct-technical-section");
  const subsystemError = document.getElementById("ct-subsystem-error");

  const subsystemDropdown = document.getElementById("ct-subsystem-dropdown");
  const subsystemTrigger = document.getElementById("ct-subsystem-trigger");
  const subsystemLabel = document.getElementById("ct-subsystem-label");
  const subsystemList = document.getElementById("ct-subsystem-list");

  const subsystemOptions = Array.from(
    document.querySelectorAll(".ct-subsystem-option")
  );

  const subjectInput = document.getElementById("ct-subject");
  const charNum = document.getElementById("ct-char-num");
  const messageArea = document.getElementById("ct-message");

  // URL parameters
  const params = new URLSearchParams(window.location.search);
  const urlType = params.get("type");
  const packageName = params.get("package");

  const initialType = Object.hasOwn(subjectLabels, urlType)
    ? urlType
    : "general";

  let autoPackageSubject = "";

  // Subject placeholder
  function updateSubjectPlaceholder(type) {
    if (!subjectInput) return;

    const subsystem = subsystemHidden?.value || "";

    subjectInput.placeholder =
      type === "technical" && Object.hasOwn(subsystemLabels, subsystem)
        ? `Technical Enquiry - ${subsystemLabels[subsystem]}`
        : subjectLabels[type] || subjectLabels.general;
  }

  // ─── Custom subsystem dropdown ───────────────────────────

  function setDropdownOpen(open, focusIndex = null) {
    if (!subsystemList || !subsystemTrigger) return;

    const shouldOpen = Boolean(open && !technicalSection?.hidden);

    subsystemList.hidden = !shouldOpen;

    subsystemTrigger.setAttribute(
      "aria-expanded",
      String(shouldOpen)
    );

    if (
      shouldOpen &&
      focusIndex !== null &&
      subsystemOptions.length
    ) {
      const index = Math.max(
        0,
        Math.min(focusIndex, subsystemOptions.length - 1)
      );

      subsystemOptions[index].focus();
    }
  }

  function selectSubsystem(value) {
    if (!Object.hasOwn(subsystemLabels, value)) return;

    if (subsystemHidden) {
      subsystemHidden.value = value;
    }

    if (subsystemLabel) {
      subsystemLabel.textContent = subsystemLabels[value];
      subsystemLabel.classList.remove("is-placeholder");
    }

    subsystemOptions.forEach(option => {
      const selected = option.dataset.subsystem === value;

      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-selected", String(selected));
    });

    if (subsystemError) {
      subsystemError.textContent = "";
    }

    updateSubjectPlaceholder("technical");
    setDropdownOpen(false);
    subsystemTrigger?.focus();
  }

  function clearSubsystem() {
    if (subsystemHidden) {
      subsystemHidden.value = "";
    }

    if (subsystemLabel) {
      subsystemLabel.textContent = "-- Choose a subsystem --";
      subsystemLabel.classList.add("is-placeholder");
    }

    subsystemOptions.forEach(option => {
      option.classList.remove("is-selected");
      option.setAttribute("aria-selected", "false");
    });

    if (subsystemError) {
      subsystemError.textContent = "";
    }

    setDropdownOpen(false);
  }

  // Open / close dropdown
  subsystemTrigger?.addEventListener("click", () => {
    const opening = subsystemList?.hidden ?? false;

    const index = subsystemOptions.findIndex(
      option => option.classList.contains("is-selected")
    );

    setDropdownOpen(
      opening,
      opening ? Math.max(0, index) : null
    );
  });

  // Keyboard support on dropdown trigger
  subsystemTrigger?.addEventListener("keydown", event => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      const selectedIndex = subsystemOptions.findIndex(
        option => option.classList.contains("is-selected")
      );

      const nextIndex = selectedIndex >= 0
        ? selectedIndex
        : event.key === "ArrowDown"
          ? 0
          : subsystemOptions.length - 1;

      setDropdownOpen(true, nextIndex);

    } else if (event.key === "Escape") {
      setDropdownOpen(false);
    }
  });

  // Subsystem option click and keyboard navigation
  subsystemOptions.forEach((option, index) => {

    option.addEventListener("click", () => {
      selectSubsystem(option.dataset.subsystem);
    });

    option.addEventListener("keydown", event => {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();

        let next = index;

        if (event.key === "ArrowDown") {
          next = (index + 1) % subsystemOptions.length;
        }

        if (event.key === "ArrowUp") {
          next = (
            index - 1 + subsystemOptions.length
          ) % subsystemOptions.length;
        }

        if (event.key === "Home") {
          next = 0;
        }

        if (event.key === "End") {
          next = subsystemOptions.length - 1;
        }

        subsystemOptions[next].focus();

      } else if (event.key === "Escape") {
        event.preventDefault();
        setDropdownOpen(false);
        subsystemTrigger?.focus();

      } else if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        selectSubsystem(option.dataset.subsystem);

      } else if (event.key === "Tab") {
        setDropdownOpen(false);
      }
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener("pointerdown", event => {
    if (
      subsystemDropdown &&
      !subsystemDropdown.contains(event.target)
    ) {
      setDropdownOpen(false);
    }
  });

  // ─── Enquiry category synchronization ────────────────────

  function setEnquiryType(type) {
    const selectedType = Object.hasOwn(subjectLabels, type)
      ? type
      : "general";

    if (enquiryHidden) {
      enquiryHidden.value = selectedType;
    }

    document.querySelectorAll(".ct-eq-btn[data-eq]").forEach(btn => {
      const selected = btn.dataset.eq === selectedType;

      btn.classList.toggle("active", selected);
      btn.setAttribute("aria-pressed", String(selected));
    });

    if (
      selectedType !== "sponsorship" &&
      subjectInput &&
      autoPackageSubject &&
      subjectInput.value === autoPackageSubject
    ) {
      subjectInput.value = "";
      autoPackageSubject = "";
    }

    if (technicalSection) {
      technicalSection.hidden = selectedType !== "technical";
    }

    if (selectedType !== "technical") {
      clearSubsystem();
    }

    updateSubjectPlaceholder(selectedType);

    if (subsystemError) {
      subsystemError.textContent = "";
    }
  }

  // Initialize
  setEnquiryType(initialType);

  if (
    initialType === "sponsorship" &&
    packageName &&
    subjectInput
  ) {
    autoPackageSubject = `${packageName} Sponsorship Package`;
    subjectInput.value = autoPackageSubject;
  }

  if (urlType && Object.hasOwn(subjectLabels, urlType)) {
    form?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  document.querySelectorAll(".ct-eq-btn[data-eq]").forEach(btn => {
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

  // ─── Validation ───────────────────────────────────────────

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

  function validateField(id) {
    const input = document.getElementById(id);
    const rule = validators[id];

    if (!input || !rule) return true;

    const errorEl = document.getElementById(
      `err-${id.replace("ct-", "")}`
    );

    const valid = rule.check(input.value);

    input.closest(".ct-field")?.classList.toggle(
      "has-error",
      !valid
    );

    input.setAttribute("aria-invalid", String(!valid));

    if (errorEl) {
      errorEl.textContent = valid ? "" : rule.msg;
    }

    return valid;
  }

  // Live validation
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

    if (subsystemError) {
      subsystemError.textContent = "";
    }
  }

  // ─── Gmail compose link ───────────────────────────────────

  function buildGmailUrl({ to, subject, body }) {
    const base = "https://mail.google.com/mail/?view=cm&fs=1";

    return (
      base +
      `&to=${encodeURIComponent(to)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`
    );
  }

  // ─── Status message ───────────────────────────────────────

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

  function clearStatus() {
    if (!statusEl) return;

    statusEl.textContent = "";
    statusEl.hidden = true;
  }

  function resetSubmitButton() {
    if (submitBtn) submitBtn.disabled = false;
    if (submitText) submitText.hidden = false;
    if (submitLoading) submitLoading.hidden = true;
  }

  // ─── Form submission ──────────────────────────────────────

  form?.addEventListener("submit", event => {
    event.preventDefault();
    clearStatus();

    const honey = form.querySelector('input[name="_honey"]');
    if (honey?.value) return;

    const valid = Object.keys(validators)
      .map(validateField)
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

    // Extract values
    const data = new FormData(form);

    const firstName = String(data.get("firstName") || "").trim();
    const lastName = String(data.get("lastName") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const message = String(data.get("message") || "").trim();
    const subjectRaw = String(data.get("subject") || "").trim();

    const rawType = enquiryHidden?.value || "general";

    const enquiryType = Object.hasOwn(subjectLabels, rawType)
      ? rawType
      : "general";

    const subsystem = subsystemHidden?.value || "";

    // Determine recipient
    let to = "";

    if (enquiryType === "technical") {

      if (!Object.hasOwn(subsystemLabels, subsystem)) {
        if (subsystemError) {
          subsystemError.textContent =
            "Please select a technical subsystem.";
        }

        technicalSection?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        showStatus("Please select a technical subsystem.");
        return;
      }

      // Subsystem recipients pending confirmation
      to = TECHNICAL_RECIPIENTS[subsystem];

      if (!to) {
        showStatus(
          "The email address for this subsystem hasn't been configured yet. " +
          "Please try again once the team has added its lead's email."
        );
        return;
      }

    } else {
      to = RECIPIENTS[enquiryType];
    }

    // Email subject
    const enquiryLabel =
      enquiryType.charAt(0).toUpperCase() + enquiryType.slice(1);

    const subsystemName =
      enquiryType === "technical"
        ? subsystemLabels[subsystem]
        : "";

    const prefix = subsystemName
      ? `[Technical - ${subsystemName}]`
      : `[${enquiryLabel}]`;

    const subject = subjectRaw
      ? `${prefix} ${subjectRaw}`
      : `${prefix} ${subjectLabels[enquiryType]}`;

    // Email body
    const body = [
      "Ashwa Racing Website Contact Form",
      "",
      `Enquiry Type: ${enquiryLabel}`,
      ...(subsystemName ? [`Subsystem: ${subsystemName}`] : []),
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

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.hidden = true;
    if (submitLoading) submitLoading.hidden = false;

    try {
      window.open(
        buildGmailUrl({ to, subject, body }),
        "_blank",
        "noopener"
      );

      showStatus(
        "A Gmail draft was requested in a new tab. " +
        "Please check that it opened and click Send in Gmail " +
        "to complete your enquiry. If no tab opened, " +
        "allow pop-ups and try again."
      );

    } catch (error) {
      console.error("Unable to open Gmail:", error);

      showStatus(
        "Unable to open Gmail. Please allow pop-ups and try again."
      );
    }

    resetSubmitButton();
  });

  // ─── Form reset ────────────────────────────────────────────

  function resetContactForm() {
    form?.reset();
    autoPackageSubject = "";

    clearValidation();
    clearSubsystem();
    setEnquiryType("general");
    updateCharacterCounter();
    resetSubmitButton();
    clearStatus();

    if (form) form.hidden = false;
    if (successEl) successEl.hidden = true;
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
