-- ============================================================
-- DEMO DATA SEED - Todo-List Pro
-- Ejecutar: "C:/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -d todolist_dev -h 127.0.0.1 -f seed-demo.sql
-- Re-ejecutable: limpia datos previos con prefijo cm_seed_
-- ============================================================

BEGIN;

-- ============================================================
-- LIMPIEZA
-- ============================================================
DELETE FROM comments WHERE id LIKE 'cm_seed_%';
DELETE FROM task_tags WHERE "taskId" LIKE 'cm_seed_%';
DELETE FROM task_assignments WHERE "taskId" LIKE 'cm_seed_%';
DELETE FROM recurrence_rules WHERE id LIKE 'cm_seed_%';
DELETE FROM tasks WHERE id LIKE 'cm_seed_%';
DELETE FROM task_lists WHERE id LIKE 'cm_seed_%';
DELETE FROM clients WHERE id LIKE 'cm_seed_%';
DELETE FROM categories WHERE id = 'cm_seed_cat_trabajo_daniel';

-- ============================================================
-- CATEGORÍA FALTANTE: "Trabajo" para Daniel
-- ============================================================
INSERT INTO categories (id, name, color, icon, "order", "userId", "createdAt", "updatedAt")
VALUES ('cm_seed_cat_trabajo_daniel', 'Trabajo', '#3b82f6', NULL, 10, 'cmlhm3y4q000yhyqwzltn8muq', NOW(), NOW())
ON CONFLICT ("userId", name) DO NOTHING;

-- ============================================================
-- CLIENTES (5)
-- ============================================================
INSERT INTO clients (id, name, color, "contactName", "contactEmail", "contactPhone", "createdAt", "updatedAt")
VALUES
  ('cm_seed_cli_01', 'Grupo Industrial Monterrey', '#10b981', 'Ing. Roberto Garza Treviño', 'rgarza@gimty.com.mx', '+52 81 8345 2100', NOW(), NOW()),
  ('cm_seed_cli_02', 'FarmaPronto México', '#3b82f6', 'Lic. María Elena Soto', 'mesoto@farmapronto.mx', '+52 55 5567 3400', NOW(), NOW()),
  ('cm_seed_cli_03', 'Logística Nacional del Bajío', '#f59e0b', 'C.P. Alejandro Mendoza', 'amendoza@lognalbajio.com.mx', '+52 477 712 8900', NOW(), NOW()),
  ('cm_seed_cli_04', 'Constructora del Sureste SA', '#ef4444', 'Arq. Patricia Vázquez', 'pvazquez@constrsureste.mx', '+52 999 926 1500', NOW(), NOW()),
  ('cm_seed_cli_05', 'Bufete Jurídico Reyes & Domínguez', '#8b5cf6', 'Lic. Fernando Reyes Acosta', 'freyes@bjrd.com.mx', '+52 33 3614 7800', NOW(), NOW());

-- ============================================================
-- LISTAS DE TAREAS (12) - Vinculadas a clientes
-- ============================================================
-- Daniel: cmlhm3y4q000yhyqwzltn8muq
-- Demo:   cmlfmg61x0000hyq433lpaxpn

INSERT INTO task_lists (id, name, description, color, "isPinned", "order", "userId", "clientId", "createdAt", "updatedAt")
VALUES
  -- GIM (Daniel, 3 listas)
  ('cm_seed_lst_01', 'GIM - Soporte TI',       'Tickets de soporte mensual',       '#10b981', true,  10, 'cmlhm3y4q000yhyqwzltn8muq', 'cm_seed_cli_01', NOW(), NOW()),
  ('cm_seed_lst_02', 'GIM - Desarrollo',        'Proyectos de desarrollo web',      '#059669', false, 11, 'cmlhm3y4q000yhyqwzltn8muq', 'cm_seed_cli_01', NOW(), NOW()),
  ('cm_seed_lst_03', 'GIM - Infraestructura',   'Mantenimiento de servidores',      '#047857', false, 12, 'cmlhm3y4q000yhyqwzltn8muq', 'cm_seed_cli_01', NOW(), NOW()),
  -- FPM (Daniel, 2 listas)
  ('cm_seed_lst_04', 'FPM - Soporte',           'Soporte mensual FarmaPronto',      '#3b82f6', true,  20, 'cmlhm3y4q000yhyqwzltn8muq', 'cm_seed_cli_02', NOW(), NOW()),
  ('cm_seed_lst_05', 'FPM - Sitio Web',         'Mantenimiento sitio web',          '#2563eb', false, 21, 'cmlhm3y4q000yhyqwzltn8muq', 'cm_seed_cli_02', NOW(), NOW()),
  -- LNB (Demo, 3 listas)
  ('cm_seed_lst_06', 'LNB - Soporte',           'Soporte técnico mensual',          '#f59e0b', true,  30, 'cmlfmg61x0000hyq433lpaxpn', 'cm_seed_cli_03', NOW(), NOW()),
  ('cm_seed_lst_07', 'LNB - ERP',               'Sistema ERP personalizado',        '#d97706', false, 31, 'cmlfmg61x0000hyq433lpaxpn', 'cm_seed_cli_03', NOW(), NOW()),
  ('cm_seed_lst_08', 'LNB - Redes',             'Infraestructura de red',           '#b45309', false, 32, 'cmlfmg61x0000hyq433lpaxpn', 'cm_seed_cli_03', NOW(), NOW()),
  -- CdS (Daniel, 2 listas)
  ('cm_seed_lst_09', 'CdS - Soporte',           'Soporte mensual constructora',     '#ef4444', true,  40, 'cmlhm3y4q000yhyqwzltn8muq', 'cm_seed_cli_04', NOW(), NOW()),
  ('cm_seed_lst_10', 'CdS - Sistemas',          'Sistema de costos y presupuestos', '#dc2626', false, 41, 'cmlhm3y4q000yhyqwzltn8muq', 'cm_seed_cli_04', NOW(), NOW()),
  -- BJRD (Demo, 2 listas)
  ('cm_seed_lst_11', 'BJRD - Soporte',          'Soporte técnico bufete',           '#8b5cf6', true,  50, 'cmlfmg61x0000hyq433lpaxpn', 'cm_seed_cli_05', NOW(), NOW()),
  ('cm_seed_lst_12', 'BJRD - Gestión Documental','Sistema de gestión de expedientes','#7c3aed', false, 51, 'cmlfmg61x0000hyq433lpaxpn', 'cm_seed_cli_05', NOW(), NOW());

