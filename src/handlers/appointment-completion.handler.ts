import { SQSEvent, SQSRecord } from 'aws-lambda';
import { createContext, deserializeContext, Context } from '../middleware/context';
import { AppointmentService } from '../services/appointment.service';
import { AppointmentCompletedEventDTO } from '../dtos/appointment.dto';
import Logger from '../utils/logger';

const appointmentService = new AppointmentService();

/**
 * Handler del Lambda "appointment_completion"
 * Recibe eventos de EventBridge vía SQS
 * Actualiza el estado del agendamiento en DynamoDB a "completed"
 */
export const handler = async (event: SQSEvent): Promise<void> => {
  const ctx = createContext('appointment-completion');

  Logger.info(ctx, `Procesando ${event.Records.length} eventos de completado`);

  // Procesar cada mensaje del batch
  for (const record of event.Records) {
    await processSQSRecord(record, ctx);
  }

  Logger.info(ctx, 'Procesamiento de completados finalizado', {
    totalRecords: event.Records.length,
  });
};

/**
 * Procesa un registro individual de SQS
 * @param record - Registro de SQS
 * @param ctx - Contexto base
 */
const processSQSRecord = async (
  record: SQSRecord,
  ctx: Context
): Promise<void> => {
  try {
    // El mensaje viene desde EventBridge, parsearlo
    const eventBridgeMessage = JSON.parse(record.body);
    
    // Extraer el detalle del evento
    const detail: AppointmentCompletedEventDTO = 
      typeof eventBridgeMessage.detail === 'string'
        ? JSON.parse(eventBridgeMessage.detail)
        : eventBridgeMessage.detail;

    // Crear contexto desde el evento para trazabilidad
    const messageCtx = detail.context
      ? deserializeContext(detail.context as Record<string, string>)
      : ctx;

    Logger.info(messageCtx, 'Procesando evento de completado', {
      appointmentId: detail.appointmentId,
      insuredId: detail.insuredId,
      countryISO: detail.countryISO,
    });

    // Actualizar estado a "completed" en DynamoDB
    await appointmentService.completeAppointment(messageCtx, detail.appointmentId);

    Logger.info(messageCtx, 'Agendamiento marcado como completado', {
      appointmentId: detail.appointmentId,
      messageId: record.messageId,
    });
  } catch (error) {
    Logger.error(ctx, 'Error procesando evento de completado', error, {
      messageId: record.messageId,
    });

    // Re-lanzar error para reintento
    throw error;
  }
};

