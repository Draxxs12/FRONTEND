-- =============================================
-- SISTEMA VENTAS/ALMACÉN — Prototipo v1.0
-- Base de datos: tienda_db
-- =============================================

CREATE DATABASE IF NOT EXISTS tienda_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tienda_db;

-- =============================================
-- ROLES
-- =============================================
CREATE TABLE roles (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  nombre   VARCHAR(50) NOT NULL UNIQUE
);

-- =============================================
-- USUARIOS
-- =============================================
CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol_id        INT NOT NULL,
  activo        TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- =============================================
-- CLIENTES
-- =============================================
CREATE TABLE clientes (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(200) NOT NULL,
  tipo_documento   ENUM('DNI','RUC','CE') DEFAULT 'DNI',
  numero_documento VARCHAR(20),
  telefono         VARCHAR(20),
  email            VARCHAR(150),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CATEGORÍAS
-- =============================================
CREATE TABLE categorias (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
);

-- =============================================
-- PRODUCTOS
-- =============================================
CREATE TABLE productos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  codigo       VARCHAR(50) UNIQUE,
  nombre       VARCHAR(200) NOT NULL,
  categoria_id INT,
  precio_compra DECIMAL(10,2) DEFAULT 0,
  precio_venta  DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock         INT DEFAULT 0,
  stock_minimo  INT DEFAULT 5,
  activo        TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- =============================================
-- INVENTARIO (movimientos de stock)
-- =============================================
CREATE TABLE inventario (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  producto_id   INT NOT NULL,
  usuario_id    INT NOT NULL,
  tipo          ENUM('Entrada','Salida','Ajuste') NOT NULL,
  cantidad      INT NOT NULL,
  stock_antes   INT NOT NULL,
  stock_despues INT NOT NULL,
  motivo        VARCHAR(255),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)
);

-- =============================================
-- VENTAS
-- =============================================
CREATE TABLE ventas (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  numero_comprobante VARCHAR(30) UNIQUE,
  cliente_id         INT,
  usuario_id         INT NOT NULL,
  subtotal           DECIMAL(10,2) DEFAULT 0,
  igv                DECIMAL(10,2) DEFAULT 0,
  total              DECIMAL(10,2) DEFAULT 0,
  tipo_pago          ENUM('Efectivo','Tarjeta','Yape','Plin') DEFAULT 'Efectivo',
  estado             ENUM('Completada','Anulada') DEFAULT 'Completada',
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id)  REFERENCES clientes(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)
);

