import { v4 as uuidv4 } from 'uuid';

/**
 * Contexto de ejecución para trazabilidad completa
 * Proporciona IDs únicos para tracking de transacciones
 */
export interface Context {
  /** ID de la aplicación/servicio que origina la petición */
  applicationId: string;
  /** ID único de transacción para correlación de logs */
  transactionId: string;
  /** Timestamp de inicio de la transacción */
  timestamp: string;
  /** Nombre de la función Lambda actual */
  functionName?: string;
}

/**
 * Crea un nuevo contexto con IDs únicos
 * @param applicationId - Identificador de la aplicación
 * @param transactionId - ID de transacción (genera uno si no se proporciona)
 * @param functionName - Nombre de la función Lambda
 * @returns Contexto inicializado
 */
export const createContext = (
  applicationId = 'medical-appointment-api',
  transactionId?: string,
  functionName?: string
): Context => {
  return {
    applicationId,
    transactionId: transactionId || uuidv4(),
    timestamp: new Date().toISOString(),
    functionName: functionName || process.env.FUNCTION_NAME,
  };
};

/**
 * Extrae o crea contexto desde headers HTTP
 * @param headers - Headers de la petición HTTP
 * @returns Contexto extraído o nuevo
 */
export const extractContextFromHeaders = (headers: Record<string, string>): Context => {
  const applicationId = headers['application-id'] || headers['Application-ID'] || 'medical-appointment-api';
  // Siempre generar un Transaction-ID único automáticamente
  const transactionId = uuidv4();
  
  return createContext(applicationId, transactionId);
};

/**
 * Serializa el contexto para propagarlo en mensajes
 * @param ctx - Contexto a serializar
 * @returns Objeto serializable
 */
export const serializeContext = (ctx: Context): Record<string, string> => {
  return {
    applicationId: ctx.applicationId,
    transactionId: ctx.transactionId,
    timestamp: ctx.timestamp,
    functionName: ctx.functionName || '',
  };
};

/**
 * Deserializa contexto desde un mensaje
 * @param data - Datos serializados
 * @returns Contexto deserializado
 */
export const deserializeContext = (data: Record<string, string>): Context => {
  return {
    applicationId: data.applicationId || 'medical-appointment-api',
    transactionId: data.transactionId || uuidv4(),
    timestamp: data.timestamp || new Date().toISOString(),
    functionName: data.functionName,
  };
};

