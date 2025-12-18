-- ============================================================================
-- SISTEMA DE GESTIÓN DE ÓRDENES DE TRANSFERENCIA (OT)
-- Script 03: Funciones y Stored Procedures
-- Versión: 1.0.0
-- Fecha: Noviembre 2024
-- ============================================================================

-- ============================================================================
-- 1. FUNCIÓN: upsert_transfer_order
-- Descripción: Inserta o actualiza una orden de transferencia
-- Uso: Desde n8n para operaciones idempotentes
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_transfer_order(
  p_id_ot TEXT,
  p_sku TEXT,
  p_mlc TEXT DEFAULT NULL,
  p_cliente TEXT DEFAULT NULL,
  p_fecha_solicitud TIMESTAMPTZ DEFAULT NULL,
  p_fecha_transferencia_comprometida TIMESTAMPTZ DEFAULT NULL,
  p_cantidad_solicitada NUMERIC DEFAULT NULL,
  p_fecha_preparacion TIMESTAMPTZ DEFAULT NULL,
  p_cantidad_preparada NUMERIC DEFAULT NULL,
  p_fecha_recepcion TIMESTAMPTZ DEFAULT NULL,
  p_cantidad_recepcionada NUMERIC DEFAULT NULL,
  p_estado TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  id_ot TEXT,
  sku TEXT,
  estado TEXT,
  operacion TEXT
) AS $$
DECLARE
  v_id BIGINT;
  v_estado_actual TEXT;
  v_estado_nuevo TEXT;
  v_operacion TEXT;
BEGIN
  -- Verificar si existe
  SELECT t.id, t.estado INTO v_id, v_estado_actual
  FROM transfer_orders t
  WHERE t.id_ot = p_id_ot AND t.sku = p_sku;
  
  -- Determinar estado nuevo
  v_estado_nuevo := COALESCE(p_estado, v_estado_actual, 'Solicitado');
  
  IF v_id IS NULL THEN
    -- INSERT
    INSERT INTO transfer_orders (
      id_ot, sku, mlc, cliente,
      fecha_solicitud, fecha_transferencia_comprometida, cantidad_solicitada,
      fecha_preparacion, cantidad_preparada,
      fecha_recepcion, cantidad_recepcionada,
      estado
    ) VALUES (
      p_id_ot, p_sku, p_mlc, p_cliente,
      p_fecha_solicitud, p_fecha_transferencia_comprometida, COALESCE(p_cantidad_solicitada, 0),
      p_fecha_preparacion, COALESCE(p_cantidad_preparada, 0),
      p_fecha_recepcion, COALESCE(p_cantidad_recepcionada, 0),
      v_estado_nuevo
    )
    RETURNING transfer_orders.id INTO v_id;
    
    v_operacion := 'INSERT';
  ELSE
    -- UPDATE (solo campos no nulos)
    UPDATE transfer_orders
    SET
      mlc = COALESCE(p_mlc, mlc),
      cliente = COALESCE(p_cliente, cliente),
      fecha_solicitud = COALESCE(p_fecha_solicitud, fecha_solicitud),
      fecha_transferencia_comprometida = COALESCE(p_fecha_transferencia_comprometida, fecha_transferencia_comprometida),
      cantidad_solicitada = COALESCE(p_cantidad_solicitada, cantidad_solicitada),
      fecha_preparacion = COALESCE(p_fecha_preparacion, fecha_preparacion),
      cantidad_preparada = COALESCE(p_cantidad_preparada, cantidad_preparada),
      fecha_recepcion = COALESCE(p_fecha_recepcion, fecha_recepcion),
      cantidad_recepcionada = COALESCE(p_cantidad_recepcionada, cantidad_recepcionada),
      estado = v_estado_nuevo,
      updated_at = NOW()
    WHERE transfer_orders.id = v_id;
    
    v_operacion := 'UPDATE';
  END IF;
  
  -- Retornar resultado
  RETURN QUERY
  SELECT v_id, p_id_ot, p_sku, v_estado_nuevo, v_operacion;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_transfer_order IS 'Inserta o actualiza una orden de transferencia de forma idempotente';

-- ============================================================================
-- 2. FUNCIÓN: validar_diferencia_ot_ota
-- Descripción: Valida diferencias entre OT y OTA
-- Retorna: Registros con diferencias superiores al umbral
-- ============================================================================