-- =============================================
-- DETALLE VENTA
-- =============================================
CREATE TABLE detalle_venta (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  venta_id        INT NOT NULL,
  producto_id     INT NOT NULL,
  cantidad        INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (venta_id)    REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- =============================================
-- DATOS DE PRUEBA
-- =============================================

INSERT INTO roles (nombre) VALUES
  ('Administrador'),
  ('Recepcionista'),
  ('Almacenero');

-- Contraseña: admin123 (bcrypt simulado para prototipo)
INSERT INTO usuarios (nombre, email, password_hash, rol_id) VALUES
  -- Usuarios creados por el sistema
  ('Dany',   'midanale12@gmail.com',         '$2b$10$cYEuK/WaNzdOQBSmaos.NutRFjjCKcW5ZlxBR9rUtml12XK/8nVCW', 1),
  ('Dany2',  'bacadany58@gmail.com',         '$2b$10$cYEuK/WaNzdOQBSmaos.NutRFjjCKcW5ZlxBR9rUtml12XK/8nVCW', 2),
  ('Dany3',  'aalessandro.baca57@gmail.com', '$2b$10$cYEuK/WaNzdOQBSmaos.NutRFjjCKcW5ZlxBR9rUtml12XK/8nVCW', 3),
  -- Usuarios creados por Dany desde la carga inicial
  ('Alfredo','alfredomq82@gmail.com',        '$2b$10$cYEuK/WaNzdOQBSmaos.NutRFjjCKcW5ZlxBR9rUtml12XK/8nVCW', 1),
  ('Frank',  'franckyc2013@gmail.com',       '$2b$10$cYEuK/WaNzdOQBSmaos.NutRFjjCKcW5ZlxBR9rUtml12XK/8nVCW', 1),
  ('Angel',  'Asp.asrp@gmail.com',           '$2b$10$cYEuK/WaNzdOQBSmaos.NutRFjjCKcW5ZlxBR9rUtml12XK/8nVCW', 1);

INSERT INTO clientes (nombre, tipo_documento, numero_documento, telefono, email) VALUES
  ('Cliente General', 'DNI', '00000000', '',            ''),
  ('María García',    'DNI', '45678901', '987654321',   'maria@gmail.com'),
  ('Empresa ABC SAC', 'RUC', '20987654321', '01-555-0000', 'compras@abc.com');

INSERT INTO categorias (nombre) VALUES
  ('Herramientas Manuales'),
  ('Herramientas Eléctricas'),
  ('Plomería'),
  ('Electricidad'),
  ('Ferretería General');

INSERT INTO productos (codigo, nombre, categoria_id, precio_compra, precio_venta, stock, stock_minimo) VALUES
  ('PROD-001', 'Martillo Carpintero 16oz',    1, 18.00,  35.00, 50, 10),
  ('PROD-002', 'Destornillador Estrella #2',  1,  5.00,  12.00, 80, 15),
  ('PROD-003', 'Taladro Percutor 500W',       2, 85.00, 159.90, 20,  5),
  ('PROD-004', 'Sierra Circular 7-1/4"',      2,120.00, 229.00, 10,  3),
  ('PROD-005', 'Llave Francesa 10"',          1, 12.00,  24.00, 40, 10),
  ('PROD-006', 'Tubo PVC 1/2" x 3m',         3,  4.50,   9.00, 100,20),
  ('PROD-007', 'Cable THW 2.5mm (metro)',     4,  1.80,   3.50, 500,50),
  ('PROD-008', 'Caja de Clavos 2" (kg)',      5,  4.00,   8.00, 60, 10),
  ('PROD-009', 'Cinta Métrica 5m',            1,  7.00,  14.00, 35, 10),
  ('PROD-010', 'Nivel de Burbuja 60cm',       1, 15.00,  29.00, 25,  5);

-- Movimientos iniciales de inventario (carga inicial)
INSERT INTO inventario (producto_id, usuario_id, tipo, cantidad, stock_antes, stock_despues, motivo) VALUES
  (1, 3, 'Entrada', 50, 0, 50, 'Stock inicial'),
  (2, 3, 'Entrada', 80, 0, 80, 'Stock inicial'),
  (3, 3, 'Entrada', 20, 0, 20, 'Stock inicial'),
  (4, 3, 'Entrada', 10, 0, 10, 'Stock inicial'),
  (5, 3, 'Entrada', 40, 0, 40, 'Stock inicial'),
  (6, 3, 'Entrada',100, 0,100, 'Stock inicial'),
  (7, 3, 'Entrada',500, 0,500, 'Stock inicial'),
  (8, 3, 'Entrada', 60, 0, 60, 'Stock inicial'),
  (9, 3, 'Entrada', 35, 0, 35, 'Stock inicial'),
  (10,3, 'Entrada', 25, 0, 25, 'Stock inicial');

-- Venta de ejemplo #1
INSERT INTO ventas (numero_comprobante, cliente_id, usuario_id, subtotal, igv, total, tipo_pago) VALUES
  ('B001-00001', 2, 2, 84.75, 15.25, 100.00, 'Efectivo');

INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
  (1, 1, 1, 35.00, 35.00),
  (1, 2, 2, 12.00, 24.00),
  (1, 9, 1, 14.00, 14.00),
  (1, 8, 1,  8.00,  8.00);

-- Registrar salida en inventario por la venta
INSERT INTO inventario (producto_id, usuario_id, tipo, cantidad, stock_antes, stock_despues, motivo) VALUES
  (1, 2, 'Salida', 1, 50, 49, 'Venta B001-00001'),
  (2, 2, 'Salida', 2, 80, 78, 'Venta B001-00001'),
  (9, 2, 'Salida', 1, 35, 34, 'Venta B001-00001'),
  (8, 2, 'Salida', 1, 60, 59, 'Venta B001-00001');

-- Actualizar stock de los productos vendidos
UPDATE productos SET stock = 49 WHERE id = 1;
UPDATE productos SET stock = 78 WHERE id = 2;
UPDATE productos SET stock = 34 WHERE id = 9;
UPDATE productos SET stock = 59 WHERE id = 8;

-- Venta de ejemplo #2
INSERT INTO ventas (numero_comprobante, cliente_id, usuario_id, subtotal, igv, total, tipo_pago, estado) VALUES
  ('B001-00002', 3, 2, 199.07, 35.83, 234.90, 'Tarjeta', 'Completada');

INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
  (2, 3, 1, 159.90, 159.90),
  (2, 7, 20,  3.50,  70.00);
  
  -- =============================================
-- AGREGAR A tienda_db: Proveedores + Compras
-- Ejecuta esto en MySQL sobre tienda_db
-- =============================================
 
USE tienda_db;
 
-- =============================================
-- PROVEEDORES
-- =============================================
CREATE TABLE IF NOT EXISTS proveedores (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  empresa    VARCHAR(200) NOT NULL,
  ruc        VARCHAR(20),
  contacto   VARCHAR(100),
  telefono   VARCHAR(20),
  email      VARCHAR(150),
  direccion  VARCHAR(255),
  activo     TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 
-- =============================================
-- COMPRAS (cabecera)
-- =============================================
CREATE TABLE IF NOT EXISTS compras (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  numero_orden       VARCHAR(30) UNIQUE,
  proveedor_id       INT NOT NULL,
  usuario_id         INT NOT NULL,
  subtotal           DECIMAL(10,2) DEFAULT 0,
  igv                DECIMAL(10,2) DEFAULT 0,
  total              DECIMAL(10,2) DEFAULT 0,
  tipo_pago          ENUM('Efectivo','Transferencia','Credito') DEFAULT 'Efectivo',
  estado             ENUM('Pendiente','Recibida','Anulada') DEFAULT 'Pendiente',
  fecha_esperada     DATE,
  observaciones      TEXT,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)
);
 
-- =============================================
-- DETALLE COMPRAS
-- =============================================
CREATE TABLE IF NOT EXISTS detalle_compra (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  compra_id       INT NOT NULL,
  producto_id     INT NOT NULL,
  cantidad        INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (compra_id)   REFERENCES compras(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);
 
-- =============================================
-- DATOS DE PRUEBA
-- =============================================
INSERT INTO proveedores (empresa, ruc, contacto, telefono, email, direccion) VALUES
  ('Distribuidora Ferretera SAC', '20456789012', 'Juan Pérez',   '999-111-222', 'jperez@distrib.com',  'Av. Industrial 456, Lima'),
  ('Herramientas Pro EIRL',       '20567890123', 'María López',  '999-333-444', 'mlopez@herrpro.com',  'Jr. Comercio 789, Lima');
 
-- Compra de ejemplo
INSERT INTO compras (numero_orden, proveedor_id, usuario_id, subtotal, igv, total, tipo_pago, estado, fecha_esperada) VALUES
  ('OC-00001', 1, 1, 423.73, 76.27, 500.00, 'Transferencia', 'Recibida', '2026-05-01');
 
INSERT INTO detalle_compra (compra_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
  (1, 1, 10, 18.00, 180.00),
  (1, 2, 20,  5.00, 100.00),
  (1, 5, 10, 12.00, 120.00);
  
  -- =============================================
-- CONTRASEÑAS INICIALES
-- Contraseña para los 6 usuarios iniciales: admin123
-- =============================================

USE tienda_db;

UPDATE usuarios
SET password_hash = '$2b$10$cYEuK/WaNzdOQBSmaos.NutRFjjCKcW5ZlxBR9rUtml12XK/8nVCW'
WHERE email IN (
  'midanale12@gmail.com',
  'bacadany58@gmail.com',
  'aalessandro.baca57@gmail.com',
  'alfredomq82@gmail.com',
  'franckyc2013@gmail.com',
  'Asp.asrp@gmail.com'
);

-- =============================================
-- CREDENCIALES PARA PROBAR EL LOGIN
-- Todos los usuarios iniciales usan: admin123
-- =============================================

-- =============================================
-- FASE 3 — CAJA, MOVIMIENTOS Y DEVOLUCIONES
-- Ejecutar sobre tienda_db
-- =============================================
USE tienda_db;

-- ─── CAJA (apertura / cierre por turno) ───────────────
CREATE TABLE IF NOT EXISTS caja (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id     INT NOT NULL,
  monto_inicial  DECIMAL(10,2) NOT NULL DEFAULT 0,
  monto_final    DECIMAL(10,2),
  total_ventas   DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_egresos  DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado         ENUM('Abierta','Cerrada') NOT NULL DEFAULT 'Abierta',
  observaciones  VARCHAR(255),
  apertura       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cierre         TIMESTAMP NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ─── MOVIMIENTOS DE CAJA (ingresos / egresos) ─────────
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  caja_id      INT NOT NULL,
  tipo         ENUM('Ingreso','Egreso') NOT NULL,
  monto        DECIMAL(10,2) NOT NULL,
  descripcion  VARCHAR(255),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (caja_id) REFERENCES caja(id) ON DELETE CASCADE
);

-- ─── DEVOLUCIONES (notas de crédito) ──────────────────
CREATE TABLE IF NOT EXISTS devoluciones (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  numero_nota     VARCHAR(30) UNIQUE,
  venta_id        INT NOT NULL,
  usuario_id      INT NOT NULL,
  motivo          VARCHAR(255),
  monto_reembolso DECIMAL(10,2) NOT NULL DEFAULT 0,
  tipo_reembolso  ENUM('Efectivo','Tarjeta','NotaCredito') DEFAULT 'Efectivo',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id)   REFERENCES ventas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ─── DETALLE DEVOLUCIÓN ───────────────────────────────
CREATE TABLE IF NOT EXISTS detalle_devolucion (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  devolucion_id   INT NOT NULL,
  producto_id     INT NOT NULL,
  cantidad        INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (devolucion_id) REFERENCES devoluciones(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id)   REFERENCES productos(id)
);

-- ─── DATOS DE PRUEBA (caja inicial cerrada) ───────────
INSERT INTO caja (usuario_id, monto_inicial, monto_final, total_ventas, total_egresos, estado, observaciones, apertura, cierre)
VALUES (1, 100.00, 1450.00, 1350.00, 0.00, 'Cerrada', 'Turno de apertura del sistema', '2026-05-01 08:00:00', '2026-05-01 18:00:00');

-- =============================================
-- FASE 4 — CONFIGURACIÓN DE LA EMPRESA
-- =============================================
USE tienda_db;

CREATE TABLE IF NOT EXISTS configuracion (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nombre_empresa VARCHAR(200) DEFAULT 'Ferretería Progresol Charito',
  direccion      VARCHAR(255),
  ruc            VARCHAR(20),
  serie_boleta   VARCHAR(10) DEFAULT 'B001',
  serie_factura  VARCHAR(10) DEFAULT 'F001'
);

INSERT INTO configuracion (nombre_empresa, direccion, ruc, serie_boleta, serie_factura)
SELECT 'Ferretería Progresol Charito', 'Av. Principal 123, Lima', '20123456789', 'B001', 'F001'
WHERE NOT EXISTS (SELECT 1 FROM configuracion);

-- =============================================
-- FASE 5 — VISTAS DE AUDITORÍA
-- Quién realizó cada acción/cambio y cuándo (con su nombre de usuario)
-- =============================================
USE tienda_db;

-- Movimientos de inventario (entradas, salidas, ajustes)
CREATE OR REPLACE VIEW vista_auditoria_inventario AS
SELECT i.created_at AS fecha, u.nombre AS usuario, 'Inventario' AS modulo, i.tipo AS accion,
       CONCAT(p.nombre, ' — ', i.tipo, ' ', i.cantidad, ' und (stock ', i.stock_antes, ' a ', i.stock_despues, '). ', COALESCE(i.motivo,'')) AS detalle
FROM inventario i
JOIN usuarios  u ON u.id = i.usuario_id
JOIN productos p ON p.id = i.producto_id;

-- Ventas
CREATE OR REPLACE VIEW vista_auditoria_ventas AS
SELECT v.created_at AS fecha, u.nombre AS usuario, 'Ventas' AS modulo, CONCAT('Venta ', v.estado) AS accion,
       CONCAT('Comprobante ', v.numero_comprobante, ' por S/ ', v.total) AS detalle
FROM ventas v JOIN usuarios u ON u.id = v.usuario_id;

-- Compras
CREATE OR REPLACE VIEW vista_auditoria_compras AS
SELECT c.created_at AS fecha, u.nombre AS usuario, 'Compras' AS modulo, CONCAT('Compra ', c.estado) AS accion,
       CONCAT('Orden ', c.numero_orden, ' por S/ ', c.total) AS detalle
FROM compras c JOIN usuarios u ON u.id = c.usuario_id;

-- Caja (apertura/cierre)
CREATE OR REPLACE VIEW vista_auditoria_caja AS
SELECT caja.apertura AS fecha, u.nombre AS usuario, 'Caja' AS modulo, CONCAT('Caja ', caja.estado) AS accion,
       CONCAT('Inicial S/ ', caja.monto_inicial, ' | Ventas S/ ', caja.total_ventas, ' | Egresos S/ ', caja.total_egresos) AS detalle
FROM caja JOIN usuarios u ON u.id = caja.usuario_id;

-- Devoluciones
CREATE OR REPLACE VIEW vista_auditoria_devoluciones AS
SELECT d.created_at AS fecha, u.nombre AS usuario, 'Devoluciones' AS modulo, 'Nota de crédito' AS accion,
       CONCAT('Nota ', d.numero_nota, ' reembolso S/ ', d.monto_reembolso) AS detalle
FROM devoluciones d JOIN usuarios u ON u.id = d.usuario_id;

-- Productos (usuario en la columna registrado_por)
CREATE OR REPLACE VIEW vista_auditoria_productos AS
SELECT p.created_at AS fecha, p.registrado_por AS usuario, 'Productos' AS modulo, 'Registro/Edición' AS accion,
       CONCAT('Producto: ', p.nombre, ' (S/ ', p.precio_venta, ', stock ', p.stock, ')') AS detalle
FROM productos p WHERE p.registrado_por IS NOT NULL;

-- Clientes
CREATE OR REPLACE VIEW vista_auditoria_clientes AS
SELECT c.created_at AS fecha, c.registrado_por AS usuario, 'Clientes' AS modulo, 'Registro/Edición' AS accion,
       CONCAT('Cliente: ', c.nombre, ' (', c.tipo_documento, ' ', COALESCE(c.numero_documento,''), ')') AS detalle
FROM clientes c WHERE c.registrado_por IS NOT NULL;

-- Proveedores
CREATE OR REPLACE VIEW vista_auditoria_proveedores AS
SELECT pr.created_at AS fecha, pr.registrado_por AS usuario, 'Proveedores' AS modulo, 'Registro/Edición' AS accion,
       CONCAT('Proveedor: ', pr.empresa, ' (RUC ', COALESCE(pr.ruc,''), ')') AS detalle
FROM proveedores pr WHERE pr.registrado_por IS NOT NULL;

-- Categorías (la tabla no tiene fecha)
CREATE OR REPLACE VIEW vista_auditoria_categorias AS
SELECT NULL AS fecha, cat.registrado_por AS usuario, 'Categorías' AS modulo, 'Registro/Edición' AS accion,
       CONCAT('Categoría: ', cat.nombre) AS detalle
FROM categorias cat WHERE cat.registrado_por IS NOT NULL;

-- =============================================
-- VISTA MAESTRA: toda la auditoría consolidada en una sola tabla
--   SELECT * FROM vista_auditoria_general;
-- =============================================
CREATE OR REPLACE VIEW vista_auditoria_general AS
SELECT * FROM vista_auditoria_inventario
UNION ALL SELECT * FROM vista_auditoria_ventas
UNION ALL SELECT * FROM vista_auditoria_compras
UNION ALL SELECT * FROM vista_auditoria_caja
UNION ALL SELECT * FROM vista_auditoria_devoluciones
UNION ALL SELECT * FROM vista_auditoria_productos
UNION ALL SELECT * FROM vista_auditoria_clientes
UNION ALL SELECT * FROM vista_auditoria_proveedores
UNION ALL SELECT * FROM vista_auditoria_categorias
ORDER BY fecha DESC;

-- Usuarios (quién registró/editó la cuenta)
CREATE OR REPLACE VIEW vista_auditoria_usuarios AS
SELECT us.created_at AS fecha, us.registrado_por AS usuario, 'Usuarios' AS modulo, 'Registro/Edición' AS accion,
       CONCAT('Usuario: ', us.nombre, ' (', us.email, ')') AS detalle
FROM usuarios us WHERE us.registrado_por IS NOT NULL;

-- Vista maestra ACTUALIZADA (ahora incluye usuarios)
CREATE OR REPLACE VIEW vista_auditoria_general AS
SELECT * FROM vista_auditoria_inventario
UNION ALL SELECT * FROM vista_auditoria_ventas
UNION ALL SELECT * FROM vista_auditoria_compras
UNION ALL SELECT * FROM vista_auditoria_caja
UNION ALL SELECT * FROM vista_auditoria_devoluciones
UNION ALL SELECT * FROM vista_auditoria_productos
UNION ALL SELECT * FROM vista_auditoria_clientes
UNION ALL SELECT * FROM vista_auditoria_proveedores
UNION ALL SELECT * FROM vista_auditoria_categorias
UNION ALL SELECT * FROM vista_auditoria_usuarios
ORDER BY fecha DESC;

-- =============================================
-- FASE 6 — DATOS COMPLETOS Y AUDITORÍA RELLENADA
-- Requiere haber ejecutado el backend una vez (crea la columna registrado_por),
-- o el bloque de abajo la crea si falta. Usa subconsultas para que los IDs siempre coincidan.
-- =============================================
USE tienda_db;

-- ── Asegura la columna registrado_por (solo la agrega si no existe) ──
DROP PROCEDURE IF EXISTS add_reg_por;
DELIMITER //
CREATE PROCEDURE add_reg_por()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='tienda_db' AND table_name='usuarios'    AND column_name='registrado_por') THEN ALTER TABLE usuarios    ADD COLUMN registrado_por VARCHAR(100); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='tienda_db' AND table_name='categorias'  AND column_name='registrado_por') THEN ALTER TABLE categorias  ADD COLUMN registrado_por VARCHAR(100); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='tienda_db' AND table_name='productos'   AND column_name='registrado_por') THEN ALTER TABLE productos   ADD COLUMN registrado_por VARCHAR(100); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='tienda_db' AND table_name='clientes'    AND column_name='registrado_por') THEN ALTER TABLE clientes    ADD COLUMN registrado_por VARCHAR(100); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='tienda_db' AND table_name='proveedores' AND column_name='registrado_por') THEN ALTER TABLE proveedores ADD COLUMN registrado_por VARCHAR(100); END IF;
END //
DELIMITER ;
CALL add_reg_por();
DROP PROCEDURE IF EXISTS add_reg_por;

