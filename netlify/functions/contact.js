// Sentry monitoring (optional - only if SENTRY_DSN is configured)
let Sentry = null;
try {
  if (process.env.SENTRY_DSN) {
    Sentry = require("@sentry/node");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.CONTEXT || "production",
      tracesSampleRate: 1.0,
    });
  }
} catch (error) {
  console.warn("Sentry not available:", error.message);
}

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none';",
  "X-XSS-Protection": "1; mode=block",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

const MAX_BODY_BYTES = 25_000;
const MIN_FORM_FILL_MS = 2_500;
const MAX_FORM_AGE_MS = 1000 * 60 * 60 * 2;
const GENERIC_ERROR_MESSAGE =
  "We could not process your request right now. Please try again.";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 20;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minute block

// In-memory storage for rate limiting (use Redis/KV in production for multi-instance)
const requestLog = new Map();
const blockedIPs = new Map();

function firstEnv() {
  for (const key of arguments) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function extractEmailAddress(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const angleMatch = raw.match(/<([^<>@\s]+@[^<>@\s]+)>/);
  if (angleMatch && angleMatch[1]) {
    return angleMatch[1].trim();
  }

  return raw;
}

function composeFromAddress(displayName, emailAddress) {
  const safeName = sanitize(displayName, 120).replace(/"/g, "");
  return `${safeName} <${emailAddress}>`;
}

function sanitize(value, maxLength = 2000) {
  return String(value ?? "")
    .replace(/[\x00-\x1F\x7F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value) {
  return /^[0-9+\-\s()]{7,20}$/.test(value);
}

function validName(value) {
  return value.length >= 2 && value.length <= 120;
}

function validMessage(value) {
  return value.length >= 10 && value.length <= 5000;
}

function formLabel(formType) {
  if (formType === "intake") return "Client Intake Form";
  if (formType === "kuber-workshop") return "Kuber Workshop Inquiry";
  return "Contact Form";
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function optionalHtmlField(label, value) {
  if (!value) return "";
  return `<p><strong>${htmlEscape(label)}:</strong> ${htmlEscape(value)}</p>`;
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  };
}

function normalizeOrigin(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
}

function getAllowedOrigins(event) {
  const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  const host = sanitize(event.headers?.host, 255);
  const derivedOrigins = host
    ? [`https://${host}`, `http://${host}`].map((origin) =>
        normalizeOrigin(origin),
      )
    : [];

  return new Set([
    ...configuredOrigins,
    ...derivedOrigins,
    "http://127.0.0.1:5500",
    "http://localhost:5500",
  ]);
}

function requestOriginAllowed(event) {
  const allowedOrigins = getAllowedOrigins(event);
  const origin = normalizeOrigin(event.headers?.origin);
  const referer = normalizeOrigin(event.headers?.referer);

  if (origin && allowedOrigins.has(origin)) {
    return true;
  }

  if (referer) {
    for (const allowed of allowedOrigins) {
      if (referer.startsWith(allowed)) {
        return true;
      }
    }
  }

  return !origin && !referer;
}

function validStartedAt(value) {
  const startedAt = Number(value);

  if (!Number.isFinite(startedAt)) {
    return false;
  }

  const age = Date.now() - startedAt;
  return age >= MIN_FORM_FILL_MS && age <= MAX_FORM_AGE_MS;
}

function getClientIP(event) {
  // Try multiple headers to get real IP (Netlify specific)
  const ip =
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    event.headers["x-real-ip"] ||
    "unknown";
  return sanitize(ip, 45);
}

function isIPBlocked(ip) {
  const blockInfo = blockedIPs.get(ip);
  if (!blockInfo) return false;

  if (Date.now() - blockInfo.blockedAt < BLOCK_DURATION_MS) {
    return true;
  }

  // Unblock after duration
  blockedIPs.delete(ip);
  return false;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const requests = requestLog.get(ip) || [];

  // Remove old requests outside the window
  const recentRequests = requests.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    // Block this IP
    blockedIPs.set(ip, { blockedAt: now, attempts: recentRequests.length });
    logSecurityEvent("RATE_LIMIT_EXCEEDED", {
      ip,
      attempts: recentRequests.length,
    });
    return false;
  }

  // Add current request
  recentRequests.push(now);
  requestLog.set(ip, recentRequests);

  // Cleanup old entries periodically
  if (requestLog.size > 1000) {
    cleanupOldEntries();
  }

  return true;
}

function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, requests] of requestLog.entries()) {
    const recentRequests = requests.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
    );
    if (recentRequests.length === 0) {
      requestLog.delete(ip);
    } else {
      requestLog.set(ip, recentRequests);
    }
  }

  for (const [ip, blockInfo] of blockedIPs.entries()) {
    if (now - blockInfo.blockedAt >= BLOCK_DURATION_MS) {
      blockedIPs.delete(ip);
    }
  }
}