-- ============================================================
-- TAREAS PRINCIPALES (45)
-- ============================================================
-- Abreviaciones: Daniel=DAN, Demo=DEM
-- catTraDan = categoría Trabajo de Daniel (via subquery)
-- catTraDem = categoría Trabajo de Demo (via subquery)

-- === GIM - 10 tareas (Daniel) ===

-- T01: Plantilla recurrente - Soporte
INSERT INTO tasks (id, title, description, status, "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_01', 'Revisión mensual de servidores - GIM',
  'Verificar estado de servidores, revisar logs, actualizar parches de seguridad y generar reporte mensual.',
  'PENDING', 1, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_01', 'HIGH', true, '2026-01-01 10:00:00', NOW());

-- T02: Plantilla recurrente - Respaldos
INSERT INTO tasks (id, title, description, status, "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_02', 'Respaldo completo de bases de datos - GIM',
  'Ejecutar respaldo completo de SQL Server y verificar integridad de los archivos .bak.',
  'PENDING', 2, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_01', 'HIGH', true, '2026-01-01 10:00:00', NOW());

-- T03: Plantilla recurrente - Antivirus
INSERT INTO tasks (id, title, description, status, "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_03', 'Actualización de antivirus en estaciones - GIM',
  'Verificar licencias vigentes y actualizar definiciones en 45 equipos.',
  'PENDING', 3, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_01', 'MEDIUM', true, '2026-01-01 10:00:00', NOW());

-- T04: Desarrollo portal (IN_PROGRESS, con subtareas)
INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_04', 'Desarrollar módulo de reportes para portal interno',
  'El cliente necesita un módulo de reportes con filtros por fecha, departamento y tipo de incidencia.',
  'IN_PROGRESS', '2026-02-20 18:00:00', 4, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_02', 'HIGH', false, '2026-02-03 09:00:00', NOW());

-- T05: VPN completada
INSERT INTO tasks (id, title, description, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_05', 'Configurar VPN site-to-site con sucursal Saltillo',
  'Implementar túnel IPSec entre las dos oficinas usando FortiGate.',
  'COMPLETED', '2026-02-10 18:00:00', '2026-02-08 16:30:00', 5, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_03', 'URGENT', false, '2026-01-28 09:00:00', NOW());

-- T06: Migración correo (OVERDUE, IN_PROGRESS)
INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_06', 'Migrar correo corporativo a Microsoft 365',
  'Migrar 120 buzones de Exchange On-Premises a Exchange Online. Incluye configuración de DNS y coexistencia.',
  'IN_PROGRESS', '2026-02-14 18:00:00', 6, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_03', 'URGENT', false, '2026-01-15 09:00:00', NOW());

-- T07: Capacitación futuro
INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_07', 'Capacitación de ciberseguridad para personal',
  'Preparar material y agenda de capacitación sobre phishing y buenas prácticas.',
  'PENDING', '2026-03-10 18:00:00', 7, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Captura' LIMIT 1),
  'cm_seed_lst_01', 'MEDIUM', false, '2026-02-10 09:00:00', NOW());

-- T08: Switch completado
INSERT INTO tasks (id, title, description, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_08', 'Reemplazar switch de piso 3 por modelo administrable',
  'Instalar HP Aruba 2530 y reconfigurar VLANs.',
  'COMPLETED', '2026-02-05 18:00:00', '2026-02-04 14:00:00', 8, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_03', 'MEDIUM', false, '2026-01-20 09:00:00', NOW());

-- T09: Cancelada
INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_09', 'Implementar sistema de control de acceso biométrico',
  'Cancelado por el cliente - decidieron usar tarjetas RFID en su lugar.',
  'CANCELLED', '2026-02-28 18:00:00', 9, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Petición de cliente' LIMIT 1),
  'cm_seed_lst_03', 'LOW', false, '2026-01-10 09:00:00', NOW());

-- T10: Pendiente esta semana
INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_10', 'Configurar nueva impresora multifuncional en recepción',
  'Instalar drivers, configurar escaneo a correo y carpeta compartida.',
  'PENDING', '2026-02-19 18:00:00', 10, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_01', 'LOW', false, '2026-02-14 09:00:00', NOW());

-- === FPM - 9 tareas (Daniel) ===

INSERT INTO tasks (id, title, description, status, "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_11', 'Soporte técnico mensual - FarmaPronto',
  'Atender tickets de soporte, revisión de equipos punto de venta y actualización de software.',
  'PENDING', 1, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_04', 'MEDIUM', true, '2026-01-01 10:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_12', 'Respaldo de sistema de inventario - FarmaPronto',
  'Respaldo de base de datos MySQL del sistema de inventario y punto de venta.',
  'PENDING', 2, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_04', 'HIGH', true, '2026-01-01 10:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_13', 'Mantenimiento mensual sitio web - FarmaPronto',
  'Actualizar WordPress, plugins, verificar certificado SSL y revisar formularios de contacto.',
  'PENDING', 3, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Revisión' LIMIT 1),
  'cm_seed_lst_05', 'MEDIUM', true, '2026-01-01 10:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_14', 'Agregar catálogo de productos al sitio web',
  'Desarrollar sección de catálogo con filtros por categoría farmacéutica y buscador.',
  'IN_PROGRESS', '2026-02-25 18:00:00', 4, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_05', 'HIGH', false, '2026-02-01 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_15', 'Actualizar software punto de venta a versión 4.2',
  'Actualización en las 3 sucursales, incluye migración de datos y pruebas.',
  'COMPLETED', '2026-02-07 18:00:00', '2026-02-06 17:00:00', 5, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_04', 'URGENT', false, '2026-01-25 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_16', 'Configurar correo corporativo para nueva sucursal',
  'Crear 8 cuentas de correo, configurar en equipos y capacitar al personal.',
  'PENDING', '2026-02-24 18:00:00', 6, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_04', 'MEDIUM', false, '2026-02-12 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_17', 'Renovar certificado SSL del sitio web',
  'Renovar certificado Let''s Encrypt y verificar configuración HTTPS.',
  'COMPLETED', '2026-01-31 18:00:00', '2026-01-30 11:00:00', 7, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Revisión' LIMIT 1),
  'cm_seed_lst_05', 'HIGH', false, '2026-01-20 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_18', 'Implementar sistema de videovigilancia IP',
  'Cancelado - el cliente contrató proveedor especializado en CCTV.',
  'CANCELLED', '2026-03-15 18:00:00', 8, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Petición de cliente' LIMIT 1),
  'cm_seed_lst_04', 'LOW', false, '2026-01-15 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_19', 'Configurar reglas de firewall para nueva sucursal',
  'Definir políticas de acceso para la sucursal Polanco. Requiere reunión con el gerente de TI.',
  'PENDING', '2026-02-12 18:00:00', 9, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_04', 'HIGH', false, '2026-02-01 09:00:00', NOW());

-- === LNB - 9 tareas (Demo) ===

INSERT INTO tasks (id, title, description, status, "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_20', 'Soporte mensual equipos de cómputo - LNB',
  'Revisión de 30 equipos, limpieza, actualizaciones de Windows y verificación de antivirus.',
  'PENDING', 1, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_06', 'MEDIUM', true, '2026-01-01 10:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_21', 'Mantenimiento mensual del ERP - LNB',
  'Optimización de consultas, limpieza de logs, verificación de integraciones con facturación electrónica.',
  'PENDING', 2, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_07', 'HIGH', true, '2026-01-01 10:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_22', 'Desarrollar módulo de rastreo de flotilla en ERP',
  'Integración con GPS de unidades para seguimiento en tiempo real desde el ERP.',
  'IN_PROGRESS', '2026-02-28 18:00:00', 3, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_07', 'HIGH', false, '2026-02-01 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_23', 'Extender cobertura WiFi en almacén principal',
  'Instalar 4 access points Ubiquiti en almacén de 2,000 m2.',
  'COMPLETED', '2026-02-10 18:00:00', '2026-02-09 15:00:00', 4, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_08', 'MEDIUM', false, '2026-01-28 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_24', 'Implementar respaldo en la nube con AWS S3',
  'Configurar política de retención y script de respaldo automático nocturno.',
  'PENDING', '2026-02-26 18:00:00', 5, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_08', 'MEDIUM', false, '2026-02-10 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_25', 'Actualizar módulo de facturación electrónica CFDI 4.0',
  'El SAT actualizó requerimientos. Urgente para evitar multas al cliente.',
  'IN_PROGRESS', '2026-02-13 18:00:00', 6, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_07', 'URGENT', false, '2026-01-20 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_26', 'Capacitación de nuevo módulo ERP a usuarios',
  'Preparar manual de usuario y sesión de capacitación para 15 operadores.',
  'PENDING', '2026-03-05 18:00:00', 7, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_07', 'LOW', false, '2026-02-15 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_27', 'Segmentar red con VLANs por departamento',
  'Configurar VLANs para Administración, Operaciones y Almacén en switch administrable.',
  'COMPLETED', '2026-02-03 18:00:00', '2026-02-02 16:00:00', 8, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_08', 'MEDIUM', false, '2026-01-15 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_28', 'Migrar ERP a infraestructura en la nube',
  'Pospuesto indefinidamente - el cliente prefiere mantener on-premises por ahora.',
  'CANCELLED', '2026-03-30 18:00:00', 9, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_07', 'NONE', false, '2026-01-10 09:00:00', NOW());

-- === CdS - 8 tareas (Daniel) ===

INSERT INTO tasks (id, title, description, status, "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_29', 'Soporte mensual de equipos - Constructora',
  'Revisión de laptops de obra, tablets de supervisores y equipos de oficina central.',
  'PENDING', 1, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_09', 'MEDIUM', true, '2026-01-01 10:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_30', 'Respaldo de planos y proyectos AutoCAD - CdS',
  'Respaldar carpeta de proyectos activos (~500 GB) en servidor NAS y copia offsite.',
  'PENDING', 2, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_09', 'HIGH', true, '2026-01-01 10:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_31', 'Desarrollar sistema de control de costos de obra',
  'Aplicación web para que los residentes de obra capturen gastos diarios por partida.',
  'IN_PROGRESS', '2026-03-15 18:00:00', 3, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_10', 'HIGH', false, '2026-01-20 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_32', 'Configurar VPN para acceso remoto desde obras',
  'Implementar OpenVPN para que supervisores accedan al sistema de costos desde campo.',
  'COMPLETED', '2026-02-07 18:00:00', '2026-02-05 10:00:00', 4, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_09', 'MEDIUM', false, '2026-01-25 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_33', 'Renovar licencias de AutoCAD y Revit',
  'Gestionar renovación de 10 licencias con Autodesk. Verificar descuento corporativo.',
  'PENDING', '2026-02-18 18:00:00', 5, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_09', 'URGENT', false, '2026-02-10 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_34', 'Instalar servidor de archivos para oficina central',
  'Servidor Dell PowerEdge con RAID 5 para compartir planos y documentos.',
  'PENDING', '2026-02-27 18:00:00', 6, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_09', 'LOW', false, '2026-02-08 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_35', 'Migrar correo a Google Workspace',
  'Migración de 25 cuentas de GoDaddy a Google Workspace Business Standard.',
  'COMPLETED', '2026-01-31 18:00:00', '2026-01-28 14:00:00', 7, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_09', 'MEDIUM', false, '2026-01-10 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_36', 'Desarrollar app móvil de reportes de avance de obra',
  'App React Native para que supervisores tomen fotos y reporten avance diario.',
  'IN_PROGRESS', '2026-03-30 18:00:00', 8, 'cmlhm3y4q000yhyqwzltn8muq',
  (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_10', 'MEDIUM', false, '2026-02-01 09:00:00', NOW());

-- === BJRD - 9 tareas (Demo) ===

INSERT INTO tasks (id, title, description, status, "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_37', 'Soporte técnico mensual - Bufete RD',
  'Mantenimiento de equipos, revisión de impresoras, soporte a usuarios de sistema legal.',
  'PENDING', 1, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_11', 'MEDIUM', true, '2026-01-01 10:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_38', 'Respaldo mensual de expedientes digitales - Bufete',
  'Respaldo cifrado de la base de datos de expedientes y documentos escaneados.',
  'PENDING', 2, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_11', 'HIGH', true, '2026-01-01 10:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_39', 'Desarrollar sistema de gestión de expedientes',
  'Aplicación web para búsqueda, clasificación y seguimiento de casos legales.',
  'IN_PROGRESS', '2026-03-20 18:00:00', 3, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_12', 'HIGH', false, '2026-01-15 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_40', 'Configurar escáner de alto volumen con OCR',
  'Configurar Fujitsu fi-8170 con software de OCR para digitalización de expedientes.',
  'COMPLETED', '2026-02-05 18:00:00', '2026-02-04 11:00:00', 4, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_11', 'MEDIUM', false, '2026-01-22 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_41', 'Implementar política de contraseñas y 2FA',
  'Configurar Azure AD con autenticación multifactor para todos los abogados.',
  'PENDING', '2026-02-10 18:00:00', 5, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_11', 'HIGH', false, '2026-01-25 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_42', 'Instalar cableado estructurado en nueva oficina',
  'Tirar 24 nodos de red Cat6A en la nueva ala del bufete.',
  'PENDING', '2026-02-21 18:00:00', 6, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_11', 'MEDIUM', false, '2026-02-12 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_43', 'Configurar impresora de red con control de impresión',
  'Instalar sistema PaperCut para control de costos de impresión por abogado.',
  'COMPLETED', '2026-02-03 18:00:00', '2026-02-01 17:00:00', 7, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_11', 'LOW', false, '2026-01-20 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "dueDate", "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_44', 'Desarrollar portal de clientes del bufete',
  'Cancelado por cambio de prioridades - se retomará en Q2.',
  'CANCELLED', '2026-03-01 18:00:00', 8, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_12', 'LOW', false, '2026-01-10 09:00:00', NOW());

INSERT INTO tasks (id, title, description, status, "order", "userId", "categoryId", "listId", priority, "isRecurring", "createdAt", "updatedAt")
VALUES ('cm_seed_tsk_45', 'Documentar procedimientos de TI del bufete',
  'Crear wiki interna con procedimientos de soporte y contactos de proveedores.',
  'PENDING', 9, 'cmlfmg61x0000hyq433lpaxpn',
  (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
  'cm_seed_lst_11', 'NONE', false, '2026-02-15 09:00:00', NOW());

-- ============================================================
-- SUBTAREAS (8)
-- ============================================================

-- Subtareas de T04: Portal de reportes GIM
INSERT INTO tasks (id, title, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "parentId", "isRecurring", "createdAt", "updatedAt")
VALUES
  ('cm_seed_sub_01', 'Diseñar esquema de base de datos para reportes', 'COMPLETED', '2026-02-15 18:00:00', '2026-02-14 10:00:00', 1,
   'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
   'cm_seed_lst_02', 'MEDIUM', 'cm_seed_tsk_04', false, '2026-02-03 09:00:00', NOW()),
  ('cm_seed_sub_02', 'Crear endpoints de API para consulta de reportes', 'IN_PROGRESS', '2026-02-18 18:00:00', NULL, 2,
   'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
   'cm_seed_lst_02', 'MEDIUM', 'cm_seed_tsk_04', false, '2026-02-03 09:00:00', NOW()),
  ('cm_seed_sub_03', 'Desarrollar interfaz de filtros y visualización', 'PENDING', '2026-02-20 18:00:00', NULL, 3,
   'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
   'cm_seed_lst_02', 'MEDIUM', 'cm_seed_tsk_04', false, '2026-02-03 09:00:00', NOW());

-- Subtareas de T31: Sistema de costos CdS
INSERT INTO tasks (id, title, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "parentId", "isRecurring", "createdAt", "updatedAt")
VALUES
  ('cm_seed_sub_04', 'Modelar base de datos de partidas y presupuestos', 'COMPLETED', '2026-02-10 18:00:00', '2026-02-08 16:00:00', 1,
   'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
   'cm_seed_lst_10', 'MEDIUM', 'cm_seed_tsk_31', false, '2026-01-20 09:00:00', NOW()),
  ('cm_seed_sub_05', 'Desarrollar API de captura de gastos', 'IN_PROGRESS', '2026-02-25 18:00:00', NULL, 2,
   'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
   'cm_seed_lst_10', 'MEDIUM', 'cm_seed_tsk_31', false, '2026-01-20 09:00:00', NOW()),
  ('cm_seed_sub_06', 'Diseñar interfaz de captura móvil', 'PENDING', '2026-03-01 18:00:00', NULL, 3,
   'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1),
   'cm_seed_lst_10', 'MEDIUM', 'cm_seed_tsk_31', false, '2026-01-20 09:00:00', NOW());

-- Subtareas de T39: Gestión expedientes BJRD
INSERT INTO tasks (id, title, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "parentId", "isRecurring", "createdAt", "updatedAt")
VALUES
  ('cm_seed_sub_07', 'Diseñar modelo de datos de expedientes', 'COMPLETED', '2026-02-01 18:00:00', '2026-01-30 15:00:00', 1,
   'cmlfmg61x0000hyq433lpaxpn', (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
   'cm_seed_lst_12', 'MEDIUM', 'cm_seed_tsk_39', false, '2026-01-15 09:00:00', NOW()),
  ('cm_seed_sub_08', 'Implementar motor de búsqueda de expedientes', 'IN_PROGRESS', '2026-02-28 18:00:00', NULL, 2,
   'cmlfmg61x0000hyq433lpaxpn', (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1),
   'cm_seed_lst_12', 'MEDIUM', 'cm_seed_tsk_39', false, '2026-01-15 09:00:00', NOW());

-- ============================================================
-- REGLAS DE RECURRENCIA (12)
-- ============================================================
INSERT INTO recurrence_rules (id, "taskId", frequency, "interval", "daysOfWeek", "dayOfMonth", "startDate", "isActive", "createdAt", "updatedAt")
VALUES
  ('cm_seed_rr_01', 'cm_seed_tsk_01', 'MONTHLY', 1, '{}', 1,  '2026-01-01', true, NOW(), NOW()),
  ('cm_seed_rr_02', 'cm_seed_tsk_02', 'MONTHLY', 1, '{}', 15, '2026-01-01', true, NOW(), NOW()),
  ('cm_seed_rr_03', 'cm_seed_tsk_03', 'MONTHLY', 1, '{}', 1,  '2026-01-01', true, NOW(), NOW()),
  ('cm_seed_rr_04', 'cm_seed_tsk_11', 'MONTHLY', 1, '{}', 1,  '2026-01-01', true, NOW(), NOW()),
  ('cm_seed_rr_05', 'cm_seed_tsk_12', 'MONTHLY', 1, '{}', 15, '2026-01-01', true, NOW(), NOW()),
  ('cm_seed_rr_06', 'cm_seed_tsk_13', 'MONTHLY', 1, '{}', 1,  '2026-01-01', true, NOW(), NOW()),
  ('cm_seed_rr_07', 'cm_seed_tsk_20', 'MONTHLY', 1, '{}', 1,  '2026-01-01', true, NOW(), NOW()),
  ('cm_seed_rr_08', 'cm_seed_tsk_21', 'MONTHLY', 1, '{}', 15, '2026-01-01', true, NOW(), NOW()),
  ('cm_seed_rr_09', 'cm_seed_tsk_29', 'MONTHLY', 1, '{}', 1,  '2026-01-01', true, NOW(), NOW()),
  ('cm_seed_rr_10', 'cm_seed_tsk_30', 'MONTHLY', 1, '{}', 15, '2026-01-01', true, NOW(), NOW()),
  ('cm_seed_rr_11', 'cm_seed_tsk_37', 'MONTHLY', 1, '{}', 1,  '2026-01-01', true, NOW(), NOW()),
  ('cm_seed_rr_12', 'cm_seed_tsk_38', 'MONTHLY', 1, '{}', 15, '2026-01-01', true, NOW(), NOW());

-- ============================================================
-- INSTANCIAS GENERADAS - Febrero 2026 (12)
-- ============================================================
INSERT INTO tasks (id, title, description, status, "dueDate", "completedAt", "order", "userId", "categoryId", "listId", priority, "generatedFromId", "isRecurring", "createdAt", "updatedAt")
VALUES
  -- GIM: 2/3 completadas
  ('cm_seed_gen_01', 'Revisión mensual de servidores - GIM',       'Verificar estado de servidores, revisar logs, actualizar parches.', 'COMPLETED', '2026-02-01 18:00:00', '2026-02-03 16:00:00', 0, 'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1), 'cm_seed_lst_01', 'HIGH', 'cm_seed_tsk_01', false, '2026-02-01 00:05:00', NOW()),
  ('cm_seed_gen_02', 'Respaldo completo de bases de datos - GIM',  'Ejecutar respaldo completo de SQL Server.', 'COMPLETED', '2026-02-15 18:00:00', '2026-02-15 14:00:00', 0, 'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1), 'cm_seed_lst_01', 'HIGH', 'cm_seed_tsk_02', false, '2026-02-01 00:05:00', NOW()),
  ('cm_seed_gen_03', 'Actualización de antivirus en estaciones - GIM', 'Verificar licencias y actualizar definiciones.', 'IN_PROGRESS', '2026-02-01 18:00:00', NULL, 0, 'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1), 'cm_seed_lst_01', 'MEDIUM', 'cm_seed_tsk_03', false, '2026-02-01 00:05:00', NOW()),
  -- FPM: 1/3 completadas
  ('cm_seed_gen_04', 'Soporte técnico mensual - FarmaPronto',      'Atender tickets, revisión de equipos POS.', 'IN_PROGRESS', '2026-02-01 18:00:00', NULL, 0, 'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1), 'cm_seed_lst_04', 'MEDIUM', 'cm_seed_tsk_11', false, '2026-02-01 00:05:00', NOW()),
  ('cm_seed_gen_05', 'Respaldo de sistema de inventario - FarmaPronto', 'Respaldo de base de datos MySQL.', 'COMPLETED', '2026-02-15 18:00:00', '2026-02-15 10:00:00', 0, 'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1), 'cm_seed_lst_04', 'HIGH', 'cm_seed_tsk_12', false, '2026-02-01 00:05:00', NOW()),
  ('cm_seed_gen_06', 'Mantenimiento mensual sitio web - FarmaPronto', 'Actualizar WordPress, plugins, SSL.', 'PENDING', '2026-02-01 18:00:00', NULL, 0, 'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Revisión' LIMIT 1), 'cm_seed_lst_05', 'MEDIUM', 'cm_seed_tsk_13', false, '2026-02-01 00:05:00', NOW()),
  -- LNB: 1/2 completadas
  ('cm_seed_gen_07', 'Soporte mensual equipos de cómputo - LNB',   'Revisión de 30 equipos.', 'COMPLETED', '2026-02-01 18:00:00', '2026-02-05 17:00:00', 0, 'cmlfmg61x0000hyq433lpaxpn', (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1), 'cm_seed_lst_06', 'MEDIUM', 'cm_seed_tsk_20', false, '2026-02-01 00:05:00', NOW()),
  ('cm_seed_gen_08', 'Mantenimiento mensual del ERP - LNB',        'Optimización de consultas y limpieza de logs.', 'PENDING', '2026-02-15 18:00:00', NULL, 0, 'cmlfmg61x0000hyq433lpaxpn', (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1), 'cm_seed_lst_07', 'HIGH', 'cm_seed_tsk_21', false, '2026-02-01 00:05:00', NOW()),
  -- CdS: 1/2 completadas
  ('cm_seed_gen_09', 'Soporte mensual de equipos - Constructora',  'Revisión de laptops y tablets.', 'PENDING', '2026-02-01 18:00:00', NULL, 0, 'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1), 'cm_seed_lst_09', 'MEDIUM', 'cm_seed_tsk_29', false, '2026-02-01 00:05:00', NOW()),
  ('cm_seed_gen_10', 'Respaldo de planos AutoCAD - CdS',           'Respaldar ~500 GB en NAS.', 'COMPLETED', '2026-02-15 18:00:00', '2026-02-14 16:00:00', 0, 'cmlhm3y4q000yhyqwzltn8muq', (SELECT id FROM categories WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Trabajo' LIMIT 1), 'cm_seed_lst_09', 'HIGH', 'cm_seed_tsk_30', false, '2026-02-01 00:05:00', NOW()),
  -- BJRD: 1/2 completadas
  ('cm_seed_gen_11', 'Soporte técnico mensual - Bufete RD',        'Mantenimiento de equipos e impresoras.', 'COMPLETED', '2026-02-01 18:00:00', '2026-02-04 12:00:00', 0, 'cmlfmg61x0000hyq433lpaxpn', (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1), 'cm_seed_lst_11', 'MEDIUM', 'cm_seed_tsk_37', false, '2026-02-01 00:05:00', NOW()),
  ('cm_seed_gen_12', 'Respaldo mensual expedientes - Bufete',      'Respaldo cifrado de expedientes.', 'PENDING', '2026-02-15 18:00:00', NULL, 0, 'cmlfmg61x0000hyq433lpaxpn', (SELECT id FROM categories WHERE "userId"='cmlfmg61x0000hyq433lpaxpn' AND name='Trabajo' LIMIT 1), 'cm_seed_lst_11', 'HIGH', 'cm_seed_tsk_38', false, '2026-02-01 00:05:00', NOW());

-- ============================================================
-- TASK TAGS (18) - Daniel's tags on relevant tasks
-- ============================================================
INSERT INTO task_tags ("taskId", "tagId") VALUES
  -- Gilberto = infra/redes
  ('cm_seed_tsk_05', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Gilberto')),
  ('cm_seed_tsk_06', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Gilberto')),
  ('cm_seed_tsk_08', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Gilberto')),
  ('cm_seed_tsk_32', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Gilberto')),
  -- Hector = desarrollo
  ('cm_seed_tsk_04', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Hector')),
  ('cm_seed_tsk_14', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Hector')),
  ('cm_seed_tsk_31', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Hector')),
  ('cm_seed_tsk_36', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Hector')),
  -- Oscar = soporte
  ('cm_seed_tsk_10', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Oscar')),
  ('cm_seed_tsk_15', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Oscar')),
  ('cm_seed_tsk_16', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Oscar')),
  ('cm_seed_tsk_33', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Oscar')),
  -- Joel = general
  ('cm_seed_tsk_07', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Joel')),
  ('cm_seed_tsk_17', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Joel')),
  ('cm_seed_tsk_35', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Joel')),
  -- Tags en instancias generadas
  ('cm_seed_gen_01', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Oscar')),
  ('cm_seed_gen_02', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Joel')),
  ('cm_seed_gen_03', (SELECT id FROM tags WHERE "userId"='cmlhm3y4q000yhyqwzltn8muq' AND name='Oscar'));

-- ============================================================
-- TASK ASSIGNMENTS (~45)
-- ============================================================
-- Daniel: cmlhm3y4q000yhyqwzltn8muq
-- Demo:   cmlfmg61x0000hyq433lpaxpn
-- Admin:  cmloompym000hhy40acli6fed
-- Normal: cmloon1b9000shy40hjsgdx3u

INSERT INTO task_assignments ("taskId", "userId") VALUES
  -- Plantillas recurrentes (para copiar a futuras instancias)
  ('cm_seed_tsk_01', 'cmlhm3y4q000yhyqwzltn8muq'), ('cm_seed_tsk_01', 'cmloon1b9000shy40hjsgdx3u'),
  ('cm_seed_tsk_02', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_tsk_03', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_tsk_11', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_tsk_12', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_tsk_13', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_tsk_20', 'cmlfmg61x0000hyq433lpaxpn'),
  ('cm_seed_tsk_21', 'cmlfmg61x0000hyq433lpaxpn'),
  ('cm_seed_tsk_29', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_tsk_30', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_tsk_37', 'cmlfmg61x0000hyq433lpaxpn'),
  ('cm_seed_tsk_38', 'cmlfmg61x0000hyq433lpaxpn'),
  -- Tareas regulares
  ('cm_seed_tsk_04', 'cmlhm3y4q000yhyqwzltn8muq'), ('cm_seed_tsk_04', 'cmloon1b9000shy40hjsgdx3u'),
  ('cm_seed_tsk_05', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_tsk_06', 'cmlhm3y4q000yhyqwzltn8muq'), ('cm_seed_tsk_06', 'cmloompym000hhy40acli6fed'),
  ('cm_seed_tsk_14', 'cmlhm3y4q000yhyqwzltn8muq'), ('cm_seed_tsk_14', 'cmloon1b9000shy40hjsgdx3u'),
  ('cm_seed_tsk_15', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_tsk_19', 'cmlhm3y4q000yhyqwzltn8muq'), ('cm_seed_tsk_19', 'cmloompym000hhy40acli6fed'),
  ('cm_seed_tsk_22', 'cmlfmg61x0000hyq433lpaxpn'), ('cm_seed_tsk_22', 'cmloon1b9000shy40hjsgdx3u'),
  ('cm_seed_tsk_25', 'cmlfmg61x0000hyq433lpaxpn'), ('cm_seed_tsk_25', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_tsk_31', 'cmlhm3y4q000yhyqwzltn8muq'), ('cm_seed_tsk_31', 'cmloon1b9000shy40hjsgdx3u'),
  ('cm_seed_tsk_36', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_tsk_39', 'cmlfmg61x0000hyq433lpaxpn'), ('cm_seed_tsk_39', 'cmloompym000hhy40acli6fed'),
  -- Instancias generadas
  ('cm_seed_gen_01', 'cmlhm3y4q000yhyqwzltn8muq'), ('cm_seed_gen_01', 'cmloon1b9000shy40hjsgdx3u'),
  ('cm_seed_gen_02', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_gen_03', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_gen_04', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_gen_05', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_gen_06', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_gen_07', 'cmlfmg61x0000hyq433lpaxpn'),
  ('cm_seed_gen_08', 'cmlfmg61x0000hyq433lpaxpn'),
  ('cm_seed_gen_09', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_gen_10', 'cmlhm3y4q000yhyqwzltn8muq'),
  ('cm_seed_gen_11', 'cmlfmg61x0000hyq433lpaxpn'),
  ('cm_seed_gen_12', 'cmlfmg61x0000hyq433lpaxpn');

-- ============================================================
-- COMENTARIOS (10)
-- ============================================================
INSERT INTO comments (id, content, "taskId", "userId", "createdAt", "updatedAt") VALUES
  ('cm_seed_com_01', 'Ya se completó la migración de los primeros 60 buzones. Falta la segunda fase con los 60 restantes.',
   'cm_seed_tsk_06', 'cmlhm3y4q000yhyqwzltn8muq', '2026-02-10 14:30:00', '2026-02-10 14:30:00'),
  ('cm_seed_com_02', 'El cliente reporta que algunos usuarios no pueden acceder al correo. Revisando configuración de Autodiscover.',
   'cm_seed_tsk_06', 'cmloompym000hhy40acli6fed', '2026-02-12 09:15:00', '2026-02-12 09:15:00'),
  ('cm_seed_com_03', 'El diseño de la interfaz fue aprobado por el cliente. Se procede con el desarrollo del backend.',
   'cm_seed_tsk_04', 'cmlhm3y4q000yhyqwzltn8muq', '2026-02-08 11:00:00', '2026-02-08 11:00:00'),
  ('cm_seed_com_04', 'Primer prototipo del catálogo listo para revisión. Se necesita retroalimentación del área de marketing.',
   'cm_seed_tsk_14', 'cmlhm3y4q000yhyqwzltn8muq', '2026-02-14 16:00:00', '2026-02-14 16:00:00'),
  ('cm_seed_com_05', 'Urgente: la fecha límite del SAT para el nuevo esquema CFDI 4.0 es el 1 de marzo. Priorizar esta tarea.',
   'cm_seed_tsk_25', 'cmlfmg61x0000hyq433lpaxpn', '2026-02-11 08:00:00', '2026-02-11 08:00:00'),
  ('cm_seed_com_06', 'Se completó la actualización del catálogo de productos y servicios del SAT. Falta la validación de sello digital.',
   'cm_seed_tsk_25', 'cmloon1b9000shy40hjsgdx3u', '2026-02-13 15:30:00', '2026-02-13 15:30:00'),
  ('cm_seed_com_07', 'Reunión con el arquitecto mañana a las 10:00 para validar las partidas del catálogo de costos.',
   'cm_seed_tsk_31', 'cmlhm3y4q000yhyqwzltn8muq', '2026-02-16 18:00:00', '2026-02-16 18:00:00'),
  ('cm_seed_com_08', 'El bufete necesita que el sistema genere folios consecutivos por tipo de expediente. Agregar al backlog.',
   'cm_seed_tsk_39', 'cmlfmg61x0000hyq433lpaxpn', '2026-02-12 10:00:00', '2026-02-12 10:00:00'),
  ('cm_seed_com_09', 'VPN configurada y funcionando. Velocidad de túnel: 85 Mbps. El cliente quedó satisfecho.',
   'cm_seed_tsk_05', 'cmlhm3y4q000yhyqwzltn8muq', '2026-02-08 17:00:00', '2026-02-08 17:00:00'),
  ('cm_seed_com_10', 'La integración con el GPS Calamp funciona correctamente en pruebas. Falta integrar Queclink.',
   'cm_seed_tsk_22', 'cmlfmg61x0000hyq433lpaxpn', '2026-02-15 13:00:00', '2026-02-15 13:00:00');

COMMIT;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT 'Clientes' as entidad, count(*)::text as total FROM clients WHERE id LIKE 'cm_seed_%'
UNION ALL SELECT 'Listas', count(*)::text FROM task_lists WHERE id LIKE 'cm_seed_%'
UNION ALL SELECT 'Tareas', count(*)::text FROM tasks WHERE id LIKE 'cm_seed_%'
UNION ALL SELECT 'Recurrencia', count(*)::text FROM recurrence_rules WHERE id LIKE 'cm_seed_%'
UNION ALL SELECT 'Tags', count(*)::text FROM task_tags WHERE "taskId" LIKE 'cm_seed_%'
UNION ALL SELECT 'Asignaciones', count(*)::text FROM task_assignments WHERE "taskId" LIKE 'cm_seed_%'
UNION ALL SELECT 'Comentarios', count(*)::text FROM comments WHERE id LIKE 'cm_seed_%';
