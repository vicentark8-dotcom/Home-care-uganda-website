/* ===========================================================
   HOME CARE UGANDA — SHARED SCRIPT
   Link this file before </body> on every page: <script src="script.js"></script>
   =========================================================== */

/* ----------------------------------------------------------------
   FLASK BACKEND URL
   Change this to your phone's IP when running Flask locally,
   or to your online server URL after you deploy to Railway/Render.
   ---------------------------------------------------------------- */
const BACKEND_URL = "https://backend-home-care-uganda-production.up.railway.app";

// Highlight the current page in nav
document.addEventListener('DOMContentLoaded', () => {
  const current = document.body.dataset.page;
  document.querySelectorAll('.navlinks a[data-nav]').forEach(a => {
    if(a.dataset.nav === current) a.classList.add('active');
  });

  // Mobile menu toggle
  const hamburger = document.getElementById('hamburger');
  const navlinks  = document.getElementById('navlinks');
  if(hamburger && navlinks){
    hamburger.addEventListener('click', () => navlinks.classList.toggle('open'));
  }

  // About page sub-tabs
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('[data-tabpanel]').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.querySelector(`[data-tabpanel="${tab.dataset.tab}"]`);
      if(panel) panel.classList.add('active');
    });
  });

  // Programs page accordion
  document.querySelectorAll('.program-card').forEach(card => {
    card.addEventListener('click', () => {
      const detail = card.querySelector('.program-detail');
      if(!detail) return;
      const isOpen = detail.classList.contains('open');
      detail.classList.toggle('open', !isOpen);
      card.classList.toggle('expanded', !isOpen);
    });
  });

  // Donation page: amount tiers + custom amount + one-time/monthly toggle
  const tierCards   = document.querySelectorAll('.tier-card');
  const customInput = document.getElementById('customAmount');
  tierCards.forEach(card => {
    card.addEventListener('click', () => {
      tierCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      if(customInput) customInput.value = card.dataset.amount || '';
    });
  });

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

  // Scroll reveal animation
  function runReveal(){
    document.querySelectorAll('.fade-in').forEach(el => {
      const rect = el.getBoundingClientRect();
      if(rect.top < window.innerHeight - 60) el.classList.add('visible');
    });
  }
  window.addEventListener('scroll', runReveal);
  runReveal();

  /* ----------------------------------------------------------------
     FORM SUBMISSIONS — sends to Flask backend
     ---------------------------------------------------------------- */

  // Helper: show a success or error message inside the form panel
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
    msg.style.background    = isError ? '#fdf0ed' : '#eafaf1';
    msg.style.color          = isError ? '#A8542E' : '#1e8449';
    msg.style.border         = isError ? '1px solid #f5b9a8' : '1px solid #a9dfbf';
    msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Helper: set submit button loading state
  function setLoading(btn, loading) {
    btn.disabled    = loading;
    btn.textContent = loading ? 'Sending…' : btn.dataset.originalText;
  }

  // Front-end validation
  function validateForm(form) {
    let ok = true;
    form.querySelectorAll('[required]').forEach(field => {
      if (!field.value.trim() && field.type !== 'checkbox') {
        ok = false;
        field.style.borderColor = '#A8542E';
      } else if (field.type === 'checkbox' && !field.checked) {
        ok = false;
      } else {
        field.style.borderColor = '';
      }
    });
    return ok;
  }

  /* ---- VOLUNTEER FORM ---- */
  const volunteerForm = document.querySelector('[data-page="volunteer"] form[data-validate], body[data-page="volunteer"] form[data-validate]');
  if (volunteerForm) {
    const btn = volunteerForm.querySelector('button[type="submit"]');
    if (btn) btn.dataset.originalText = btn.textContent;

    volunteerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(volunteerForm)) {
        showMessage(volunteerForm, 'Please fill in all required fields marked with *.', true);
        return;
      }

      setLoading(btn, true);

      const data = {
        full_name:    volunteerForm.querySelector('[name="name"]')?.value.trim()      || '',
        contact:      volunteerForm.querySelector('[name="phone"]')?.value.trim()     || '',
        skills:       volunteerForm.querySelector('[name="skills"]')?.value.trim()    || '',
        availability: volunteerForm.querySelector('[name="frequency"]')?.value.trim() || '',
        email:        volunteerForm.querySelector('[name="location"]')?.value.trim()  || '',
      };

      try {
        const res    = await fetch(`${BACKEND_URL}/api/volunteer`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          showMessage(volunteerForm, '✓ Application submitted! We will contact you soon.');
          volunteerForm.reset();
        } else {
          showMessage(volunteerForm, result.error || 'Something went wrong. Please try again.', true);
        }
      } catch (err) {
        showMessage(volunteerForm, 'Could not reach the server. Make sure Flask is running.', true);
      }

      setLoading(btn, false);
    });
  }

  /* ---- CHILD REGISTRATION FORM ---- */
  const registerForm = document.querySelector('body[data-page="register"] form[data-validate]');
  if (registerForm) {
    const btn = registerForm.querySelector('button[type="submit"]');
    if (btn) btn.dataset.originalText = btn.textContent;

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(registerForm)) {
        showMessage(registerForm, 'Please fill in all required fields marked with *.', true);
        return;
      }

      setLoading(btn, true);

      const childName     = registerForm.querySelector('[name="child_name"]')?.value.trim()          || '';
      const childDob      = registerForm.querySelector('[name="child_dob"]')?.value.trim()           || '';
      const childGender   = registerForm.querySelector('[name="child_gender"]')?.value.trim()        || '';
      const childLocation = registerForm.querySelector('[name="child_location"]')?.value.trim()      || '';
      const childSituation= registerForm.querySelector('[name="child_situation"]')?.value.trim()     || '';
      const refName       = registerForm.querySelector('[name="referrer_name"]')?.value.trim()       || '';
      const refRelation   = registerForm.querySelector('[name="referrer_relationship"]')?.value.trim()|| '';
      const refPhone      = registerForm.querySelector('[name="referrer_phone"]')?.value.trim()      || '';
      const refEmail      = registerForm.querySelector('[name="referrer_email"]')?.value.trim()      || '';

      const data = {
        full_name:      childName,
        age:            childDob,
        gender:         childGender,
        guardian_name:  `${refName} (${refRelation})`,
        contact:        refPhone,
        notes:          `Location: ${childLocation}. Situation: ${childSituation}. Referrer email: ${refEmail}`,
      };

      try {
        const res    = await fetch(`${BACKEND_URL}/api/register-child`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          showMessage(registerForm, '✓ Application received! Our team will be in touch within a few days.');
          registerForm.reset();
        } else {
          showMessage(registerForm, result.error || 'Something went wrong. Please try again.', true);
        }
      } catch (err) {
        showMessage(registerForm, 'Could not reach the server. Make sure Flask is running.', true);
      }

      setLoading(btn, false);
    });
  }

  /* ---- DONATION FORM ---- */
  const donateForm = document.querySelector('body[data-page="donate"] form[data-validate]');
  if (donateForm) {
    const btn = donateForm.querySelector('button[type="submit"]');
    if (btn) btn.dataset.originalText = btn.textContent;

    donateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(donateForm)) {
        showMessage(donateForm, 'Please fill in all required fields marked with *.', true);
        return;
      }

      setLoading(btn, true);

      // Get selected amount from tier card or custom input
      const selectedTier = document.querySelector('.tier-card.selected');
      const customAmt    = document.getElementById('customAmount');
      const amount       = (customAmt && customAmt.value) ? customAmt.value
                         : (selectedTier ? selectedTier.dataset.amount : '');

      // Get selected payment method
      const activeMethod = document.querySelector('.method-chip.active');
      const method       = activeMethod ? activeMethod.textContent : '';

      // Get frequency (one-time or monthly)
      const activeFreq   = document.querySelector('.tier-toggle button.active');
      const frequency    = activeFreq ? activeFreq.textContent : 'One-time';

      const data = {
        donor_name:    donateForm.querySelector('[name="name"]')?.value.trim()    || '',
        amount:        amount,
        currency:      'USD',
        donation_type: `${frequency} — ${method}`,
        notes:         donateForm.querySelector('[name="message"]')?.value.trim() || '',
      };

      try {
        const res    = await fetch(`${BACKEND_URL}/api/donate`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          showMessage(donateForm, '✓ Thank you! Your donation details have been received. We will contact you with payment instructions.');
          donateForm.reset();
        } else {
          showMessage(donateForm, result.error || 'Something went wrong. Please try again.', true);
        }
      } catch (err) {
        showMessage(donateForm, 'Could not reach the server. Make sure Flask is running.', true);
      }

      setLoading(btn, false);
    });
  }

  /* ---- CONTACT FORM ---- */
  const contactForm = document.querySelector('body[data-page="contact"] form[data-validate]');
  if (contactForm) {
    const btn = contactForm.querySelector('button[type="submit"]');
    if (btn) btn.dataset.originalText = btn.textContent;

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(contactForm)) {
        showMessage(contactForm, 'Please fill in all required fields marked with *.', true);
        return;
      }

      setLoading(btn, true);

      const data = {
        donor_name:    contactForm.querySelector('[name="name"]')?.value.trim()    || '',
        amount:        '0',
        currency:      'N/A',
        donation_type: 'Contact message',
        notes:         `Email: ${contactForm.querySelector('[name="email"]')?.value.trim() || ''}. Message: ${contactForm.querySelector('[name="message"]')?.value.trim() || ''}`,
      };

      try {
        const res    = await fetch(`${BACKEND_URL}/api/donate`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          showMessage(contactForm, '✓ Message sent! We will get back to you soon.');
          contactForm.reset();
        } else {
          showMessage(contactForm, result.error || 'Something went wrong. Please try again.', true);
        }
      } catch (err) {
        showMessage(contactForm, 'Could not reach the server. Make sure Flask is running.', true);
      }

      setLoading(btn, false);
    });
  }

});
