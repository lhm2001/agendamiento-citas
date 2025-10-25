# Guía de Despliegue

## Prerrequisitos

### 1. AWS CLI Configurado

```bash
aws configure
# AWS Access Key ID: YOUR_KEY
# AWS Secret Access Key: YOUR_SECRET
# Default region name: us-east-1
# Default output format: json
```

### 2. Verificar Credenciales

```bash
aws sts get-caller-identity
```

### 3. Preparar Bases de Datos RDS

Antes de desplegar, debes tener 2 instancias RDS MySQL:
- Una para Perú (PE)
- Una para Chile (CL)

#### Crear Schema en cada BD

```bash
# Para Perú
mysql -h your-rds-pe-endpoint.amazonaws.com -u admin -p appointments_pe < docs/database-schema.sql

# Para Chile  
mysql -h your-rds-cl-endpoint.amazonaws.com -u admin -p appointments_cl < docs/database-schema.sql
```

## Pasos de Despliegue

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` con las credenciales de RDS:

```env
RDS_HOST_PE=your-rds-pe-endpoint.amazonaws.com
RDS_PORT_PE=3306
RDS_DATABASE_PE=appointments_pe
RDS_USER_PE=admin
RDS_PASSWORD_PE=your_secure_password

RDS_HOST_CL=your-rds-cl-endpoint.amazonaws.com
RDS_PORT_CL=3306
RDS_DATABASE_CL=appointments_cl
RDS_USER_CL=admin
RDS_PASSWORD_CL=your_secure_password
```

### 3. Compilar TypeScript

```bash
npm run build
```

### 4. Desplegar a Desarrollo

```bash
npm run deploy:dev
```

Este comando:
- ✅ Crea la tabla DynamoDB
- ✅ Crea los tópicos SNS (PE y CL)
- ✅ Crea las colas SQS (PE, CL y completion)
- ✅ Crea el EventBridge bus y rule
- ✅ Despliega las 4 Lambda functions
- ✅ Crea el API Gateway
- ✅ Configura todos los permisos IAM

### 5. Verificar Despliegue

```bash
# Ver recursos desplegados
serverless info --stage dev

# Ver logs de una función
serverless logs -f appointment --stage dev --tail
```

### 6. Probar la API

```bash
# Obtener el endpoint de la API
export API_URL=$(serverless info --stage dev | grep "POST" | awk '{print $3}' | sed 's|/appointments||')

# Crear un agendamiento
curl -X POST $API_URL/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "insuredId": "00123",
    "scheduleId": 100,
    "countryISO": "PE"
  }'

# Listar agendamientos
curl $API_URL/appointments/00123
```

## Despliegue a Producción

### 1. Validar Tests

```bash
npm test
npm run test:coverage
```

### 2. Desplegar

```bash
npm run deploy:prod
```

### 3. Configurar Monitoreo

- Crear alarmas de CloudWatch
- Configurar logs de DynamoDB
- Habilitar X-Ray tracing (opcional)

## Rollback

Si algo sale mal:

```bash
# Ver versiones anteriores
serverless deploy list --stage dev

# Hacer rollback
serverless rollback --timestamp TIMESTAMP --stage dev
```

## Remover Stack Completo

⚠️ **PRECAUCIÓN**: Esto eliminará TODOS los recursos

```bash
serverless remove --stage dev
```

## Troubleshooting

### Error: "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error: "Access Denied" en AWS

Verificar que el usuario IAM tiene los permisos:
- CloudFormation
- Lambda
- DynamoDB
- SNS
- SQS
- EventBridge
- API Gateway
- CloudWatch Logs

### Error de Timeout en Lambda

Aumentar el timeout en `serverless.yml`:

```yaml
provider:
  timeout: 60  # segundos
```

### Logs no aparecen

```bash
# Ver logs directamente en CloudWatch
aws logs tail /aws/lambda/medical-appointment-api-dev-appointment --follow
```

## Costos Estimados

Para ambiente de desarrollo con poco tráfico:
- DynamoDB: $0-5/mes (on-demand)
- Lambda: $0-10/mes (1M invocaciones)
- API Gateway: $0-5/mes (<1M requests)
- SNS/SQS: $0-1/mes
- EventBridge: $0-1/mes
- RDS MySQL: $15-50/mes (depende de la instancia)

**Total estimado**: $15-75/mes

