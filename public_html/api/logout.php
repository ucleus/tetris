<?php
require __DIR__.'/db.php';
start_session();
session_destroy();
json_out(['ok'=>true]);
