# Diagrama del Sistema

## Diagrama de Flujo Completo

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Web/Mobile)                            │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│  • POST /appointments (crear agendamiento)                              │
│  • GET /appointments/{insuredId} (listar agendamientos)                │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 │ invoke
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    LAMBDA: appointment                                   │
│  Responsabilidades:                                                      │
│  • Recibir petición HTTP                                                │
│  • Validar datos (Joi)                                                  │
│  • Crear Context (trazabilidad)                                         │
│  • Guardar en DynamoDB (status: pending)                               │
│  • Publicar a SNS                                                       │
│  • Retornar respuesta 201                                              │
└────┬──────────────────────────────────────────────┬──────────────────────┘
     │                                              │
     │ write                                        │ read/update
     ↓                                              ↓
┌──────────────────┐                    ┌──────────────────────────┐
│   DYNAMODB       │◄───────────────────│  LAMBDA: appointment     │
│   appointments   │    update status   │  (completion handler)    │
│                  │                    └──────────▲───────────────┘
│  Attributes:     │                               │
│  • appointmentId │                               │ read
│  • insuredId     │                               │
│  • scheduleId    │                    ┌──────────┴───────────────┐
│  • countryISO    │                    │   SQS: Completion        │
│  • status        │                    │   appointment-completion │
│  • createdAt     │                    └──────────▲───────────────┘
│  • transactionId │                               │
│                  │                               │ send
│  GSI:            │                    ┌──────────┴───────────────┐
│  • InsuredIdIdx  │                    │   EVENTBRIDGE            │
└──────────────────┘                    │   appointment-events     │
                                        │                          │
     │ publish                          │  Rule: AppointmentCompleted
     ↓                                  └──────────▲───────────────┘
┌──────────────────────────────────────────────────┘
│                                                  │ put event
│         ┌────────────────┬────────────────┐
│         │                │                │
│         ↓                ↓                │
│  ┌──────────────┐  ┌──────────────┐      │
│  │ SNS Topic PE │  │ SNS Topic CL │      │
│  └──────┬───────┘  └──────┬───────┘      │
│         │                 │               │
│         │ subscribe       │ subscribe     │
│         ↓                 ↓               │
│  ┌──────────────┐  ┌──────────────┐      │
│  │  SQS PE      │  │  SQS CL      │      │
│  │  + DLQ PE    │  │  + DLQ CL    │      │
│  └──────┬───────┘  └──────┬───────┘      │
│         │                 │               │
│         │ poll            │ poll          │
│         ↓                 ↓               │
│  ┌──────────────┐  ┌──────────────┐      │
│  │ LAMBDA:      │  │ LAMBDA:      │      │
│  │appointment_pe│  │appointment_cl│      │
│  │              │  │              │      │
│  │ Procesa PE   │  │ Procesa CL   │      │
│  └──────┬───────┘  └──────┬───────┘      │
│         │                 │               │
│         │ write           │ write         │
│         ↓                 ↓               │
│  ┌──────────────┐  ┌──────────────┐      │
│  │  RDS MySQL   │  │  RDS MySQL   │      │
│  │  Perú (PE)   │  │  Chile (CL)  │      │
│  │              │  │              │      │
│  │ appointments │  │ appointments │      │
│  │ centers      │  │ centers      │      │
│  │ specialties  │  │ specialties  │      │
│  │ medics       │  │ medics       │      │
│  └──────────────┘  └──────────────┘      │
│         │                 │               │
│         └─────────┬───────┘               │
│                   │ publish event         │
│                   └───────────────────────┘
└─────────────────────────────────────────────
```

## Diagrama de Estados

```
┌─────────────────┐
│   PENDING       │  ← Estado inicial al crear
└────────┬────────┘
         │
         │ Procesamiento asíncrono:
         │ • Lambda PE/CL lee de SQS
         │ • Guarda en RDS
         │ • Publica evento
         │
         ↓
┌─────────────────┐
│   COMPLETED     │  ← Estado final exitoso
└─────────────────┘

         O
         
