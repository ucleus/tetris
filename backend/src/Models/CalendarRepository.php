<?php
namespace AudicalServices\Models;

use PDO;

class CalendarRepository
{
    public function __construct(private PDO $db) {}

    public function addEvent(string $title, string $startDate, string $location): int
    {
        $stmt = $this->db->prepare('INSERT INTO logistics_events (title, start_date, location) VALUES (?,?,?)');
        $stmt->execute([$title, $startDate, $location]);
        return (int)$this->db->lastInsertId();
    }

    public function all(): array
    {
        $stmt = $this->db->query('SELECT * FROM logistics_events ORDER BY start_date DESC');
        return $stmt->fetchAll();
    }
}
