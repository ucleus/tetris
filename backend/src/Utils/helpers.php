<?php
function json_input() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function send_json($data, int $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function require_method(string $method) {
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        send_json(['error' => 'Method not allowed'], 405);
    }
}