CREATE OR REPLACE FUNCTION validar_diferencia_ot_ota(
  p_umbral NUMERIC DEFAULT 0.02
)
RETURNS TABLE (
  id_ot TEXT,
  sku TEXT,
  cantidad_solicitada NUMERIC,
  cantidad_preparada NUMERIC,
  diferencia_absoluta NUMERIC,
  diferencia_relativa NUMERIC,
  supera_umbral BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id_ot,
    t.sku,
    t.cantidad_solicitada,
    t.cantidad_preparada,
    ABS(t.cantidad_preparada - t.cantidad_solicitada) AS diferencia_absoluta,
    CASE
      WHEN t.cantidad_solicitada = 0 THEN 0
      ELSE ABS(t.cantidad_preparada - t.cantidad_solicitada) / NULLIF(t.cantidad_solicitada, 0)
    END AS diferencia_relativa,
    CASE
      WHEN t.cantidad_solicitada = 0 THEN FALSE
      ELSE (ABS(t.cantidad_preparada - t.cantidad_solicitada) / NULLIF(t.cantidad_solicitada, 0)) > p_umbral
    END AS supera_umbral
  FROM transfer_orders t
  WHERE t.estado IN ('Preparado', 'Preparacion_Validada')
    AND t.cantidad_solicitada IS NOT NULL
    AND t.cantidad_preparada IS NOT NULL
    AND t.cantidad_preparada > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_diferencia_ot_ota IS 'Valida diferencias entre cantidades solicitadas y preparadas';

-- ============================================================================
-- 3. FUNCIÓN: validar_diferencia_ota_otf
-- Descripción: Valida diferencias entre OTA y OTF
-- Retorna: Registros con diferencias superiores al umbral
-- ============================================================================

CREATE OR REPLACE FUNCTION validar_diferencia_ota_otf(
  p_umbral NUMERIC DEFAULT 0.05
)
RETURNS TABLE (
  id_ot TEXT,
  sku TEXT,
  cantidad_preparada NUMERIC,
  cantidad_recepcionada NUMERIC,
  diferencia_absoluta NUMERIC,
  diferencia_relativa NUMERIC,
  supera_umbral BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id_ot,
    t.sku,
    t.cantidad_preparada,
    t.cantidad_recepcionada,
    ABS(t.cantidad_recepcionada - t.cantidad_preparada) AS diferencia_absoluta,
    CASE
      WHEN t.cantidad_preparada = 0 THEN 0
      ELSE ABS(t.cantidad_recepcionada - t.cantidad_preparada) / NULLIF(t.cantidad_preparada, 0)
    END AS diferencia_relativa,
    CASE
      WHEN t.cantidad_preparada = 0 THEN FALSE
      ELSE (ABS(t.cantidad_recepcionada - t.cantidad_preparada) / NULLIF(t.cantidad_preparada, 0)) > p_umbral
    END AS supera_umbral
  FROM transfer_orders t
  WHERE t.fecha_recepcion IS NOT NULL
    AND t.cantidad_preparada IS NOT NULL
    AND t.cantidad_recepcionada IS NOT NULL
    AND t.cantidad_recepcionada > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_diferencia_ota_otf IS 'Valida diferencias entre cantidades preparadas y recepcionadas';

-- ============================================================================
-- 4. FUNCIÓN: validar_ean_contra_pim
-- Descripción: Valida EAN de OTADET contra catálogo PIM
-- Retorna: EAN faltantes y sobrantes
-- ============================================================================

CREATE OR REPLACE FUNCTION validar_ean_contra_pim(
  p_id_ot TEXT,
  p_sku TEXT
)
RETURNS TABLE (
  sku TEXT,
  ean TEXT,
  tipo_inconsistencia TEXT,
  mensaje TEXT
) AS $$
BEGIN
  -- EAN en OTADET pero no en PIM (sobrantes)
  RETURN QUERY
  SELECT
    d.sku,
    d.ean,
    'EAN_SOBRANTE'::TEXT AS tipo_inconsistencia,
    'EAN presente en OTADET pero no en catálogo PIM'::TEXT AS mensaje
  FROM transfer_orders_detalle_ean d
  WHERE d.id_ot = p_id_ot
    AND d.sku = p_sku
    AND NOT EXISTS (
      SELECT 1 FROM pim_productos p
      WHERE p.sku = d.sku AND p.ean = d.ean AND p.activo = TRUE
    );
  
  -- EAN en PIM pero no en OTADET (faltantes)
  RETURN QUERY
  SELECT
    p.sku,
    p.ean,
    'EAN_FALTANTE'::TEXT AS tipo_inconsistencia,
    'EAN en catálogo PIM pero no registrado en OTADET'::TEXT AS mensaje
  FROM pim_productos p
  WHERE p.sku = p_sku
    AND p.activo = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM transfer_orders_detalle_ean d
      WHERE d.id_ot = p_id_ot AND d.sku = p.sku AND d.ean = p.ean
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_ean_contra_pim IS 'Valida consistencia de EAN entre OTADET y catálogo PIM';

-- ============================================================================
-- 5. FUNCIÓN: registrar_log_integracion
-- Descripción: Registra un log de integración
-- Uso: Llamar desde n8n al finalizar cada flujo
-- ============================================================================

CREATE OR REPLACE FUNCTION registrar_log_integracion(
  p_tipo_operacion TEXT,
  p_flujo_n8n TEXT DEFAULT NULL,
  p_exitoso BOOLEAN DEFAULT TRUE,
  p_total_registros INTEGER DEFAULT 0,
  p_registros_exitosos INTEGER DEFAULT 0,
  p_registros_fallidos INTEGER DEFAULT 0,
  p_mensaje TEXT DEFAULT NULL,
  p_errores JSONB DEFAULT NULL,
  p_datos_adicionales JSONB DEFAULT NULL,
  p_duracion_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO logs_integracion (
    tipo_operacion,
    flujo_n8n,
    exitoso,
    total_registros,
    registros_exitosos,
    registros_fallidos,
    mensaje,
    errores,
    datos_adicionales,
    duracion_ms
  ) VALUES (
    p_tipo_operacion,
    p_flujo_n8n,
    p_exitoso,
    p_total_registros,
    p_registros_exitosos,
    p_registros_fallidos,
    p_mensaje,
    p_errores,
    p_datos_adicionales,
    p_duracion_ms
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION registrar_log_integracion IS 'Registra un log de operación de integración';

-- ============================================================================
-- 6. FUNCIÓN: registrar_alerta
-- Descripción: Registra una alerta en el historial de OT
-- Retorna: ID de la alerta creada
-- ============================================================================

CREATE OR REPLACE FUNCTION registrar_alerta(
  p_id_ot TEXT,
  p_tipo_alerta TEXT,
  p_sku TEXT DEFAULT NULL,
  p_severidad TEXT DEFAULT 'Media',
  p_asunto TEXT DEFAULT NULL,
  p_mensaje TEXT DEFAULT NULL,
  p_datos_alerta JSONB DEFAULT NULL,
  p_destinatarios TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_alerta_id UUID;
BEGIN
  INSERT INTO historial_alertas_ot (
    id_ot,
    sku,
    tipo_alerta,
    severidad,
    estado,
    asunto,
    mensaje,
    datos_alerta,
    destinatarios
  ) VALUES (
    p_id_ot,
    p_sku,
    p_tipo_alerta,
    p_severidad,
    'Generada',
    p_asunto,
    p_mensaje,
    p_datos_alerta,
    p_destinatarios
  )
  RETURNING id INTO v_alerta_id;
  
  RETURN v_alerta_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION registrar_alerta IS 'Registra una alerta en el historial de OT';

-- ============================================================================
-- 7. FUNCIÓN: marcar_alerta_notificada
-- Descripción: Marca una alerta como notificada
-- ============================================================================

CREATE OR REPLACE FUNCTION marcar_alerta_notificada(
  p_alerta_id UUID,
  p_exitoso BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE historial_alertas_ot
  SET
    estado = 'Notificada',
    fecha_notificacion = NOW(),
    notificacion_exitosa = p_exitoso
  WHERE id = p_alerta_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION marcar_alerta_notificada IS 'Marca una alerta como notificada';

-- ============================================================================
-- 8. FUNCIÓN: resolver_alerta
-- Descripción: Marca una alerta como resuelta
-- ============================================================================

CREATE OR REPLACE FUNCTION resolver_alerta(
  p_alerta_id UUID,
  p_resuelto_por TEXT DEFAULT NULL,
  p_notas_resolucion TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE historial_alertas_ot
  SET
    estado = 'Resuelta',
    fecha_resolucion = NOW(),
    resuelto_por = p_resuelto_por,
    notas_resolucion = p_notas_resolucion
  WHERE id = p_alerta_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION resolver_alerta IS 'Marca una alerta como resuelta';

-- ============================================================================
-- 9. FUNCIÓN: obtener_configuracion
-- Descripción: Obtiene un valor de configuración
-- ============================================================================

CREATE OR REPLACE FUNCTION obtener_configuracion(
  p_clave TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_valor TEXT;
BEGIN
  SELECT valor INTO v_valor
  FROM configuracion
  WHERE clave = p_clave;
  
  RETURN v_valor;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_configuracion IS 'Obtiene un valor de configuración por clave';

-- ============================================================================
-- 10. FUNCIÓN: estadisticas_ot
-- Descripción: Retorna estadísticas generales de OT
-- ============================================================================

CREATE OR REPLACE FUNCTION estadisticas_ot()
RETURNS TABLE (
  total_ot BIGINT,
  por_estado JSONB,
  con_novedad BIGINT,
  sin_novedad BIGINT,
  promedio_diferencia_preparacion NUMERIC,
  promedio_diferencia_recepcion NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT id_ot)::BIGINT AS total_ot,
    jsonb_object_agg(estado, count) AS por_estado,
    SUM(CASE WHEN tiene_novedad THEN 1 ELSE 0 END)::BIGINT AS con_novedad,
    SUM(CASE WHEN NOT tiene_novedad THEN 1 ELSE 0 END)::BIGINT AS sin_novedad,
    AVG(porcentaje_diferencia_preparacion) AS promedio_diferencia_preparacion,
    AVG(porcentaje_diferencia_recepcion) AS promedio_diferencia_recepcion
  FROM (
    SELECT estado, COUNT(*) as count
    FROM transfer_orders
    GROUP BY estado
  ) estados,
  transfer_orders;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION estadisticas_ot IS 'Retorna estadísticas generales de órdenes de transferencia';

-- ============================================================================
-- 11. FUNCIÓN: obtener_ot_pendientes_procesamiento
-- Descripción: Retorna OT que requieren procesamiento
-- ============================================================================

CREATE OR REPLACE FUNCTION obtener_ot_pendientes_procesamiento(
  p_estados TEXT[] DEFAULT ARRAY['Solicitado', 'Preparado']
)
RETURNS TABLE (
  id BIGINT,
  id_ot TEXT,
  sku TEXT,
  estado TEXT,
  fecha_ultimo_cambio_estado TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.id_ot,
    t.sku,
    t.estado,
    t.fecha_ultimo_cambio_estado
  FROM transfer_orders t
  WHERE t.estado = ANY(p_estados)
  ORDER BY t.fecha_ultimo_cambio_estado ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_ot_pendientes_procesamiento IS 'Retorna OT pendientes de procesamiento por estado';

-- ============================================================================
-- VERIFICACIÓN DE FUNCIONES CREADAS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Funciones creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Funciones disponibles:';
  RAISE NOTICE '   1. upsert_transfer_order - Upsert de OT';
  RAISE NOTICE '   2. validar_diferencia_ot_ota - Validación OT vs OTA';
  RAISE NOTICE '   3. validar_diferencia_ota_otf - Validación OTA vs OTF';
  RAISE NOTICE '   4. validar_ean_contra_pim - Validación EAN vs PIM';
  RAISE NOTICE '   5. registrar_log_integracion - Registro de logs';
  RAISE NOTICE '   6. registrar_alerta - Registro de alertas';
  RAISE NOTICE '   7. marcar_alerta_notificada - Marcar alerta notificada';
  RAISE NOTICE '   8. resolver_alerta - Resolver alerta';
  RAISE NOTICE '   9. obtener_configuracion - Obtener configuración';
  RAISE NOTICE '   10. estadisticas_ot - Estadísticas generales';
  RAISE NOTICE '   11. obtener_ot_pendientes_procesamiento - OT pendientes';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Listas para usar desde n8n';
END $$;

-- ============================================================================
-- FIN DEL SCRIPT 03
-- ============================================================================

