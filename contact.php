<?php
// Basic contact form handler (keeps UI unchanged)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Method Not Allowed';
    exit;
}

function field($key) {
    return isset($_POST[$key]) ? trim((string)$_POST[$key]) : '';
}

$name = field('name');
$email = field('email');
$message = field('message');

if ($name === '' || $email === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo 'Invalid form data';
    exit;
}

$line = [
    date('c'),
    $name,
    $email,
    str_replace(["\r", "\n"], [' ', ' '], $message)
];

$csvPath = __DIR__ . '/data/contact-submissions.csv';
$fp = fopen($csvPath, 'a');
if ($fp) {
    if (flock($fp, LOCK_EX)) {
        fputcsv($fp, $line);
        fflush($fp);
        flock($fp, LOCK_UN);
    }
    fclose($fp);
}

// Redirect back to contact page without changing UI
header('Location: contact.html');
exit;
?>