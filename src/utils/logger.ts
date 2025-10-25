import pino from 'pino';
import { Context } from '../middleware/context';

/**
 * Configuración del logger Pino para alto rendimiento
 */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Logger con contexto para trazabilidad
 */
export class Logger {
  /**
   * Log de nivel DEBUG
   * @param ctx - Contexto de ejecución
   * @param message - Mensaje a loggear
   * @param data - Datos adicionales
   */
  static debug(ctx: Context, message: string, data?: Record<string, unknown>): void {
    logger.debug({
      ...this.buildLogContext(ctx),
      ...data,
      msg: message,
    });
  }

  /**
   * Log de nivel INFO
   * @param ctx - Contexto de ejecución
   * @param message - Mensaje a loggear
   * @param data - Datos adicionales
   */
  static info(ctx: Context, message: string, data?: Record<string, unknown>): void {
    logger.info({
      ...this.buildLogContext(ctx),
      ...data,
      msg: message,
    });
  }

  /**
   * Log de nivel WARN
   * @param ctx - Contexto de ejecución
   * @param message - Mensaje a loggear
   * @param data - Datos adicionales
   */
  static warn(ctx: Context, message: string, data?: Record<string, unknown>): void {
    logger.warn({
      ...this.buildLogContext(ctx),
      ...data,
      msg: message,
    });
  }

  /**
   * Log de nivel ERROR
   * @param ctx - Contexto de ejecución
   * @param message - Mensaje a loggear
   * @param error - Error ocurrido
   * @param data - Datos adicionales
   */
  static error(ctx: Context, message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    logger.error({
      ...this.buildLogContext(ctx),
      ...data,
      msg: message,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    });
  }

  /**
   * Construye el contexto base para todos los logs
   * @param ctx - Contexto de ejecución
   * @returns Objeto con datos de contexto
   */
  private static buildLogContext(ctx: Context): Record<string, unknown> {
    return {
      applicationId: ctx.applicationId,
      transactionId: ctx.transactionId,
      timestamp: ctx.timestamp,
      functionName: ctx.functionName,
    };
  }
}

export default Logger;

