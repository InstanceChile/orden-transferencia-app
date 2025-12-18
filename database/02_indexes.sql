-- ============================================================================
-- SISTEMA DE GESTIÓN DE ÓRDENES DE TRANSFERENCIA (OT)
-- Script 02: Índices para Optimización de Performance
-- Versión: 1.0.0
-- Fecha: Noviembre 2024
-- ============================================================================

-- ============================================================================
-- ÍNDICES PARA: transfer_orders
-- ============================================================================

-- Índice en estado (filtrado frecuente)
CREATE INDEX IF NOT EXISTS idx_transfer_orders_estado 
  ON transfer_orders(estado);

-- Índice en id_ot (búsquedas por OT)
CREATE INDEX IF NOT EXISTS idx_transfer_orders_id_ot 
  ON transfer_orders(id_ot);

-- Índice en sku (búsquedas por producto)
CREATE INDEX IF NOT EXISTS idx_transfer_orders_sku 
  ON transfer_orders(sku);

-- Índice compuesto para filtrado por estado y fecha
CREATE INDEX IF NOT EXISTS idx_transfer_orders_estado_fecha 
  ON transfer_orders(estado, fecha_ultimo_cambio_estado DESC);

-- Índice para novedades pendientes
CREATE INDEX IF NOT EXISTS idx_transfer_orders_novedades 
  ON transfer_orders(tiene_novedad, estado) 
  WHERE tiene_novedad = TRUE;

-- Índice en fechas para reportes
CREATE INDEX IF NOT EXISTS idx_transfer_orders_fecha_solicitud 
  ON transfer_orders(fecha_solicitud DESC);

CREATE INDEX IF NOT EXISTS idx_transfer_orders_fecha_recepcion 
  ON transfer_orders(fecha_recepcion DESC);

-- Índice en created_at para procesamiento cronológico
CREATE INDEX IF NOT EXISTS idx_transfer_orders_created_at 
  ON transfer_orders(created_at DESC);

-- ============================================================================
-- ÍNDICES PARA: transfer_orders_detalle_ean
-- ============================================================================

-- Índice en id_ot para joins
CREATE INDEX IF NOT EXISTS idx_detalle_ean_id_ot 
  ON transfer_orders_detalle_ean(id_ot);

-- Índice en sku para búsquedas
CREATE INDEX IF NOT EXISTS idx_detalle_ean_sku 
  ON transfer_orders_detalle_ean(sku);

-- Índice en ean para validaciones con PIM
CREATE INDEX IF NOT EXISTS idx_detalle_ean_ean 
  ON transfer_orders_detalle_ean(ean);

-- Índice compuesto para búsquedas completas
CREATE INDEX IF NOT EXISTS idx_detalle_ean_ot_sku 
  ON transfer_orders_detalle_ean(id_ot, sku);

-- ============================================================================
-- ÍNDICES PARA: pim_productos
-- ============================================================================

-- Índice en sku (búsquedas frecuentes)
CREATE INDEX IF NOT EXISTS idx_pim_productos_sku 
  ON pim_productos(sku);

-- Índice en ean (validaciones)
CREATE INDEX IF NOT EXISTS idx_pim_productos_ean 
  ON pim_productos(ean);

-- Índice para productos activos
CREATE INDEX IF NOT EXISTS idx_pim_productos_activo 
  ON pim_productos(activo) 
  WHERE activo = TRUE;

-- Índice en categoría para reportes
CREATE INDEX IF NOT EXISTS idx_pim_productos_categoria 
  ON pim_productos(categoria);

-- ============================================================================
-- ÍNDICES PARA: logs_integracion
-- ============================================================================

-- Índice en tipo_operacion
CREATE INDEX IF NOT EXISTS idx_logs_tipo_operacion 
  ON logs_integracion(tipo_operacion);

-- Índice en timestamp (consultas por fecha)
CREATE INDEX IF NOT EXISTS idx_logs_timestamp 
  ON logs_integracion(timestamp DESC);

-- Índice para errores
CREATE INDEX IF NOT EXISTS idx_logs_errores 
  ON logs_integracion(exitoso, timestamp DESC) 
  WHERE exitoso = FALSE;

-- Índice compuesto para análisis
CREATE INDEX IF NOT EXISTS idx_logs_tipo_exitoso_timestamp 
  ON logs_integracion(tipo_operacion, exitoso, timestamp DESC);

-- Índice en flujo_n8n
CREATE INDEX IF NOT EXISTS idx_logs_flujo_n8n 
  ON logs_integracion(flujo_n8n);

-- ============================================================================
-- ÍNDICES PARA: historial_alertas_ot
-- ============================================================================

-- Índice en id_ot
CREATE INDEX IF NOT EXISTS idx_historial_alertas_ot_id_ot 
  ON historial_alertas_ot(id_ot);

