-- ============================================================================
-- ACTUALIZACIÓN DE CONSTRAINT: check_tipo_operacion
-- Descripción: Agrega los nuevos tipos de operación al constraint
-- Fecha: 2024-11-28
-- Versión: 2.0.3
-- ============================================================================

-- IMPORTANTE: Ejecutar este script en el SQL Editor de Supabase

-- Paso 1: Eliminar el constraint existente
ALTER TABLE logs_integracion 
DROP CONSTRAINT IF EXISTS check_tipo_operacion;

-- Paso 2: Crear el constraint actualizado con los nuevos tipos
ALTER TABLE logs_integracion 
ADD CONSTRAINT check_tipo_operacion CHECK (
  tipo_operacion IN (
    'Ingesta_OT',
    'Ingesta_OTA',
    'Ingesta_OTADET',
    'Ingesta_OTF',
    'Ingesta_Unificada',           -- ✨ NUEVO: Para el flujo unificado de ingesta
    'Validacion_OT_OTA',
    'Validacion_OTADET_PIM',
    'Validacion_OTA_OTF',
    'Validacion_Completa',         -- ✨ NUEVO: Para el flujo de validaciones completo
    'Cierre_Novedad',
    'Envio_Alerta',
    'Otro'
  )
);

-- Verificación: Consultar los valores permitidos
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'check_tipo_operacion';

-- ============================================================================
-- NOTAS:
-- - 'Ingesta_Unificada': Usado por el flujo unificado que procesa OT, OTA, OTADET y OTF
-- - 'Validacion_Completa': Usado por el flujo de validaciones y alertas
-- ============================================================================

