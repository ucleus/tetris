# GameBoy-Style Tetris — HTML5/CSS3/Three.js + PHP/MySQL (Hostinger-ready)

Retro, mobile-first Tetris that looks like a Gen‑1 Game Boy (duo‑tone) with auth, profiles, awards, persistent save/resume, and a 5‑minute guest gate.

---

## 0) File Tree

```
public_html/
├── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── game.js
│   │   └── gb_shader.js
│   └── images/
│       └── default_avatar.png
├── api/
│   ├── db.php
│   ├── me.php
│   ├── register.php
│   ├── send_login_code.php
│   ├── verify_login_code.php
│   ├── logout.php
│   ├── save_state.php
│   ├── load_state.php
│   ├── update_profile.php
│   ├── awards.php
│   ├── admin_users.php
│   └── .htaccess
├── admin/
│   └── index.php
└── schema.sql
```

> **Notes**
>
> * Three.js is used for a subtle CRT/scanline effect layer over the canvas (purely optional eye‑candy). Game rendering is HTML5 Canvas 2D for performance.
> * Passwordless sign‑in (email + one‑time code). No passwords collected; matches “email, username, real name, image.”
> * Guest play is limited to **5 minutes**. After that, a login/register modal blocks input.
> * Persistent resume: the server saves compressed game state JSON; user resumes from last position after sign‑in.
> * Duo‑tone themes: **Original (DMG green)** plus **Red, Pink, Purple, Baby Powder Blue**.

---

## 1) Database Schema (MySQL)

Create a database on Hostinger, then run this SQL.

```sql
-- schema.sql
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  username VARCHAR(32) NOT NULL UNIQUE,
  real_name VARCHAR(128) NOT NULL,
  avatar_path VARCHAR(255) DEFAULT NULL,
  theme ENUM('original','red','pink','purple','babyblue') DEFAULT 'original',
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_codes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (email),
  INDEX (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_state (
  user_id INT UNSIGNED NOT NULL,
  state_json JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_gs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS awards (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  description VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_awards (
  user_id INT UNSIGNED NOT NULL,
  award_id INT UNSIGNED NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, award_id),
  CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ua_award FOREIGN KEY (award_id) REFERENCES awards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- seed some awards
INSERT IGNORE INTO awards(code, name, description) VALUES
 ('FIRST_LINE','First Line','Clear your first line'),
 ('TETRIS','Tetris!','Clear 4 lines at once'),
 ('LVL5','Level 5','Reach level 5'),
 ('LVL10','Level 10','Reach level 10'),
 ('SPEED_DEEMON','Speed Demon','Perform 10 hard drops in one game');

-- (Optional) seed one admin user placeholder to convert post‑registration
-- UPDATE users SET is_admin=1 WHERE email='your-admin-email@domain.com';
```

---

## 2) API (PHP)

**Security**: Uses PDO prepared statements, rotates OTPs, sets `HttpOnly` session cookies, and checks MIME for avatar uploads. Configure DB credentials in `api/db.php`.

```php
<?php // api/db.php
// Set your Hostinger DB credentials
const DB_HOST = 'localhost';
const DB_NAME = 'your_db_name';
const DB_USER = 'your_db_user';
const DB_PASS = 'your_db_password';

function pdo() : PDO {
  static $pdo; if ($pdo) return $pdo;
  $dsn = 'mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4';
  $pdo = new PDO($dsn, DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

function start_session() {
  if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
      'lifetime' => 0,
      'path' => '/',
      'httponly' => true,
      'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
      'samesite' => 'Lax',
    ]);
    session_start();
  }
}

function json_out($data, $code=200){
  http_response_code($code);
  header('Content-Type: application/json');
  echo json_encode($data);
  exit;
}

function require_post(){ if($_SERVER['REQUEST_METHOD']!=='POST') json_out(['error'=>'POST only'],405); }
function require_get(){ if($_SERVER['REQUEST_METHOD']!=='GET') json_out(['error'=>'GET only'],405); }
```

```
# api/.htaccess
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Headers "Content-Type"
  Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
</IfModule>
<IfModule mod_php.c>
  php_flag display_errors Off
  php_value upload_max_filesize 5M
  php_value post_max_size 6M
</IfModule>
# block direct listing
Options -Indexes
```

### 2.1 `me.php` (session peek)

```php
<?php // api/me.php
require __DIR__.'/db.php';
start_session();
if (!empty($_SESSION['user_id'])) {
  $stmt = pdo()->prepare('SELECT id,email,username,real_name,avatar_path,theme,is_admin FROM users WHERE id=?');
  $stmt->execute([$_SESSION['user_id']]);
  $user = $stmt->fetch();
  json_out(['user'=>$user]);
}
json_out(['user'=>null]);
```

### 2.2 `register.php`

