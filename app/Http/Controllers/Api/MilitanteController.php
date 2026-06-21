<?php
namespace App\Http\Controllers\Api;

class MilitanteController {
    public function store() {
        header('Content-Type: application/json');
        $inputJSON = file_get_contents('php://input');
        $data = json_decode($inputJSON, true);

        if ($data && isset($data['id'])) {
            $backupDir = __DIR__ . '/../../../../storage/app/public/backups';
            if (!is_dir($backupDir)) {
                mkdir($backupDir, 0755, true);
            }
            
            $filename = $backupDir . '/militante_' . preg_replace('/[^a-zA-Z0-9_-]/', '', $data['id']) . '.json';
            file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT));
            
            echo json_encode(["status" => "success", "message" => "Guardado en Storage Local por el Controlador."]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Payload JSON inválido."]);
        }
    }
}
