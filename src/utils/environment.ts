/**
 * Centralización de variables de entorno
 * Facilita el acceso y validación de configuración
 */
export class Environment {
  // General
  static readonly STAGE = process.env.STAGE || 'dev';
  static readonly LOG_LEVEL = process.env.LOG_LEVEL || 'info';
  static readonly AWS_REGION = process.env.AWS_REGION || 'us-east-1';

  // DynamoDB
  static readonly DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'appointments-dev';

  // SNS
  static readonly SNS_TOPIC_PE = process.env.SNS_TOPIC_PE || '';
  static readonly SNS_TOPIC_CL = process.env.SNS_TOPIC_CL || '';

  // SQS
  static readonly SQS_PE = process.env.SQS_PE || '';
  static readonly SQS_CL = process.env.SQS_CL || '';
  static readonly SQS_COMPLETION = process.env.SQS_COMPLETION || '';

  // EventBridge
  static readonly EVENTBRIDGE_BUS = process.env.EVENTBRIDGE_BUS || '';

  // RDS MySQL - Perú
  static readonly RDS_HOST_PE = process.env.RDS_HOST_PE || '';
  static readonly RDS_PORT_PE = parseInt(process.env.RDS_PORT_PE || '3306');
  static readonly RDS_DATABASE_PE = process.env.RDS_DATABASE_PE || '';
  static readonly RDS_USER_PE = process.env.RDS_USER_PE || '';
  static readonly RDS_PASSWORD_PE = process.env.RDS_PASSWORD_PE || '';

  // RDS MySQL - Chile
  static readonly RDS_HOST_CL = process.env.RDS_HOST_CL || '';
  static readonly RDS_PORT_CL = parseInt(process.env.RDS_PORT_CL || '3306');
  static readonly RDS_DATABASE_CL = process.env.RDS_DATABASE_CL || '';
  static readonly RDS_USER_CL = process.env.RDS_USER_CL || '';
  static readonly RDS_PASSWORD_CL = process.env.RDS_PASSWORD_CL || '';

  /**
   * Valida que todas las variables requeridas estén configuradas
   * @throws Error si falta alguna variable crítica
   */
  static validate(): void {
    const required = [
      'DYNAMODB_TABLE',
      'SNS_TOPIC_PE',
      'SNS_TOPIC_CL',
      'EVENTBRIDGE_BUS',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`);
    }
  }

  /**
   * Obtiene configuración de RDS según país
   * @param countryISO - Código ISO del país (PE o CL)
   * @returns Configuración de RDS
   */
  static getRDSConfig(countryISO: string): {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  } {
    if (countryISO === 'PE') {
      return {
        host: this.RDS_HOST_PE,
        port: this.RDS_PORT_PE,
        database: this.RDS_DATABASE_PE,
        user: this.RDS_USER_PE,
        password: this.RDS_PASSWORD_PE,
      };
    }

    if (countryISO === 'CL') {
      return {
        host: this.RDS_HOST_CL,
        port: this.RDS_PORT_CL,
        database: this.RDS_DATABASE_CL,
        user: this.RDS_USER_CL,
        password: this.RDS_PASSWORD_CL,
      };
    }

    throw new Error(`País no soportado: ${countryISO}`);
  }
}

