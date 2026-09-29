// Solusys Digital: careers application form (multi-step)

const CAREERS_WEB3FORMS_KEY = "c6008d3a-efb3-4c4c-bb79-d7769f072250";

document.addEventListener("DOMContentLoaded", () => {
  initCareersForm();
});

function initCareersForm() {
  const form = document.querySelector("#careers-form");
  if (!form) return;

  const steps = Array.from(form.querySelectorAll(".form-step"));
  const totalSteps = steps.length;
  const backBtn = form.querySelector("#form-back");
  const nextBtn = form.querySelector("#form-next");
  const submitBtn = form.querySelector("#form-submit");
  const status = form.querySelector(".form-status");
  const progressFill = form.querySelector(".form-progress-fill");
  const stepCurrentLabel = form.querySelector("#step-current");
  const stepTotalLabel = form.querySelector("#step-total");
  const reviewContent = form.querySelector("#review-content");
  const honeypot = form.querySelector('input[name="website"]');

  if (stepTotalLabel) stepTotalLabel.textContent = String(totalSteps);

  let currentStep = 1;

  function fieldLabel(field) {
    const wrapper = field.closest(".field");
    const label = wrapper ? wrapper.querySelector("label") : null;
    return label ? label.textContent.replace("*", "").trim() : field.name;
  }

  function showStep(stepNum, shouldScroll = true) {
    steps.forEach((step) => {
      step.hidden = Number(step.dataset.step) !== stepNum;
    });
    currentStep = stepNum;
    stepCurrentLabel.textContent = String(stepNum);
    progressFill.style.width = `${(stepNum / totalSteps) * 100}%`;
    backBtn.hidden = stepNum === 1;
    nextBtn.hidden = stepNum === totalSteps;
    nextBtn.textContent = stepNum === totalSteps - 1 ? "Review Information" : "Next";
    submitBtn.hidden = stepNum !== totalSteps;
    if (shouldScroll) {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function validateStep(stepNum) {
    const step = steps.find((s) => Number(s.dataset.step) === stepNum);
    let valid = true;
    let firstInvalid = null;
    const missing = [];

    // Plain required inputs/selects/textareas (skip hidden conditional fields)
    step.querySelectorAll("[data-required]").forEach((field) => {
      if (field.closest(".radio-group") || field.closest(".checkbox-group")) return;
      const wrapper = field.closest(".field");
      if (wrapper && wrapper.closest(".conditional-field[hidden]")) return;

      let fieldValid;
      if (field.type === "checkbox") {
        fieldValid = field.checked;
      } else if (field.type === "file") {
        fieldValid = field.files && field.files.length > 0;
      } else {
        fieldValid = field.value.trim().length > 0;
        if (field.type === "email" && fieldValid) {
          fieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
        }
      }

      if (wrapper) wrapper.classList.toggle("invalid", !fieldValid);
      if (!fieldValid) {
        valid = false;
        missing.push(fieldLabel(field));
        if (!firstInvalid) firstInvalid = field;
      }
    });

    // Required radio groups
    step.querySelectorAll(".radio-group[data-required]").forEach((group) => {
      const name = group.dataset.name;
      const checked = step.querySelector(`input[name="${name}"]:checked`);
      if (!checked) {
        valid = false;
        const wrapper = group.closest(".field");
        if (wrapper) wrapper.classList.add("invalid");
        missing.push(fieldLabel(group));
        if (!firstInvalid) firstInvalid = group;
      } else {
        const wrapper = group.closest(".field");
        if (wrapper) wrapper.classList.remove("invalid");
      }
    });

    if (!valid) {
      status.textContent = `Please complete: ${missing.join(", ")}.`;
      status.classList.remove("success");
      status.classList.add("show");
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      status.classList.remove("show", "success");
    }

    return valid;
  }

  // Conditional fields (show/hide based on a radio's selected value)
  const conditionalFields = Array.from(form.querySelectorAll(".conditional-field[data-show-when]"));

  function updateConditionalFields() {
    conditionalFields.forEach((field) => {
      const [name, value] = field.dataset.showWhen.split("=");
      const checked = form.querySelector(`input[name="${name}"]:checked`);
      field.hidden = !checked || checked.value !== value;
    });
  }

  form.addEventListener("change", (e) => {
    if (e.target.type === "radio") updateConditionalFields();
  });

  function buildReviewSummary() {
    if (!reviewContent) return;
    reviewContent.innerHTML = "";

    for (let s = 1; s < totalSteps; s++) {
      const step = steps.find((st) => Number(st.dataset.step) === s);
      const heading = step.querySelector("h3");
      const sectionEl = document.createElement("div");
      sectionEl.className = "review-section";
      const h4 = document.createElement("h4");
      h4.textContent = heading ? heading.textContent : `Section ${s}`;
      sectionEl.appendChild(h4);

      let hasContent = false;

      step.querySelectorAll(".field").forEach((field) => {
        if (field.closest(".conditional-field[hidden]")) return;

        const labelEl = field.querySelector("label");
        const labelText = labelEl ? labelEl.textContent.replace("*", "").trim() : "";
        const radioGroup = field.querySelector(".radio-group");
        const checkboxGroup = field.querySelector(".checkbox-group");
        const input = field.querySelector("input, select, textarea");
        let valueText = "";

        if (radioGroup) {
          const checked = radioGroup.querySelector("input:checked");
          valueText = checked ? checked.value : "";
        } else if (checkboxGroup) {
          valueText = Array.from(checkboxGroup.querySelectorAll("input:checked"))
            .map((c) => c.value)
            .join(", ");
        } else if (input && input.type === "file") {
          valueText = input.files && input.files[0] ? input.files[0].name : "";
        } else if (input && input.type === "checkbox") {
          valueText = input.checked ? "Confirmed" : "";
        } else if (input) {
          valueText = input.value.trim();
        }

        if (!valueText) return;
        hasContent = true;

        const row = document.createElement("div");
        row.className = "review-row";
        const labelSpan = document.createElement("span");
        labelSpan.className = "review-label";
        labelSpan.textContent = labelText;
        const valueSpan = document.createElement("span");
        valueSpan.className = "review-value";
        valueSpan.textContent = valueText;
        row.appendChild(labelSpan);
        row.appendChild(valueSpan);
        sectionEl.appendChild(row);
      });

      if (hasContent) reviewContent.appendChild(sectionEl);
    }
  }

  nextBtn.addEventListener("click", () => {
    if (!validateStep(currentStep)) return;
    const next = currentStep + 1;
    if (next === totalSteps) buildReviewSummary();
    if (currentStep < totalSteps) showStep(next);
  });

  backBtn.addEventListener("click", () => {
    if (currentStep > 1) showStep(currentStep - 1);
  });

  function enforceFileSize(fieldName, maxBytes, label) {
    const input = form.querySelector(`input[name="${fieldName}"]`);
    if (!input) return;
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (file && file.size > maxBytes) {
        status.textContent = `${label} is too large (max ${Math.round(maxBytes / (1024 * 1024))}MB). Please choose a smaller file.`;
        status.classList.add("show");
        status.classList.remove("success");
        input.value = "";
      }
    });
  }

  enforceFileSize("cv", 3 * 1024 * 1024, "CV");
  enforceFileSize("portrait_photo", 2 * 1024 * 1024, "Portrait photo");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (honeypot && honeypot.value) return;
    if (!validateStep(currentStep)) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    status.classList.remove("show", "success");

    try {
      const formData = new FormData(form);
      formData.delete("website");
      formData.append("access_key", CAREERS_WEB3FORMS_KEY);
      formData.append("subject", `New job application: ${form.querySelector('[name="full_name"]').value}`);
      formData.append("from_name", form.querySelector('[name="full_name"]').value);

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        form.querySelectorAll(".form-step, .form-nav, .form-progress").forEach((el) => (el.hidden = true));
        status.textContent = "Thanks for applying! We've received your application and will be in touch if you're shortlisted.";
        status.classList.add("show", "success");
      } else {
        throw new Error(result.message || "Submission failed");
      }
    } catch (err) {
      status.textContent = `Something went wrong sending your application (${err.message}). Please email your CV, photo, and answers directly to info@solusysdigital.com.`;
      status.classList.add("show");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Application";
    }
  });

  showStep(1, false);
}
