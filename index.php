<?php
/**
 * Ecosistema EPICA - API Gateway (Fallback)
 */
define('LARAVEL_START', microtime(true));

// Permitir CORS para que la vista en Github Pages se comunique con este backend si se aloja en otro servidor
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Enrutador Simple
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($uri === '/api/militantes') {
    require __DIR__ . '/../app/Http/Controllers/Api/MilitanteController.php';
    $controller = new \App\Http\Controllers\Api\MilitanteController();
    $controller->store();
} else {
    // Si acceden a la raíz por PHP, servir el HTML
    require __DIR__ . '/index.html';
}
