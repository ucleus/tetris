<?php
require_once __DIR__.'/src/Utils/helpers.php';
require_once __DIR__.'/src/Config/Database.php';
require_once __DIR__.'/src/Services/Response.php';
require_once __DIR__.'/src/Models/ProductRepository.php';
require_once __DIR__.'/src/Models/CartRepository.php';
require_once __DIR__.'/src/Models/OrderRepository.php';
require_once __DIR__.'/src/Models/CalendarRepository.php';
require_once __DIR__.'/src/Services/ShippingService.php';
require_once __DIR__.'/src/Services/InventoryService.php';
require_once __DIR__.'/src/Services/PaymentService.php';

use AudicalServices\Config\Database;

// load env
$envFile = __DIR__.'/.env';
if (file_exists($envFile)) {
    foreach (parse_ini_file($envFile) as $key => $value) {
        $_ENV[$key] = $value;
    }
}

function pdo(): PDO {
    static $pdo;
    if ($pdo) return $pdo;
    $pdo = (new Database())->getConnection();
    return $pdo;
}
