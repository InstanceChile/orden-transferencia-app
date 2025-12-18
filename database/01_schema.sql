-- ============================================================================
-- SISTEMA DE GESTIÓN DE ÓRDENES DE TRANSFERENCIA (OT)
-- Script 01: Definición de Esquema de Base de Datos
-- Versión: 1.0.0
-- Fecha: Noviembre 2024
-- ============================================================================

-- ============================================================================
-- 1. TABLA PRINCIPAL: transfer_orders
-- Descripción: Registro único por combinación ID_OT + SKU
-- Restricción: Unique constraint en (id_ot, sku)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transfer_orders (
  -- Identificadores
  id BIGSERIAL PRIMARY KEY,
  id_ot TEXT NOT NULL,
  sku TEXT NOT NULL,
  mlc TEXT,
  cliente TEXT,
  
  -- Datos de solicitud (OT)
  fecha_solicitud TIMESTAMPTZ,
  fecha_transferencia_comprometida TIMESTAMPTZ,
  cantidad_solicitada NUMERIC(10,2) DEFAULT 0,
  
  -- Datos de preparación (OTA)
  fecha_preparacion TIMESTAMPTZ,
  cantidad_preparada NUMERIC(10,2) DEFAULT 0,
  
  -- Datos de recepción (OTF)
  fecha_recepcion TIMESTAMPTZ,
  cantidad_recepcionada NUMERIC(10,2) DEFAULT 0,
  
  -- Gestión de estados
  estado TEXT NOT NULL DEFAULT 'Solicitado',
  tiene_novedad BOOLEAN DEFAULT FALSE,
  detalle_novedad TEXT,
  porcentaje_diferencia_preparacion NUMERIC(5,2),
  porcentaje_diferencia_recepcion NUMERIC(5,2),
  fecha_ultimo_cambio_estado TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_ot_sku UNIQUE (id_ot, sku),
  CONSTRAINT check_estado CHECK (
    estado IN (
      'Solicitado',
      'Preparado',
      'Preparacion_Validada',
      'Entregado_Sin_Novedad',
      'Entregado_con_Novedad',
      'Entregado_con_Novedad_Resuelto'
    )
  ),
  CONSTRAINT check_cantidades_positivas CHECK (
    cantidad_solicitada >= 0 AND
    cantidad_preparada >= 0 AND
    cantidad_recepcionada >= 0
  )
);

-- Comentarios de documentación
COMMENT ON TABLE transfer_orders IS 'Tabla principal de órdenes de transferencia con estado único por OT + SKU';
COMMENT ON COLUMN transfer_orders.id_ot IS 'Identificador único de la orden de transferencia';
COMMENT ON COLUMN transfer_orders.sku IS 'Código SKU del producto';
COMMENT ON COLUMN transfer_orders.mlc IS 'Código de publicación MercadoLibre (opcional)';
COMMENT ON COLUMN transfer_orders.cliente IS 'Nombre o identificador del cliente asociado a la orden';
COMMENT ON COLUMN transfer_orders.estado IS 'Estado actual: Solicitado, Preparado, Preparacion_Validada, Entregado_Sin_Novedad, Entregado_con_Novedad, Entregado_con_Novedad_Resuelto';
COMMENT ON COLUMN transfer_orders.tiene_novedad IS 'Indica si hay una novedad/diferencia que requiere atención';
COMMENT ON COLUMN transfer_orders.porcentaje_diferencia_preparacion IS 'Diferencia porcentual entre cantidad solicitada y preparada';
COMMENT ON COLUMN transfer_orders.porcentaje_diferencia_recepcion IS 'Diferencia porcentual entre cantidad preparada y recepcionada';

-- ============================================================================
-- 2. TABLA DE DETALLE POR EAN: transfer_orders_detalle_ean
-- Descripción: Detalle de preparación por código EAN (OTADET)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transfer_orders_detalle_ean (
  -- Identificadores
  id BIGSERIAL PRIMARY KEY,
  id_ot TEXT NOT NULL,
  sku TEXT NOT NULL,
  ean TEXT NOT NULL,
  
  -- Cantidades
  cantidad_preparada_ean NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_ot_sku_ean UNIQUE (id_ot, sku, ean),
  CONSTRAINT check_cantidad_ean_positiva CHECK (cantidad_preparada_ean >= 0),
  
  -- Foreign key (opcional, si quieres integridad referencial)
  CONSTRAINT fk_transfer_order FOREIGN KEY (id_ot, sku) 
    REFERENCES transfer_orders(id_ot, sku) 
    ON DELETE CASCADE
);