```php
<?php // api/register.php
require __DIR__.'/db.php';
start_session();
require_post();

$email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
$username = preg_replace('/[^a-zA-Z0-9_]/','', $_POST['username'] ?? '');
$real = trim($_POST['real_name'] ?? '');
$theme = in_array($_POST['theme'] ?? 'original', ['original','red','pink','purple','babyblue']) ? $_POST['theme'] : 'original';

if(!$email || !$username || !$real){ json_out(['error'=>'Missing required fields'],422); }

// avatar upload (optional)
$avatar_path = null;
if (isset($_FILES['avatar']) && $_FILES['avatar']['error']===UPLOAD_ERR_OK){
  $finfo = finfo_open(FILEINFO_MIME_TYPE);
  $mime = finfo_file($finfo, $_FILES['avatar']['tmp_name']);
  if(!in_array($mime,['image/png','image/jpeg'])) json_out(['error'=>'PNG or JPG only'],415);
  $ext = $mime==='image/png' ? '.png' : '.jpg';
  $safe = bin2hex(random_bytes(8)).$ext;
  $dest = __DIR__.'/../assets/images/'.$safe;
  if(!move_uploaded_file($_FILES['avatar']['tmp_name'],$dest)) json_out(['error'=>'Upload failed'],500);
  $avatar_path = 'assets/images/'.$safe;
}

// insert
try {
  $stmt = pdo()->prepare('INSERT INTO users(email,username,real_name,avatar_path,theme) VALUES(?,?,?,?,?)');
  $stmt->execute([$email,$username,$real,$avatar_path,$theme]);
  $_SESSION['user_id'] = (int)pdo()->lastInsertId();
  json_out(['ok'=>true]);
} catch(PDOException $e){
  if(str_contains($e->getMessage(),'Duplicate')) json_out(['error'=>'Email or username already exists'],409);
  json_out(['error'=>'DB error'],500);
}
```

### 2.3 OTP (passwordless) — `send_login_code.php` and `verify_login_code.php`

```php
<?php // api/send_login_code.php
require __DIR__.'/db.php';
require_post();
$email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
if(!$email) json_out(['error'=>'Invalid email'],422);

$code = random_int(100000,999999);
$hash = hash('sha256', (string)$code);
$exp = (new DateTime('+10 minutes'))->format('Y-m-d H:i:s');

$stmt = pdo()->prepare('INSERT INTO login_codes(email,code_hash,expires_at) VALUES(?,?,?)');
$stmt->execute([$email,$hash,$exp]);

// naive email via PHP mail(); on Hostinger this usually works.
$subject = 'Your Tetris sign-in code';
$body = "Your one-time code is: $code (valid for 10 minutes).";
$headers = 'From: no-reply@'.($_SERVER['HTTP_HOST'] ?? 'localhost');
@mail($email, $subject, $body, $headers);

json_out(['ok'=>true]);
```

```php
<?php // api/verify_login_code.php
require __DIR__.'/db.php';
start_session();
require_post();
$email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
$code  = trim($_POST['code'] ?? '');
if(!$email || !preg_match('/^\d{6}$/',$code)) json_out(['error'=>'Bad input'],422);

$hash = hash('sha256', $code);
$now = (new DateTime())->format('Y-m-d H:i:s');

$pdo = pdo();
$pdo->beginTransaction();
$stmt = $pdo->prepare('SELECT id,expires_at,used FROM login_codes WHERE email=? AND code_hash=? ORDER BY id DESC LIMIT 1');
$stmt->execute([$email,$hash]);
$row = $stmt->fetch();
if(!$row || $row['used'] || $row['expires_at'] < $now){ $pdo->rollBack(); json_out(['error'=>'Invalid/expired code'],401); }
$pdo->prepare('UPDATE login_codes SET used=1 WHERE id=?')->execute([$row['id']]);

// Upsert user shell if not found (allows email-only quick login)
$stmt = $pdo->prepare('SELECT id FROM users WHERE email=?');
$stmt->execute([$email]);
$u = $stmt->fetch();
if(!$u){
  $pdo->prepare('INSERT INTO users(email,username,real_name) VALUES(?,?,?)')->execute([$email, 'user'.random_int(1000,9999), '']);
  $uid = (int)$pdo->lastInsertId();
} else { $uid = (int)$u['id']; }
$pdo->commit();

$_SESSION['user_id'] = $uid;
json_out(['ok'=>true]);
```

### 2.4 Logout

```php
<?php // api/logout.php
require __DIR__.'/db.php';
start_session();
session_destroy();
json_out(['ok'=>true]);
```

### 2.5 Save/Load state

```php
<?php // api/save_state.php
require __DIR__.'/db.php';
start_session();
require_post();
if (empty($_SESSION['user_id'])) json_out(['error'=>'Auth required'],401);

$state = $_POST['state_json'] ?? '';
$json = json_decode($state,true);
if(!$json) json_out(['error'=>'Invalid JSON'],422);

$stmt = pdo()->prepare('INSERT INTO game_state(user_id,state_json) VALUES(?,JSON_OBJECT()) ON DUPLICATE KEY UPDATE state_json=VALUES(state_json)');
$stmt->execute([$_SESSION['user_id']]);

// safer: update with bound param
$stmt = pdo()->prepare('UPDATE game_state SET state_json=? WHERE user_id=?');
$stmt->execute([$state, $_SESSION['user_id']]);

json_out(['ok'=>true]);
```

```php
<?php // api/load_state.php
require __DIR__.'/db.php';
start_session();
require_get();
if (empty($_SESSION['user_id'])) json_out(['state'=>null]);
$stmt = pdo()->prepare('SELECT state_json FROM game_state WHERE user_id=?');
$stmt->execute([$_SESSION['user_id']]);
$row = $stmt->fetch();
json_out(['state'=>$row ? json_decode($row['state_json'],true) : null]);
```

### 2.6 Profile update (username uniqueness + avatar)

