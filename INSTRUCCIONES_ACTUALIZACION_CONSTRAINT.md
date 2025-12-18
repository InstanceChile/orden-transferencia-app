# 🔧 Instrucciones: Actualizar Constraint en Supabase

## ⚠️ Error Actual

Al ejecutar el flujo de validaciones, el nodo `📊 Guardar_Log_Supabase` falla con:

```
Error: new row for relation "logs_integracion" violates check constraint "check_tipo_operacion"
```

## 🎯 Solución

El constraint de la tabla `logs_integracion` necesita incluir los nuevos tipos de operación.

## 📋 Pasos para Resolver

### 1. Acceder al SQL Editor de Supabase

1. Ir a tu proyecto en Supabase: https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. En el menú lateral, hacer clic en **"SQL Editor"**

### 2. Ejecutar el Script de Actualización

Copiar y pegar el siguiente SQL en el editor:

```sql
-- Eliminar el constraint existente
ALTER TABLE logs_integracion 
DROP CONSTRAINT IF EXISTS check_tipo_operacion;

-- Crear el constraint actualizado
ALTER TABLE logs_integracion 
ADD CONSTRAINT check_tipo_operacion CHECK (
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
);
```

### 3. Ejecutar el Script

1. Hacer clic en el botón **"Run"** (o presionar `Ctrl + Enter`)
2. Verificar que aparezca el mensaje de éxito: `Success. No rows returned`

### 4. Verificar la Actualización (Opcional)

Para confirmar que el constraint se actualizó correctamente, ejecutar:

```sql
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'check_tipo_operacion';
```

Deberías ver el constraint con todos los valores incluyendo `'Ingesta_Unificada'` y `'Validacion_Completa'`.

### 5. Probar el Flujo

1. Regresar a n8n
2. Ejecutar manualmente el flujo **"🔍 Flujo Validaciones y Alertas OT"**
3. Verificar que el nodo `📊 Guardar_Log_Supabase` se ejecute sin errores

## ✅ Resultado Esperado

Después de ejecutar el script:
- ✅ El flujo de validaciones puede guardar logs correctamente
- ✅ El flujo unificado de ingesta puede guardar logs correctamente
- ✅ Ambos flujos registran sus operaciones en `logs_integracion`

## 📁 Archivos Relacionados

- **Script SQL completo**: `database/05_update_constraint_validacion_completa.sql`
- **Schema actualizado**: `database/01_schema.sql`
- **Changelog**: `CHANGELOG.md` (versión 2.0.3)

## 🆘 Soporte

Si después de ejecutar el script sigues teniendo problemas:

1. Verificar que no haya registros en `logs_integracion` con valores no permitidos
2. Revisar los logs de Supabase para más detalles del error
3. Confirmar que tienes permisos de administrador en la base de datos

---

**Fecha de creación**: 2024-11-28  
**Versión**: 2.0.3