-- Comentarios
COMMENT ON TABLE transfer_orders_detalle_ean IS 'Detalle de preparación por código EAN (OTADET)';
COMMENT ON COLUMN transfer_orders_detalle_ean.ean IS 'Código de barras EAN del producto';
COMMENT ON COLUMN transfer_orders_detalle_ean.cantidad_preparada_ean IS 'Cantidad preparada específica para este EAN';

-- ============================================================================
-- 3. TABLA PIM: pim_productos
-- Descripción: Catálogo de productos con mapeo SKU → EAN
-- ============================================================================

CREATE TABLE IF NOT EXISTS pim_productos (
  -- Identificadores
  id BIGSERIAL PRIMARY KEY,
  sku TEXT NOT NULL,
  ean TEXT NOT NULL,
  
  -- Información del producto
  nombre_producto TEXT,
  descripcion TEXT,
  categoria TEXT,
  marca TEXT,
  
  -- Estado
  activo BOOLEAN DEFAULT TRUE,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_sku_ean UNIQUE (sku, ean)
);

-- Comentarios
COMMENT ON TABLE pim_productos IS 'Catálogo de productos con mapeo SKU a EAN';
COMMENT ON COLUMN pim_productos.sku IS 'Código SKU del producto';
COMMENT ON COLUMN pim_productos.ean IS 'Código EAN asociado al SKU';
COMMENT ON COLUMN pim_productos.activo IS 'Indica si el producto está activo en el catálogo';

-- ============================================================================
-- 4. TABLA DE LOGS: logs_integracion
-- Descripción: Registro de todas las operaciones de integración
-- ============================================================================

CREATE TABLE IF NOT EXISTS logs_integracion (
  -- Identificadores
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información de la operación
  tipo_operacion TEXT NOT NULL,
  flujo_n8n TEXT,
  
  -- Resultados
  exitoso BOOLEAN NOT NULL DEFAULT TRUE,
  total_registros INTEGER DEFAULT 0,
  registros_exitosos INTEGER DEFAULT 0,
  registros_fallidos INTEGER DEFAULT 0,
  
  -- Detalles
  mensaje TEXT,
  errores JSONB,
  datos_adicionales JSONB,
  
  -- Metadatos
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  duracion_ms INTEGER,
  
  -- Constraints
  CONSTRAINT check_tipo_operacion CHECK (
    tipo_operacion IN (
      'Ingesta_OT',
      'Ingesta_OTA',
      'Ingesta_OTADET',
      'Ingesta_OTF',
      'Ingesta_Unificada',
      'Validacion_OT_OTA',
      'Validacion_OTADET_PIM',
      'Validacion_OTA_OTF',
      'Validacion_Completa',
      'Cierre_Novedad',
      'Envio_Alerta',
      'Otro'
    )
  )
);

-- Comentarios
COMMENT ON TABLE logs_integracion IS 'Registro de todas las operaciones de integración y validación';
COMMENT ON COLUMN logs_integracion.tipo_operacion IS 'Tipo de operación ejecutada';
COMMENT ON COLUMN logs_integracion.flujo_n8n IS 'Nombre del flujo n8n que ejecutó la operación';
COMMENT ON COLUMN logs_integracion.errores IS 'Detalles de errores en formato JSON';
COMMENT ON COLUMN logs_integracion.datos_adicionales IS 'Información adicional relevante en formato JSON';

-- ============================================================================
-- 5. TABLA DE HISTORIAL: historial_alertas_ot
-- Descripción: Registro histórico de todas las alertas generadas para OT
-- ============================================================================

CREATE TABLE IF NOT EXISTS historial_alertas_ot (
  -- Identificadores
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia
  id_ot TEXT NOT NULL,
  sku TEXT,
  
  -- Tipo de alerta
  tipo_alerta TEXT NOT NULL,
  severidad TEXT DEFAULT 'Media',
  
  -- Estado
  estado TEXT DEFAULT 'Generada',
  
  -- Contenido
  asunto TEXT,
  mensaje TEXT,
  datos_alerta JSONB,
  
  -- Notificación
  destinatarios TEXT[],
  fecha_notificacion TIMESTAMPTZ,
  notificacion_exitosa BOOLEAN,
  
  -- Resolución
  fecha_resolucion TIMESTAMPTZ,
  resuelto_por TEXT,
  notas_resolucion TEXT,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_tipo_alerta CHECK (
    tipo_alerta IN (
      'Diferencia_OT_OTA',
      'Inconsistencia_OTADET_PIM',
      'Diferencia_OTA_OTF',
      'Otro'
    )
  ),
  CONSTRAINT check_severidad CHECK (
    severidad IN ('Baja', 'Media', 'Alta', 'Crítica')
  ),
  CONSTRAINT check_estado_alerta CHECK (
    estado IN ('Generada', 'Notificada', 'En_Revision', 'Resuelta', 'Descartada')
  )
);