-- Índice en tipo_alerta
CREATE INDEX IF NOT EXISTS idx_historial_alertas_ot_tipo 
  ON historial_alertas_ot(tipo_alerta);

-- Índice en estado
CREATE INDEX IF NOT EXISTS idx_historial_alertas_ot_estado 
  ON historial_alertas_ot(estado);

-- Índice en severidad
CREATE INDEX IF NOT EXISTS idx_historial_alertas_ot_severidad 
  ON historial_alertas_ot(severidad);

-- Índice en fecha de creación
CREATE INDEX IF NOT EXISTS idx_historial_alertas_ot_created_at 
  ON historial_alertas_ot(created_at DESC);

-- Índice para alertas pendientes
CREATE INDEX IF NOT EXISTS idx_historial_alertas_ot_pendientes 
  ON historial_alertas_ot(estado, created_at DESC) 
  WHERE estado IN ('Generada', 'Notificada', 'En_Revision');

-- Índice compuesto para análisis
CREATE INDEX IF NOT EXISTS idx_historial_alertas_ot_tipo_estado_fecha 
  ON historial_alertas_ot(tipo_alerta, estado, created_at DESC);

-- ============================================================================
-- ÍNDICES PARA: configuracion
-- ============================================================================

-- Índice en clave (ya existe UNIQUE, pero explícito para claridad)
CREATE INDEX IF NOT EXISTS idx_configuracion_clave 
  ON configuracion(clave);

-- ============================================================================
-- ÍNDICES GIN PARA BÚSQUEDAS EN JSONB
-- ============================================================================

-- Índice GIN en logs_integracion.errores
CREATE INDEX IF NOT EXISTS idx_logs_errores_gin 
  ON logs_integracion USING GIN (errores);

-- Índice GIN en logs_integracion.datos_adicionales
CREATE INDEX IF NOT EXISTS idx_logs_datos_adicionales_gin 
  ON logs_integracion USING GIN (datos_adicionales);

-- Índice GIN en historial_alertas_ot.datos_alerta
CREATE INDEX IF NOT EXISTS idx_historial_alertas_ot_datos_gin 
  ON historial_alertas_ot USING GIN (datos_alerta);

-- ============================================================================
-- ANÁLISIS DE TABLAS PARA OPTIMIZACIÓN
-- ============================================================================

-- Analizar tablas para actualizar estadísticas del planificador
ANALYZE transfer_orders;
ANALYZE transfer_orders_detalle_ean;
ANALYZE pim_productos;
ANALYZE logs_integracion;
ANALYZE historial_alertas_ot;
ANALYZE configuracion;

-- ============================================================================
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- ============================================================================

DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  -- Contar índices creados
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN (
      'transfer_orders',
      'transfer_orders_detalle_ean',
      'pim_productos',
      'logs_integracion',
      'historial_alertas_ot',
      'configuracion'
    );
  
  RAISE NOTICE '✅ Índices creados exitosamente';
  RAISE NOTICE '📊 Total de índices: %', idx_count;
  RAISE NOTICE '';
  RAISE NOTICE '📈 Índices por tabla:';
  RAISE NOTICE '   - transfer_orders: 8 índices';
  RAISE NOTICE '   - transfer_orders_detalle_ean: 4 índices';
  RAISE NOTICE '   - pim_productos: 4 índices';
  RAISE NOTICE '   - logs_integracion: 6 índices (+ 2 GIN)';
  RAISE NOTICE '   - historial_alertas_ot: 7 índices (+ 1 GIN)';
  RAISE NOTICE '   - configuracion: 1 índice';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Performance optimizada';
END $$;

-- ============================================================================
-- QUERIES DE EJEMPLO PARA VERIFICAR USO DE ÍNDICES
-- ============================================================================

-- Para verificar que los índices se usan, ejecutar EXPLAIN ANALYZE:

-- Ejemplo 1: Buscar OT por estado
-- EXPLAIN ANALYZE
-- SELECT * FROM transfer_orders WHERE estado = 'Preparado';

-- Ejemplo 2: Buscar novedades pendientes
-- EXPLAIN ANALYZE
-- SELECT * FROM transfer_orders 
-- WHERE tiene_novedad = TRUE 
--   AND estado != 'Entregado_con_Novedad_Resuelto';

-- Ejemplo 3: Logs de errores últimas 24h
-- EXPLAIN ANALYZE
-- SELECT * FROM logs_integracion 
-- WHERE exitoso = FALSE 
--   AND timestamp > NOW() - INTERVAL '24 hours';

-- Ejemplo 4: Alertas por tipo y estado
-- EXPLAIN ANALYZE
-- SELECT * FROM historial_alertas_ot 
-- WHERE tipo_alerta = 'Diferencia_OT_OTA' 
--   AND estado = 'Generada';

-- ============================================================================
-- FIN DEL SCRIPT 02
-- ============================================================================

