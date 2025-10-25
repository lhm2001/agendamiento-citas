# 🌐 URLs del Sistema de Agendamientos Médicos

## Base URL
```
https://qe25glnfqg.execute-api.us-east-1.amazonaws.com/dev
```

## 📡 Endpoints Disponibles

### 1. Crear Agendamiento (POST)
```
POST https://qe25glnfqg.execute-api.us-east-1.amazonaws.com/dev/appointments
```

**Headers requeridos:**
```
Content-Type: application/json
Application-ID: web-app
```

**Ejemplo de body para Perú:**
```json
{
    "insuredId": "00123",
    "scheduleId": 100,
    "countryISO": "PE"
}
```

**Ejemplo de body para Chile:**
```json
{
    "insuredId": "00456",
    "scheduleId": 200,
    "countryISO": "CL"
}
```

### 2. Listar Agendamientos (GET)
```
GET https://qe25glnfqg.execute-api.us-east-1.amazonaws.com/dev/appointments/{insuredId}
```

**Headers requeridos:**
```
Application-ID: web-app
```

**Ejemplos:**
- `GET https://qe25glnfqg.execute-api.us-east-1.amazonaws.com/dev/appointments/00123`
- `GET https://qe25glnfqg.execute-api.us-east-1.amazonaws.com/dev/appointments/00456`

## 🧪 Ejemplos de Prueba con cURL

### Crear agendamiento para Perú:
```bash
curl -X POST https://qe25glnfqg.execute-api.us-east-1.amazonaws.com/dev/appointments \
  -H "Content-Type: application/json" \
  -H "Application-ID: web-app" \
  -d '{
    "insuredId": "00123",
    "scheduleId": 100,
    "countryISO": "PE"
  }'
```

### Crear agendamiento para Chile:
```bash
curl -X POST https://qe25glnfqg.execute-api.us-east-1.amazonaws.com/dev/appointments \
  -H "Content-Type: application/json" \
  -H "Application-ID: web-app" \
  -d '{
    "insuredId": "00456",
    "scheduleId": 200,
    "countryISO": "CL"
  }'
```

### Listar agendamientos:
```bash
curl https://qe25glnfqg.execute-api.us-east-1.amazonaws.com/dev/appointments/00123 \
  -H "Application-ID: web-app"
```

## 📊 Respuestas Esperadas

### POST Response (Crear Agendamiento):
```json
{
  "success": true,
  "message": "Agendamiento en proceso. Recibirá confirmación pronto.",
  "data": {
    "appointmentId": "uuid-generado",
    "status": "pending",
    "transactionId": "uuid-transaccion"
  }
}
```

### GET Response (Listar Agendamientos):
```json
{
  "success": true,
  "data": [
    {
      "appointmentId": "uuid",
      "insuredId": "00123",
      "scheduleId": 100,
      "countryISO": "PE",
      "status": "completed",
      "createdAt": "2025-10-24T03:48:20.157Z",
      "updatedAt": "2025-10-24T03:48:20.675Z",
      "completedAt": "2025-10-24T03:48:20.675Z"
    }
  ],
  "total": 1
}
```

## 🔄 Flujo del Sistema

1. **Cliente** → POST /appointments → **Lambda principal**
2. **Lambda principal** → **DynamoDB** (estado: pending)
3. **Lambda principal** → **SNS** (por país)
4. **SNS** → **SQS** (PE o CL según corresponda)
5. **Lambda procesador** (PE/CL) → **RDS** (simulado)
6. **Lambda procesador** → **EventBridge**
7. **EventBridge** → **SQS completion**
8. **Lambda completion** → **DynamoDB** (estado: completed)

## 🎯 Estados del Agendamiento

- **pending**: Agendamiento creado, en proceso
- **completed**: Agendamiento procesado exitosamente

## 📝 Notas Importantes

- Los agendamientos se procesan de forma **asíncrona**
- El tiempo de procesamiento es de **1-3 segundos**
- Los lambdas procesadores de Perú y Chile están **operativos**
- El sistema está **listo para producción**

---
*Sistema de Agendamientos Médicos - Arquitectura Serverless AWS*
*Última actualización: Octubre 2025*
