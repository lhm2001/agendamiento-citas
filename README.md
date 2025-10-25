# Medical Appointment API - Sistema de Agendamiento de Citas Médicas

Sistema de agendamiento de citas médicas para asegurados utilizando **arquitectura serverless en AWS**. Soporta procesamiento asíncrono para múltiples países (Perú y Chile) con arquitectura en capas limpia y principios SOLID.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Despliegue](#despliegue)
- [Uso de la API](#uso-de-la-api)
- [Testing](#testing)
- [Documentación](#documentación)
- [Swagger UI](#swagger-ui)
- [Principios y Patrones](#principios-y-patrones)

---

## 📖 Descripción

Un asegurado desea agendar una cita médica, ingresa a la aplicación web y escoge:
- Centro médico
- Especialidad
- Médico
- Fecha y hora

Luego presiona un botón "Agendar" y los datos son enviados a esta aplicación backend que procesa el agendamiento de forma **asíncrona** y retorna un mensaje indicando que está en proceso.

### Flujo del Sistema

```
1. Cliente → POST /appointments → Lambda "appointment"
2. Lambda guarda en DynamoDB (estado: pending)
3. Lambda publica mensaje a SNS (por país)
4. SNS → SQS (PE o CL según corresponda)
5. Lambda procesador (appointment_pe o appointment_cl) lee de SQS
6. Lambda procesador guarda en RDS MySQL del país
7. Lambda procesador publica evento a EventBridge
8. EventBridge → SQS completion
9. Lambda "appointment" lee y actualiza DynamoDB (estado: completed)
```

---

## 🏗️ Arquitectura

### Diagrama de Infraestructura

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │ HTTP
       ↓
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
└─────────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────┐
│         Lambda: appointment                             │
│  • POST /appointments (crear)                           │
│  • GET /appointments/{insuredId} (listar)              │
└─────────────────────────────────────────────────────────┘
       │                                    ↑
       ↓ (write)                           │ (read/update)
┌──────────────────┐                       │
│   DynamoDB       │                       │
│  appointments    │───────────────────────┘
│  (pending/       │
│   completed)     │
└──────────────────┘
       │
       ↓ (publish)
┌──────────────────┬──────────────────┐
│   SNS Topic PE   │  SNS Topic CL    │
└────────┬─────────┴────────┬─────────┘
         │                  │
         ↓                  ↓
┌──────────────────┐  ┌──────────────────┐
│   SQS PE         │  │   SQS CL         │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ↓                     ↓
┌──────────────────┐  ┌──────────────────┐
│ Lambda:          │  │ Lambda:          │
│ appointment_pe   │  │ appointment_cl   │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ↓ (write)             ↓ (write)
┌──────────────────┐  ┌──────────────────┐
│   RDS MySQL PE   │  │   RDS MySQL CL   │
└──────────────────┘  └──────────────────┘
         │                     │
         └──────────┬──────────┘
                    │ (publish)
                    ↓
         ┌──────────────────────┐
         │   EventBridge        │
         │   (custom bus)       │
         └──────────┬───────────┘
                    │
                    ↓
         ┌──────────────────────┐
         │   SQS Completion     │
         └──────────┬───────────┘
                    │
                    ↓
         ┌──────────────────────┐
         │ Lambda: appointment  │
         │    (completion)      │
         └──────────────────────┘
```

### Arquitectura en Capas

El proyecto sigue una **arquitectura en capas limpia**:

```
┌─────────────────────────────────────────────────────┐
│         HANDLERS (Presentation Layer)               │
│  • appointment.handler.ts                           │
│  • appointment-pe.handler.ts                        │
│  • appointment-cl.handler.ts                        │
│  • appointment-completion.handler.ts                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│           SERVICES (Business Layer)                 │
│  • appointment.service.ts                           │
│  • appointment-processor.service.ts                 │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│            MAPPERS (Transformation)                 │
│  • appointment.mapper.ts                            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│         REPOSITORIES (Data Access)                  │
│  • appointment-dynamo.repository.ts                 │
│  • appointment-rds.repository.ts                    │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│              INTEGRATIONS                           │
│  • sns.client.ts                                    │
│  • eventbridge.client.ts                            │
│  • schedule.client.ts                               │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** 20.x - Runtime
- **TypeScript** 5.5.4 - Lenguaje con tipado fuerte
- **Serverless Framework** 3.x - Infraestructura como código

### AWS Services
- **Lambda** - Compute serverless
- **API Gateway** - HTTP API
- **DynamoDB** - Base de datos NoSQL (estado temporal)
- **RDS MySQL** - Base de datos relacional (por país)
- **SNS** - Notificaciones pub/sub
- **SQS** - Colas de mensajería
- **EventBridge** - Bus de eventos

### Librerías Principales
- **AWS SDK v3** - Clientes de AWS
- **Joi** - Validación de esquemas
- **Pino** - Logger de alto rendimiento
- **mysql2** - Cliente MySQL con promises
- **UUID** - Generación de IDs únicos

### Testing
- **Jest** - Framework de testing
- **ts-jest** - Soporte TypeScript en Jest

---

## 📁 Estructura del Proyecto

```
medical-appointment-api/
├── src/
│   ├── handlers/                    # Lambdas (Controllers)
│   │   ├── appointment.handler.ts
│   │   ├── appointment-pe.handler.ts
│   │   ├── appointment-cl.handler.ts
│   │   └── appointment-completion.handler.ts
│   ├── services/                    # Lógica de negocio
│   │   ├── appointment.service.ts
│   │   └── appointment-processor.service.ts
│   ├── repositories/                # Acceso a datos
│   │   ├── appointment-dynamo.repository.ts
│   │   └── appointment-rds.repository.ts
│   ├── integrations/                # Clientes AWS
│   │   ├── sns.client.ts
│   │   ├── eventbridge.client.ts
│   │   └── schedule.client.ts
│   ├── mappers/                     # Transformación de datos
│   │   └── appointment.mapper.ts
│   ├── entities/                    # Modelos de dominio
│   │   └── appointment.entity.ts
│   ├── dtos/                        # Data Transfer Objects
│   │   └── appointment.dto.ts
│   ├── validators/                  # Validaciones Joi
│   │   └── appointment.validator.ts
│   ├── middleware/                  # Middleware y Context
│   │   └── context.ts
│   ├── utils/                       # Utilidades
│   │   ├── logger.ts
│   │   ├── environment.ts
│   │   └── http-response.ts
│   └── __tests__/                   # Tests unitarios
│       ├── services/
│       ├── mappers/
│       └── validators/
├── docs/                            # Documentación
│   ├── openapi.yaml
│   └── database-schema.sql
├── serverless.yml                   # Configuración Serverless
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## 🚀 Instalación

### Prerrequisitos

- Node.js 20.x o superior
- npm o yarn
- AWS CLI configurado
- Cuenta de AWS con permisos adecuados
- Instancias de RDS MySQL para Perú y Chile (ver configuración)

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd medical-appointment-api

# 2. Instalar dependencias
npm install

# 3. Compilar TypeScript
npm run build

# 4. Ejecutar tests
npm test
```

---

## ⚙️ Configuración

### Variables de Entorno

Crear un archivo `.env` basado en `.env.example`:

```bash
# Node Environment
NODE_ENV=development
LOG_LEVEL=debug

# RDS MySQL - Perú
RDS_HOST_PE=mysql-pe.example.com
RDS_PORT_PE=3306
RDS_DATABASE_PE=appointments_pe
RDS_USER_PE=admin_pe
RDS_PASSWORD_PE=your_password_here

# RDS MySQL - Chile
RDS_HOST_CL=mysql-cl.example.com
RDS_PORT_CL=3306
RDS_DATABASE_CL=appointments_cl
RDS_USER_CL=admin_cl
RDS_PASSWORD_CL=your_password_here

# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=default
```

### Configurar RDS

1. Ejecutar el script SQL en ambas bases de datos:

```bash
# Para Perú
mysql -h mysql-pe.example.com -u admin_pe -p appointments_pe < docs/database-schema.sql

# Para Chile
mysql -h mysql-cl.example.com -u admin_cl -p appointments_cl < docs/database-schema.sql
```

---

## 🚢 Despliegue

### Despliegue a AWS

```bash
# Desplegar a desarrollo
npm run deploy:dev

# Desplegar a producción
npm run deploy:prod

# Remover stack completo
npm run remove
```

### Lo que se despliega

- ✅ 4 Lambda Functions
- ✅ API Gateway con 2 endpoints
- ✅ Tabla DynamoDB con índice GSI
- ✅ 2 Tópicos SNS (PE y CL)
- ✅ 3 Colas SQS + 2 DLQ
- ✅ 1 EventBridge Bus + Rule
- ✅ Todas las policies IAM necesarias

### Output del Despliegue

```
endpoints:
  POST - https://abc123.execute-api.us-east-1.amazonaws.com/dev/appointments
  GET  - https://abc123.execute-api.us-east-1.amazonaws.com/dev/appointments/{insuredId}

functions:
  appointment: medical-appointment-api-dev-appointment
  appointmentPE: medical-appointment-api-dev-appointmentPE
  appointmentCL: medical-appointment-api-dev-appointmentCL
  appointmentCompletion: medical-appointment-api-dev-appointmentCompletion
```

---

## 📡 Uso de la API

### Crear Agendamiento

```bash
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/dev/appointments \
  -H "Content-Type: application/json" \
  -H "Application-ID: web-app" \
  -d '{
    "insuredId": "00123",
    "scheduleId": 100,
    "countryISO": "PE"
  }'
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Agendamiento en proceso. Recibirá confirmación pronto.",
  "data": {
    "appointmentId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "pending",
    "transactionId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Listar Agendamientos de un Asegurado

```bash
curl https://your-api.execute-api.us-east-1.amazonaws.com/dev/appointments/00123 \
  -H "Application-ID: web-app"
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "appointmentId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "insuredId": "00123",
      "scheduleId": 100,
      "countryISO": "PE",
      "status": "completed",
      "createdAt": "2024-10-23T10:00:00.000Z",
      "updatedAt": "2024-10-23T10:05:00.000Z",
      "completedAt": "2024-10-23T10:05:00.000Z"
    }
  ],
  "total": 1
}
```

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Cobertura de Tests

El proyecto incluye tests unitarios para:
- ✅ Services (lógica de negocio)
- ✅ Mappers (transformaciones)
- ✅ Validators (validaciones Joi)

---

## 📚 Documentación

### OpenAPI/Swagger

La documentación completa de la API está en formato OpenAPI 3.0:

- **Archivo**: `docs/openapi.yaml`
- **Visualizar**: Importar en [Swagger Editor](https://editor.swagger.io/)

## 🔧 Swagger UI

El proyecto incluye una interfaz web interactiva de Swagger UI para probar la API directamente desde el navegador.

### Acceso a Swagger UI

Una vez desplegado el proyecto, puedes acceder a Swagger UI en:

- **Desarrollo**: `https://tu-api-gateway-url/dev/swagger`
- **Producción**: `https://tu-api-gateway-url/prod/swagger`

### Endpoints disponibles

- **Swagger UI**: `/swagger` - Interfaz web interactiva
- **OpenAPI YAML**: `/swagger/openapi.yaml` - Especificación en formato YAML
- **OpenAPI JSON**: `/swagger/openapi.json` - Especificación en formato JSON

### Pruebas locales

Para probar Swagger UI localmente:

```bash
# Opción 1: Script de PowerShell (Windows)
.\scripts\test-swagger.ps1

# Opción 2: Comandos manuales
npm run build
npm run local
```

Luego visita: `http://localhost:3000/dev/swagger`

### Características de Swagger UI

- ✅ Interfaz web interactiva
- ✅ Pruebas de endpoints en tiempo real
- ✅ Documentación automática basada en OpenAPI
- ✅ Soporte para autenticación
- ✅ Ejemplos de requests y responses
- ✅ Validación de esquemas

### Logs y Trazabilidad

Todos los logs incluyen:
- `applicationId`: Identificador de la aplicación cliente
- `transactionId`: ID único de transacción (UUID)
- `timestamp`: Timestamp ISO 8601
- `functionName`: Nombre de la Lambda

**Ejemplo de log:**

```json
{
  "level": "info",
  "time": "2024-10-23T10:00:00.000Z",
  "applicationId": "web-app",
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "functionName": "appointment",
  "msg": "Creando agendamiento",
  "insuredId": "00123",
  "scheduleId": 100
}
```

---

## 🎯 Principios y Patrones

### Principios SOLID

1. **Single Responsibility**: Cada clase tiene una única responsabilidad
2. **Open/Closed**: Abierto para extensión, cerrado para modificación
3. **Liskov Substitution**: Las clases derivadas son sustituibles
4. **Interface Segregation**: Interfaces específicas y pequeñas
5. **Dependency Inversion**: Dependencias inyectadas, no creadas internamente

### Patrones de Diseño

1. **Layered Architecture**: Arquitectura en capas con separación clara
2. **Repository Pattern**: Abstracción del acceso a datos
3. **Mapper Pattern**: Transformación entre DTOs y Entities
4. **Service Layer**: Lógica de negocio centralizada
5. **Dependency Injection**: Inyección de dependencias
6. **Factory Pattern**: Creación de clientes AWS

### Buenas Prácticas

- ✅ Tipado fuerte con TypeScript (sin `any` [[memory:6558611]])
- ✅ Validación en múltiples capas (Joi + negocio + BD)
- ✅ Trazabilidad completa con Context
- ✅ Logging estructurado con Pino
- ✅ Tests unitarios con alta cobertura
- ✅ Documentación OpenAPI 3.0
- ✅ Manejo robusto de errores
- ✅ Infraestructura como código

---

## 👤 Autor

**Lucia Heredia**
- Última actualización: Octubre 2025
- Versión: 1.0.0

---

## 📄 Licencia

ISC License

