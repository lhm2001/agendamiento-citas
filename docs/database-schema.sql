-- ========================================
-- Schema para RDS MySQL (Perú y Chile)
-- ========================================
-- Este script debe ejecutarse en ambas bases de datos:
-- - appointments_pe (Perú)
-- - appointments_cl (Chile)

-- Crear base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS appointments_pe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CREATE DATABASE IF NOT EXISTS appointments_cl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE appointments_pe;

-- ========================================
-- Tabla: appointments
-- ========================================
-- Almacena los agendamientos de citas médicas
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id VARCHAR(36) NOT NULL UNIQUE COMMENT 'UUID del agendamiento desde DynamoDB',
    insured_id VARCHAR(5) NOT NULL COMMENT 'Código del asegurado (5 dígitos)',
    center_id INT NOT NULL COMMENT 'ID del centro médico',
    specialty_id INT NOT NULL COMMENT 'ID de la especialidad',
    medic_id INT NOT NULL COMMENT 'ID del médico',
    appointment_date DATETIME NOT NULL COMMENT 'Fecha y hora de la cita',
    schedule_id INT NOT NULL COMMENT 'ID del espacio de agendamiento',
    country_iso CHAR(2) NOT NULL COMMENT 'Código ISO del país (PE o CL)',
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' COMMENT 'Estado del agendamiento',
    metadata JSON COMMENT 'Información adicional en formato JSON',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_insured_id (insured_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_center_specialty (center_id, specialty_id),
    INDEX idx_schedule_id (schedule_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Agendamientos de citas médicas';

-- ========================================
-- Tabla: centers
-- ========================================
-- Catálogo de centros médicos (opcional)
CREATE TABLE IF NOT EXISTS centers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    country_iso CHAR(2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_country (country_iso),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Catálogo de centros médicos';

-- ========================================
-- Tabla: specialties
-- ========================================
-- Catálogo de especialidades médicas (opcional)
CREATE TABLE IF NOT EXISTS specialties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Catálogo de especialidades médicas';

-- ========================================
-- Tabla: medics
-- ========================================
-- Catálogo de médicos (opcional)
CREATE TABLE IF NOT EXISTS medics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialty_id INT NOT NULL,
    license_number VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_specialty (specialty_id),
    INDEX idx_active (active),
    FOREIGN KEY (specialty_id) REFERENCES specialties(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Catálogo de médicos';

-- ========================================
-- Datos de ejemplo (opcional)
-- ========================================

-- Centros médicos
INSERT INTO centers (name, address, city, country_iso) VALUES
('Centro Médico San José', 'Av. Principal 123', 'Lima', 'PE'),
('Centro Médico Santa Rosa', 'Jr. Los Andes 456', 'Lima', 'PE'),
('Clínica Las Condes', 'Av. Las Condes 7891', 'Santiago', 'CL'),
('Clínica Alemana', 'Av. Vitacura 5951', 'Santiago', 'CL');

-- Especialidades
INSERT INTO specialties (name, description) VALUES
('Medicina General', 'Consulta médica general'),
('Pediatría', 'Especialidad en salud infantil'),
('Cardiología', 'Especialidad en enfermedades del corazón'),
('Dermatología', 'Especialidad en enfermedades de la piel'),
('Oftalmología', 'Especialidad en enfermedades de los ojos'),
('Traumatología', 'Especialidad en lesiones del sistema musculoesquelético'),
('Ginecología', 'Especialidad en salud de la mujer'),
('Neurología', 'Especialidad en enfermedades del sistema nervioso');

-- Médicos
INSERT INTO medics (first_name, last_name, specialty_id, license_number) VALUES
('Juan', 'Pérez García', 1, 'CMP-12345'),
('María', 'González López', 2, 'CMP-23456'),
('Carlos', 'Rodríguez Silva', 3, 'CMP-34567'),
('Ana', 'Martínez Torres', 4, 'CMP-45678'),
('Luis', 'Fernández Díaz', 5, 'CMP-56789'),
('Carmen', 'Sánchez Ruiz', 6, 'CMP-67890'),
('José', 'López Ramírez', 7, 'CMP-78901'),
('Laura', 'Torres Flores', 8, 'CMP-89012');

-- ========================================
-- NOTA: 
-- Este mismo script debe ejecutarse en la base de datos de Chile (appointments_cl)
-- cambiando el USE y los datos de ejemplo según corresponda
-- ========================================

