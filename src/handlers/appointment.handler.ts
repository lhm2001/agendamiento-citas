import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createContext, extractContextFromHeaders, Context } from '../middleware/context';
import { AppointmentService } from '../services/appointment.service';
import { CreateAppointmentRequest } from '../dtos/appointment.dto';
import { validateSchema, createAppointmentSchema, insuredIdParamSchema } from '../validators/appointment.validator';
import { successResponse, errorResponse, handleError } from '../utils/http-response';
import Logger from '../utils/logger';

const appointmentService = new AppointmentService();

/**
 * Handler principal del Lambda "appointment"
 * Maneja las peticiones HTTP del API Gateway
 * 
 * Endpoints:
 * - POST /appointments - Crea un nuevo agendamiento
 * - GET /appointments/{insuredId} - Lista agendamientos por asegurado
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Crear contexto desde headers HTTP
  const ctx = event.headers
    ? extractContextFromHeaders(event.headers as Record<string, string>)
    : createContext();

  Logger.info(ctx, 'Petición recibida', {
    method: event.httpMethod,
    path: event.path,
  });

  try {
    // Routing basado en método HTTP y path
    if (event.httpMethod === 'POST' && event.path === '/appointments') {
      return await createAppointment(event, ctx);
    }

    if (event.httpMethod === 'GET' && event.path?.includes('/appointments/')) {
      return await getAppointments(event, ctx);
    }

    // Ruta no encontrada
    return errorResponse(ctx, 404, 'Ruta no encontrada', 'NOT_FOUND');
  } catch (error) {
    Logger.error(ctx, 'Error en handler principal', error);
    return handleError(ctx, error);
  }
};

/**
 * Crea un nuevo agendamiento (POST /appointments)
 * @param event - Evento de API Gateway
 * @param ctx - Contexto de ejecución
 * @returns Respuesta HTTP
 */
const createAppointment = async (
  event: APIGatewayProxyEvent,
  ctx: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // Parsear y validar body
    if (!event.body) {
      return errorResponse(ctx, 400, 'Body es requerido', 'MISSING_BODY');
    }

    const body = JSON.parse(event.body);
    const request = validateSchema<CreateAppointmentRequest>(createAppointmentSchema, body);

    Logger.info(ctx, 'Creando agendamiento', {
      insuredId: request.insuredId,
      scheduleId: request.scheduleId,
      countryISO: request.countryISO,
    });

    // Invocar servicio
    const result = await appointmentService.createAppointment(ctx, request);

    Logger.info(ctx, 'Agendamiento creado exitosamente', {
      appointmentId: result.data.appointmentId,
    });

    return successResponse(ctx, 201, result);
  } catch (error) {
    Logger.error(ctx, 'Error creando agendamiento', error);
    return handleError(ctx, error);
  }
};

/**
 * Obtiene agendamientos por insuredId (GET /appointments/{insuredId})
 * @param event - Evento de API Gateway
 * @param ctx - Contexto de ejecución
 * @returns Respuesta HTTP
 */
const getAppointments = async (
  event: APIGatewayProxyEvent,
  ctx: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // Extraer y validar parámetro de path
    const insuredId = event.pathParameters?.insuredId;

    if (!insuredId) {
      return errorResponse(ctx, 400, 'insuredId es requerido', 'MISSING_PARAM');
    }

    validateSchema(insuredIdParamSchema, { insuredId });

    Logger.info(ctx, 'Obteniendo agendamientos', { insuredId });

    // Invocar servicio
    const result = await appointmentService.getAppointmentsByInsuredId(ctx, insuredId);

    Logger.info(ctx, 'Agendamientos obtenidos exitosamente', {
      insuredId,
      total: result.total,
    });

    return successResponse(ctx, 200, result);
  } catch (error) {
    Logger.error(ctx, 'Error obteniendo agendamientos', error);
    return handleError(ctx, error);
  }
};

