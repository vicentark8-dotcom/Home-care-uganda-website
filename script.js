/* ===========================================================
   HOME CARE UGANDA — SHARED SCRIPT  (v5, rebuilt & tested)
   Link this file before </body> on every page: <script src="script.js"></script>
   =========================================================== */

const BACKEND_URL = "https://backend-home-care-uganda.onrender.com";

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Nav highlighting ---- */
  const current = document.body.dataset.page;
  document.querySelectorAll('.navlinks a[data-nav]').forEach(a => {
    if (a.dataset.nav === current) a.classList.add('active');
  });

  /* ---- Mobile menu toggle ---- */
  const hamburger = document.getElementById('hamburger');
  const navlinks  = document.getElementById('navlinks');
  if (hamburger && navlinks) {
    hamburger.addEventListener('click', () => navlinks.classList.toggle('open'));
  }

  /* ---- About page sub-tabs ---- */
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('[data-tabpanel]').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.querySelector(`[data-tabpanel="${tab.dataset.tab}"]`);
      if (panel) panel.classList.add('active');
    });
  });

  /* ---- Programs page accordion ---- */
  document.querySelectorAll('.program-card').forEach(card => {
    card.addEventListener('click', () => {
      const detail = card.querySelector('.program-detail');
      if (!detail) return;
      const isOpen = detail.classList.contains('open');
      detail.classList.toggle('open', !isOpen);
      card.classList.toggle('expanded', !isOpen);
    });
  });

  /* ---- Donate page: tiers, custom amount, frequency, method ---- */
  const tierCards   = document.querySelectorAll('.tier-card');
  const customInput = document.getElementById('customAmount');
  tierCards.forEach(card => {
    card.addEventListener('click', () => {
      tierCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      if (customInput) customInput.value = card.dataset.amount || '';
    });
  });
  if (customInput) {
    customInput.addEventListener('input', () => {
      if (customInput.value) tierCards.forEach(c => c.classList.remove('selected'));
    });
  }

  const freqButtons = document.querySelectorAll('.tier-toggle button');
  freqButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      freqButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const methodChips = document.querySelectorAll('.method-chip');
  methodChips.forEach(chip => {
    chip.addEventListener('click', () => {
      methodChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  /* ---- Scroll reveal ---- */
  function runReveal() {
    document.querySelectorAll('.fade-in').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 60) el.classList.add('visible');
    });
  }
  window.addEventListener('scroll', runReveal);
  runReveal();

  /* ----------------------------------------------------------------
     FORM SUBMISSIONS
     Every form below is sent as JSON to the Flask backend. The keys
     in each `data` object match exactly what the backend expects —
     this pairing has been tested end-to-end, so if you ever add a
     field, add it in three places: the <input name="...">, here,
     and the matching data.get("...") in homecare_flask_backend.py.
     ---------------------------------------------------------------- */

  function showMessage(form, message, isError = false) {
    let msg = form.querySelector('.submit-message');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'submit-message';
      msg.style.cssText = `
        margin-top: 14px;
        padding: 14px 18px;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 600;
        text-align: center;
      `;
      form.appendChild(msg);
    }
    msg.textContent = message;
    msg.style.background = isError ? '#fdf0ed' : '#eafaf1';
    msg.style.color      = isError ? '#A8542E' : '#1e8449';
    msg.style.border     = isError ? '1px solid #f5b9a8' : '1px solid #a9dfbf';
    msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Sending…' : btn.dataset.originalText;
  }

  function validateForm(form) {
    let ok = true;
    form.querySelectorAll('[required]').forEach(field => {
      if (field.type === 'checkbox') {
        if (!field.checked) ok = false;
      } else if (!field.value.trim()) {
        ok = false;
        field.style.borderColor = '#A8542E';
      } else {
        field.style.borderColor = '';
      }
    });
    return ok;
  }

  // Shared submit handler: posts JSON, always resolves to a clear message.
  async function submitForm(form, endpoint, buildPayload, successText) {
    const btn = form.querySelector('button[type="submit"]');
    if (btn && !btn.dataset.originalText) btn.dataset.originalText = btn.textContent;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(form)) {
        showMessage(form, 'Please fill in all required fields marked with *.', true);
        return;
      }

      setLoading(btn, true);
      try {
        const res = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload())
        });

        let result = {};
        try { result = await res.json(); } catch (_) { /* non-JSON response */ }

        if (res.ok && result.success) {
          showMessage(form, successText);
          form.reset();
        } else {
          showMessage(form, result.error || 'Something went wrong. Please try again.', true);
        }
      } catch (err) {
        showMessage(form, 'Could not reach the server. Please check your connection and try again.', true);
      }
      setLoading(btn, false);
    });
  }

  /* ---- DONATION FORM ---- */
  const donateForm = document.querySelector('body[data-page="donate"] form[data-validate]');
  if (donateForm) {
    submitForm(donateForm, '/api/donate', () => {
      const selectedTier = document.querySelector('.tier-card.selected');
      const customAmt    = document.getElementById('customAmount');
      const amount = (customAmt && customAmt.value) ? customAmt.value
                   : (selectedTier ? selectedTier.dataset.amount : '');

      const activeMethod = document.querySelector('.method-chip.active');
      const method = activeMethod ? activeMethod.textContent : '';

      const activeFreq = document.querySelector('.tier-toggle button.active');
      const frequency = activeFreq ? activeFreq.textContent : 'One-time';

      return {
        name:    donateForm.querySelector('[name="name"]')?.value.trim()    || '',
        email:   donateForm.querySelector('[name="email"]')?.value.trim()   || '',
        amount:  amount,
        message: donateForm.querySelector('[name="message"]')?.value.trim() || '',
        type:    `${frequency} — ${method}`
      };
    }, '✓ Thank you! Your donation details have been received. We will contact you with payment instructions.');
  }

  /* ---- VOLUNTEER FORM ---- */
  const volunteerForm = document.querySelector('body[data-page="volunteer"] form[data-validate]');
  if (volunteerForm) {
    submitForm(volunteerForm, '/api/volunteer', () => ({
      name:      volunteerForm.querySelector('[name="name"]')?.value.trim()      || '',
      email:     volunteerForm.querySelector('[name="email"]')?.value.trim()     || '',
      phone:     volunteerForm.querySelector('[name="phone"]')?.value.trim()     || '',
      location:  volunteerForm.querySelector('[name="location"]')?.value.trim()  || '',
      frequency: volunteerForm.querySelector('[name="frequency"]')?.value.trim() || '',
      skills:    volunteerForm.querySelector('[name="skills"]')?.value.trim()    || ''
    }), '✓ Application submitted! We will contact you soon.');
  }

  /* ---- CHILD REGISTRATION FORM ---- */
  const registerForm = document.querySelector('body[data-page="register"] form[data-validate]');
  if (registerForm) {
    submitForm(registerForm, '/api/register-child', () => ({
      child_name:            registerForm.querySelector('[name="child_name"]')?.value.trim()             || '',
      child_dob:             registerForm.querySelector('[name="child_dob"]')?.value.trim()               || '',
      child_gender:          registerForm.querySelector('[name="child_gender"]')?.value.trim()            || '',
      child_location:        registerForm.querySelector('[name="child_location"]')?.value.trim()          || '',
      child_situation:       registerForm.querySelector('[name="child_situation"]')?.value.trim()         || '',
      referrer_name:         registerForm.querySelector('[name="referrer_name"]')?.value.trim()           || '',
      referrer_relationship: registerForm.querySelector('[name="referrer_relationship"]')?.value.trim()   || '',
      referrer_phone:        registerForm.querySelector('[name="referrer_phone"]')?.value.trim()          || '',
      referrer_email:        registerForm.querySelector('[name="referrer_email"]')?.value.trim()          || ''
    }), '✓ Application received! Our team will be in touch within a few days.');
  }

  /* ---- CONTACT FORM ---- */
  const contactForm = document.querySelector('body[data-page="contact"] form[data-validate]');
  if (contactForm) {
    submitForm(contactForm, '/api/contact', () => ({
      name:    contactForm.querySelector('[name="name"]')?.value.trim()    || '',
      email:   contactForm.querySelector('[name="email"]')?.value.trim()   || '',
      message: contactForm.querySelector('[name="message"]')?.value.trim() || ''
    }), '✓ Message sent! We will get back to you soon.');
  }

});
