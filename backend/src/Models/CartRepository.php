<?php
namespace AudicalServices\Models;

use PDO;

class CartRepository
{
    public function __construct(private PDO $db) {}

    public function create(int $userId): int
    {
        $stmt = $this->db->prepare('INSERT INTO carts (user_id) VALUES (?)');
        $stmt->execute([$userId]);
        return (int)$this->db->lastInsertId();
    }

    public function addItem(int $cartId, int $productId, int $quantity): void
    {
        $stmt = $this->db->prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)');
        $stmt->execute([$cartId, $productId, $quantity]);
    }

    public function updateQty(int $cartId, int $productId, int $quantity): void
    {
        $stmt = $this->db->prepare('UPDATE cart_items SET quantity=? WHERE cart_id=? AND product_id=?');
        $stmt->execute([$quantity, $cartId, $productId]);
    }

    public function removeItem(int $cartId, int $productId): void
    {
        $stmt = $this->db->prepare('DELETE FROM cart_items WHERE cart_id=? AND product_id=?');
        $stmt->execute([$cartId, $productId]);
    }

    public function getItems(int $cartId): array
    {
        $stmt = $this->db->prepare('SELECT ci.*, p.name, p.price, p.condition_grade, p.stock FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ?');
        $stmt->execute([$cartId]);
        return $stmt->fetchAll();
    }
}