```php
<?php // api/update_profile.php
require __DIR__.'/db.php';
start_session();
require_post();
if (empty($_SESSION['user_id'])) json_out(['error'=>'Auth required'],401);

$username = isset($_POST['username']) ? preg_replace('/[^a-zA-Z0-9_]/','', $_POST['username']) : null;
$theme = in_array($_POST['theme'] ?? '', ['original','red','pink','purple','babyblue']) ? $_POST['theme'] : null;
$avatar_path = null;

if (isset($_FILES['avatar']) && $_FILES['avatar']['error']===UPLOAD_ERR_OK){
  $finfo = finfo_open(FILEINFO_MIME_TYPE);
  $mime = finfo_file($finfo, $_FILES['avatar']['tmp_name']);
  if(!in_array($mime,['image/png','image/jpeg'])) json_out(['error'=>'PNG or JPG only'],415);
  $ext = $mime==='image/png' ? '.png' : '.jpg';
  $safe = bin2hex(random_bytes(8)).$ext;
  $dest = __DIR__.'/../assets/images/'.$safe;
  if(!move_uploaded_file($_FILES['avatar']['tmp_name'],$dest)) json_out(['error'=>'Upload failed'],500);
  $avatar_path = 'assets/images/'.$safe;
}

$pdo = pdo();
$uid = $_SESSION['user_id'];
if ($username){
  $stmt = $pdo->prepare('SELECT id FROM users WHERE username=? AND id<>?');
  $stmt->execute([$username,$uid]);
  if ($stmt->fetch()) json_out(['error'=>'Username taken'],409);
}

$sets = [];$vals=[];
if($username){ $sets[]='username=?'; $vals[]=$username; }
if($theme){ $sets[]='theme=?'; $vals[]=$theme; }
if($avatar_path){ $sets[]='avatar_path=?'; $vals[]=$avatar_path; }
if(!$sets) json_out(['ok'=>true]);
$vals[]=$uid;
$pdo->prepare('UPDATE users SET '.implode(',',$sets).' WHERE id=?')->execute($vals);
json_out(['ok'=>true,'avatar_path'=>$avatar_path]);
```

### 2.7 Awards (record unlocks)

```php
<?php // api/awards.php
require __DIR__.'/db.php';
start_session();
$pdo = pdo();
if($_SERVER['REQUEST_METHOD']==='GET'){
  if (empty($_SESSION['user_id'])) json_out(['awards'=>[]]);
  $stmt = $pdo->prepare('SELECT a.code,a.name,a.description,ua.unlocked_at FROM user_awards ua JOIN awards a ON a.id=ua.award_id WHERE ua.user_id=? ORDER BY ua.unlocked_at DESC');
  $stmt->execute([$_SESSION['user_id']]);
  json_out(['awards'=>$stmt->fetchAll()]);
}
if($_SERVER['REQUEST_METHOD']==='POST'){
  if (empty($_SESSION['user_id'])) json_out(['error'=>'Auth required'],401);
  $code = preg_replace('/[^A-Z0-9_]/','', $_POST['code'] ?? '');
  if(!$code) json_out(['error'=>'Bad code'],422);
  $stmt=$pdo->prepare('SELECT id FROM awards WHERE code=?');
  $stmt->execute([$code]);
  $a=$stmt->fetch(); if(!$a) json_out(['error'=>'Unknown award'],404);
  $stmt=$pdo->prepare('INSERT IGNORE INTO user_awards(user_id,award_id) VALUES(?,?)');
  $stmt->execute([$_SESSION['user_id'],$a['id']]);
  json_out(['ok'=>true]);
}
json_out(['error'=>'Method not allowed'],405);
```

### 2.8 Simple Admin (list users + awards)

```php
<?php // api/admin_users.php
require __DIR__.'/db.php';
start_session();
if (empty($_SESSION['user_id'])) json_out(['error'=>'Auth required'],401);
$pdo = pdo();
$me = $pdo->prepare('SELECT is_admin FROM users WHERE id=?');
$me->execute([$_SESSION['user_id']]);
$me = $me->fetch();
if (!$me || !$me['is_admin']) json_out(['error'=>'Forbidden'],403);

$rows = $pdo->query('SELECT id,email,username,real_name,theme,created_at FROM users ORDER BY created_at DESC LIMIT 200')->fetchAll();
json_out(['users'=>$rows]);
```

```php
<?php // admin/index.php
require __DIR__.'/../api/db.php';
start_session();
if (empty($_SESSION['user_id'])) die('Login required');
$pdo = pdo();
$me = $pdo->prepare('SELECT is_admin FROM users WHERE id=?');
$me->execute([$_SESSION['user_id']]);
$me=$me->fetch();
if(!$me || !$me['is_admin']) die('Forbidden');
$users = $pdo->query('SELECT id,email,username,real_name,theme,created_at FROM users ORDER BY created_at DESC')->fetchAll();
?>
<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin — Users</title>
<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px}th{background:#f7f7f7;text-align:left}</style>
</head><body>
<h1>Users</h1>
<table>
<tr><th>ID</th><th>Email</th><th>Username</th><th>Name</th><th>Theme</th><th>Created</th></tr>
<?php foreach($users as $u): ?>
<tr>
<td><?=htmlspecialchars($u['id'])?></td>
<td><?=htmlspecialchars($u['email'])?></td>
<td><?=htmlspecialchars($u['username'])?></td>
<td><?=htmlspecialchars($u['real_name'])?></td>
<td><?=htmlspecialchars($u['theme'])?></td>
<td><?=htmlspecialchars($u['created_at'])?></td>
</tr>
<?php endforeach; ?>
</table>
</body></html>
```

---

## 3) Frontend

### 3.1 `index.html`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Game Boy Tetris</title>
  <link rel="stylesheet" href="assets/css/style.css">
  <script defer src="https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.min.js"></script>
  <script defer src="assets/js/gb_shader.js"></script>
  <script defer src="assets/js/game.js"></script>
