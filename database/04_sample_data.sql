-- ============================================================================
-- SISTEMA DE GESTIÓN DE ÓRDENES DE TRANSFERENCIA (OT)
-- Script 04: Datos de Prueba (Sample Data)
-- Versión: 1.0.0
-- Fecha: Noviembre 2024
-- ============================================================================

-- ⚠️ ADVERTENCIA: Este script es solo para ambientes de desarrollo/testing
-- NO ejecutar en producción

-- ============================================================================
-- 1. LIMPIAR DATOS EXISTENTES (solo para testing)
-- ============================================================================

-- Descomentar solo si quieres limpiar todo:
-- TRUNCATE TABLE transfer_orders_detalle_ean CASCADE;
-- TRUNCATE TABLE transfer_orders CASCADE;
-- TRUNCATE TABLE pim_productos CASCADE;
-- TRUNCATE TABLE logs_integracion CASCADE;
-- TRUNCATE TABLE historial_alertas CASCADE;

-- ============================================================================
-- 2. DATOS DE PRUEBA: pim_productos
-- ============================================================================

INSERT INTO pim_productos (sku, ean, nombre_producto, descripcion, categoria, marca, activo) VALUES
  ('SKU001', '7891234567890', 'Producto A', 'Descripción del producto A', 'Electrónica', 'Marca X', TRUE),
  ('SKU001', '7891234567891', 'Producto A - Variante', 'Variante del producto A', 'Electrónica', 'Marca X', TRUE),
  ('SKU002', '7891234567892', 'Producto B', 'Descripción del producto B', 'Hogar', 'Marca Y', TRUE),
  ('SKU003', '7891234567893', 'Producto C', 'Descripción del producto C', 'Deportes', 'Marca Z', TRUE),
  ('SKU004', '7891234567894', 'Producto D', 'Descripción del producto D', 'Electrónica', 'Marca X', TRUE),
  ('SKU005', '7891234567895', 'Producto E', 'Descripción del producto E', 'Hogar', 'Marca Y', TRUE),
  ('SKU006', '7891234567896', 'Producto F', 'Descripción del producto F', 'Deportes', 'Marca Z', TRUE),
  ('SKU007', '7891234567897', 'Producto G', 'Descripción del producto G', 'Electrónica', 'Marca X', TRUE),
  ('SKU008', '7891234567898', 'Producto H', 'Descripción del producto H', 'Hogar', 'Marca Y', TRUE),
  ('SKU009', '7891234567899', 'Producto I', 'Descripción del producto I', 'Deportes', 'Marca Z', TRUE),
  ('SKU010', '7891234567800', 'Producto J', 'Descripción del producto J', 'Electrónica', 'Marca X', TRUE)
ON CONFLICT (sku, ean) DO NOTHING;

-- ============================================================================
-- 3. DATOS DE PRUEBA: transfer_orders
-- ============================================================================

-- Escenario 1: OT en estado Solicitado (recién creada)
INSERT INTO transfer_orders (
  id_ot, sku, mlc,
  fecha_solicitud, fecha_transferencia_comprometida,
  cantidad_solicitada,
  estado
) VALUES
  ('OT-2024-001', 'SKU001', 'MLC123456', 
   NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days',
   100,
   'Solicitado'),
  ('OT-2024-001', 'SKU002', 'MLC123457',
   NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days',
   50,
   'Solicitado')
ON CONFLICT (id_ot, sku) DO NOTHING;

-- Escenario 2: OT en estado Preparado (con diferencia menor al 2%)
INSERT INTO transfer_orders (
  id_ot, sku, mlc,
  fecha_solicitud, fecha_transferencia_comprometida, cantidad_solicitada,
  fecha_preparacion, cantidad_preparada,
  estado, porcentaje_diferencia_preparacion
) VALUES
  ('OT-2024-002', 'SKU003', 'MLC123458',
   NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days', 200,
   NOW() - INTERVAL '1 day', 199,
   'Preparado', 0.005)
ON CONFLICT (id_ot, sku) DO NOTHING;

-- Escenario 3: OT en estado Preparado (con diferencia mayor al 2% - ALERTA)
INSERT INTO transfer_orders (
  id_ot, sku, mlc,
  fecha_solicitud, fecha_transferencia_comprometida, cantidad_solicitada,
  fecha_preparacion, cantidad_preparada,
  estado, porcentaje_diferencia_preparacion, tiene_novedad, detalle_novedad
) VALUES
  ('OT-2024-003', 'SKU004', 'MLC123459',
   NOW() - INTERVAL '6 days', NOW() + INTERVAL '1 day', 150,
   NOW() - INTERVAL '1 day', 140,
   'Preparado', 0.067, TRUE, 'Diferencia de 10 unidades (6.7%) entre solicitado y preparado')
