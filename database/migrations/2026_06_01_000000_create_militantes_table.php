<?php
// Migración simplificada para base de datos
class CreateMilitantesTable {
    public function up() {
        return "CREATE TABLE militantes (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            cedula VARCHAR(50) NOT NULL,
            phone VARCHAR(50),
            email VARCHAR(255),
            role VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );";
    }
}