-- ── Identidad de los usuarios iniciales ──
UPDATE usuarios SET registrado_por = 'Sistema'
WHERE email IN (
  'midanale12@gmail.com',
  'bacadany58@gmail.com',
  'aalessandro.baca57@gmail.com'
);

UPDATE usuarios SET registrado_por = 'Dany'
WHERE email IN (
  'alfredomq82@gmail.com',
  'franckyc2013@gmail.com',
  'Asp.asrp@gmail.com'
);

-- ── Rellena quién registró los datos que estaban vacíos ──
UPDATE usuarios    SET registrado_por = 'Sistema'    WHERE registrado_por IS NULL AND email = 'midanale12@gmail.com';
UPDATE usuarios    SET registrado_por = 'Dany' WHERE registrado_por IS NULL;
UPDATE categorias  SET registrado_por = 'Dany' WHERE registrado_por IS NULL;
UPDATE productos   SET registrado_por = 'Dany3' WHERE registrado_por IS NULL;
UPDATE clientes    SET registrado_por = 'Dany2' WHERE registrado_por IS NULL;
UPDATE proveedores SET registrado_por = 'Dany' WHERE registrado_por IS NULL;

-- ── Más clientes ──
INSERT INTO clientes (nombre, tipo_documento, numero_documento, telefono, email, registrado_por) VALUES
 ('Juan Ramírez',                'DNI', '41258963',    '987112233', 'juanr@gmail.com',          'Dany2'),
 ('Constructora Andina SAC',     'RUC', '20481239876', '01-456-7890','ventas@andina.com',        'Dany'),
 ('Rosa Huamán',                 'DNI', '09876543',    '981223344', 'rosah@hotmail.com',        'Dany2'),
 ('Ferretería El Tornillo EIRL', 'RUC', '20551122334', '986554433', 'contacto@eltornillo.com',  'Dany2'),
 ('Miguel Ángel Soto',           'DNI', '70154896',    '999888777', 'msoto@gmail.com',          'Dany2'),
 ('Distribuidora San Martín',    'RUC', '20669988771', '01-778-9900','compras@sanmartin.com',    'Dany');

