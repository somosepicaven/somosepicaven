<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Este archivo actúa como contingencia en caso de que Firebase esté inactivo
// Recibe cargas POST del Ecosistema ÉPICA y guarda copias locales.

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputJSON = file_get_contents('php://input');
    $data = json_decode($inputJSON, true);

    if ($data && isset($data['id'])) {
        $backupDir = __DIR__ . '/backup_db';
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        
        $filename = $backupDir . '/militante_' . preg_replace('/[^a-zA-Z0-9_-]/', '', $data['id']) . '.json';
        file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT));
        
        echo json_encode(["status" => "success", "message" => "Backup guardado vía PHP."]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Payload JSON inválido o sin ID."]);
    }
} else {
    echo json_encode(["status" => "info", "message" => "API PHP ÉPICA Operativa. Use POST para escribir."]);
}
?>
