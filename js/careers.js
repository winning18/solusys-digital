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
  const honeypot = form.querySelector('input[name="website"]');

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

  nextBtn.addEventListener("click", () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < totalSteps) showStep(currentStep + 1);
  });

  backBtn.addEventListener("click", () => {
    if (currentStep > 1) showStep(currentStep - 1);
  });

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
      status.textContent = "Something went wrong sending your application. Please email your CV directly to info@solusysdigital.com.";
      status.classList.add("show");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Application";
    }
  });

  showStep(1, false);
}