-- ── Más proveedores ──
INSERT INTO proveedores (empresa, ruc, contacto, telefono, email, direccion, registrado_por) VALUES
 ('Aceros del Perú SAC',      '20334455667', 'Gloria Vega',  '01-222-3344', 'ventas@acerosperu.com',    'Av. Argentina 1200, Callao', 'Dany'),
 ('Pinturas Tricolor EIRL',   '20447788990', 'Raúl Díaz',    '01-333-4455', 'raul@tricolor.com',        'Jr. Puno 456, Lima',        'Dany3'),
 ('Electro Suministros SAC',  '20556677889', 'Nadia Flores', '01-444-5566', 'nadia@electrosum.com',     'Av. Wilson 789, Lima',      'Dany3'),
 ('Cemento Andino Distrib.',  '20667788991', 'Pablo Ruiz',   '01-555-6677', 'pablo@cementoandino.com',  'Panamericana Sur km 20',    'Dany');

-- ── Más productos ──
INSERT INTO productos (codigo, nombre, categoria_id, precio_compra, precio_venta, stock, stock_minimo, activo, registrado_por) VALUES
 ('PROD-030','Carretilla Buggy 90L',        (SELECT id FROM categorias WHERE nombre='Ferretería General' LIMIT 1),120.00,215.00, 8, 3,1,'Dany3'),
 ('PROD-031','Escalera Aluminio 7 pasos',   (SELECT id FROM categorias WHERE nombre='Ferretería General' LIMIT 1), 95.00,175.00,10, 3,1,'Dany3'),
 ('PROD-032','Pintura Látex Blanco 4L',     (SELECT id FROM categorias WHERE nombre='Ferretería General' LIMIT 1), 28.00, 52.00,40, 8,1,'Dany'),
 ('PROD-033','Rodillo de Pintura 9 pulg',   (SELECT id FROM categorias WHERE nombre='Ferretería General' LIMIT 1),  5.00, 11.00,60,15,1,'Dany'),
 ('PROD-034','Guantes de Seguridad',        (SELECT id FROM categorias WHERE nombre='Ferretería General' LIMIT 1),  3.50,  8.00,120,25,1,'Dany2');

