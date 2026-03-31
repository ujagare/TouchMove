<?php
declare(strict_types=1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo 'Method Not Allowed';
    exit;
}

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');

function serverValue(string $key, int $maxLength = 2000): string
{
    $value = isset($_SERVER[$key]) ? trim((string) $_SERVER[$key]) : '';
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value) ?? '';
    $value = preg_replace('/\s+/u', ' ', $value) ?? '';

    return mb_substr($value, 0, $maxLength);
}

function field(string $key, int $maxLength = 2000): string
{
    $value = isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value) ?? '';
    $value = preg_replace('/\s+/u', ' ', $value) ?? '';

    return mb_substr($value, 0, $maxLength);
}

function csvSafe(string $value): string
{
    $trimmed = ltrim($value);
    if ($trimmed !== '' && preg_match('/^[=+\-@]/', $trimmed) === 1) {
        return "'" . $value;
    }

    return $value;
}

function allowedRedirect(string $candidate): string
{
    $allowed = [
        'contact.html?submitted=1',
        'contact.html',
    ];

    return in_array($candidate, $allowed, true) ? $candidate : 'contact.html?submitted=1';
}

function formLabel(string $formType): string
{
    return $formType === 'intake' ? 'Client Intake Form' : 'Contact Form';
}

function defaultFromEmail(): string
{
    $host = serverValue('HTTP_HOST', 255);
    $host = preg_replace('/:\d+$/', '', $host) ?? '';

    if ($host !== '' && strpos($host, '.') !== false) {
        return 'no-reply@' . $host;
    }

    return 'no-reply@touchandmove.local';
}

function mailHeaderValue(string $value, int $maxLength = 255): string
{
    $value = preg_replace('/[\r\n]+/', ' ', $value) ?? '';
    return mb_substr(trim($value), 0, $maxLength);
}

$honeypot = field('website', 200);
if ($honeypot !== '') {
    http_response_code(400);
    echo 'Invalid form data';
    exit;
}

$name = field('name', 120);
$email = field('email', 180);
$phone = field('phone', 40);
$location = field('location', 120);
$service = field('service', 160);
$message = field('message', 5000);
$formType = field('form_type', 40);
$redirectTo = allowedRedirect(field('redirect_to', 255));

if (
    $name === '' ||
    $email === '' ||
    $message === '' ||
    mb_strlen($name) < 2 ||
    mb_strlen($message) < 10 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL)
) {
    http_response_code(400);
    echo 'Invalid form data';
    exit;
}

$storagePath = getenv('CONTACT_STORAGE_PATH') ?: (__DIR__ . '/data/contact-submissions.csv');
$successUrl = $redirectTo;
$storageDir = dirname($storagePath);

if (!is_dir($storageDir)) {
    mkdir($storageDir, 0755, true);
}

$line = [
    date('c'),
    csvSafe($name),
    csvSafe(strtolower($email)),
    csvSafe($phone),
    csvSafe($location),
    csvSafe($service),
    csvSafe($message),
    csvSafe($_SERVER['REMOTE_ADDR'] ?? ''),
    csvSafe($_SERVER['HTTP_USER_AGENT'] ?? ''),
];

$fp = fopen($storagePath, 'ab');
if ($fp === false) {
    http_response_code(500);
    echo 'Unable to process form';
    exit;
}

if (flock($fp, LOCK_EX)) {
    fputcsv($fp, $line);
    fflush($fp);
    flock($fp, LOCK_UN);
}

fclose($fp);

$mailRecipient = getenv('CONTACT_RECIPIENT_EMAIL') ?: 'touchandmove.69@gmail.com';
$mailFrom = getenv('CONTACT_FROM_EMAIL') ?: defaultFromEmail();
$mailSubject = sprintf(
    '[Touch and Move] %s from %s',
    formLabel($formType),
    $name
);

$mailLines = [
    'A new website form submission has been received.',
    '',
    'Form: ' . formLabel($formType),
    'Name: ' . $name,
    'Email: ' . strtolower($email),
    'Phone: ' . ($phone !== '' ? $phone : 'Not provided'),
    'Location: ' . ($location !== '' ? $location : 'Not provided'),
    'Preferred Service: ' . ($service !== '' ? $service : 'Not provided'),
    '',
    'Message:',
    $message,
    '',
    'Submitted At: ' . date('c'),
    'IP Address: ' . serverValue('REMOTE_ADDR', 100),
    'User Agent: ' . serverValue('HTTP_USER_AGENT', 500),
];

$mailHeaders = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Touch and Move Website <' . mailHeaderValue($mailFrom) . '>',
    'Reply-To: ' . mailHeaderValue(strtolower($email)),
];

$mailSent = mail(
    mailHeaderValue($mailRecipient),
    mailHeaderValue($mailSubject),
    implode(PHP_EOL, $mailLines),
    implode(PHP_EOL, $mailHeaders)
);

if (!$mailSent) {
    http_response_code(500);
    echo 'Unable to send email notification';
    exit;
}

header('Location: ' . $successUrl, true, 303);
exit;

