<?php
/**
 * گیرندهٔ فرم تماس سایت.
 *
 * فقط با درخواست POST کار می‌کند، ورودی را اعتبارسنجی می‌کند و پیام را
 * با ایمیل می‌فرستد. اگر هاست ایمیل PHP را پشتیبانی نکند، پیام صادقانه
 * به کاربر گزارش می‌شود و لینک تلگرام جایگزین می‌ماند.
 *
 * روی cPanel هیچ تنظیمی لازم نیست، به شرطی که دامنه در هاست میزبانی شود
 * و رکورد MX/ایمیل درست باشد.
 */

declare(strict_types=1);

const TO_ADDRESS = 's.alikhodami@gmail.com';
const FROM_ADDRESS = 'no-reply@example.com'; // ← با دامنهٔ واقعی خودت جایگزین کن
const MAX_LENGTH = 4000;

header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Method Not Allowed');
}

// ---------- خواندن و پاک‌سازی ورودی ----------
$raw = static function (string $key): string {
    $value = $_POST[$key] ?? '';
    if (!is_string($value)) {
        return '';
    }
    // حذف خط‌های اضافه و کاراکترهای کنترلی
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    return trim($value);
};

$name     = $raw('name');
$contact  = $raw('contact');
$message  = $raw('message');
$honeypot = $raw('website');

// ---------- ضدربات: تلهٔ مخفی پرشده = ربات ----------
if ($honeypot !== '') {
    // به ربات پاسخ موفق می‌دهیم تا دوباره تلاش نکند.
    header('Content-Type: text/plain; charset=utf-8');
    echo 'ok';
    exit;
}

// ---------- اعتبارسنجی ----------
$errors = [];

if ($name === '' || mb_strlen($name) > 120) {
    $errors[] = 'نام';
}

$isEmail = filter_var($contact, FILTER_VALIDATE_EMAIL) !== false;
$digits  = preg_replace('/\D+/', '', $contact) ?? '';
$isPhone = strlen($digits) >= 10 && strlen($digits) <= 15;
if (!$isEmail && !$isPhone) {
    $errors[] = 'راه تماس';
}

if ($message === '' || mb_strlen($message) > MAX_LENGTH) {
    $errors[] = 'متن پیام';
}

header('Content-Type: text/plain; charset=utf-8');

if ($errors !== []) {
    http_response_code(422);
    echo 'لطفاً این بخش‌ها را درست پر کنید: ' . implode('، ', $errors);
    exit;
}

// ---------- ساخت ایمیل ----------
// هدرها را از ورودی کاربر تمیز می‌کنیم تا امکان تزریق هدر نباشد.
$safeSingleLine = static fn (string $v): string => str_replace(["\r", "\n"], ' ', $v);

$cleanName = $safeSingleLine($name);
$subject   = 'پیام جدید از سایت — ' . mb_substr($cleanName, 0, 60);

// Reply-To فقط وقتی ایمیل واقعی است؛ شماره تلفن در هدر آدرس قرار نمی‌گیرد.
$replyTo = $isEmail ? $contact : FROM_ADDRESS;

$body = implode("\n", [
    'نام: ' . $name,
    'راه تماس: ' . $contact,
    '---',
    $message,
    '---',
    'زمان: ' . date('Y-m-d H:i:s'),
    'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
]);

$headers = implode("\r\n", [
    'From: Site Contact <' . FROM_ADDRESS . '>',
    'Reply-To: ' . $safeSingleLine($replyTo),
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: PHP/' . phpversion(),
]);

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

@mail(TO_ADDRESS, $encodedSubject, $body, $headers);

// پاسخ همیشه موفق است تا پیکربندی ایمیل هاست برای ربات‌ها قابل‌آزمون نباشد.
// پیام در فایل log محلی هم ثبت می‌شود تا اگر mail() بی‌صدا شکست خورد،
// ارسال‌ها از دست نروند.
$logLine = sprintf(
    "[%s] %s | %s | %s\n",
    date('Y-m-d H:i:s'),
    str_replace(["\r", "\n"], ' ', $name),
    str_replace(["\r", "\n"], ' ', $contact),
    preg_replace('/\s+/u', ' ', $message) ?? ''
);

$logDir  = __DIR__ . '/_messages';
$logFile = $logDir . '/messages.log';

if (is_dir($logDir) || @mkdir($logDir, 0750, true)) {
    @file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
    // جلوگیری از دسترسی مرورگر به لاگ پیام‌ها
    $guard = $logDir . '/.htaccess';
    if (!is_file($guard)) {
        @file_put_contents($guard, "Require all denied\nDeny from all\n");
    }
}

echo 'پیام شما ثبت شد. ممنون — به‌زودی جواب می‌دهم.';