ON CONFLICT (id_ot, sku) DO NOTHING;

-- Escenario 4: OT en estado Preparacion_Validada
INSERT INTO transfer_orders (
  id_ot, sku, mlc,
  fecha_solicitud, fecha_transferencia_comprometida, cantidad_solicitada,
  fecha_preparacion, cantidad_preparada,
  estado, porcentaje_diferencia_preparacion
) VALUES
  ('OT-2024-004', 'SKU005', 'MLC123460',
   NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day', 300,
   NOW() - INTERVAL '2 days', 300,
   'Preparacion_Validada', 0.00),
  ('OT-2024-004', 'SKU006', 'MLC123461',
   NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day', 120,
   NOW() - INTERVAL '2 days', 121,
   'Preparacion_Validada', 0.008)
ON CONFLICT (id_ot, sku) DO NOTHING;

-- Escenario 5: OT en estado Entregado_Sin_Novedad
INSERT INTO transfer_orders (
  id_ot, sku, mlc,
  fecha_solicitud, fecha_transferencia_comprometida, cantidad_solicitada,
  fecha_preparacion, cantidad_preparada,
  fecha_recepcion, cantidad_recepcionada,
  estado, porcentaje_diferencia_preparacion, porcentaje_diferencia_recepcion
) VALUES
  ('OT-2024-005', 'SKU007', 'MLC123462',
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', 250,
   NOW() - INTERVAL '5 days', 250,
   NOW() - INTERVAL '2 days', 250,
   'Entregado_Sin_Novedad', 0.00, 0.00)
ON CONFLICT (id_ot, sku) DO NOTHING;

-- Escenario 6: OT en estado Entregado_con_Novedad (diferencia en recepción)
INSERT INTO transfer_orders (
  id_ot, sku, mlc,
  fecha_solicitud, fecha_transferencia_comprometida, cantidad_solicitada,
  fecha_preparacion, cantidad_preparada,
  fecha_recepcion, cantidad_recepcionada,
  estado, porcentaje_diferencia_preparacion, porcentaje_diferencia_recepcion,
  tiene_novedad, detalle_novedad
) VALUES
  ('OT-2024-006', 'SKU008', 'MLC123463',
   NOW() - INTERVAL '12 days', NOW() - INTERVAL '5 days', 180,
   NOW() - INTERVAL '7 days', 180,
   NOW() - INTERVAL '3 days', 165,
   'Entregado_con_Novedad', 0.00, 0.083, TRUE, 'Faltan 15 unidades en recepción (8.3%)'),
  ('OT-2024-006', 'SKU009', 'MLC123464',
   NOW() - INTERVAL '12 days', NOW() - INTERVAL '5 days', 90,
   NOW() - INTERVAL '7 days', 90,
   NOW() - INTERVAL '3 days', 95,
   'Entregado_con_Novedad', 0.00, 0.056, TRUE, 'Sobran 5 unidades en recepción (5.6%)')
ON CONFLICT (id_ot, sku) DO NOTHING;

-- Escenario 7: OT en estado Entregado_con_Novedad_Resuelto
INSERT INTO transfer_orders (
  id_ot, sku, mlc,
  fecha_solicitud, fecha_transferencia_comprometida, cantidad_solicitada,
  fecha_preparacion, cantidad_preparada,
  fecha_recepcion, cantidad_recepcionada,
  estado, porcentaje_diferencia_preparacion, porcentaje_diferencia_recepcion,
  tiene_novedad, detalle_novedad
) VALUES
  ('OT-2024-007', 'SKU010', 'MLC123465',
   NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days', 400,
   NOW() - INTERVAL '10 days', 400,
   NOW() - INTERVAL '6 days', 390,
   'Entregado_con_Novedad_Resuelto', 0.00, 0.025, FALSE, 'Novedad resuelta: 10 unidades dañadas en tránsito')
ON CONFLICT (id_ot, sku) DO NOTHING;

-- ============================================================================
-- 4. DATOS DE PRUEBA: transfer_orders_detalle_ean
-- ============================================================================

