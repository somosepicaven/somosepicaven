<?php
namespace App\Models;

class Militante {
    public $id;
    public $name;
    public $cedula;
    public $phone;
    public $email;
    public $role;
    public $timestamp;

    public function __construct($data) {
        $this->id = $data['id'] ?? null;
        $this->name = $data['name'] ?? null;
        $this->cedula = $data['cedula'] ?? null;
        $this->phone = $data['phone'] ?? null;
        $this->email = $data['email'] ?? null;
        $this->role = $data['role'] ?? null;
        $this->timestamp = $data['timestamp'] ?? date('c');
    }
}
