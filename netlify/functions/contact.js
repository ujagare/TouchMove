const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const MAX_BODY_BYTES = 25_000;
const MIN_FORM_FILL_MS = 2_500;
const MAX_FORM_AGE_MS = 1000 * 60 * 60 * 2;
const GENERIC_ERROR_MESSAGE =
  "We could not process your request right now. Please try again.";

function firstEnv() {
  for (const key of arguments) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
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

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  };
}

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "").toLowerCase();
}

function getAllowedOrigins(event) {
  const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  const host = sanitize(event.headers?.host, 255);
  const derivedOrigins = host
    ? [`https://${host}`, `http://${host}`].map((origin) => normalizeOrigin(origin))
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

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return response(405, { ok: false, message: "Method Not Allowed" });
  }

  const contentType = sanitize(event.headers?.["content-type"] || event.headers?.["Content-Type"], 200);
  if (!contentType.toLowerCase().includes("application/json")) {
    return response(415, { ok: false, message: GENERIC_ERROR_MESSAGE });
  }

  if ((event.body || "").length > MAX_BODY_BYTES) {
    return response(413, { ok: false, message: GENERIC_ERROR_MESSAGE });
  }

  if (!requestOriginAllowed(event)) {
    return response(403, { ok: false, message: GENERIC_ERROR_MESSAGE });
  }

  const resendApiKey = firstEnv("RESEND_API_KEY", "API_KEY", "RESEND_KEY");
  const toEmail =
    firstEnv("CONTACT_TO_EMAIL", "TO_EMAIL", "RESEND_TO_EMAIL") ||
    "touchandmove.69@gmail.com";
  const fromEmail = firstEnv(
    "CONTACT_FROM_EMAIL",
    "FROM_EMAIL",
    "RESEND_FROM_EMAIL",
  );

  if (!resendApiKey || !fromEmail) {
    console.error("Missing email configuration", {
      hasResendApiKey: Boolean(resendApiKey),
      hasFromEmail: Boolean(fromEmail),
      envKeys: Object.keys(process.env).filter(function (key) {
        return /EMAIL|RESEND|API_KEY/i.test(key);
      }),
    });
    return response(500, {
      ok: false,
      message: "Email service is not configured correctly on the server.",
    });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { ok: false, message: GENERIC_ERROR_MESSAGE });
  }

  const formType = sanitize(payload.formType, 40) || "contact";
  const name = sanitize(payload.name, 120);
  const email = sanitize(payload.email, 180).toLowerCase();
  const phone = sanitize(payload.phone, 40);
  const location = sanitize(payload.location, 120);
  const service = sanitize(payload.service, 160);
  const message = sanitize(payload.message, 5000);
  const honeypot = sanitize(payload.website || payload.botField, 200);
  const startedAt = sanitize(payload.formStartedAt, 40);

  if (honeypot) {
    return response(400, { ok: false, message: GENERIC_ERROR_MESSAGE });
  }

  if (!validStartedAt(startedAt)) {
    return response(400, { ok: false, message: GENERIC_ERROR_MESSAGE });
  }

  if (!validName(name)) {
    return response(400, { ok: false, message: "Please enter a valid name." });
  }

  if (!validEmail(email)) {
    return response(400, { ok: false, message: "Please enter a valid email." });
  }

  if (!phone || !validPhone(phone)) {
    return response(400, { ok: false, message: "Please enter a valid phone number." });
  }

  if (!validMessage(message)) {
    return response(400, {
      ok: false,
      message: "Please enter at least 10 characters in the message.",
    });
  }

  const subjectPrefix = formType === "intake" ? "Client Intake Form" : "Contact Form";
  const subject = `[Touch and Move] ${subjectPrefix} from ${name}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 16px;">New ${htmlEscape(subjectPrefix)} Submission</h2>
      <p><strong>Name:</strong> ${htmlEscape(name)}</p>
      <p><strong>Email:</strong> ${htmlEscape(email)}</p>
      <p><strong>Phone:</strong> ${htmlEscape(phone)}</p>
      <p><strong>Location:</strong> ${htmlEscape(location || "Not provided")}</p>
      <p><strong>Preferred Service:</strong> ${htmlEscape(service || "Not provided")}</p>
      <p><strong>Form Type:</strong> ${htmlEscape(formType)}</p>
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
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject,
        html,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    console.error("Resend request failed", {
      message: error && error.message ? error.message : "unknown fetch error",
    });
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

    return response(502, {
      ok: false,
      message: GENERIC_ERROR_MESSAGE,
    });
  }

  return response(200, {
    ok: true,
    message:
      formType === "intake"
        ? "Your intake form has been submitted successfully."
        : "Your message has been sent successfully.",
  });
};