-- Detalle EAN para OT-2024-004 (SKU005)
INSERT INTO transfer_orders_detalle_ean (id_ot, sku, ean, cantidad_preparada_ean) VALUES
  ('OT-2024-004', 'SKU005', '7891234567895', 300)
ON CONFLICT (id_ot, sku, ean) DO NOTHING;

-- Detalle EAN para OT-2024-005 (SKU007)
INSERT INTO transfer_orders_detalle_ean (id_ot, sku, ean, cantidad_preparada_ean) VALUES
  ('OT-2024-005', 'SKU007', '7891234567897', 250)
ON CONFLICT (id_ot, sku, ean) DO NOTHING;

-- Detalle EAN para OT-2024-001 (SKU001) - con múltiples EAN
INSERT INTO transfer_orders_detalle_ean (id_ot, sku, ean, cantidad_preparada_ean) VALUES
  ('OT-2024-001', 'SKU001', '7891234567890', 60),
  ('OT-2024-001', 'SKU001', '7891234567891', 40)
ON CONFLICT (id_ot, sku, ean) DO NOTHING;

-- ============================================================================
-- 5. DATOS DE PRUEBA: historial_alertas_ot
-- ============================================================================

-- Alerta 1: Diferencia OT vs OTA
INSERT INTO historial_alertas_ot (
  id_ot, sku, tipo_alerta, severidad, estado,
  asunto, mensaje,
  datos_alerta,
  destinatarios,
  fecha_notificacion, notificacion_exitosa
) VALUES
  ('OT-2024-003', 'SKU004', 'Diferencia_OT_OTA', 'Media', 'Notificada',
   '🚨 [ALERTA OT] Diferencia en preparación vs solicitud – OT OT-2024-003',
   'Se detectó una diferencia del 6.7% entre la cantidad solicitada (150) y preparada (140) para el SKU004.',
   '{"cantidad_solicitada": 150, "cantidad_preparada": 140, "diferencia_porcentual": 6.7}'::jsonb,
   ARRAY['abastecimiento@empresa.com', 'operaciones@empresa.com'],
   NOW() - INTERVAL '1 day', TRUE);

-- Alerta 2: Diferencia OTA vs OTF
INSERT INTO historial_alertas_ot (
  id_ot, sku, tipo_alerta, severidad, estado,
  asunto, mensaje,
  datos_alerta,
  destinatarios,
  fecha_notificacion, notificacion_exitosa
) VALUES
  ('OT-2024-006', 'SKU008', 'Diferencia_OTA_OTF', 'Alta', 'En_Revision',
   '🚨 [ALERTA OTF] Descuadre recepción vs preparación – OT OT-2024-006',
   'Se detectó una diferencia del 8.3% entre la cantidad preparada (180) y recepcionada (165) para el SKU008. Faltan 15 unidades.',
   '{"cantidad_preparada": 180, "cantidad_recepcionada": 165, "diferencia_porcentual": 8.3, "tipo": "faltante"}'::jsonb,
   ARRAY['operaciones@empresa.com', 'full@empresa.com'],
   NOW() - INTERVAL '3 days', TRUE);

-- Alerta 3: Alerta resuelta
INSERT INTO historial_alertas_ot (
  id_ot, sku, tipo_alerta, severidad, estado,
  asunto, mensaje,
  datos_alerta,
  destinatarios,
  fecha_notificacion, notificacion_exitosa,
  fecha_resolucion, resuelto_por, notas_resolucion
) VALUES
  ('OT-2024-007', 'SKU010', 'Diferencia_OTA_OTF', 'Media', 'Resuelta',
   '🚨 [ALERTA OTF] Descuadre recepción vs preparación – OT OT-2024-007',
   'Se detectó una diferencia del 2.5% entre la cantidad preparada (400) y recepcionada (390) para el SKU010.',
   '{"cantidad_preparada": 400, "cantidad_recepcionada": 390, "diferencia_porcentual": 2.5}'::jsonb,
   ARRAY['operaciones@empresa.com', 'full@empresa.com'],
   NOW() - INTERVAL '6 days', TRUE,
   NOW() - INTERVAL '4 days', 'Juan Pérez', 'Revisado: 10 unidades dañadas en tránsito, ajuste aprobado');

-- ============================================================================
-- 6. DATOS DE PRUEBA: logs_integracion
-- ============================================================================

