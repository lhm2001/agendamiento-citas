# Guía de Contribución

## Principios de Código

### 1. Arquitectura en Capas

Siempre mantener la separación de responsabilidades:

```
Handlers → Services → Repositories → Database
         ↓          ↓
     Validators   Mappers
```

**❌ NO hacer**:
- Acceso directo a BD desde handlers
- Lógica de negocio en repositories
- Validaciones solo en handlers

**✅ HACER**:
- Validar en handlers con Joi
- Lógica de negocio en services
- Acceso a datos solo en repositories

### 2. Context Propagation

SIEMPRE pasar el Context como primer parámetro:

```typescript
// ✅ Correcto
async function createAppointment(ctx: Context, request: CreateAppointmentRequest) {
  Logger.info(ctx, 'Creando agendamiento');
  // ...
}

// ❌ Incorrecto
async function createAppointment(request: CreateAppointmentRequest) {
  // Sin contexto, sin trazabilidad
}
```

### 3. Tipado Fuerte

**❌ Evitar `any`**:
```typescript
// ❌ Incorrecto
function process(data: any) {
  return data.field;
}

// ✅ Correcto
function process(data: AppointmentDTO): string {
  return data.appointmentId;
}
```

### 4. Logging

```typescript
// ✅ Correcto - con contexto
Logger.info(ctx, 'Mensaje descriptivo', { additionalData: value });

// ❌ Incorrecto - sin contexto
console.log('Mensaje');
```

### 5. Manejo de Errores

```typescript
// ✅ Correcto
try {
  await service.process(ctx, data);
} catch (error) {
  Logger.error(ctx, 'Error procesando', error);
  throw error; // Re-lanzar si es necesario
}
```

## Proceso de Desarrollo

### 1. Branch Strategy

```bash
# Crear feature branch
git checkout -b feature/nombre-feature

# Crear bugfix branch
git checkout -b bugfix/nombre-bug
```

### 2. Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: agregar endpoint de cancelación
fix: corregir validación de insuredId
docs: actualizar README con ejemplos
test: agregar tests para appointment service
refactor: mejorar mapper de appointments
```

### 3. Tests

**Antes de hacer commit**:

```bash
npm test
npm run lint
npm run build
```

**Crear tests para**:
- Todas las funciones de services
- Todos los mappers
- Todos los validators

### 4. Pull Request

**Checklist**:
- [ ] Tests unitarios agregados/actualizados
- [ ] Todos los tests pasan
- [ ] Lint pasa sin errores
- [ ] Documentación actualizada
- [ ] README actualizado si es necesario
- [ ] Tipos TypeScript correctos (sin `any`)

## Estructura de Archivos

### Nuevos Services

```typescript
// src/services/new-service.service.ts
import { Context } from '../middleware/context';
import Logger from '../utils/logger';

export class NewService {
  constructor(
    // Inyectar dependencias
  ) {}

  async doSomething(ctx: Context, params: Params): Promise<Result> {
    Logger.info(ctx, 'Haciendo algo');
    // Lógica aquí
  }
}
```

### Nuevos Repositories

```typescript
// src/repositories/new.repository.ts
import { Context } from '../middleware/context';
import Logger from '../utils/logger';

export class NewRepository {
  async findById(ctx: Context, id: string): Promise<Entity | null> {
    Logger.debug(ctx, 'Buscando por ID', { id });
    // Acceso a datos aquí
  }
}
```

### Nuevos Handlers

```typescript
// src/handlers/new.handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createContext } from '../middleware/context';
import { successResponse, errorResponse } from '../utils/http-response';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const ctx = createContext();
  
  try {
    // Lógica del handler
    return successResponse(ctx, 200, { data: result });
  } catch (error) {
    return handleError(ctx, error);
  }
};
```

## Testing

### Tests de Services

```typescript
// src/__tests__/services/new-service.test.ts
import { NewService } from '../../services/new-service.service';
import { createContext } from '../../middleware/context';

describe('NewService', () => {
  let service: NewService;

  beforeEach(() => {
    service = new NewService();
  });

  it('debería hacer algo correctamente', async () => {
    const ctx = createContext('test');
    const result = await service.doSomething(ctx, params);
    expect(result).toBeDefined();
  });
});
```

## Estándares de Código

### Naming Conventions

- **Variables y funciones**: camelCase
- **Clases e interfaces**: PascalCase
- **Constantes**: UPPER_SNAKE_CASE
- **Archivos**: kebab-case

### Límites

- Funciones: máximo 50 líneas
- Archivos: máximo 500 líneas
- Parámetros: máximo 5 (usar objeto si son más)

### JSDoc

```typescript
/**
 * Descripción breve de la función
 * @param ctx - Contexto de ejecución
 * @param param - Descripción del parámetro
 * @returns Descripción del retorno
 * @throws Error cuando algo falla
 */
async function doSomething(ctx: Context, param: string): Promise<Result> {
  // ...
}
```

## Preguntas Frecuentes

### ¿Dónde pongo validaciones?

1. **Validación de formato**: Joi en handlers
2. **Validación de negocio**: Services
3. **Validación de integridad**: Database constraints

### ¿Cómo manejo errores?

1. Loggear con Logger.error()
2. Re-lanzar si es error fatal
3. Retornar error response apropiado en handlers

### ¿Cuándo usar async/await?

Siempre que hagas I/O:
- Base de datos
- APIs externas
- AWS services
- File system

## Recursos

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