┌─────────────────┐
│   FAILED        │  ← Estado si algo falla
└─────────────────┘
```

## Diagrama de Secuencia - Crear Agendamiento

```
Cliente  API-GW  Lambda   DynamoDB   SNS    SQS    Lambda-PE   RDS    EventBridge  SQS-Comp  Lambda-Comp
  │        │       │         │        │      │         │        │         │           │          │
  ├POST────▶│      │         │        │      │         │        │         │           │          │
  │        ├invoke─▶│        │        │      │         │        │         │           │          │
  │        │       ├validate│        │      │         │        │         │           │          │
  │        │       ├write───▶│       │      │         │        │         │           │          │
  │        │       │◀────────┤       │      │         │        │         │           │          │
  │        │       ├publish─────────▶│     │         │        │         │           │          │
  │        │       │         │        ├send─▶│        │        │         │           │          │
  │        │◀──201─┤         │        │      │         │        │         │           │          │
  │◀───────┤       │         │        │      │         │        │         │           │          │
  │        │       │         │        │      ├poll────▶│       │         │           │          │
  │        │       │         │        │      │         ├write──▶│        │           │          │
  │        │       │         │        │      │         │◀───────┤        │           │          │
  │        │       │         │        │      │         ├publish─────────▶│          │          │
  │        │       │         │        │      │         │        │         ├send──────▶│         │
  │        │       │         │        │      │         │        │         │           ├poll────▶│
  │        │       │         │        │      │         │        │         │           │         │
  │        │       │         │◀─────update (status: completed)────────────────────────┼─────────┤
  │        │       │         │        │      │         │        │         │           │         │
```

## Diagrama de Componentes - Arquitectura en Capas

```
┌───────────────────────────────────────────────────────────────────┐
│                        CAPA DE HANDLERS                           │
│                      (Presentation Layer)                         │
├───────────────────────────────────────────────────────────────────┤
│  • appointment.handler.ts           (HTTP → Lambda)              │
│  • appointment-pe.handler.ts        (SQS → Lambda)               │
│  • appointment-cl.handler.ts        (SQS → Lambda)               │
│  • appointment-completion.handler.ts (SQS → Lambda)              │
│                                                                   │
│  Responsabilidades:                                               │
│  - Recibir eventos (HTTP, SQS)                                   │
│  - Crear/extraer Context                                         │
│  - Invocar Services                                              │
│  - Formatear respuestas                                          │
└───────────────────────────┬───────────────────────────────────────┘
                            │ calls
                            ↓
┌───────────────────────────────────────────────────────────────────┐
│                        CAPA DE SERVICES                           │
│                      (Business Logic Layer)                       │
├───────────────────────────────────────────────────────────────────┤
│  • appointment.service.ts                                        │
│  • appointment-processor.service.ts                              │
│                                                                   │
│  Responsabilidades:                                               │
│  - Lógica de negocio                                             │
│  - Validaciones de dominio                                       │
│  - Orquestación de repositorios                                  │
│  - Coordinación de integraciones                                 │
└───────────────────────────┬───────────────────────────────────────┘
                            │ uses
                            ↓
┌───────────────────────────────────────────────────────────────────┐
│                        CAPA DE MAPPERS                            │
│                    (Transformation Layer)                         │
├───────────────────────────────────────────────────────────────────┤
│  • appointment.mapper.ts                                         │
│                                                                   │
│  Responsabilidades:                                               │
│  - DTO ↔ Entity transformations                                  │
│  - Message ↔ Entity conversions                                  │
│  - Data structure adaptations                                    │
└───────────────────────────┬───────────────────────────────────────┘
                            │ uses
                            ↓
┌───────────────────────────────────────────────────────────────────┐
│                     CAPA DE REPOSITORIES                          │
│                      (Data Access Layer)                          │
├───────────────────────────────────────────────────────────────────┤
│  • appointment-dynamo.repository.ts                              │
│  • appointment-rds.repository.ts                                 │
│                                                                   │
│  Responsabilidades:                                               │
│  - CRUD operations                                               │
│  - Queries específicas                                           │
│  - Abstracción de acceso a datos                                 │
└───────────────────────────┬───────────────────────────────────────┘
                            │ accesses
                            ↓
