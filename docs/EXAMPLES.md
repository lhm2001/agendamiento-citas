# Ejemplos de Uso

## Ejemplos de Requests

### 1. Crear Agendamiento - Perú

```bash
curl -X POST https://your-api.com/appointments \
  -H "Content-Type: application/json" \
  -H "Application-ID: mobile-app" \
  -H "Transaction-ID: 550e8400-e29b-41d4-a716-446655440001" \
  -d '{
    "insuredId": "00123",
    "scheduleId": 100,
    "countryISO": "PE"
  }'
```

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Agendamiento en proceso. Recibirá confirmación pronto.",
  "data": {
    "appointmentId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "pending",
    "transactionId": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

### 2. Crear Agendamiento - Chile

```bash
curl -X POST https://your-api.com/appointments \
  -H "Content-Type: application/json" \
  -H "Application-ID: web-app" \
  -d '{
    "insuredId": "00456",
    "scheduleId": 250,
    "countryISO": "CL"
  }'
```

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Agendamiento en proceso. Recibirá confirmación pronto.",
  "data": {
    "appointmentId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "status": "pending",
    "transactionId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
  }
}
```

### 3. Listar Agendamientos de un Asegurado

```bash
curl -X GET https://your-api.com/appointments/00123 \
  -H "Application-ID: mobile-app"
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": [
    {
      "appointmentId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "insuredId": "00123",
      "scheduleId": 100,
      "countryISO": "PE",
      "status": "completed",
      "createdAt": "2024-10-23T10:00:00.000Z",
      "updatedAt": "2024-10-23T10:05:00.000Z",
      "completedAt": "2024-10-23T10:05:00.000Z"
    },
    {
      "appointmentId": "a2b3c4d5-e6f7-8901-2345-67890abcdef1",
      "insuredId": "00123",
      "scheduleId": 105,
      "countryISO": "PE",
      "status": "pending",
      "createdAt": "2024-10-23T11:00:00.000Z",
      "updatedAt": "2024-10-23T11:00:00.000Z"
    }
  ],
  "total": 2
}
```

## Ejemplos de Errores

### Error de Validación - insuredId inválido

```bash
curl -X POST https://your-api.com/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "insuredId": "123",
    "scheduleId": 100,
    "countryISO": "PE"
  }'
```

**Respuesta (400)**:
```json
{
  "success": false,
  "message": "Validación fallida: insuredId debe ser un código de 5 dígitos",
  "errorCode": "VALIDATION_ERROR"
}
```

### Error de Validación - país inválido

```bash
curl -X POST https://your-api.com/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "insuredId": "00123",
    "scheduleId": 100,
    "countryISO": "AR"
  }'
```

**Respuesta (400)**:
```json
{
  "success": false,
  "message": "Validación fallida: countryISO debe ser PE o CL",
  "errorCode": "VALIDATION_ERROR"
}
```

### Error de Negocio - Schedule no disponible

```bash
curl -X POST https://your-api.com/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "insuredId": "00123",
    "scheduleId": 999,
    "countryISO": "PE"
  }'
```

**Respuesta (409)**:
```json
{
  "success": false,
  "message": "El espacio de agendamiento 999 no está disponible",
  "errorCode": "SCHEDULE_NOT_AVAILABLE"
}
```

### Error - Asegurado no encontrado

```bash
curl -X GET https://your-api.com/appointments/99999
```

**Respuesta (200)** (sin datos):
```json
{
  "success": true,
  "data": [],
  "total": 0
}
```

## Ejemplos con JavaScript/TypeScript

### Node.js con Axios

```typescript
import axios from 'axios';

const API_URL = 'https://your-api.com';

// Crear agendamiento
async function createAppointment() {
  try {
    const response = await axios.post(`${API_URL}/appointments`, {
      insuredId: '00123',
      scheduleId: 100,
      countryISO: 'PE',
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Application-ID': 'my-app',
      },
    });

    console.log('Agendamiento creado:', response.data);
    return response.data.data.appointmentId;
  } catch (error) {
    console.error('Error:', error.response?.data);
    throw error;
  }
}