-- Comentarios
COMMENT ON TABLE historial_alertas_ot IS 'Registro histórico de alertas generadas por el sistema de OT';
COMMENT ON COLUMN historial_alertas_ot.tipo_alerta IS 'Tipo de alerta: Diferencia_OT_OTA, Inconsistencia_OTADET_PIM, Diferencia_OTA_OTF';
COMMENT ON COLUMN historial_alertas_ot.severidad IS 'Nivel de severidad: Baja, Media, Alta, Crítica';
COMMENT ON COLUMN historial_alertas_ot.estado IS 'Estado actual: Generada, Notificada, En_Revision, Resuelta, Descartada';
COMMENT ON COLUMN historial_alertas_ot.datos_alerta IS 'Datos específicos de la alerta en formato JSON';

-- ============================================================================
-- 6. TABLA DE CONFIGURACIÓN: configuracion
-- Descripción: Parámetros configurables del sistema
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuracion (
  -- Identificadores
  id SERIAL PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  
  -- Descripción
  descripcion TEXT,
  tipo_dato TEXT DEFAULT 'text',
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_tipo_dato CHECK (
    tipo_dato IN ('text', 'number', 'boolean', 'json', 'email')
  )
);

-- Comentarios
COMMENT ON TABLE configuracion IS 'Parámetros configurables del sistema';
COMMENT ON COLUMN configuracion.clave IS 'Nombre único del parámetro';
COMMENT ON COLUMN configuracion.valor IS 'Valor del parámetro (siempre como texto)';
COMMENT ON COLUMN configuracion.tipo_dato IS 'Tipo de dato para validación';

-- ============================================================================
-- 7. INSERTAR CONFIGURACIONES INICIALES
-- ============================================================================

INSERT INTO configuracion (clave, valor, descripcion, tipo_dato) VALUES
  ('umbral_diferencia_preparacion', '0.02', 'Umbral de diferencia aceptable entre OT y OTA (2%)', 'number'),
  ('umbral_diferencia_recepcion', '0.05', 'Umbral de diferencia aceptable entre OTA y OTF (5%)', 'number'),
  ('email_abastecimiento', 'abastecimiento@empresa.com', 'Email del área de abastecimiento', 'email'),
  ('email_operaciones', 'operaciones@empresa.com', 'Email del área de operaciones', 'email'),
  ('email_full', 'full@empresa.com', 'Email del área de full', 'email'),
  ('frecuencia_ejecucion_minutos', '10', 'Frecuencia de ejecución de flujos en minutos', 'number'),
  ('habilitar_alertas', 'true', 'Habilitar o deshabilitar envío de alertas', 'boolean'),
  ('google_sheet_id', '', 'ID del Google Sheet principal', 'text')
ON CONFLICT (clave) DO NOTHING;

-- ============================================================================
-- 8. TRIGGERS PARA ACTUALIZAR updated_at
-- ============================================================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para transfer_orders
CREATE TRIGGER update_transfer_orders_updated_at
  BEFORE UPDATE ON transfer_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para transfer_orders_detalle_ean
CREATE TRIGGER update_detalle_ean_updated_at
  BEFORE UPDATE ON transfer_orders_detalle_ean
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para pim_productos
CREATE TRIGGER update_pim_productos_updated_at
  BEFORE UPDATE ON pim_productos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para configuracion
CREATE TRIGGER update_configuracion_updated_at
  BEFORE UPDATE ON configuracion
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. TRIGGER PARA ACTUALIZAR fecha_ultimo_cambio_estado
-- ============================================================================

CREATE OR REPLACE FUNCTION update_fecha_cambio_estado()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar si el estado cambió
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    NEW.fecha_ultimo_cambio_estado = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_estado_timestamp
  BEFORE UPDATE ON transfer_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_fecha_cambio_estado();

-- ============================================================================
-- FIN DEL SCRIPT 01
-- ============================================================================

-- Verificación de tablas creadas
DO $$
BEGIN
  RAISE NOTICE '✅ Schema creado exitosamente';
  RAISE NOTICE '📊 Tablas creadas:';
  RAISE NOTICE '   - transfer_orders';
  RAISE NOTICE '   - transfer_orders_detalle_ean';
  RAISE NOTICE '   - pim_productos';
  RAISE NOTICE '   - logs_integracion';
  RAISE NOTICE '   - historial_alertas_ot';
  RAISE NOTICE '   - configuracion';
  RAISE NOTICE '🔧 Triggers configurados';
  RAISE NOTICE '⚙️  Configuraciones iniciales insertadas';
END $$;