-- Log exitoso: Ingesta OT
INSERT INTO logs_integracion (
  tipo_operacion, flujo_n8n, exitoso,
  total_registros, registros_exitosos, registros_fallidos,
  mensaje, duracion_ms
) VALUES
  ('Ingesta_OT', 'Flujo_01_Ingesta_OT', TRUE,
   5, 5, 0,
   'Ingesta de OT completada exitosamente', 1250);

-- Log exitoso: Ingesta OTA
INSERT INTO logs_integracion (
  tipo_operacion, flujo_n8n, exitoso,
  total_registros, registros_exitosos, registros_fallidos,
  mensaje, duracion_ms
) VALUES
  ('Ingesta_OTA', 'Flujo_02_Ingesta_OTA', TRUE,
   3, 3, 0,
   'Ingesta de OTA completada exitosamente', 980);

-- Log con error: Validación OTADET vs PIM
INSERT INTO logs_integracion (
  tipo_operacion, flujo_n8n, exitoso,
  total_registros, registros_exitosos, registros_fallidos,
  mensaje, errores, duracion_ms
) VALUES
  ('Validacion_OTADET_PIM', 'Flujo_03_Ingesta_OTADET', FALSE,
   10, 8, 2,
   'Validación completada con errores',
   '{"errores": [{"ot": "OT-2024-008", "sku": "SKU011", "error": "EAN no encontrado en PIM"}]}'::jsonb,
   2100);

-- Log exitoso: Envío de alerta
INSERT INTO logs_integracion (
  tipo_operacion, flujo_n8n, exitoso,
  total_registros, registros_exitosos, registros_fallidos,
  mensaje, datos_adicionales, duracion_ms
) VALUES
  ('Envio_Alerta', 'Flujo_02_Ingesta_OTA', TRUE,
   1, 1, 0,
   'Alerta enviada exitosamente',
   '{"destinatarios": ["abastecimiento@empresa.com"], "tipo_alerta": "Diferencia_OT_OTA"}'::jsonb,
   450);

-- ============================================================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- ============================================================================

DO $$
DECLARE
  v_count_pim INTEGER;
  v_count_ot INTEGER;
  v_count_detalle INTEGER;
  v_count_alertas INTEGER;
  v_count_logs INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_pim FROM pim_productos;
  SELECT COUNT(*) INTO v_count_ot FROM transfer_orders;
  SELECT COUNT(*) INTO v_count_detalle FROM transfer_orders_detalle_ean;
  SELECT COUNT(*) INTO v_count_alertas FROM historial_alertas_ot;
  SELECT COUNT(*) INTO v_count_logs FROM logs_integracion;
  
  RAISE NOTICE '✅ Datos de prueba insertados exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumen de datos:';
  RAISE NOTICE '   - Productos PIM: % registros', v_count_pim;
  RAISE NOTICE '   - Órdenes de Transferencia: % registros', v_count_ot;
  RAISE NOTICE '   - Detalle EAN: % registros', v_count_detalle;
  RAISE NOTICE '   - Alertas: % registros', v_count_alertas;
  RAISE NOTICE '   - Logs: % registros', v_count_logs;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Escenarios de prueba disponibles:';
  RAISE NOTICE '   1. OT en estado Solicitado';
  RAISE NOTICE '   2. OT en estado Preparado (sin alertas)';
  RAISE NOTICE '   3. OT en estado Preparado (con alerta >2%%)';
  RAISE NOTICE '   4. OT en estado Preparacion_Validada';
  RAISE NOTICE '   5. OT en estado Entregado_Sin_Novedad';
  RAISE NOTICE '   6. OT en estado Entregado_con_Novedad';
  RAISE NOTICE '   7. OT en estado Entregado_con_Novedad_Resuelto';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Listo para pruebas';
END $$;

-- ============================================================================
-- QUERIES DE VERIFICACIÓN
-- ============================================================================

-- Ver todas las OT por estado
-- SELECT estado, COUNT(*) as total FROM transfer_orders GROUP BY estado ORDER BY estado;

-- Ver OT con novedades
-- SELECT id_ot, sku, estado, detalle_novedad FROM transfer_orders WHERE tiene_novedad = TRUE;

-- Ver alertas generadas
-- SELECT tipo_alerta, estado, COUNT(*) as total FROM historial_alertas_ot GROUP BY tipo_alerta, estado;

-- Ver logs de integración
-- SELECT tipo_operacion, exitoso, COUNT(*) as total FROM logs_integracion GROUP BY tipo_operacion, exitoso;

-- ============================================================================
-- FIN DEL SCRIPT 04
-- ============================================================================

