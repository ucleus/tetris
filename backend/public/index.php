<?php
// Simple health endpoint
header('Content-Type: application/json');
echo json_encode(['service' => 'Audical Services API', 'status' => 'ok']);