</head>
<body class="theme-original">
  <div id="app">
    <div class="gb-shell">
      <div class="gb-top">
        <div class="gb-speaker"></div>
      </div>
      <div class="gb-screen-wrap">
        <canvas id="tetris" width="160" height="144"></canvas>
        <!-- Three.js screen effect overlay -->
        <div id="crt-overlay"></div>
        <div class="hud">
          <div class="hud-col">
            <div class="hud-box"><label>Score</label><span id="score">0</span></div>
            <div class="hud-box"><label>Level</label><span id="level">1</span></div>
            <div class="hud-box"><label>Lines</label><span id="lines">0</span></div>
          </div>
          <div class="hud-col">
            <div class="hud-box"><label>Next</label><canvas id="next" width="48" height="48"></canvas></div>
            <div class="hud-box"><label>Hold</label><canvas id="hold" width="48" height="48"></canvas></div>
          </div>
        </div>
      </div>

      <!-- Controls: D-Pad + A/B + Start/Select (touch-friendly) -->
      <div class="gb-controls">
        <div class="dpad">
          <button class="pad up" data-action="up"></button>
          <button class="pad left" data-action="left"></button>
          <button class="pad right" data-action="right"></button>
          <button class="pad down" data-action="down"></button>
        </div>
        <div class="ab">
          <button class="btn-a" data-action="rotate">A</button>
          <button class="btn-b" data-action="hard">B</button>
        </div>
        <div class="start-select">
          <button class="btn-select" data-action="hold">Select</button>
          <button class="btn-start" data-action="pause">Start</button>
        </div>
      </div>
    </div>

    <!-- Top bar: auth, theme -->
    <div class="topbar">
      <div class="auth">
        <span id="user-info"></span>
        <button id="btn-login">Login</button>
        <button id="btn-register">Register</button>
        <button id="btn-logout" class="hide">Logout</button>
      </div>
      <div class="theme-picker">
        <label>Theme:</label>
        <select id="theme">
          <option value="original">Original</option>
          <option value="red">Red</option>
          <option value="pink">Pink</option>
          <option value="purple">Purple</option>
          <option value="babyblue">Baby Powder Blue</option>
        </select>
      </div>
    </div>

    <!-- Gate modal (5-min free play) -->
    <div id="gate" class="modal hide">
      <div class="modal-card">
        <h2>Time’s up!</h2>
        <p>Enjoyed the demo? Sign in to keep playing and save your progress.</p>
        <button id="gate-login">Sign In</button>
        <button id="gate-register">Create Account</button>
      </div>
    </div>

    <!-- Register modal -->
    <div id="register" class="modal hide">
      <form class="modal-card" id="registerForm" enctype="multipart/form-data">
        <h2>Create Account</h2>
        <label>Email<input type="email" name="email" required></label>
        <label>Username<input name="username" required maxlength="32" pattern="[A-Za-z0-9_]+"></label>
        <label>Real Name<input name="real_name" required></label>
        <label>Avatar (PNG/JPG, optional)<input type="file" name="avatar" accept="image/png,image/jpeg"></label>
        <label>Theme
          <select name="theme">
            <option value="original">Original</option>
            <option value="red">Red</option>
            <option value="pink">Pink</option>
            <option value="purple">Purple</option>
            <option value="babyblue">Baby Powder Blue</option>
          </select>
        </label>
        <div class="row">
          <button type="submit">Create</button>
          <button type="button" data-close>Cancel</button>
        </div>
        <p class="small">Already have an account? <a href="#" id="swapToLogin">Sign in</a></p>
      </form>
    </div>

    <!-- Login modal (OTP) -->
    <div id="login" class="modal hide">
      <form class="modal-card" id="loginFormStep1">
        <h2>Sign In</h2>
        <label>Email<input type="email" name="email" required></label>
        <div class="row"><button type="submit">Send Code</button><button type="button" data-close>Cancel</button></div>
      </form>
      <form class="modal-card hide" id="loginFormStep2">
        <h2>Enter Code</h2>
        <input type="hidden" name="email">
        <label>6‑digit code<input name="code" required pattern="\d{6}" maxlength="6"></label>
        <div class="row"><button type="submit">Verify</button><button type="button" data-close>Cancel</button></div>
      </form>
    </div>

    <!-- Profile modal -->
    <div id="profile" class="modal hide">
      <form class="modal-card" id="profileForm" enctype="multipart/form-data">
        <h2>Profile</h2>
        <label>Username<input name="username" maxlength="32" pattern="[A-Za-z0-9_]+"></label>
        <label>Avatar (PNG/JPG)<input type="file" name="avatar" accept="image/png,image/jpeg"></label>
        <label>Theme
          <select name="theme">
            <option value="original">Original</option>
            <option value="red">Red</option>
            <option value="pink">Pink</option>
            <option value="purple">Purple</option>
            <option value="babyblue">Baby Powder Blue</option>
          </select>
        </label>
        <div class="row"><button type="submit">Save</button><button type="button" data-close>Close</button></div>
      </form>
    </div>
  </div>