// Obtener agendamientos
async function getAppointments(insuredId: string) {
  try {
    const response = await axios.get(`${API_URL}/appointments/${insuredId}`, {
      headers: {
        'Application-ID': 'my-app',
      },
    });

    console.log('Agendamientos:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data);
    throw error;
  }
}

// Uso
(async () => {
  const appointmentId = await createAppointment();
  console.log('Appointment ID:', appointmentId);

  // Esperar un poco para procesamiento
  await new Promise(resolve => setTimeout(resolve, 3000));

  const appointments = await getAppointments('00123');
  console.log('Total appointments:', appointments.length);
})();
```

### Frontend (React)

```typescript
import { useState } from 'react';

const API_URL = 'https://your-api.com';

function AppointmentForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const createAppointment = async (formData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Application-ID': 'web-portal',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          appointmentId: data.data.appointmentId,
        });
      } else {
        setResult({
          success: false,
          message: data.message,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Error de conexión',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      insuredId: e.target.insuredId.value,
      scheduleId: parseInt(e.target.scheduleId.value),
      countryISO: e.target.countryISO.value,
    };
    createAppointment(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="insuredId" placeholder="Código asegurado (00123)" required />
      <input name="scheduleId" type="number" placeholder="ID espacio" required />
      <select name="countryISO" required>
        <option value="">Seleccionar país</option>
        <option value="PE">Perú</option>
        <option value="CL">Chile</option>
      </select>
      <button type="submit" disabled={loading}>
        {loading ? 'Procesando...' : 'Agendar Cita'}
      </button>
      
      {result && (
        <div className={result.success ? 'success' : 'error'}>
          {result.message}
          {result.appointmentId && <p>ID: {result.appointmentId}</p>}
        </div>
      )}
    </form>
  );
}
```

### Python

```python
import requests
import time

API_URL = "https://your-api.com"

def create_appointment(insured_id, schedule_id, country_iso):
    """Crea un agendamiento"""
    response = requests.post(
        f"{API_URL}/appointments",
        json={
            "insuredId": insured_id,
            "scheduleId": schedule_id,
            "countryISO": country_iso
        },
        headers={
            "Content-Type": "application/json",
            "Application-ID": "python-client"
        }
    )
    
    if response.status_code == 201:
        data = response.json()
        print(f"✓ Agendamiento creado: {data['data']['appointmentId']}")
        return data['data']['appointmentId']
    else:
        print(f"✗ Error: {response.json()['message']}")
        return None

def get_appointments(insured_id):
    """Obtiene agendamientos de un asegurado"""
    response = requests.get(
        f"{API_URL}/appointments/{insured_id}",
        headers={"Application-ID": "python-client"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"Total agendamientos: {data['total']}")
        return data['data']
    else:
        print(f"Error: {response.json()['message']}")
        return []

# Uso
if __name__ == "__main__":
    # Crear agendamiento
    appointment_id = create_appointment("00123", 100, "PE")
    
    # Esperar procesamiento
    print("Esperando procesamiento...")
    time.sleep(3)
    
    # Obtener agendamientos
    appointments = get_appointments("00123")
    for appt in appointments:
        print(f"- {appt['appointmentId']} ({appt['status']})")
```

## Testing con Postman

### Collection JSON

```json
{
  "info": {
    "name": "Medical Appointment API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Crear Agendamiento PE",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Application-ID",
            "value": "postman"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"insuredId\": \"00123\",\n  \"scheduleId\": 100,\n  \"countryISO\": \"PE\"\n}"
        },
        "url": {
          "raw": "{{API_URL}}/appointments",
          "host": ["{{API_URL}}"],
          "path": ["appointments"]
        }
      }
    },
    {
      "name": "Listar Agendamientos",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Application-ID",
            "value": "postman"
          }
        ],
        "url": {
          "raw": "{{API_URL}}/appointments/00123",
          "host": ["{{API_URL}}"],
          "path": ["appointments", "00123"]
        }
      }
    }
  ]
}
```

