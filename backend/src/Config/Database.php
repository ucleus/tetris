<?php
namespace AudicalServices\Config;

use PDO;
use PDOException;

class Database
{
    public function getConnection(): PDO
    {
        $host = $_ENV['DB_HOST'] ?? 'localhost';
        $db = $_ENV['DB_NAME'] ?? 'audicalservices';
        $user = $_ENV['DB_USER'] ?? 'root';
        $pass = $_ENV['DB_PASS'] ?? '';
        $port = $_ENV['DB_PORT'] ?? 3306;
        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";

        try {
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            return $pdo;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
            exit;
        }
    }
}
