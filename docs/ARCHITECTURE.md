# Arquitectura del Sistema

## Resumen Ejecutivo

Sistema de agendamiento de citas médicas basado en **arquitectura serverless** en AWS, diseñado para soportar múltiples países (Perú y Chile) con procesamiento asíncrono y trazabilidad completa.

## Decisiones Arquitectónicas

### 1. ¿Por qué Serverless?

✅ **Escalabilidad automática**: Sin configuración de servidores  
✅ **Pago por uso**: Solo pagas por las invocaciones reales  
✅ **Alta disponibilidad**: Infraestructura gestionada por AWS  
✅ **Mantenimiento reducido**: No hay servidores que parchear  

### 2. ¿Por qué Procesamiento Asíncrono?

✅ **Mejor experiencia de usuario**: Respuesta inmediata  
✅ **Desacoplamiento**: Cada país procesa independientemente  
✅ **Resiliencia**: Reintentos automáticos con DLQ  
✅ **Escalabilidad**: Cada cola escala independientemente  

### 3. ¿Por qué DynamoDB + RDS?

**DynamoDB**:
- Estado temporal (pending/completed)
- Lectura rápida por insuredId
- Sin mantenimiento
- Pay-per-request

**RDS MySQL**:
- Datos persistentes del agendamiento
- Relaciones complejas (centros, médicos, especialidades)
- Queries SQL tradicionales
- Una BD por país (aislamiento)

## Flujo Detallado

### Paso 1: Crear Agendamiento

```
Cliente → API Gateway → Lambda "appointment"
```

**Lambda "appointment"**:
1. Valida request con Joi
2. Crea Context (applicationId, transactionId)
3. Valida que schedule esté disponible (simulado)
4. Genera UUID para appointmentId
5. Guarda en DynamoDB con status="pending"
6. Publica mensaje a SNS del país correspondiente
7. Retorna 201 con appointmentId y status="pending"

**DynamoDB Item**:
```json
{
  "appointmentId": "uuid",
  "insuredId": "00123",
  "scheduleId": 100,
  "countryISO": "PE",
  "status": "pending",
  "createdAt": "2024-10-23T10:00:00Z",
  "transactionId": "uuid",
  "applicationId": "web-app"
}
```

### Paso 2: Enrutamiento por País

```
SNS Topic (PE o CL) → SQS Queue (PE o CL)
```

**SNS**: Publica el mensaje al tópico correcto según countryISO  
**SQS**: Recibe el mensaje y lo almacena hasta que Lambda lo procese

**Características SQS**:
- VisibilityTimeout: 180 segundos
- MaxReceiveCount: 3 (después va a DLQ)
- BatchSize: 10 mensajes

### Paso 3: Procesamiento por País

```
SQS (PE) → Lambda "appointment_pe"
SQS (CL) → Lambda "appointment_cl"
```

**Lambda procesador**:
1. Lee batch de mensajes de SQS
2. Para cada mensaje:
   - Extrae appointmentId, insuredId, scheduleId
   - Obtiene detalles del schedule (centerId, specialtyId, medicId, date)
   - Crea registro en RDS MySQL del país
   - Publica evento a EventBridge
3. Si hay error, re-lanza para que vaya a DLQ

**RDS Record**:
```sql
INSERT INTO appointments (
  appointment_id, insured_id, center_id, specialty_id,
  medic_id, appointment_date, schedule_id, country_iso, status
) VALUES (
  'uuid', '00123', 1, 2, 3, '2024-12-30 12:30:00', 100, 'PE', 'confirmed'
);
```

### Paso 4: Evento de Completado

```
Lambda procesador → EventBridge → Rule → SQS Completion
```

**EventBridge Event**:
```json
{
  "source": "appointment.processor",
  "detail-type": "AppointmentCompleted",
  "detail": {
    "appointmentId": "uuid",
    "insuredId": "00123",
    "countryISO": "PE",
    "processedAt": "2024-10-23T10:05:00Z"
  }
}
```

### Paso 5: Actualización Final

```
SQS Completion → Lambda "appointment" (completion handler)
```

**Lambda completion**:
1. Lee eventos de SQS
2. Extrae appointmentId
3. Actualiza DynamoDB: status="completed", completedAt=timestamp
4. Fin del flujo

### Paso 6: Consultar Agendamientos

```
Cliente → API Gateway → Lambda "appointment" → DynamoDB
```

**GET /appointments/{insuredId}**:
1. Valida insuredId (5 dígitos)
2. Query a DynamoDB usando GSI (InsuredIdIndex)
3. Retorna lista ordenada por fecha descendente

## Componentes AWS

### Lambda Functions