function logSecurityEvent(eventType, details) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    eventType,
    ...details,
  };

  // Log to console (in production, send to monitoring service)
  console.warn("SECURITY_EVENT", JSON.stringify(logEntry));

  // Send to Sentry if available
  if (Sentry) {
    const severity =
      eventType.includes("FAILED") ||
      eventType.includes("EXCEEDED") ||
      eventType.includes("BLOCKED")
        ? "warning"
        : "info";

    Sentry.captureMessage(`Security Event: ${eventType}`, {
      level: severity,
      extra: details,
      tags: {
        eventType,
        ip: details.ip || "unknown",
      },
    });
  }
}

async function verifyRecaptcha(token) {
  const recaptchaSecret = firstEnv("RECAPTCHA_SECRET_KEY", "RECAPTCHA_SECRET");

  if (!recaptchaSecret) {
    console.warn("reCAPTCHA secret not configured, skipping verification");
    return { success: true, score: 1.0, skipped: true };
  }

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(recaptchaSecret)}&response=${encodeURIComponent(token)}`,
      },
    );

    const data = await response.json();
    return {
      success: data.success === true,
      score: data.score || 0,
      action: data.action,
      skipped: false,
    };
  } catch (error) {
    console.error("reCAPTCHA verification failed", error);
    if (Sentry) {
      Sentry.captureException(error, {
        tags: { component: "recaptcha" },
      });
    }
    return { success: false, score: 0, error: true };
  }
}

exports.handler = async (event) => {
  const clientIP = getClientIP(event);

  // Check if IP is blocked
  if (isIPBlocked(clientIP)) {
    logSecurityEvent("BLOCKED_IP_ATTEMPT", { ip: clientIP });
    return response(429, {
      ok: false,
      message: "Too many requests. Please try again later.",
    });
  }

  // Check rate limit
  if (!checkRateLimit(clientIP)) {
    return response(429, {
      ok: false,
      message: "Too many requests. Please try again in an hour.",
    });
  }

  if (event.httpMethod !== "POST") {
    logSecurityEvent("INVALID_METHOD", {
      ip: clientIP,
      method: event.httpMethod,
    });
    return response(405, { ok: false, message: "Method Not Allowed" });
  }

  const contentType = sanitize(
    event.headers?.["content-type"] || event.headers?.["Content-Type"],
    200,
  );
  if (!contentType.toLowerCase().includes("application/json")) {
    logSecurityEvent("INVALID_CONTENT_TYPE", { ip: clientIP, contentType });
    return response(415, { ok: false, message: GENERIC_ERROR_MESSAGE });
  }

  if ((event.body || "").length > MAX_BODY_BYTES) {
    logSecurityEvent("BODY_TOO_LARGE", {
      ip: clientIP,
      size: event.body.length,
    });
    return response(413, { ok: false, message: GENERIC_ERROR_MESSAGE });
  }

  if (!requestOriginAllowed(event)) {
    logSecurityEvent("INVALID_ORIGIN", {
      ip: clientIP,
      origin: event.headers?.origin,
      referer: event.headers?.referer,
    });
    return response(403, { ok: false, message: GENERIC_ERROR_MESSAGE });
  }

  const resendApiKey = firstEnv("RESEND_API_KEY", "API_KEY", "RESEND_KEY");
  const toEmailRaw =
    firstEnv(
      "CONTACT_TO_EMAIL",
      "CONTACT_RECIPIENT_EMAIL",
      "TO_EMAIL",
      "RESEND_TO_EMAIL",
    ) || "touchandmove.69@gmail.com";
  const fromEmailRaw =
    firstEnv("CONTACT_FROM_EMAIL", "FROM_EMAIL", "RESEND_FROM_EMAIL") ||
    "Touch and Move <onboarding@resend.dev>";
  const toEmail = extractEmailAddress(toEmailRaw);
  const fromEmail = extractEmailAddress(fromEmailRaw);

  if (!resendApiKey || !fromEmail || !toEmail) {
    console.error("Missing email configuration", {
      hasResendApiKey: Boolean(resendApiKey),
      hasToEmail: Boolean(toEmail),
      hasFromEmail: Boolean(fromEmail),
      envKeys: Object.keys(process.env).filter(function (key) {
        return /EMAIL|RESEND|API_KEY/i.test(key);
      }),
    });
    logSecurityEvent("MISSING_CONFIG", { ip: clientIP });
    return response(500, {
      ok: false,
      message: "Email service is not configured correctly on the server.",
    });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    logSecurityEvent("INVALID_JSON", { ip: clientIP });
    return response(400, { ok: false, message: GENERIC_ERROR_MESSAGE });
  }

  const formType = sanitize(payload.formType, 40) || "contact";
  const adminFromName =
    formType === "kuber-workshop"
      ? "Workshop se mail mila"
      : "Contact se mail mila";
  const adminFromEmail = composeFromAddress(adminFromName, fromEmail);
  const autoReplyFromEmail = composeFromAddress("Touch and Move", fromEmail);
  const name = sanitize(payload.name, 120);
  const email = sanitize(payload.email, 180).toLowerCase();
  const phone = sanitize(payload.phone, 40);
  const location = sanitize(payload.location, 120);
  const service = sanitize(payload.service, 160);
  const message = sanitize(payload.message, 5000);
  const birthDate = sanitize(payload.birthDate, 40);
  const birthTime = sanitize(payload.birthTime, 80);
  const birthPlace = sanitize(payload.birthPlace, 180);
  const workshopName = sanitize(payload.workshopName, 200);
  const sourcePage = sanitize(payload.sourcePage, 120);
  const honeypot = sanitize(payload.website || payload.botField, 200);
  const startedAt = sanitize(payload.formStartedAt, 40);
  const recaptchaToken = sanitize(payload.recaptchaToken, 2000);

  if (honeypot) {
    logSecurityEvent("HONEYPOT_TRIGGERED", { ip: clientIP, honeypot });
    return response(400, { ok: false, message: GENERIC_ERROR_MESSAGE });
  }

  if (!validStartedAt(startedAt)) {
    logSecurityEvent("INVALID_FORM_TIMING", { ip: clientIP, startedAt });
    return response(400, { ok: false, message: GENERIC_ERROR_MESSAGE });
  }

  // Verify reCAPTCHA
  const recaptchaResult = await verifyRecaptcha(recaptchaToken);
  if (!recaptchaResult.success && !recaptchaResult.skipped) {
    logSecurityEvent("RECAPTCHA_FAILED", {
      ip: clientIP,
      score: recaptchaResult.score,
      action: recaptchaResult.action,
    });
    return response(400, {
      ok: false,
      message: "Security verification failed. Please try again.",
    });
  }

  // Check reCAPTCHA score (v3 returns 0.0 to 1.0, lower = more likely bot)
  if (!recaptchaResult.skipped && recaptchaResult.score < 0.5) {
    logSecurityEvent("LOW_RECAPTCHA_SCORE", {
      ip: clientIP,
      score: recaptchaResult.score,
    });
    return response(400, {
      ok: false,
      message: "Security verification failed. Please try again.",
    });
  }

  if (!validName(name)) {
    logSecurityEvent("INVALID_NAME", { ip: clientIP });
    return response(400, { ok: false, message: "Please enter a valid name." });
  }

  if (email && !validEmail(email)) {
    logSecurityEvent("INVALID_EMAIL", { ip: clientIP, email });
    return response(400, { ok: false, message: "Please enter a valid email." });
  }

  if (!phone || !validPhone(phone)) {
    logSecurityEvent("INVALID_PHONE", { ip: clientIP });
    return response(400, {
      ok: false,
      message: "Please enter a valid phone number.",
    });
  }

  if (!validMessage(message)) {
    logSecurityEvent("INVALID_MESSAGE", { ip: clientIP });
    return response(400, {
      ok: false,
      message: "Please enter at least 10 characters in the message.",
    });
  }

  const subjectPrefix = formLabel(formType);
  const subject =
    formType === "kuber-workshop"
      ? `[Workshop Form] ${name}`
      : `[Contact Form] ${name}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 16px;">New ${htmlEscape(subjectPrefix)} Submission</h2>
      <p><strong>Name:</strong> ${htmlEscape(name)}</p>
      ${optionalHtmlField("Email", email)}
      <p><strong>Phone:</strong> ${htmlEscape(phone)}</p>
      ${optionalHtmlField("Location", location)}
      ${optionalHtmlField("Preferred Service", service)}
      <p><strong>Form Type:</strong> ${htmlEscape(formType)}</p>
      ${optionalHtmlField("Workshop", workshopName)}
      ${optionalHtmlField("Birth Date", birthDate)}
      ${optionalHtmlField("Birth Time", birthTime)}
      ${optionalHtmlField("Birth Place", birthPlace)}
      ${optionalHtmlField("Source Page", sourcePage)}
      <p><strong>Message:</strong></p>
      <div style="padding: 12px 14px; background: #f3f4f6; border-radius: 8px; white-space: pre-wrap;">${htmlEscape(message)}</div>
      <p style="margin-top: 16px;"><strong>Submitted At:</strong> ${htmlEscape(new Date().toISOString())}</p>
    </div>
  `;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let resendResponse;

  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: adminFromEmail,
        to: [toEmail],
        subject,
        html,
        ...(email ? { reply_to: email } : {}),
      }),
      signal: controller.signal,
    });
  } catch (error) {
    console.error("Resend request failed", {
      message: error && error.message ? error.message : "unknown fetch error",
    });
    logSecurityEvent("EMAIL_SEND_FAILED", {
      ip: clientIP,
      error: error && error.message ? error.message : "unknown",
    });
    if (Sentry) {
      Sentry.captureException(error, {
        tags: { component: "email_send", ip: clientIP },
      });
    }
    clearTimeout(timeout);
    return response(502, {
      ok: false,
      message: GENERIC_ERROR_MESSAGE,
    });
  }

  clearTimeout(timeout);

  if (!resendResponse.ok) {
    let resendBody = "";
    try {
      resendBody = await resendResponse.text();
    } catch {
      resendBody = "";
    }

    console.error("Resend API returned non-OK response", {
      status: resendResponse.status,
      body: resendBody.slice(0, 500),
    });

    logSecurityEvent("RESEND_API_ERROR", {
      ip: clientIP,
      status: resendResponse.status,
    });

    return response(502, {
      ok: false,
      message: GENERIC_ERROR_MESSAGE,
    });
  }

  // Log successful submission
  logSecurityEvent("FORM_SUBMITTED_SUCCESS", {
    ip: clientIP,
    formType,
    recaptchaScore: recaptchaResult.score,
  });

  // Send auto-reply to user
  const autoReplySubject =
    formType === "kuber-workshop"
      ? "Your Kuber Workshop Inquiry Has Been Received"
      : "Thank you for contacting Touch and Move";
  const autoReplyHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.8; color: #111827; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #9E8976 0%, #8B7355 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300;">Touch and Move</h1>
      </div>
      
      <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #9E8976; margin-top: 0; font-size: 24px;">Thank You, ${htmlEscape(name)}!</h2>
        
        <p style="color: #374151; font-size: 16px; margin: 20px 0;">
          We have received your ${
            formType === "intake"
              ? "intake form"
              : formType === "kuber-workshop"
                ? "workshop inquiry"
                : "message"
          } and truly appreciate you reaching out to us.
        </p>
        
        <p style="color: #374151; font-size: 16px; margin: 20px 0;">
          Our team will carefully review your submission and get back to you within 24-48 hours. We're excited to connect with you and support you on your journey.
        </p>
        
        <div style="background: #f9fafb; padding: 20px; border-left: 4px solid #9E8976; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Your Details:</strong></p>
          <p style="margin: 10px 0 0 0; color: #374151; font-size: 14px;">
            <strong>Email:</strong> ${htmlEscape(email || "Not provided")}<br>
            <strong>Phone:</strong> ${htmlEscape(phone)}
          </p>
        </div>
        
        <p style="color: #374151; font-size: 16px; margin: 20px 0;">
          In the meantime, feel free to explore our website or follow us on social media to learn more about our services and approach.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://touchandmove.in" style="display: inline-block; background: #9E8976; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Visit Our Website</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
          With gratitude,<br>
          <strong style="color: #9E8976;">The Touch and Move Team</strong>
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
            Touch and Move | Holistic Wellness & Guidance<br>
            <a href="https://touchandmove.in" style="color: #9E8976; text-decoration: none;">touchandmove.in</a> | 
            <a href="mailto:touchandmove.69@gmail.com" style="color: #9E8976; text-decoration: none;">touchandmove.69@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  `;

  // Send auto-reply email to user
  if (email) {
    try {
    const autoReplyResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: autoReplyFromEmail,
        to: [email],
        subject: autoReplySubject,
        html: autoReplyHtml,
      }),
    });

    if (!autoReplyResponse.ok) {
      console.error("Auto-reply email failed", {
        status: autoReplyResponse.status,
        userEmail: email,
      });
      // Don't fail the main request if auto-reply fails
    }
  } catch (error) {
    console.error("Auto-reply request failed", {
      message: error && error.message ? error.message : "unknown error",
    });
    // Don't fail the main request if auto-reply fails
  }
  }

  return response(200, {
    ok: true,
    message:
      formType === "intake"
        ? "Your intake form has been submitted successfully."
        : formType === "kuber-workshop"
          ? "Your workshop inquiry has been submitted successfully."
          : "Your message has been sent successfully.",
  });
};
