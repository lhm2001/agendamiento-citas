# Arquitectura del Proyecto API-EXTORNO

## Índice
1. [Visión General](#visión-general)
2. [Patrón Arquitectónico](#patrón-arquitectónico)
3. [Estructura de Capas](#estructura-de-capas)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Flujo de Datos](#flujo-de-datos)
6. [Conexiones a Bases de Datos](#conexiones-a-bases-de-datos)
7. [Middleware y Trazabilidad](#middleware-y-trazabilidad)
8. [Validación y Seguridad](#validación-y-seguridad)
9. [Diagramas](#diagramas)

---

## Visión General

**API-EXTORNO** es un servicio REST desarrollado para gestionar provisiones y extornos, siguiendo una **arquitectura en capas (Layered Architecture)** con separación clara de responsabilidades y alta cohesión.

### Características Principales
- ✅ **Arquitectura en Capas**: Separación clara entre presentación, lógica de negocio y acceso a datos
- ✅ **TypeScript**: Tipado fuerte para mayor seguridad y mantenibilidad
- ✅ **Multi-Base de Datos**: Conexiones a PostgreSQL (escritura/lectura) y SQL Server (solo lectura)
- ✅ **Trazabilidad Completa**: Sistema de contexto que propaga IDs de transacción en todas las capas
- ✅ **Validación Robusta**: Validación de entrada con Joi en todas las rutas
- ✅ **Documentación Automática**: Swagger/OpenAPI 3.0 integrado

---

## Patrón Arquitectónico

El proyecto implementa una **Arquitectura en Capas (Layered Architecture)** con las siguientes características:

### Principios Fundamentales

1. **Separación de Responsabilidades (SoC)**
   - Cada capa tiene una responsabilidad única y bien definida
   - No hay mezcla de lógica de negocio con acceso a datos o presentación

2. **Flujo Unidireccional**
   - El flujo de datos va desde las capas superiores (Controllers) hacia las inferiores (Repositories)
   - Las capas inferiores NO conocen ni dependen de las capas superiores

3. **Inyección de Dependencias**
   - Las dependencias se inyectan (se pasan como parámetros) en lugar de ser creadas internamente
   - Facilita el testing y la modularidad

4. **Principio de Single Responsibility**
   - Funciones máximo de 50 líneas
   - Clases máximo de 500 líneas
   - Una responsabilidad por clase/función

---

## Estructura de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                     │
│                  (Routes & Controllers)                     │
├─────────────────────────────────────────────────────────────┤
│  • Rutas HTTP (extornos.route.ts, evento.route.ts)        │
│  • Controladores (extornos.controller.ts)                  │
│  • Validación de entrada (Joi schemas)                     │
│  • Manejo de errores HTTP (Boom)                           │
│  • Creación del Context para trazabilidad                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE NEGOCIO                          │
│                      (Services)                             │
├─────────────────────────────────────────────────────────────┤
│  • Lógica de negocio (extornos.service.ts)                │
│  • Orquestación de operaciones                             │
│  • Validaciones de negocio                                 │
│  • Transformaciones complejas                              │
│  • Coordinación entre múltiples repositorios               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  CAPA DE TRANSFORMACIÓN                     │
│                       (Mappers)                             │
├─────────────────────────────────────────────────────────────┤
│  • Mapeo entre DTOs y Entidades                            │
│  • Transformación de formatos                              │
│  • Conversión de estructuras de datos                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 CAPA DE ACCESO A DATOS                      │
│                     (Repositories)                          │
├─────────────────────────────────────────────────────────────┤
│  • Operaciones CRUD con TypeORM                            │
│  • Queries específicas                                      │
│  • Transacciones de base de datos                          │
│  • Abstracción del acceso a datos                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     BASES DE DATOS                          │
├─────────────────────────────────────────────────────────────┤
│  • PostgreSQL (Extornos) - Lectura/Escritura              │
│  • SQL Server (Exactus) - Solo Lectura                     │
└─────────────────────────────────────────────────────────────┘
```

### Capas Horizontales

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPAS TRANSVERSALES                      │
├─────────────────────────────────────────────────────────────┤
│  • Middleware (context.ts) - Trazabilidad                  │
│  • Utils (logger.ts, environment.ts) - Utilidades          │
│  • Entities - Definición de modelos de dominio             │
│  • DTOs - Objetos de transferencia de datos                │
│  • Integrations - Conexión con servicios externos          │
└─────────────────────────────────────────────────────────────┘
```

---

## Descripción Detallada de Capas

### 1. Capa de Presentación (Routes & Controllers)

**Ubicación**: `src/routes/`, `src/controllers/`

**Responsabilidades**:
- Definir endpoints HTTP (GET, POST, PUT, DELETE)
- Validar datos de entrada con Joi
- Crear el objeto `Context` para trazabilidad
- Invocar servicios de la capa de negocio
- Formatear respuestas HTTP
- Manejo de errores con Boom

**Ejemplo de Flujo**:
```typescript
// 1. Route define el endpoint
server.route({
  method: 'POST',
  path: '/api/v1/extornos',
  options: {
    validate: {
      payload: createExtornoSchema // Validación Joi
    }
  },
  handler: extornosController.create
});

// 2. Controller recibe la petición
export const create = async (request: Request, h: ResponseToolkit) => {
  const ctx = getContext(request); // Crear contexto
  logger.debug(ctx, 'Creando extorno');
  
  const result = await extornosService.create(ctx, request.payload);
  return h.response(result).code(201);
}
```

**Características**:
- ❌ **NO contiene** lógica de negocio
- ❌ **NO accede** directamente a base de datos
- ✅ Solo maneja aspectos de protocolo HTTP
- ✅ Siempre crea y propaga el `Context`

---

### 2. Capa de Negocio (Services)

**Ubicación**: `src/services/`

**Responsabilidades**:
- Implementar reglas de negocio
- Validar lógica de dominio
- Orquestar operaciones complejas
- Coordinar múltiples repositorios
- Implementar transacciones de negocio
- Transformar datos entre capas

**Ejemplo**:
```typescript
export const addDetalleExtornoService = async (
  ctx: Context, 
  request: AgregarDetalleConFacturaRequest
): Promise<DetalleExtorno> => {
  logger.info(ctx, 'Iniciando proceso de agregar detalle');
  
  // 1. Validación de negocio
  const extorno = await extornoRepository.findOne(ctx, { id: request.id_extorno });
  if (!extorno) {
    throw new BusinessError('Extorno no encontrado');
  }
  
  // 2. Verificar duplicados
  const existe = await detalleExtornoRepository.findByFactura(ctx, request.num_fact);
  if (existe) {
    throw new BusinessError('Factura ya procesada');
  }
  
  // 3. Lógica de negocio: calcular nuevo saldo
  const nuevoSaldo = extorno.saldo - request.monto_factura;
  
  // 4. Operaciones coordinadas
  const detalle = await detalleExtornoRepository.save(ctx, nuevoDetalle);
  await extornoRepository.update(ctx, extorno.id, { saldo: nuevoSaldo });
  
  return detalle;
}
```

**Características**:
- ✅ Contiene **TODA** la lógica de negocio
- ✅ Coordina múltiples repositorios
- ✅ Implementa validaciones de dominio
- ❌ **NO contiene** SQL directo
- ❌ **NO maneja** códigos de estado HTTP

---

### 3. Capa de Mappers

**Ubicación**: `src/mappers/`

**Responsabilidades**:
- Transformar DTOs a Entidades
- Transformar Entidades a DTOs de respuesta
- Conversión entre diferentes modelos de datos
- Adaptación de estructuras externas a internas

**Ejemplo**:
```typescript
export class ExtornoMapper {
  static toEntity(dto: ExtornoDTO): Extorno {
    const entity = new Extorno();
    entity.oc = dto.ordenCompra;
    entity.monto_oc = dto.montoOrdenCompra;
    entity.fecha_creacion = new Date();
    return entity;
  }
  
  static toDTO(entity: Extorno): ExtornoResponseDTO {
    return {
      id: entity.id_extorno,
      ordenCompra: entity.oc,
      montoOrdenCompra: entity.monto_oc,
      saldo: entity.saldo,
      estado: entity.estado_oc?.descripcion
    };
  }
}
```

---

### 4. Capa de Acceso a Datos (Repositories)

**Ubicación**: `src/repositories/`

**Responsabilidades**:
- Operaciones CRUD con TypeORM
- Queries específicas y optimizadas
- Manejo de transacciones de BD
- Abstracción del acceso a datos

**Ejemplo**:
```typescript
const repository = ExtornosDataSource.getRepository(Extorno);

export const findOne = async (
  ctx: Context,
  select: any,
  relations: any,
  where: any
): Promise<Extorno | null> => {
  logger.debug(ctx, 'Buscando extorno', { where });
  
  return await repository.findOne({
    select,
    relations,
    where
  });
}

export const save = async (
  ctx: Context, 
  data: Partial<Extorno>
): Promise<Extorno> => {
  logger.debug(ctx, 'Guardando extorno');
  return await repository.save(data);
}
```

**Características**:
- ✅ Única capa que accede a base de datos
- ✅ Usa TypeORM exclusivamente (no SQL crudo)
- ✅ Registra logs de operaciones
- ❌ **NO contiene** lógica de negocio
- ❌ **NO hace** validaciones de dominio

---

### 5. Capa de Entidades (Models)

**Ubicación**: `src/entities/`, `src/repositories/models/` (legacy)

**Responsabilidades**:
- Definir estructura de tablas con decoradores TypeORM
- Mapeo objeto-relacional
- Definir relaciones entre entidades

**Ejemplo**:
```typescript
@Entity({ name: 'extornos', schema: 'public' })
export class Extorno {
  @PrimaryGeneratedColumn()
  id_extorno: number;
  
  @Column({ type: 'varchar', length: 50 })
  oc: string;
  
  @Column({ type: 'decimal', precision: 18, scale: 2 })
  monto_oc: number;
  
  @Column({ type: 'decimal', precision: 18, scale: 2 })
  saldo: number;
  
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'id_estado' })
  estado_oc: Catalogo;
  
  @OneToMany(() => DetalleExtorno, detalle => detalle.extorno)
  detalles: DetalleExtorno[];
}
```

---

### 6. Capas Transversales

#### 6.1 Middleware

**Ubicación**: `src/middleware/`

**Funciones**:
- **Context Middleware**: Crea el objeto de contexto con `applicationId` y `transactionId`
- **Response Headers Middleware**: Agrega headers de trazabilidad a las respuestas

```typescript
export const contextServerMiddleware = (server: Server) => {
  server.ext({
    type: 'onRequest',
    method: (request, h) => {
      const context = {
        applicationId: headers['Application-ID'] || '',
        transactionId: headers['Transaction-ID'] || uuidv4()
      };
      request.app.context = context;
      return h.continue;
    }
  });
};
```

#### 6.2 Utils

**Ubicación**: `src/utils/`

- **logger.ts**: Sistema de logging con Pino
- **environment.ts**: Centralización de variables de entorno
- **database.ts**: Configuración de conexiones a BD (legacy)

#### 6.3 DTOs

**Ubicación**: `src/dtos/`

**Propósito**: Objetos de transferencia de datos entre cliente y API

```typescript
export interface ExtornoDTO {
  ordenCompra: string;
  montoOrdenCompra: number;
  usuario: string;
}

export interface ExtornoResponseDTO {
  id: number;
  ordenCompra: string;
  montoOrdenCompra: number;
  saldo: number;
  estado: string;
}
```

#### 6.4 Integrations

**Ubicación**: `src/integrations/`

**Propósito**: Consumo de APIs externas con Axios

---

## Stack Tecnológico

### Backend Core
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **Node.js** | 20+ | Runtime de JavaScript |
| **TypeScript** | 4.9.5 | Lenguaje con tipado estático |
| **Hapi.js** | 21.4.2 | Framework web HTTP |

### Base de Datos
| Tecnología | Propósito | Operaciones |
|-----------|-----------|-------------|
| **PostgreSQL** | BD principal (Extornos) | Lectura/Escritura |
| **SQL Server** | BD externa (Exactus) | Solo Lectura |
| **TypeORM** | ORM para acceso a datos | Queries y migraciones |

### Validación y Documentación
| Tecnología | Propósito |
|-----------|-----------|
| **Joi** | Validación de entrada |
| **Hapi-Swagger** | Documentación OpenAPI 3.0 |
| **Boom** | Manejo de errores HTTP |

### Logging y Observabilidad
| Tecnología | Propósito |
|-----------|-----------|
| **Pino** | Logger de alto rendimiento |
| **pino-caller** | Agregar información del caller a logs |
| **UUID** | Generación de IDs de transacción |

### Testing
| Tecnología | Propósito |
|-----------|-----------|
| **Jest** | Framework de testing |
| **Supertest** | Testing de APIs HTTP |
| **ts-jest** | Soporte de TypeScript en Jest |

### DevOps
| Tecnología | Propósito |
|-----------|-----------|
| **Docker** | Containerización |
| **hapi-k8s-health** | Health checks para Kubernetes |

---

## Flujo de Datos

### Flujo de una Petición HTTP

```
1. Cliente HTTP
   │
   ↓
2. Hapi Server (index.ts)
   │
   ↓
3. Middleware: contextServerMiddleware
   │  - Crea Context con applicationId y transactionId
   │  - Adjunta Context al request
   │
   ↓
4. Route (extornos.route.ts)
   │  - Valida payload con Joi
   │  - Si falla: retorna 400 Bad Request
   │
   ↓
5. Controller (extornos.controller.ts)
   │  - Extrae Context del request
   │  - Registra log de inicio
   │  - Invoca Service
   │
   ↓
6. Service (extornos.service.ts)
   │  - Recibe Context como primer parámetro
   │  - Implementa lógica de negocio
   │  - Coordina múltiples repositorios
   │  - Registra logs con Context
   │
   ↓
7. Repository (extorno.repository.ts)
   │  - Recibe Context
   │  - Ejecuta query con TypeORM
   │  - Registra logs con Context
   │
   ↓
8. Base de Datos (PostgreSQL / SQL Server)
   │
   ↓
9. Repository retorna datos
   │
   ↓
10. Service procesa y transforma
   │
   ↓
11. Controller formatea respuesta HTTP
   │
   ↓
12. Middleware: responseHeadersMiddleware
   │  - Agrega headers de trazabilidad
   │
   ↓
13. Cliente recibe respuesta
```

### Ejemplo Concreto: Crear Extorno

```typescript
// 1. Request HTTP
POST /api/v1/extornos
Headers: {
  "Application-ID": "web-app-extornos",
  "Transaction-ID": "550e8400-e29b-41d4-a716-446655440000"
}
Body: {
  "oc": "OC-2024-001",
  "monto_oc": 15000.00,
  "num_fact": "F-001",
  "monto_factura": 5000.00,
  "usuario": "lheredia"
}

// 2. Route valida con Joi
const createExtornoSchema = Joi.object({
  oc: Joi.string().required(),
  monto_oc: Joi.number().positive().required(),
  num_fact: Joi.string().required(),
  monto_factura: Joi.number().positive().required(),
  usuario: Joi.string().required()
});

// 3. Controller extrae Context y llama Service
export const create = async (request: Request, h: ResponseToolkit) => {
  const ctx = getContext(request);
  logger.info(ctx, 'Creando extorno');
  
  const resultado = await createExtornoWithDetalle(ctx, request.payload);
  return h.response(resultado).code(201);
}

// 4. Service implementa lógica
export const createExtornoWithDetalle = async (
  ctx: Context, 
  request: CreateExtornoRequest
) => {
  logger.info(ctx, 'Proceso de crear extorno con detalle');
  
  // Transacción
  const queryRunner = ExtornosDataSource.createQueryRunner();
  await queryRunner.startTransaction();
  
  try {
    // Crear extorno principal
    const extorno = await extornoRepository.save(ctx, {...});
    logger.info(ctx, `Extorno creado: ${extorno.id_extorno}`);
    
    // Crear detalle
    const detalle = await detalleExtornoRepository.save(ctx, {...});
    logger.info(ctx, `Detalle creado: ${detalle.id_detalle_extorno}`);
    
    await queryRunner.commitTransaction();
    
    return { extorno, detalle };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    logger.error(ctx, 'Error creando extorno', error);
    throw error;
  }
}

// 5. Repository ejecuta con TypeORM
export const save = async (ctx: Context, data: Partial<Extorno>) => {
  logger.debug(ctx, 'Guardando extorno en BD');
  return await repository.save(data);
}

// 6. Response HTTP
201 Created
Headers: {
  "Application-ID": "web-app-extornos",
  "Transaction-ID": "550e8400-e29b-41d4-a716-446655440000"
}
Body: {
  "success": true,
  "data": {
    "extorno": { "id_extorno": 123, ... },
    "detalle": { "id_detalle_extorno": 456, ... }
  }
}
```

---

## Conexiones a Bases de Datos

### Arquitectura de Conexiones

```
┌─────────────────────────────────────────────────────────────┐
│                       API-EXTORNO                           │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴──────────────┐
            │                              │
            ↓                              ↓
┌──────────────────────┐        ┌──────────────────────┐
│  ExtornosDataSource  │        │  ExactusDataSource   │
│    (PostgreSQL)      │        │   (SQL Server)       │
└──────────────────────┘        └──────────────────────┘
         │                                 │
         │ Read/Write                      │ Read Only
         │                                 │
         ↓                                 ↓
┌──────────────────────┐        ┌──────────────────────┐
│   PostgreSQL DB      │        │   SQL Server DB      │
│   (extornos_db)      │        │    (Exactus)         │
├──────────────────────┤        ├──────────────────────┤
│ • extornos           │        │ • ORDEN_COMPRA       │
│ • detalle_extorno    │        │ • TIPO_CAMBIO        │
│ • eventos            │        │ • (otras tablas)     │
│ • catalogo           │        │                      │
└──────────────────────┘        └──────────────────────┘
```

### Configuración en database.ts

```typescript
// Conexión PostgreSQL - Lectura/Escritura
export const ExtornosDataSource = new DataSource({
  type: 'postgres',
  host: env.POSTGRES_HOST,
  port: parseInt(env.POSTGRES_PORT || '5432'),
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DATABASE,
  schema: env.POSTGRES_SCHEMA || 'public',
  synchronize: false, // NUNCA true en producción
  logging: env.NODE_ENV === 'development',
  entities: [Catalogo, Extorno, DetalleExtorno, TiposEvento, Evento]
});

// Conexión SQL Server - Solo Lectura
export const ExactusDataSource = new DataSource({
  type: 'mssql',
  host: env.SQLSERVER_HOST,
  port: parseInt(env.SQLSERVER_PORT || '1433'),
  username: env.SQLSERVER_USER,
  password: env.SQLSERVER_PASSWORD,
  database: env.SQLSERVER_DATABASE,
  synchronize: false,
  logging: env.NODE_ENV === 'development',
  entities: [OrdenCompra, TipoCambio],
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
});
```

### Inicialización

```typescript
// En index.ts
await initializeDataSources();

// Función de inicialización
export const initializeDataSources = async (): Promise<void> => {
  try {
    // PostgreSQL
    if (!ExtornosDataSource.isInitialized) {
      await ExtornosDataSource.initialize();
      console.log('✅ Conexión PostgreSQL establecida');
    }
    
    // SQL Server
    if (!ExactusDataSource.isInitialized) {
      await ExactusDataSource.initialize();
      console.log('✅ Conexión SQL Server establecida');
    }
  } catch (error) {
    console.error('❌ Error conectando a bases de datos:', error);
    throw error;
  }
};
```

---

## Middleware y Trazabilidad

### Sistema de Context

El sistema de `Context` permite trazabilidad completa de todas las operaciones a través de las capas.

#### Estructura del Context

```typescript
export class Context {
  applicationId: string;  // ID de la aplicación cliente
  transactionId: string;  // ID único de la transacción (UUID)
}
```

#### Flujo del Context

```
1. Cliente envía petición con headers
   Application-ID: "web-app-extornos"
   Transaction-ID: "550e8400-..." (opcional)
   
2. Middleware crea Context
   - Extrae applicationId del header
   - Genera transactionId si no viene
   - Adjunta Context al request
   
3. Controller extrae Context
   const ctx = getContext(request);
   
4. Service recibe Context como primer parámetro
   async function processExtorno(ctx: Context, data: any)
   
5. Repository recibe Context
   async function save(ctx: Context, entity: Extorno)
   
6. Logger usa Context en TODOS los logs
   logger.info(ctx, 'Procesando extorno', { id: 123 });
```

#### Beneficios de Trazabilidad

1. **Correlación de Logs**: Todos los logs de una transacción tienen el mismo `transactionId`
2. **Debugging**: Fácil seguimiento de una petición específica
3. **Auditoría**: Saber qué aplicación originó cada operación
4. **Monitoreo**: Métricas por aplicación y transacción

#### Ejemplo de Logs con Context

```json
{
  "level": "info",
  "time": 1698765432000,
  "applicationId": "web-app-extornos",
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "msg": "Creando extorno",
  "oc": "OC-2024-001"
}

{
  "level": "info",
  "time": 1698765432100,
  "applicationId": "web-app-extornos",
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "msg": "Extorno creado con ID: 123"
}

{
  "level": "info",
  "time": 1698765432200,
  "applicationId": "web-app-extornos",
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "msg": "Detalle de extorno creado con ID: 456"
}
```

Con el mismo `transactionId`, puedes correlacionar todos los logs de esa operación.

---

## Validación y Seguridad

### Validación en Múltiples Capas

```
┌─────────────────────────────────────────────────────┐
│  1. Validación de Entrada (Joi en Routes)          │
│     - Tipos de datos                                │
│     - Campos requeridos                             │
│     - Formatos (email, UUID, etc.)                  │
│     - Rangos numéricos                              │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  2. Validación de Negocio (Services)                │
│     - Registros existentes                          │
│     - Reglas de dominio                             │
│     - Estados válidos                               │
│     - Permisos                                      │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  3. Validación de Integridad (BD)                   │
│     - Constraints                                   │
│     - Foreign keys                                  │
│     - Unique constraints                            │
└─────────────────────────────────────────────────────┘
```

### Ejemplo de Validación Joi

```typescript
const createExtornoSchema = Joi.object({
  oc: Joi.string()
    .pattern(/^OC-\d{4}-\d+$/)
    .required()
    .messages({
      'string.pattern.base': 'OC debe tener formato OC-YYYY-NNN'
    }),
  
  monto_oc: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Monto debe ser mayor a 0'
    }),
  
  num_fact: Joi.string()
    .max(50)
    .required(),
  
  monto_factura: Joi.number()
    .positive()
    .precision(2)
    .max(Joi.ref('monto_oc'))
    .required()
    .messages({
      'number.max': 'Monto factura no puede exceder monto OC'
    }),
  
  usuario: Joi.string()
    .min(3)
    .max(50)
    .required()
});
```

### Seguridad en Queries

**✅ CORRECTO - Usar TypeORM con parámetros**
```typescript
// Repository con parámetros seguros
const extorno = await repository.findOne({
  where: { oc: ocNumber, id_estado: estadoId }
});
```

**❌ INCORRECTO - SQL crudo sin parametrización**
```typescript
// NUNCA hacer esto (vulnerable a SQL injection)
const query = `SELECT * FROM extornos WHERE oc = '${ocNumber}'`;
```

### Manejo de Errores Seguro

```typescript
// Controller con manejo de errores
export const create = async (request: Request, h: ResponseToolkit) => {
  try {
    const ctx = getContext(request);
    const result = await extornosService.create(ctx, request.payload);
    return h.response(result).code(201);
  } catch (error: any) {
    logger.error(ctx, 'Error creando extorno', error);
    
    // NO exponer detalles técnicos al cliente
    if (Boom.isBoom(error)) {
      return error;
    }
    
    // Error genérico para el cliente
    return Boom.internal('Error procesando solicitud');
  }
}
```

---

## Diagramas

### Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────┐
│                      SISTEMA API-EXTORNO                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              HAPI SERVER (index.ts)                │    │
│  │  • Configuración del servidor                      │    │
│  │  • Registro de plugins (Swagger, Health)          │    │
│  │  • Registro de rutas                               │    │
│  └────────────────────────────────────────────────────┘    │
│                         │                                    │
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │           MIDDLEWARE (context.ts)                  │    │
│  │  • Context creation                                │    │
│  │  • Transaction ID generation                       │    │
│  └────────────────────────────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────┴──────────────────────┐           │
│  │                                              │           │
│  ↓                                              ↓           │
│  ┌─────────────────────┐        ┌─────────────────────┐   │
│  │   ROUTES            │        │   CONTROLLERS       │   │
│  │  • extornos.route   │───────▶│  • extornos.ctrl    │   │
│  │  • evento.route     │        │  • evento.ctrl      │   │
│  └─────────────────────┘        └─────────────────────┘   │
│                                            │                │
│                                            ↓                │
│                         ┌─────────────────────────────┐    │
│                         │       SERVICES              │    │
│                         │  • extornos.service         │    │
│                         │  • evento.service           │    │
│                         │  • catalogo.service         │    │
│                         │  • cloud-storage.service    │    │
│                         │  • exactus-consultas.srv    │    │
│                         └─────────────────────────────┘    │
│                         │                 │                │
│          ┌──────────────┴─────┐          │                │
│          ↓                     ↓          ↓                │
│  ┌─────────────┐      ┌─────────────┐   ┌──────────┐     │
│  │  MAPPERS    │      │ REPOSITORIES│   │ INTEGRA- │     │
│  │ • extornos  │      │ • extorno   │   │  TIONS   │     │
│  │ • evento    │      │ • detalle   │   │          │     │
│  └─────────────┘      │ • evento    │   └──────────┘     │
│                        │ • catalogo  │                     │
│                        └─────────────┘                     │
│                                │                           │
│                    ┌───────────┴───────────┐               │
│                    ↓                       ↓               │
│         ┌─────────────────┐     ┌─────────────────┐       │
│         │  PostgreSQL DB  │     │ SQL Server DB   │       │
│         │  (Extornos)     │     │  (Exactus)      │       │
│         │  Read/Write     │     │  Read Only      │       │
│         └─────────────────┘     └─────────────────┘       │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │         UTILS (Transversales)                      │  │
│  │  • logger.ts                                       │  │
│  │  • environment.ts                                  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### Diagrama de Secuencia: Crear Extorno

```
Cliente    Route    Controller    Service    Repository    PostgreSQL
  │          │           │            │            │             │
  ├─POST────▶│           │            │            │             │
  │          │           │            │            │             │
  │          ├─validate─▶│            │            │             │
  │          │  (Joi)    │            │            │             │
  │          │           │            │            │             │
  │          │◀──────────┤            │            │             │
  │          │           │            │            │             │
  │          ├─handler──▶│            │            │             │
  │          │           │            │            │             │
  │          │           ├─getContext─┤            │             │
  │          │           │            │            │             │
  │          │           ├─service────┼───────────▶│             │
  │          │           │            │            │             │
  │          │           │            ├─validate   │             │
  │          │           │            │  (negocio) │             │
  │          │           │            │            │             │
  │          │           │            ├─save──────▶│             │
  │          │           │            │            │             │
  │          │           │            │            ├─INSERT─────▶│
  │          │           │            │            │             │
  │          │           │            │            │◀─result────┤
  │          │           │            │            │             │
  │          │           │            │◀─entity───┤             │
  │          │           │            │            │             │
  │          │           │◀─result────┤            │             │
  │          │           │            │            │             │
  │          │◀─response─┤            │            │             │
  │          │           │            │            │             │
  │◀─201────┤            │            │            │             │
  │          │           │            │            │             │
```

---

## Ventajas de esta Arquitectura

### ✅ Mantenibilidad
- **Separación clara**: Cada capa tiene responsabilidades bien definidas
- **Fácil de entender**: La estructura es predecible y consistente
- **Fácil de modificar**: Cambios en una capa no afectan otras

### ✅ Testabilidad
- **Mocking sencillo**: Cada capa puede ser testeada independientemente
- **Tests unitarios**: Services y repositories son fáciles de testear
- **Tests de integración**: Controllers pueden testearse con servicios mockeados

### ✅ Escalabilidad
- **Horizontal**: Múltiples instancias del API sin problemas
- **Vertical**: Cada capa puede optimizarse independientemente
- **Modular**: Fácil agregar nuevos módulos sin afectar existentes

### ✅ Trazabilidad
- **Context propagation**: Trazabilidad completa de cada petición
- **Logging consistente**: Todos los logs tienen estructura uniforme
- **Debugging facilitado**: Fácil seguir el flujo de una transacción

### ✅ Seguridad
- **Validación en capas**: Entrada, negocio e integridad
- **TypeORM parametrizado**: Protección contra SQL injection
- **Manejo de errores seguro**: No expone detalles internos

---

## Patrones de Diseño Utilizados

### 1. Layered Architecture (Arquitectura en Capas)
- Separación horizontal de responsabilidades
- Dependencias unidireccionales

### 2. Repository Pattern
- Abstracción del acceso a datos
- Independencia de la tecnología de persistencia

### 3. Dependency Injection
- Context y dependencias se inyectan
- Facilita testing y desacoplamiento

### 4. DTO Pattern (Data Transfer Object)
- Objetos específicos para transferencia de datos
- Desacopla estructura interna de API pública

### 5. Mapper Pattern
- Transformación entre diferentes representaciones
- Separación entre modelos de dominio y DTOs

### 6. Service Layer Pattern
- Lógica de negocio centralizada
- Orquestación de operaciones

### 7. Middleware Pattern
- Procesamiento transversal de peticiones
- Context creation, logging, headers

---

## Convenciones y Estándares

### Nomenclatura

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Variables y funciones | camelCase | `const numeroFactura` |
| Clases e Interfaces | PascalCase | `class ExtornoService` |
| Constantes | UPPER_SNAKE_CASE | `const MAX_RETRY_COUNT` |
| Archivos | kebab-case | `extorno.service.ts` |
| Enums | PascalCase + valores UPPER_SNAKE_CASE | `EstadoExtorno.PENDIENTE` |

### Límites de Código
- **Funciones**: Máximo 50 líneas
- **Clases**: Máximo 500 líneas

### Organización de Imports
```typescript
// 1. Node.js nativo
import * as crypto from 'crypto';

// 2. Dependencias externas
import { Request, ResponseToolkit } from '@hapi/hapi';
import * as Joi from 'joi';

// 3. Internos absolutos
import { logger } from '../utils/logger';
import { Context } from '../middleware/context';

// 4. Relativos
import { ExtornoRepository } from './extorno.repository';
```

### JSDoc Obligatorio
```typescript
/**
 * Crea un extorno con su detalle asociado
 * @param ctx - Contexto de la aplicación para trazabilidad
 * @param request - Datos del extorno a crear
 * @returns Extorno creado con su detalle
 * @throws BusinessError cuando la validación de negocio falla
 */
export async function createExtornoWithDetalle(
  ctx: Context, 
  request: CreateExtornoRequest
): Promise<ExtornoResult> {
  // ...
}
```

---

## Consideraciones de Deployment

### Variables de Entorno Requeridas

```bash
# Node
NODE_ENV=production
PORT=8080
LOG_LEVEL=info

# PostgreSQL
POSTGRES_HOST=postgres-extornos.example.com
POSTGRES_PORT=5432
POSTGRES_DATABASE=extornos_db
POSTGRES_SCHEMA=public
POSTGRES_USER=extornos_user
POSTGRES_PASSWORD=***

# SQL Server
SQLSERVER_HOST=sqlserver-exactus.example.com
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=EXACTUS
SQLSERVER_USER=exactus_reader
SQLSERVER_PASSWORD=***

# Google Cloud Storage (opcional)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
GCS_BUCKET_NAME=extornos-archivos
```

### Health Checks

```
GET /liveness  → 200 OK (servidor vivo)
GET /readiness → 200 OK (servidor listo para recibir tráfico)
GET /documentation → Swagger UI
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

---

## Referencias y Documentación

- **Código Fuente**: `/src`
- **Tests**: `/tests`
- **Configuración BD**: [`/docs/databases.md`](./databases.md)
- **Integraciones**: [`/docs/integrations.md`](./integrations.md)
- **Deployment**: [`/docs/deployment.md`](./deployment.md)
- **OpenAPI**: [`/docs/openapi.json`](./openapi.json)
- **Swagger UI**: `http://localhost:8080/documentation`

---

## Conclusión

La arquitectura de **API-EXTORNO** implementa una **Arquitectura en Capas Limpia y Escalable** con:

✅ **Separación clara de responsabilidades**  
✅ **Trazabilidad completa mediante Context**  
✅ **Validación robusta en múltiples niveles**  
✅ **TypeScript para type-safety**  
✅ **Multi-base de datos con TypeORM**  
✅ **Documentación automática con Swagger**  
✅ **Testing facilitado por diseño modular**  
✅ **Estándares de código estrictos**  

Esta arquitectura garantiza **mantenibilidad**, **escalabilidad** y **calidad** del código a largo plazo.

---

**Autor**: Lucia Heredia  
**Última actualización**: Octubre 2025  
**Versión**: 1.0.0

