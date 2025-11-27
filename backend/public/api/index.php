<?php
require_once __DIR__.'/../../bootstrap.php';

use AudicalServices\Models\{ProductRepository, CartRepository, OrderRepository, CalendarRepository};
use AudicalServices\Services\{Response, ShippingService, InventoryService};

$pdo = pdo();
$products = new ProductRepository($pdo);
$carts = new CartRepository($pdo);
$orders = new OrderRepository($pdo);
$calendar = new CalendarRepository($pdo);
$inventory = new InventoryService($products);
$shipping = new ShippingService();

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

if ($path === '/api/products' && $method === 'GET') {
    Response::json($products->all());
}

if (preg_match('#^/api/products/(\d+)$#', $path, $m) && $method === 'GET') {
    $product = $products->find((int)$m[1]);
    if (!$product) Response::json(['error' => 'Not found'], 404);
    Response::json($product);
}

if ($path === '/api/cart' && $method === 'POST') {
    $body = json_input();
    $cartId = $body['cart_id'] ?? null;
    if (!$cartId) {
        $cartId = $carts->create($body['user_id'] ?? 1);
    }
    if (!empty($body['product_id'])) {
        $carts->addItem($cartId, $body['product_id'], $body['quantity'] ?? 1);
    }
    Response::json(['cart_id' => $cartId, 'items' => $carts->getItems($cartId)]);
}

if ($path === '/api/cart' && $method === 'PATCH') {
    $body = json_input();
    $cartId = $body['cart_id'] ?? null;
    if (!$cartId) Response::json(['error' => 'cart_id required'], 400);
    $carts->updateQty($cartId, $body['product_id'], $body['quantity']);
    Response::json(['items' => $carts->getItems($cartId)]);
}

if ($path === '/api/cart' && $method === 'DELETE') {
    $body = json_input();
    $cartId = $body['cart_id'] ?? null;
    if (!$cartId) Response::json(['error' => 'cart_id required'], 400);
    $carts->removeItem($cartId, $body['product_id']);
    Response::json(['items' => $carts->getItems($cartId)]);
}

if ($path === '/api/orders' && $method === 'POST') {
    $body = json_input();
    $items = $body['items'] ?? [];
    $weight = array_reduce($items, fn($carry, $item) => $carry + (($item['weight_kg'] ?? 0) * $item['quantity']), 0);
    $subtotal = array_reduce($items, fn($carry, $item) => $carry + ($item['unit_price'] * $item['quantity']), 0);
    $ship = $shipping->estimate($subtotal, $weight, true);
    $orderId = $orders->create([
        'user_id' => $body['user_id'] ?? null,
        'subtotal' => $subtotal,
        'shipping_total' => $ship,
        'total' => $subtotal + $ship,
        'shipping_address_id' => $body['shipping_address_id'] ?? null,
        'stripe_payment_intent_id' => $body['stripe_payment_intent_id'] ?? null,
    ], $items);
    Response::json(['order_id' => $orderId, 'status' => 'PENDING', 'shipping_total' => $ship]);
}

if ($path === '/api/calendar' && $method === 'GET') {
    Response::json($calendar->all());
}

if ($path === '/api/calendar' && $method === 'POST') {
    $body = json_input();
    $id = $calendar->addEvent($body['title'], $body['start_date'], $body['location']);
    Response::json(['event_id' => $id]);
}

Response::json(['error' => 'Not found'], 404);
