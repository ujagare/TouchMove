/**
 * Helper script to add reCAPTCHA v3 to contact forms
 *
 * INSTRUCTIONS:
 * 1. Get your reCAPTCHA Site Key from: https://www.google.com/recaptcha/admin
 * 2. Replace 'YOUR_SITE_KEY' below with your actual site key
 * 3. Add the script tag and updated form handler to your HTML files
 */

// ============================================
// STEP 1: Add this script tag to <head>
// ============================================
const recaptchaScriptTag = `
<!-- Google reCAPTCHA v3 -->
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
`;

// ============================================
// STEP 2: Update form submission handler
// ============================================
const updatedFormHandler = `
// Updated form submission with reCAPTCHA
async function handleFormSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  
  // Disable button
  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';
  
  try {
    // Get reCAPTCHA token
    const recaptchaToken = await new Promise((resolve, reject) => {
      grecaptcha.ready(() => {
        grecaptcha.execute('YOUR_SITE_KEY', { action: 'submit' })
          .then(resolve)
          .catch(reject);
      });
    });
    
    // Prepare form data
    const formData = {
      formType: form.dataset.formType || 'contact',
      name: form.querySelector('[name="name"]').value,
      email: form.querySelector('[name="email"]').value,
      phone: form.querySelector('[name="phone"]').value,
      location: form.querySelector('[name="location"]')?.value || '',
      service: form.querySelector('[name="service"]')?.value || '',
      message: form.querySelector('[name="message"]').value,
      formStartedAt: window.formStartedAt || Date.now(),
      recaptchaToken: recaptchaToken, // Add reCAPTCHA token
      website: '', // Honeypot field
    };
    
    // Submit form
    const response = await fetch('/.netlify/functions/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    const result = await response.json();
    
    if (response.ok && result.ok) {
      // Success
      showToast('success', result.message || 'Form submitted successfully!');
      form.reset();
    } else {
      // Error
      showToast('error', result.message || 'Something went wrong. Please try again.');
    }
  } catch (error) {
    console.error('Form submission error:', error);
    showToast('error', 'Network error. Please check your connection and try again.');
  } finally {
    // Re-enable button
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

// Initialize form started timestamp
window.formStartedAt = Date.now();

// Attach to form
document.querySelector('form').addEventListener('submit', handleFormSubmit);
`;

// ============================================
// STEP 3: Add reCAPTCHA badge styling (optional)
// ============================================
const recaptchaBadgeStyle = `
<style>
  /* Hide reCAPTCHA badge (only if you show terms in your form) */
  .grecaptcha-badge {
    visibility: hidden;
  }
  
  /* Or position it better */
  .grecaptcha-badge {
    bottom: 80px !important;
  }
</style>

<!-- Add this text to your form footer if hiding badge -->
<p class="text-xs text-gray-500 mt-4">
  This site is protected by reCAPTCHA and the Google
  <a href="https://policies.google.com/privacy" target="_blank" class="underline">Privacy Policy</a> and
  <a href="https://policies.google.com/terms" target="_blank" class="underline">Terms of Service</a> apply.
</p>
`;

// ============================================
// EXPORT FOR DOCUMENTATION
// ============================================
console.log("=".repeat(60));
console.log("reCAPTCHA v3 Integration Guide");
console.log("=".repeat(60));
console.log("\n1. Add to <head> section:");
console.log(recaptchaScriptTag);
console.log("\n2. Replace form submission handler:");
console.log(updatedFormHandler);
console.log("\n3. Optional - Add badge styling:");
console.log(recaptchaBadgeStyle);
console.log("\n" + "=".repeat(60));
console.log("Remember to replace YOUR_SITE_KEY with your actual key!");
console.log("=".repeat(60));
