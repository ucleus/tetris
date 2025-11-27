<?php
require_once __DIR__.'/../../../bootstrap.php';

use AudicalServices\Models\{OrderRepository, ProductRepository};
use AudicalServices\Services\{InventoryService, PaymentService};

$payload = @file_get_contents('php://input');
$sig = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

$orderRepo = new OrderRepository(pdo());
$productRepo = new ProductRepository(pdo());
$inventory = new InventoryService($productRepo);
$service = new PaymentService($orderRepo, $inventory);
$service->handleWebhook($payload, $sig);
