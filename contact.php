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
$successUrl = getenv('CONTACT_SUCCESS_URL') ?: 'contact.html?submitted=1';
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

header('Location: ' . $successUrl, true, 303);
exit;