┌───────────────────────────────────────────────────────────────────┐
│                        BASES DE DATOS                             │
├───────────────────────────────────────────────────────────────────┤
│  • DynamoDB (temporal)                                           │
│  • RDS MySQL PE (persistente)                                    │
│  • RDS MySQL CL (persistente)                                    │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                    CAPAS TRANSVERSALES                            │
├───────────────────────────────────────────────────────────────────┤
│  • Middleware (context.ts)          - Context propagation        │
│  • Validators (appointment.validator.ts) - Input validation      │
│  • Utils (logger, environment, http-response)                    │
│  • Integrations (sns, eventbridge, schedule clients)             │
│  • Entities (domain models)                                      │
│  • DTOs (data transfer objects)                                  │
└───────────────────────────────────────────────────────────────────┘
```

## Diagrama de Trazabilidad

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cliente envía request                        │
│  Headers: Application-ID, Transaction-ID (opcional)             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              Lambda: appointment (handler)                      │
│  Context = {                                                    │
│    applicationId: "web-app",                                    │
│    transactionId: "550e8400-...",                              │
│    timestamp: "2024-10-23T10:00:00Z"                           │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ (propaga Context)
┌─────────────────────────────────────────────────────────────────┐
│                  Service Layer                                  │
│  Logger.info(ctx, "Mensaje", data)                             │
│  → Log: {                                                       │
│      applicationId: "web-app",                                  │
│      transactionId: "550e8400-...",                            │
│      msg: "Mensaje"                                             │
│    }                                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ (propaga Context)
┌─────────────────────────────────────────────────────────────────┐
│                Repository Layer                                 │
│  Logger.debug(ctx, "Query", params)                            │
│  → Log correlacionado con mismo transactionId                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ (Context en mensaje)
┌─────────────────────────────────────────────────────────────────┐
│                  SNS Message                                    │
│  {                                                              │
│    appointmentId: "...",                                        │
│    context: {                                                   │
│      applicationId: "web-app",                                  │
│      transactionId: "550e8400-..."                             │
│    }                                                            │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│            Lambda Procesador (PE/CL)                            │
│  Extrae Context del mensaje                                     │
│  Todos los logs tienen el mismo transactionId                   │
│  → Trazabilidad completa end-to-end                            │
└─────────────────────────────────────────────────────────────────┘
```

## Diagrama de Despliegue AWS

```
┌─────────────────────────────────────────────────────────────────┐
│                          AWS CLOUD                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    VPC (opcional)                        │   │
│  │                                                          │   │
│  │  ┌────────────────┐  ┌────────────────┐                │   │
│  │  │  RDS MySQL PE  │  │  RDS MySQL CL  │                │   │
│  │  │  Private Subnet│  │  Private Subnet│                │   │
│  │  └────────────────┘  └────────────────┘                │   │
│  │                                                          │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │  Security Group: RDS                              │  │   │
│  │  │  • Inbound: 3306 from Lambda Security Group      │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Lambda Functions                            │   │
│  │  • appointment (512 MB, 30s timeout)                    │   │
│  │  • appointment_pe (512 MB, 30s timeout)                 │   │
│  │  • appointment_cl (512 MB, 30s timeout)                 │   │
│  │  • appointment_completion (512 MB, 30s timeout)         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              DynamoDB                                    │   │
│  │  • Table: appointments-{stage}                          │   │
│  │  • Billing: On-Demand                                   │   │
│  │  • Encryption: At Rest                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SNS Topics                                  │   │
│  │  • appointment-topic-pe-{stage}                         │   │
│  │  • appointment-topic-cl-{stage}                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SQS Queues                                  │   │
│  │  • appointment-queue-pe-{stage}                         │   │
│  │  • appointment-queue-cl-{stage}                         │   │
│  │  • appointment-completion-queue-{stage}                 │   │
│  │  • DLQ PE, DLQ CL                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              EventBridge                                 │   │
│  │  • Bus: appointment-events-{stage}                      │   │
│  │  • Rule: appointment-completion-rule                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CloudWatch Logs                             │   │
│  │  • /aws/lambda/medical-appointment-api-{stage}-*        │   │
│  │  • Retention: 7 days (configurable)                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              IAM Roles                                   │   │
│  │  • Lambda Execution Role                                │   │
│  │  • DynamoDB Access                                      │   │
│  │  • SNS Publish                                          │   │
│  │  • SQS Send/Receive                                     │   │
│  │  • EventBridge PutEvents                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