| Función | Trigger | Propósito |
|---------|---------|-----------|
| `appointment` | API Gateway | CRUD de agendamientos |
| `appointment_pe` | SQS PE | Procesar agendamientos de Perú |
| `appointment_cl` | SQS CL | Procesar agendamientos de Chile |
| `appointment_completion` | SQS Completion | Actualizar estado a completed |

### DynamoDB Table

**Nombre**: `appointments-{stage}`

**Schema**:
- Partition Key: `appointmentId` (String)
- GSI: `InsuredIdIndex`
  - Partition Key: `insuredId` (String)
  - Sort Key: `createdAt` (String)

**Billing**: Pay-per-request

### SNS Topics

- `appointment-topic-pe-{stage}`: Perú
- `appointment-topic-cl-{stage}`: Chile

### SQS Queues

**Main Queues**:
- `appointment-queue-pe-{stage}`
- `appointment-queue-cl-{stage}`
- `appointment-completion-queue-{stage}`

**Dead Letter Queues**:
- `appointment-dlq-pe-{stage}`
- `appointment-dlq-cl-{stage}`

### EventBridge

**Bus**: `appointment-events-{stage}`

**Rule**: Filtra eventos de tipo "AppointmentCompleted"

### RDS MySQL

**Instancias**:
- `appointments_pe`: Base de datos de Perú
- `appointments_cl`: Base de datos de Chile

**Tablas**:
- `appointments`: Agendamientos
- `centers`: Centros médicos
- `specialties`: Especialidades
- `medics`: Médicos

## Trazabilidad

Todos los componentes propagan el **Context**:

```typescript
{
  applicationId: "web-app",
  transactionId: "uuid",
  timestamp: "2024-10-23T10:00:00Z",
  functionName: "appointment"
}
```

Esto permite:
- Correlacionar logs en CloudWatch
- Debugging de transacciones específicas
- Métricas por aplicación cliente
- Auditoría completa

## Manejo de Errores

### Validación (Lambda "appointment")

```
Error de validación → 400 Bad Request
Schedule no disponible → 409 Conflict
Error interno → 500 Internal Server Error
```

### Procesamiento (Lambdas PE/CL)

```
Error → Reintento automático (SQS)
3 reintentos → Dead Letter Queue
DLQ → Alerta CloudWatch (manual)
```

### Completion

```
Error → Reintento automático
Estado queda en "pending" hasta manual fix
```

## Seguridad

### API Gateway

- CORS habilitado
- Rate limiting (configurable)
- Headers de trazabilidad

### Lambda

- Least privilege IAM roles
- VPC opcional para RDS
- Environment variables encriptadas

### DynamoDB

- Encryption at rest
- Backup automático
- Point-in-time recovery

### RDS

- Encryption at rest y in transit
- Security groups restrictivos
- Credenciales en Secrets Manager (recomendado)

## Escalabilidad

### Lambda

- Concurrencia: hasta 1000 por cuenta
- Auto-scaling sin configuración

### DynamoDB

- On-demand: escala automáticamente
- Throughput ilimitado

### SQS

- Sin límite de mensajes
- Escala automáticamente

### RDS

- Vertical scaling: cambiar instancia
- Read replicas para lecturas
- Connection pooling en Lambda

## Monitoreo

### Métricas Clave

- Lambda invocations
- Lambda errors
- Lambda duration
- DynamoDB consumed capacity
- SQS messages in queue
- SQS messages in DLQ
- API Gateway 4xx/5xx errors

### Alarmas Recomendadas

1. Lambda errors > 5% en 5 minutos
2. Mensajes en DLQ > 0
3. API Gateway 5xx > 1% en 5 minutos
4. Lambda duration > 25 segundos (timeout = 30)
5. SQS age of oldest message > 5 minutos

## Costos Optimización

### Lambda

- Usar ARM64 (Graviton2) para 20% menos costo
- Ajustar memory size según profiling
- Reusar conexiones (RDS pool)

### DynamoDB

- On-demand para cargas variables
- Provisioned para cargas predecibles
- TTL para limpiar datos antiguos

### RDS

- Instance size apropiado
- Stop/Start en dev
- Reserved instances en prod

## Mejoras Futuras

### Corto Plazo

- [ ] Agregar autenticación (Cognito)
- [ ] Implementar rate limiting
- [ ] Agregar más validaciones de negocio
- [ ] Métricas custom en CloudWatch

### Mediano Plazo

- [ ] Implementar saga pattern para rollback
- [ ] Agregar cache con ElastiCache
- [ ] Implementar circuit breaker
- [ ] Multi-region deployment

### Largo Plazo

- [ ] Event sourcing completo
- [ ] Machine learning para predicción de demanda
- [ ] GraphQL API alternativa
- [ ] WebSockets para notificaciones real-time

