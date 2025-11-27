<?php
namespace AudicalServices\Models;

use PDO;

class OrderRepository
{
    public function __construct(private PDO $db) {}

    public function create(array $order, array $items): int
    {
        $this->db->beginTransaction();
        $stmt = $this->db->prepare('INSERT INTO orders (user_id, status, subtotal, shipping_total, total, stripe_payment_intent_id, shipping_address_id) VALUES (?,?,?,?,?,?,?)');
        $stmt->execute([
            $order['user_id'] ?? null,
            $order['status'] ?? 'PENDING',
            $order['subtotal'],
            $order['shipping_total'],
            $order['total'],
            $order['stripe_payment_intent_id'] ?? null,
            $order['shipping_address_id'] ?? null,
        ]);
        $orderId = (int)$this->db->lastInsertId();

        $itemStmt = $this->db->prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?,?,?,?)');
        foreach ($items as $item) {
            $itemStmt->execute([$orderId, $item['product_id'], $item['quantity'], $item['unit_price']]);
        }

        $this->db->commit();
        return $orderId;
    }

    public function markPaid(int $orderId): void
    {
        $stmt = $this->db->prepare('UPDATE orders SET status = "PAID" WHERE id = ?');
        $stmt->execute([$orderId]);
    }

    public function markDispute(int $orderId): void
    {
        $stmt = $this->db->prepare('UPDATE orders SET status = "DISPUTED" WHERE id = ?');
        $stmt->execute([$orderId]);
    }

    public function markRefunded(int $orderId): void
    {
        $stmt = $this->db->prepare('UPDATE orders SET status = "REFUNDED" WHERE id = ?');
        $stmt->execute([$orderId]);
    }

    public function findByPaymentIntent(string $paymentIntent): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM orders WHERE stripe_payment_intent_id = ?');
        $stmt->execute([$paymentIntent]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}
