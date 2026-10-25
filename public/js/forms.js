// One generic handler for every form and action button in the site.
// The HTML says what to do with data- attributes, so there is no page-specific JavaScript:
//
//   <form data-api="/api/jobs" data-method="POST">          submit the form as JSON to the API
//   <form ... enctype="multipart/form-data">                 submit as FormData (file upload)
//   <form ... data-reset>                                    clear the form and show a toast, no reload
//   <button data-action data-api="..." data-method="PATCH"
//           data-body='{"status":"closed"}' data-confirm="Sure?">   click = API call
//   <select data-change-api="..." data-change-method="PATCH"
//           data-change-field="status">                      change = API call with { status: value }
//
// After a successful call: go to the "redirectTo" address from the API, or reload the page.
(function () {
  const { api, toast, toastAfterReload, confirmDialog } = window.AJ;

  function setLoading(button, isLoading) {
    if (!button) return;
    button.classList.toggle('is-loading', isLoading);
    button.disabled = isLoading;
  }

  // ---------- Showing errors ----------
  function clearErrors(form) {
    form.querySelectorAll('.field.has-error').forEach((field) => field.classList.remove('has-error'));
    form.querySelectorAll('[data-error-for]').forEach((slot) => { slot.textContent = ''; });
    const formError = form.querySelector('[data-form-error]');
    if (formError) formError.textContent = '';
  }

  function showFieldError(form, name, message) {
    const slot = form.querySelector(`[data-error-for="${name}"]`);
    if (!slot) return false;
    slot.textContent = message;
    const field = slot.closest('.field');
    if (field) field.classList.add('has-error');
    return true;
  }

  function showErrors(form, message, errors) {
    let fieldErrorShown = false;
    Object.entries(errors || {}).forEach(([name, text]) => {
      if (showFieldError(form, name, text)) fieldErrorShown = true;
    });

    if (fieldErrorShown) {
      const firstBad = form.querySelector('.field.has-error .input');
      if (firstBad) firstBad.focus();
      return;
    }
    const formError = form.querySelector('[data-form-error]');
    if (formError) formError.textContent = message;
    else toast(message, 'error');
  }

  // Quick check before sending: every visible "required" field must be filled in.
  function findEmptyRequiredFields(form) {
    const missing = {};
    form.querySelectorAll('[required]').forEach((control) => {
      if (control.disabled || control.closest('[hidden]')) return;
      const isEmpty = control.type === 'file' ? control.files.length === 0 : control.value.trim() === '';
      if (!isEmpty) return;
      const label = form.querySelector(`label[for="${control.id}"]`);
      const name = label ? label.childNodes[0].textContent.trim() : 'This field';
      missing[control.name] = `${name} is required.`;
    });
    return missing;
  }

  function finish(result, redirectTo) {
    toastAfterReload(result.message);
    if (redirectTo) window.location.href = redirectTo;
    else window.location.reload();
  }

  // ---------- Forms ----------
  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('form[data-api]');
    if (!form) return;
    event.preventDefault();

    clearErrors(form);
    const missing = findEmptyRequiredFields(form);
    if (Object.keys(missing).length) {
      showErrors(form, 'Please fill in the required fields.', missing);
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    const isUpload = form.enctype === 'multipart/form-data';
    const body = isUpload ? new FormData(form) : Object.fromEntries(new FormData(form));

    setLoading(button, true);
    try {
      const result = await api(form.dataset.api, { method: form.dataset.method || 'POST', body });
      if (form.hasAttribute('data-reset')) {
        form.reset();
        toast(result.message);
        setLoading(button, false);
        return;
      }
      finish(result, (result.data && result.data.redirectTo) || form.dataset.redirect);
    } catch (error) {
      showErrors(form, error.message, error.errors);
      setLoading(button, false);
    }
  });

  // ---------- Buttons ----------
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    event.preventDefault();

    if (button.dataset.confirm && !(await confirmDialog(button.dataset.confirm))) return;

    setLoading(button, true);
    try {
      const body = button.dataset.body ? JSON.parse(button.dataset.body) : undefined;
      const result = await api(button.dataset.api, { method: button.dataset.method || 'POST', body });
      finish(result, result.data && result.data.redirectTo);
    } catch (error) {
      toast(error.message, 'error');
      setLoading(button, false);
    }
  });

  // ---------- Dropdowns that save when changed (application status) ----------
  document.querySelectorAll('select[data-change-api]').forEach((select) => { select.dataset.current = select.value; });

  document.addEventListener('change', async (event) => {
    const select = event.target.closest('select[data-change-api]');
    if (!select) return;

    select.disabled = true;
    try {
      const result = await api(select.dataset.changeApi, {
        method: select.dataset.changeMethod || 'PATCH',
        body: { [select.dataset.changeField]: select.value },
      });
      select.dataset.current = select.value;
      toast(result.message);
    } catch (error) {
      select.value = select.dataset.current; // put the old value back
      toast(error.message, 'error');
    } finally {
      select.disabled = false;
    }
  });

  // ---------- Register page: show the company field only for employers ----------
  document.querySelectorAll('form[data-role-form]').forEach((form) => {
    const sync = () => {
      const role = form.querySelector('input[name="role"]:checked').value;
      form.querySelectorAll('[data-show-for]').forEach((block) => { block.hidden = block.dataset.showFor !== role; });
    };
    form.querySelectorAll('input[name="role"]').forEach((radio) => radio.addEventListener('change', sync));
    sync();
  });
})();