</body>
</html>
```

### 3.2 `assets/css/style.css`

```css
/* CSS variables per duo-tone theme */
:root {
  --bg:#E0E4C0;       /* shell */
  --accent:#8A8D75;   /* shell details */
  --lcd-dark:#0a3a03; /* screen pixels */
  --lcd-light:#90A76B;/* screen bg */
  --ink:#222;         /* text */
}
body.theme-original { --lcd-dark:#0a3a03; --lcd-light:#90A76B; }
body.theme-red      { --lcd-dark:#5a0000; --lcd-light:#ffb3b3; }
body.theme-pink     { --lcd-dark:#5a003a; --lcd-light:#ffb3de; }
body.theme-purple   { --lcd-dark:#2f0a5a; --lcd-light:#d2b3ff; }
body.theme-babyblue { --lcd-dark:#0a2a5a; --lcd-light:#b3ddff; }

*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:#111;color:var(--ink);font-family:system-ui,Segoe UI,Arial,sans-serif;display:flex;flex-direction:column;align-items:center;gap:12px}

#app{width:100%;max-width:420px;padding:12px}
.topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.topbar .auth button{margin-right:6px}
.hide{display:none!important}

/* Game Boy shell */
.gb-shell{background:var(--bg);padding:16px;border-radius:18px;box-shadow:0 12px 30px rgba(0,0,0,.5);position:relative}
.gb-top{height:18px;display:flex;justify-content:flex-end}
.gb-speaker{width:70px;height:18px;background:repeating-linear-gradient(90deg,var(--accent) 0 6px,transparent 6px 10px);border-radius:8px}

.gb-screen-wrap{position:relative;background:var(--lcd-light);border:6px solid #3b4730;border-radius:8px;aspect-ratio:160/144;}
.gb-screen-wrap canvas#tetris{width:100%;height:100%;image-rendering:pixelated;display:block}
#crt-overlay{position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply}

.hud{position:absolute;top:8px;left:8px;right:8px;display:flex;justify-content:space-between;gap:8px}
.hud .hud-box{background:rgba(0,0,0,.08);border:1px solid rgba(0,0,0,.2);padding:4px 6px;border-radius:6px;backdrop-filter:blur(1px)}
.hud label{font-size:10px;opacity:.7;display:block}
.hud span{font-weight:700}
.hud canvas{image-rendering:pixelated;background:rgba(255,255,255,.15);border-radius:4px}

/* Controls */
.gb-controls{display:flex;justify-content:space-between;align-items:center;margin-top:12px}
.dpad{position:relative;width:120px;height:120px}
.pad{position:absolute;width:40px;height:40px;background:#444;border:none;border-radius:8px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.5);}
.pad:active{transform:translateY(1px)}
.pad.up{left:40px;top:0}
.pad.left{left:0;top:40px}
.pad.right{right:0;top:40px}
.pad.down{left:40px;bottom:0}

.ab{display:flex;gap:12px}
.ab .btn-a,.ab .btn-b{width:56px;height:56px;border-radius:50%;border:none;background:#6d2f6f;color:#fff;font-weight:700;box-shadow:inset 0 -4px 0 rgba(0,0,0,.4)}

.start-select{display:flex;gap:8px}
.btn-start,.btn-select{border:none;border-radius:999px;padding:8px 14px;background:#333;color:#fff}

/* Modals */
.modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);z-index:50}
.modal-card{background:#fff;color:#111;padding:16px 18px;border-radius:12px;width:min(92vw,380px)}
.modal .row{display:flex;gap:8px;margin-top:12px}
.modal input, .modal select {width:100%;padding:8px;border:1px solid #ddd;border-radius:8px}
.modal h2{margin-top:0}
.small{font-size:12px;opacity:.75}

/* Responsive: fit iPhone 14 Pro (393x852 CSS px) beautifully */
@media (max-width:420px){
  #app{padding:8px}
  .dpad{width:100px;height:100px}
  .pad{width:34px;height:34px}
  .ab .btn-a,.ab .btn-b{width:48px;height:48px}
}
```

### 3.3 `assets/js/gb_shader.js` (Three.js scanline/CRT overlay)

```js
// Minimal Three.js CRT overlay. Progressive enhancement — if WebGL is missing, we ignore.
(function(){
  function initGBScreenEffect(){
    const host = document.getElementById('crt-overlay');
    if (!host || !window.THREE) return;
    const w = host.clientWidth, h = host.clientHeight;
    const renderer = new THREE.WebGLRenderer({alpha:true, antialias:false});
    renderer.setSize(w,h,false);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);

    const uniforms = {
      u_time:{value:0}, u_res:{value:new THREE.Vector2(w,h)},
      u_dark: {value: new THREE.Color(getComputedStyle(document.body).getPropertyValue('--lcd-dark'))},
      u_light:{value: new THREE.Color(getComputedStyle(document.body).getPropertyValue('--lcd-light'))}
    };
    const material = new THREE.ShaderMaterial({
      transparent:true,
      uniforms,
      vertexShader:`
        void main(){ gl_Position = vec4(position,1.0); }
      `,
      fragmentShader:`
        precision mediump float;
        uniform vec2 u_res; uniform float u_time;
        // simple moving scanlines and vignette
        void main(){
          vec2 uv = gl_FragCoord.xy / u_res;
          float scan = 0.06 * sin((uv.y + u_time*0.7)*400.0);
          float vign = smoothstep(0.0,0.7,length(uv-0.5));
          float alpha = clamp(0.15 + scan + vign*0.25, 0.0, 0.5);
          gl_FragColor = vec4(0.0,0.0,0.0, alpha);
        }
      `
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2,2), material);
    scene.add(quad);

    function onResize(){
      const w2 = host.clientWidth, h2 = host.clientHeight;
      renderer.setSize(w2,h2,false);
      uniforms.u_res.value.set(w2,h2);
    }
    window.addEventListener('resize', onResize);

    function tick(t){
      material.uniforms.u_time.value = t*0.001;
      renderer.render(scene,camera);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  window.initGBScreenEffect = initGBScreenEffect;
})();
```

### 3.4 `assets/js/game.js` (Core Tetris + UI + Auth + Persistence)

```js
/*
  Lightweight Tetris engine with 7-bag RNG, SRS-ish kicks, scoring, levels, hold/next, hard drop.
  Guest: 5 min gate. If logged in, autosave every 15s and on pause/blur.
*/

const W = 10, H = 20; // field size
const TICK_BASE = 900; // ms, level 1
const TICK_FALL = 50;  // reduce per level (clamped)
const TICK_MIN = 90;   // fastest

const COLORS = {
  fg: getComputedStyle(document.body).getPropertyValue('--lcd-dark').trim(),
  bg: getComputedStyle(document.body).getPropertyValue('--lcd-light').trim(),
};

const PIECES = {
  I:[[1,1,1,1]],
  O:[[1,1],[1,1]],
  T:[[0,1,0],[1,1,1]],
  S:[[0,1,1],[1,1,0]],
  Z:[[1,1,0],[0,1,1]],
  J:[[1,0,0],[1,1,1]],
  L:[[0,0,1],[1,1,1]],
};
const ORDER = ['I','O','T','S','Z','J','L'];

let state = {
  grid: Array.from({length:H},()=>Array(W).fill(0)),
  bag:[],
  cur:null, // {kind, x,y,rot,shape}
  hold:null, canHold:true,
  next:[],
  score:0, lines:0, level:1,
  over:false, paused:false,
  freeDeadline: Date.now()+5*60*1000,
};

const cvs = document.getElementById('tetris');
const ctx = cvs.getContext('2d');
const nextC = document.getElementById('next').getContext('2d');
const holdC = document.getElementById('hold').getContext('2d');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');

let lastTick = 0; let dropInterval = TICK_BASE;
let loggedIn = false; let saving = false;

function seedBag(){
  let b = ORDER.slice();
  for(let i=b.length-1;i>0;i--){ const j=(Math.random()* (i+1))|0; [b[i],b[j]]=[b[j],b[i]]; }
  state.bag.push(...b);
}
function pieceShape(kind){ return PIECES[kind].map(r=>r.slice()); }
function spawn(){
  if(state.bag.length<7) seedBag();
  const kind = state.bag.shift();
  const shape = pieceShape(kind);
  const w = shape[0].length;
  state.cur = {kind,shape,x:((W-w)/2)|0,y:0,rot:0};
  if(collides(state.cur, state.grid)) { state.over=true; }
  drawAll();
}
function rotateCW(p){
  const n = p.shape.length, m = p.shape[0].length;
  const out = Array.from({length:m}, (_,i)=>Array(n).fill(0));
  for(let y=0;y<n;y++) for(let x=0;x<m;x++) out[x][n-1-y]=p.shape[y][x];
  return out;
}
function collides(p,grid){
  const sh=p.shape;
  for(let y=0;y<sh.length;y++) for(let x=0;x<sh[0].length;x++) if(sh[y][x]){
    const gx = p.x+x, gy=p.y+y;
    if(gx<0||gx>=W||gy>=H|| (gy>=0 && grid[gy][gx])) return true;
  }
  return false;
}
function merge(){
  const {shape,x,y} = state.cur; for(let yy=0;yy<shape.length;yy++) for(let xx=0;xx<shape[0].length;xx++) if(shape[yy][xx]){
    if(y+yy>=0) state.grid[y+yy][x+xx]=1;
  }
}
function clearLines(){
  let cleared=0; for(let y=H-1;y>=0;y--){ if(state.grid[y].every(v=>v)){ state.grid.splice(y,1); state.grid.unshift(Array(W).fill(0)); cleared++; y++; } }
  if(cleared){
    state.lines += cleared;
    const points = [0,40,100,300,1200][cleared] || 0; // NES-ish
    state.score += points * state.level;
    if(state.lines >= state.level*10){ state.level++; dropInterval = Math.max(TICK_MIN, TICK_BASE - (state.level-1)*TICK_FALL); }
    // awards hooks
    if(cleared===4) unlockAward('TETRIS');
    if(state.level===5) unlockAward('LVL5');
    if(state.level===10) unlockAward('LVL10');
  }
}
function hardDrop(){
  let moved=0; while(true){ state.cur.y++; if(collides(state.cur,state.grid)){ state.cur.y--; break; } moved++; }
  state.score += 2*moved; unlockAward('SPEED_DEEMON');
  lockPiece();
}
function lockPiece(){ merge(); clearLines(); spawn(); }

function move(dx){ state.cur.x+=dx; if(collides(state.cur,state.grid)) state.cur.x-=dx; }
function soft(){ state.cur.y++; if(collides(state.cur,state.grid)){ state.cur.y--; lockPiece(); } }
function rotate(){ const old=state.cur.shape; state.cur.shape=rotateCW(state.cur); if(collides(state.cur,state.grid)){
  // simple wall kick attempts
  state.cur.x++; if(collides(state.cur,state.grid)) { state.cur.x-=2; if(collides(state.cur,state.grid)){ state.cur.x++; state.cur.shape=old; }}
}}
function hold(){ if(!state.canHold) return; const k=state.cur.kind; if(state.hold){ const swap=state.hold; state.hold=k; state.cur={kind:swap,shape:pieceShape(swap),x:3,y:0,rot:0}; }
  else { state.hold=k; spawn(); }
  state.canHold=false; drawAll(); }

function drawAll(){
  // background
  ctx.fillStyle = COLORS.bg; ctx.fillRect(0,0,cvs.width,cvs.height);
  // grid
  const cell = Math.floor(Math.min(cvs.width/W, cvs.height/H));
  const ox = Math.floor((cvs.width - cell*W)/2); const oy = Math.floor((cvs.height - cell*H)/2);
  // draw settled
  ctx.fillStyle = COLORS.fg;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(state.grid[y][x]) ctx.fillRect(ox+x*cell, oy+y*cell, cell-1, cell-1);
  // draw current
  const sh=state.cur.shape; ctx.fillStyle = COLORS.fg;
  for(let y=0;y<sh.length;y++) for(let x=0;x<sh[0].length;x++) if(sh[y][x]){
    const gx=state.cur.x+x, gy=state.cur.y+y; if(gy>=0)
      ctx.fillRect(ox+gx*cell, oy+gy*cell, cell-1, cell-1);
  }
  // HUD
  scoreEl.textContent = state.score; levelEl.textContent = state.level; linesEl.textContent = state.lines;
  drawMini(nextC, state.bag[0] || state.next?.[0]);
  drawMini(holdC, state.hold);
}
function drawMini(c2d, kind){
  c2d.clearRect(0,0,c2d.canvas.width,c2d.canvas.height);
  if(!kind) return; const shape = pieceShape(kind);
  const cell = 12; const w=shape[0].length, h=shape.length; const ox=(c2d.canvas.width - w*cell)/2, oy=(c2d.canvas.height - h*cell)/2;
  c2d.fillStyle = COLORS.fg;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(shape[y][x]) c2d.fillRect(ox+x*cell, oy+y*cell, cell-1, cell-1);
}

function gameLoop(t){
  if(state.over){ return; }
  if(state.paused){ requestAnimationFrame(gameLoop); return; }
  if(!loggedIn && Date.now()>state.freeDeadline){ showModal('gate'); return; }
  if(!lastTick) lastTick=t;
  if(t-lastTick >= dropInterval){ lastTick=t; soft(); }
  drawAll();
  requestAnimationFrame(gameLoop);
}

function unlockAward(code){ if(!loggedIn) return; fetch('api/awards.php', {method:'POST', body: new URLSearchParams({code})}); }

function bindKeys(){
  window.addEventListener('keydown', (e)=>{
    if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key) || e.key==='Shift' || e.key==='Enter') e.preventDefault();
    if(e.key==='ArrowLeft') move(-1);
    else if(e.key==='ArrowRight') move(1);
    else if(e.key==='ArrowDown') soft();
    else if(e.key==='ArrowUp') rotate();
    else if(e.key===' ') hardDrop();
    else if(e.key==='Shift') hold();
    else if(e.key==='Enter') state.paused=!state.paused;
  });
  document.querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('touchstart', (e)=>{ e.preventDefault(); doAction(btn.dataset.action); }, {passive:false});
    btn.addEventListener('click', ()=>doAction(btn.dataset.action));
  });
}
function doAction(a){ if(a==='left') move(-1); if(a==='right') move(1); if(a==='down') soft(); if(a==='up' || a==='rotate') rotate(); if(a==='hard') hardDrop(); if(a==='hold') hold(); if(a==='pause') state.paused=!state.paused; }

function setupAuth(){
  const ui = {
    info: document.getElementById('user-info'),
    loginBtn: document.getElementById('btn-login'),
    regBtn: document.getElementById('btn-register'),
    outBtn: document.getElementById('btn-logout'),
    themeSel: document.getElementById('theme'),
  };

  function applyTheme(v){ document.body.className = `theme-${v}`; COLORS.fg=getComputedStyle(document.body).getPropertyValue('--lcd-dark').trim(); COLORS.bg=getComputedStyle(document.body).getPropertyValue('--lcd-light').trim(); drawAll(); }

  fetch('api/me.php').then(r=>r.json()).then(({user})=>{
    if(user){ loggedIn=true; ui.info.textContent = `@${user.username || user.email}`; ui.loginBtn.classList.add('hide'); ui.regBtn.classList.add('hide'); ui.outBtn.classList.remove('hide'); ui.themeSel.value=user.theme||'original'; applyTheme(ui.themeSel.value); loadServerState(); } else { applyTheme(ui.themeSel.value); }
  });

  ui.themeSel.addEventListener('change', (e)=>{ applyTheme(e.target.value); if(loggedIn){ const fd=new FormData(); fd.append('theme', e.target.value); fetch('api/update_profile.php',{method:'POST',body:fd}); }});

  document.getElementById('btn-logout').addEventListener('click', ()=>{ fetch('api/logout.php').then(()=>location.reload()); });

  // Register modal
  document.getElementById('btn-register').addEventListener('click', ()=>showModal('register'));
  document.getElementById('swapToLogin').addEventListener('click', (e)=>{ e.preventDefault(); closeModal('register'); showModal('login'); });
  document.getElementById('registerForm').addEventListener('submit', async (e)=>{
    e.preventDefault(); const fd = new FormData(e.target);
    const res = await fetch('api/register.php',{method:'POST', body: fd}); const j=await res.json();
    if(j.ok){ closeModal('register'); location.reload(); } else alert(j.error||'Failed');
  });

  // Login modal (OTP)
  document.getElementById('btn-login').addEventListener('click', ()=>showModal('login'));
  document.getElementById('gate-login').addEventListener('click', ()=>{ closeModal('gate'); showModal('login'); });
  document.getElementById('gate-register').addEventListener('click', ()=>{ closeModal('gate'); showModal('register'); });

  const step1 = document.getElementById('loginFormStep1');
  const step2 = document.getElementById('loginFormStep2');
  step1.addEventListener('submit', async (e)=>{
    e.preventDefault(); const data=new FormData(step1); const res=await fetch('api/send_login_code.php',{method:'POST', body:data}); const j=await res.json(); if(j.ok){ step2.classList.remove('hide'); step1.classList.add('hide'); step2.elements.email.value = step1.elements.email.value; } else alert(j.error||'Failed'); });
  step2.addEventListener('submit', async (e)=>{
    e.preventDefault(); const data=new FormData(step2); const res=await fetch('api/verify_login_code.php',{method:'POST', body:data}); const j=await res.json(); if(j.ok){ closeModal('login'); location.reload(); } else alert(j.error||'Failed'); });
}

function showModal(id){ document.getElementById(id).classList.remove('hide'); }
function closeModal(id){ document.getElementById(id).classList.add('hide'); }
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>{
  b.closest('.modal').classList.add('hide');
}));

function saveServerState(){ if(!loggedIn || saving) return; saving=true; const payload = compressState(); fetch('api/save_state.php',{method:'POST', body: new URLSearchParams({state_json: JSON.stringify(payload)})}).finally(()=>saving=false); }
function loadServerState(){ fetch('api/load_state.php').then(r=>r.json()).then(({state:st})=>{ if(!st) return; restoreState(st); }); }

function compressState(){
  return {
    grid: state.grid,
    cur: {kind:state.cur.kind,x:state.cur.x,y:state.cur.y,shape:state.cur.shape},
    hold: state.hold, bag: state.bag,
    score: state.score, lines: state.lines, level: state.level
  };
}
function restoreState(s){
  state.grid = s.grid; state.cur = s.cur; state.hold=s.hold; state.bag=s.bag; state.score=s.score; state.lines=s.lines; state.level=s.level; dropInterval = Math.max(TICK_MIN, TICK_BASE - (state.level-1)*TICK_FALL); drawAll(); }

window.addEventListener('blur', ()=>{ state.paused=true; saveServerState(); });
setInterval(saveServerState, 15000);

function init(){
  // adapt canvas size to viewport (keeps 160x144 ratio but scales)
  function fit(){ const wrap=document.querySelector('.gb-screen-wrap'); const rect=wrap.getBoundingClientRect(); cvs.width = Math.floor(rect.width); cvs.height = Math.floor(rect.height); drawAll(); if(window.initGBScreenEffect) initGBScreenEffect(); }
  window.addEventListener('resize', fit); fit();
  seedBag(); spawn(); bindKeys(); setupAuth(); requestAnimationFrame(gameLoop);
}

init();
```

---

## 4) Deployment (Hostinger Shared Cloud)

1. **Create DB** in hPanel → MySQL Databases. Copy host, db, user, pass.
2. **Import schema**: phpMyAdmin → your DB → *Import* → upload `schema.sql`.
3. **Upload files**: Put everything under `public_html/` (keep folder structure). Replace `api/db.php` constants.
4. **File permissions**: Ensure `assets/images/` is writable for avatars (e.g., 755 on dirs, 644 files; if upload fails, try `assets/images` dir 775).
5. **Email sending**: The OTP uses `mail()`. In Hostinger, it typically works out‑of‑the‑box. If delivery lags, consider setting up an SMTP provider later.
6. **Admin**: After creating your account, set yourself admin: in phpMyAdmin run

   ```sql
   UPDATE users SET is_admin=1 WHERE email='you@yourdomain.com';
   ```

   Then visit `/admin/` to view users.

---

## 5) Game Parity with Gen‑1 Game Boy

* **Look**: Duo‑tone palette, pixelated render, scanline/vignette overlay.
* **Controls**: D‑Pad, A=rotate, B=hard drop, Start=pause, Select=hold piece.
* **Scoring/Levels**: NES‑style points; level increases every 10 lines; gravity speeds up.
* **Next/Hold**: Mini previews reflect classic quality‑of‑life features.
* **Responsive**: Fits iPhone 14 Pro and modern phones (viewport meta, aspect‑ratio, hit‑targets).

> If you want 100% SRS & DAS/ARR tuning like Tetris Guideline, we can tighten rotation kicks and input repeat timings in a subsequent pass.

---

## 6) QA Checklist (hit this on device)

* iPhone 14 Pro Safari: rotate piece, hard drop, hold, pause; verify 5‑minute gate.
* Register → verify profile theme switch + unique username enforcement.
* Refresh after sign‑in → confirms resume from saved position.
* Admin panel lists new users; awards unlock on milestones.

---

## 7) Roadmap Upgrades (optional)

* Use **Service Worker** to cache assets for offline play (PWA).
* Switch OTP mail to **SMTP** (Postmark/SendGrid) with PHPMailer.
* Anti‑cheat server validation for award triggers & score submissions.
* Add leaderboard and spectate mode.
* Three.js: model a low‑poly Game Boy shell with subtle tilt/parallax.

---

## 8) Troubleshooting

* **White screen on iOS**: likely WebGL blocked — the game still runs without the Three.js overlay.
* **OTP emails slow**: shared hosting mail queues—try again or configure SMTP.
* **Avatar upload fails**: ensure `assets/images/` exists and is writable; check PHP `upload_max_filesize`.

---

**Done.** This is production‑oriented scaffolding you can deploy today. If you want a ZIP, ask and I’ll package it.
