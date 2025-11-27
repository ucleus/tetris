<?php
namespace AudicalServices\Models;

use PDO;

class ProductRepository
{
    public function __construct(private PDO $db) {}

    public function all(): array
    {
        $stmt = $this->db->query('SELECT * FROM products ORDER BY created_at DESC');
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare('INSERT INTO products (name, description, price, category, condition_grade, verified, calibration_date, warranty, compliance, shipping, stock, weight_kg) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
        $stmt->execute([
            $data['name'],
            $data['description'],
            $data['price'],
            $data['category'],
            $data['condition_grade'],
            $data['verified'] ?? 0,
            $data['calibration_date'] ?? null,
            $data['warranty'] ?? null,
            $data['compliance'] ?? null,
            $data['shipping'] ?? null,
            $data['stock'] ?? 0,
            $data['weight_kg'] ?? 0,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function updateStock(int $productId, int $stock): void
    {
        $stmt = $this->db->prepare('UPDATE products SET stock = ? WHERE id = ?');
        $stmt->execute([$stock, $productId]);
    }
}