-- ── VENTAS REALIZADAS (cabecera) ──
INSERT INTO ventas (numero_comprobante, cliente_id, usuario_id, subtotal, igv, total, tipo_pago, estado, created_at) VALUES
 ('B001-00100',(SELECT id FROM clientes WHERE nombre='Cliente General' LIMIT 1),      (SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'),  49.00,  8.82,  57.82,'Efectivo','Completada', NOW()),
 ('B001-00101',(SELECT id FROM clientes WHERE nombre='María García' LIMIT 1),         (SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'),     159.90, 28.78, 188.68,'Tarjeta','Completada', NOW()),
 ('B001-00102',(SELECT id FROM clientes WHERE nombre='Juan Ramírez' LIMIT 1),         (SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'), 102.50, 18.45, 120.95,'Efectivo','Completada', NOW() - INTERVAL 1 DAY),
 ('B001-00103',(SELECT id FROM clientes WHERE nombre='Rosa Huamán' LIMIT 1),          (SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'),      66.00, 11.88,  77.88,'Yape','Completada',    NOW() - INTERVAL 2 DAY),
 ('B001-00104',(SELECT id FROM clientes WHERE nombre='Cliente General' LIMIT 1),      (SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'),  63.50, 11.43,  74.93,'Efectivo','Completada', NOW() - INTERVAL 3 DAY),
 ('B001-00105',(SELECT id FROM clientes WHERE nombre='Empresa ABC SAC' LIMIT 1),      (SELECT id FROM usuarios WHERE email='midanale12@gmail.com'),    179.00, 32.22, 211.22,'Tarjeta','Completada',  NOW() - INTERVAL 4 DAY),
 ('B001-00106',(SELECT id FROM clientes WHERE nombre='Constructora Andina SAC' LIMIT 1),(SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'),70.00, 12.60,  82.60,'Efectivo','Completada', NOW() - INTERVAL 5 DAY),
 ('B001-00107',(SELECT id FROM clientes WHERE nombre='Cliente General' LIMIT 1),      (SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'),      84.00, 15.12,  99.12,'Efectivo','Completada', NOW() - INTERVAL 6 DAY),
 ('B001-00108',(SELECT id FROM clientes WHERE nombre='Miguel Ángel Soto' LIMIT 1),    (SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'), 229.00, 41.22, 270.22,'Tarjeta','Completada',  NOW()),
 ('B001-00109',(SELECT id FROM clientes WHERE nombre='Rosa Huamán' LIMIT 1),          (SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'),     148.00, 26.64, 174.64,'Efectivo','Completada', NOW() - INTERVAL 1 DAY),
 ('B001-00110',(SELECT id FROM clientes WHERE nombre='María García' LIMIT 1),         (SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'),  28.00,  5.04,  33.04,'Yape','Anulada',       NOW() - INTERVAL 2 DAY);

-- ── DETALLE DE CADA VENTA ──
INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00100'),(SELECT id FROM productos WHERE codigo='PROD-001' LIMIT 1),1, 35.00, 35.00),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00100'),(SELECT id FROM productos WHERE codigo='PROD-009' LIMIT 1),1, 14.00, 14.00),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00101'),(SELECT id FROM productos WHERE codigo='PROD-003' LIMIT 1),1,159.90,159.90),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00102'),(SELECT id FROM productos WHERE codigo='PROD-006' LIMIT 1),10, 9.00, 90.00),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00102'),(SELECT id FROM productos WHERE codigo='PROD-017' LIMIT 1),5,  2.50, 12.50),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00103'),(SELECT id FROM productos WHERE codigo='PROD-020' LIMIT 1),6, 11.00, 66.00),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00104'),(SELECT id FROM productos WHERE codigo='PROD-011' LIMIT 1),2, 19.00, 38.00),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00104'),(SELECT id FROM productos WHERE codigo='PROD-023' LIMIT 1),3,  8.50, 25.50),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00105'),(SELECT id FROM productos WHERE codigo='PROD-013' LIMIT 1),1,179.00,179.00),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00106'),(SELECT id FROM productos WHERE codigo='PROD-007' LIMIT 1),20, 3.50, 70.00),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00107'),(SELECT id FROM productos WHERE codigo='PROD-005' LIMIT 1),2, 24.00, 48.00),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00107'),(SELECT id FROM productos WHERE codigo='PROD-002' LIMIT 1),3, 12.00, 36.00),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00108'),(SELECT id FROM productos WHERE codigo='PROD-004' LIMIT 1),1,229.00,229.00),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00109'),(SELECT id FROM productos WHERE codigo='PROD-032' LIMIT 1),2, 52.00,104.00),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00109'),(SELECT id FROM productos WHERE codigo='PROD-033' LIMIT 1),4, 11.00, 44.00),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00110'),(SELECT id FROM productos WHERE codigo='PROD-023' LIMIT 1),2,  8.50, 17.00),
 ((SELECT id FROM ventas WHERE numero_comprobante='B001-00110'),(SELECT id FROM productos WHERE codigo='PROD-033' LIMIT 1),1, 11.00, 11.00);

-- ── COMPRAS (cabecera) ──
INSERT INTO compras (numero_orden, proveedor_id, usuario_id, subtotal, igv, total, tipo_pago, estado, fecha_esperada, observaciones, created_at) VALUES
 ('OC-00010',(SELECT id FROM proveedores WHERE empresa='Distribuidora Ferretera SAC' LIMIT 1),(SELECT id FROM usuarios WHERE email='midanale12@gmail.com'),  280.00, 50.40, 330.40,'Transferencia','Recibida', CURDATE()-INTERVAL 2 DAY,'Reposición de herramientas', NOW()-INTERVAL 4 DAY),
 ('OC-00011',(SELECT id FROM proveedores WHERE empresa='Aceros del Perú SAC' LIMIT 1),        (SELECT id FROM usuarios WHERE email='aalessandro.baca57@gmail.com'),425.00, 76.50, 501.50,'Credito','Pendiente',      CURDATE()+INTERVAL 5 DAY,'Pedido de taladros',        NOW()-INTERVAL 1 DAY),
 ('OC-00012',(SELECT id FROM proveedores WHERE empresa='Pinturas Tricolor EIRL' LIMIT 1),     (SELECT id FROM usuarios WHERE email='midanale12@gmail.com'),  590.00,106.20, 696.20,'Efectivo','Recibida',       CURDATE()-INTERVAL 1 DAY,'Compra de pinturas',        NOW()-INTERVAL 2 DAY);

INSERT INTO detalle_compra (compra_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
 ((SELECT id FROM compras WHERE numero_orden='OC-00010'),(SELECT id FROM productos WHERE codigo='PROD-001' LIMIT 1),10,18.00,180.00),
 ((SELECT id FROM compras WHERE numero_orden='OC-00010'),(SELECT id FROM productos WHERE codigo='PROD-002' LIMIT 1),20, 5.00,100.00),
 ((SELECT id FROM compras WHERE numero_orden='OC-00011'),(SELECT id FROM productos WHERE codigo='PROD-013' LIMIT 1), 5,85.00,425.00),
 ((SELECT id FROM compras WHERE numero_orden='OC-00012'),(SELECT id FROM productos WHERE codigo='PROD-032' LIMIT 1),15,28.00,420.00),
 ((SELECT id FROM compras WHERE numero_orden='OC-00012'),(SELECT id FROM productos WHERE codigo='PROD-033' LIMIT 1),34, 5.00,170.00);

-- ── DEVOLUCIONES (notas de crédito) + detalle ──
INSERT INTO devoluciones (numero_nota, venta_id, usuario_id, motivo, monto_reembolso, tipo_reembolso, created_at) VALUES
 ('NC-00010',(SELECT id FROM ventas WHERE numero_comprobante='B001-00100'),(SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'),'Producto defectuoso',       35.00,'Efectivo',   NOW()-INTERVAL 1 DAY),
 ('NC-00011',(SELECT id FROM ventas WHERE numero_comprobante='B001-00102'),(SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'),    'Cliente pidió menos cantidad',18.00,'NotaCredito',NOW()-INTERVAL 1 DAY),
 ('NC-00012',(SELECT id FROM ventas WHERE numero_comprobante='B001-00104'),(SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'),'Cambio de medida',           8.50,'Tarjeta',    NOW()-INTERVAL 2 DAY);

INSERT INTO detalle_devolucion (devolucion_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
 ((SELECT id FROM devoluciones WHERE numero_nota='NC-00010'),(SELECT id FROM productos WHERE codigo='PROD-001' LIMIT 1),1,35.00,35.00),
 ((SELECT id FROM devoluciones WHERE numero_nota='NC-00011'),(SELECT id FROM productos WHERE codigo='PROD-006' LIMIT 1),2, 9.00,18.00),
 ((SELECT id FROM devoluciones WHERE numero_nota='NC-00012'),(SELECT id FROM productos WHERE codigo='PROD-023' LIMIT 1),1, 8.50, 8.50);

-- ── CAJA (turnos cerrados) + movimientos ──
INSERT INTO caja (usuario_id, monto_inicial, monto_final, total_ventas, total_egresos, estado, observaciones, apertura, cierre) VALUES
 ((SELECT id FROM usuarios WHERE email='midanale12@gmail.com'),    200.00, 980.00, 850.00, 70.00,'Cerrada','Turno martes',  NOW()-INTERVAL 3 DAY,NOW()-INTERVAL 3 DAY + INTERVAL 10 HOUR),
 ((SELECT id FROM usuarios WHERE email='bacadany58@gmail.com'),    150.00, 620.00, 520.00, 50.00,'Cerrada','Turno jueves',  NOW()-INTERVAL 1 DAY,NOW()-INTERVAL 1 DAY + INTERVAL 10 HOUR);

INSERT INTO movimientos_caja (caja_id, tipo, monto, descripcion) VALUES
 ((SELECT id FROM caja WHERE observaciones='Turno martes' LIMIT 1),'Egreso',  50.00,'Compra de útiles de limpieza'),
 ((SELECT id FROM caja WHERE observaciones='Turno martes' LIMIT 1),'Egreso',  20.00,'Movilidad'),
 ((SELECT id FROM caja WHERE observaciones='Turno martes' LIMIT 1),'Ingreso',100.00,'Aporte de caja chica'),
 ((SELECT id FROM caja WHERE observaciones='Turno jueves' LIMIT 1),'Egreso',  50.00,'Pago de agua');

-- ── Algunos movimientos de inventario (para la pestaña Movimientos de Stock) ──
INSERT INTO inventario (producto_id, usuario_id, tipo, cantidad, stock_antes, stock_despues, motivo, created_at) VALUES
 ((SELECT id FROM productos WHERE codigo='PROD-006' LIMIT 1),(SELECT id FROM usuarios WHERE email='aalessandro.baca57@gmail.com'),'Ajuste', 5,100,105,'Conteo físico', NOW()-INTERVAL 2 DAY),
 ((SELECT id FROM productos WHERE codigo='PROD-013' LIMIT 1),(SELECT id FROM usuarios WHERE email='aalessandro.baca57@gmail.com'),'Entrada',5, 15, 20,'Compra OC-00011',NOW()-INTERVAL 1 DAY),
 ((SELECT id FROM productos WHERE codigo='PROD-032' LIMIT 1),(SELECT id FROM usuarios WHERE email='aalessandro.baca57@gmail.com'),'Entrada',15,25, 40,'Compra OC-00012',NOW()-INTERVAL 2 DAY);
