import { Context } from '../middleware/context';
import { ErrorResponse } from '../dtos/appointment.dto';

/**
 * Construye una respuesta HTTP exitosa
 * @param ctx - Contexto de ejecución
 * @param statusCode - Código de estado HTTP
 * @param body - Cuerpo de la respuesta
 * @returns Respuesta formateada para API Gateway
 */
export const successResponse = (
  ctx: Context,
  statusCode: number,
  body: unknown
) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Application-ID': ctx.applicationId,
      'Transaction-ID': ctx.transactionId,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
};

/**
 * Construye una respuesta HTTP de error
 * @param ctx - Contexto de ejecución
 * @param statusCode - Código de estado HTTP
 * @param message - Mensaje de error
 * @param errorCode - Código de error opcional
 * @param details - Detalles adicionales
 * @returns Respuesta de error formateada
 */
export const errorResponse = (
  ctx: Context,
  statusCode: number,
  message: string,
  errorCode?: string,
  details?: Record<string, unknown>
) => {
  const errorBody: ErrorResponse = {
    success: false,
    message,
    errorCode,
  };

  // Solo incluir detalles en desarrollo
  if (process.env.STAGE === 'dev' && details) {
    errorBody.details = details;
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Application-ID': ctx.applicationId,
      'Transaction-ID': ctx.transactionId,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(errorBody),
  };
};

/**
 * Maneja errores y retorna respuesta apropiada
 * @param ctx - Contexto de ejecución
 * @param error - Error ocurrido
 * @returns Respuesta de error
 */
export const handleError = (ctx: Context, error: unknown) => {
  if (error instanceof Error) {
    // Errores de validación
    if (error.message.includes('Validación fallida')) {
      return errorResponse(ctx, 400, error.message, 'VALIDATION_ERROR');
    }

    // Errores de negocio
    if (error.message.includes('no está disponible')) {
      return errorResponse(ctx, 409, error.message, 'SCHEDULE_NOT_AVAILABLE');
    }

    // Error genérico
    return errorResponse(ctx, 500, 'Error interno del servidor', 'INTERNAL_ERROR', {
      message: error.message,
    });
  }

  return errorResponse(ctx, 500, 'Error desconocido', 'UNKNOWN_ERROR');
};

