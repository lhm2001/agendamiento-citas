import { SQSEvent, SQSRecord } from 'aws-lambda';
import { createContext, deserializeContext, Context } from '../middleware/context';
import { AppointmentProcessorService } from '../services/appointment-processor.service';
import { AppointmentMessageDTO } from '../dtos/appointment.dto';
import Logger from '../utils/logger';

const processorService = new AppointmentProcessorService();
const COUNTRY_ISO = 'CL';

/**
 * Handler del Lambda "appointment_cl"
 * Procesa agendamientos para Chile desde SQS
 * Guarda los agendamientos en RDS MySQL de Chile
 */
export const handler = async (event: SQSEvent): Promise<void> => {
  const ctx = createContext('appointment-processor-cl');

  Logger.info(ctx, `Procesando ${event.Records.length} mensajes de SQS para ${COUNTRY_ISO}`);

  // Procesar cada mensaje del batch
  for (const record of event.Records) {
    await processSQSRecord(record, ctx);
  }

  Logger.info(ctx, 'Procesamiento de batch completado', {
    totalRecords: event.Records.length,
    countryISO: COUNTRY_ISO,
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
    // Parsear mensaje
    const message: AppointmentMessageDTO = JSON.parse(record.body);

    // Crear contexto desde el mensaje para trazabilidad
    const messageCtx = message.context
      ? deserializeContext(message.context as Record<string, string>)
      : ctx;

    Logger.info(messageCtx, 'Procesando mensaje de agendamiento', {
      appointmentId: message.appointmentId,
      insuredId: message.insuredId,
      scheduleId: message.scheduleId,
      countryISO: COUNTRY_ISO,
    });

    // Procesar agendamiento
    await processorService.processAppointment(messageCtx, message, COUNTRY_ISO);

    Logger.info(messageCtx, 'Mensaje procesado exitosamente', {
      appointmentId: message.appointmentId,
      messageId: record.messageId,
    });
  } catch (error) {
    Logger.error(ctx, 'Error procesando mensaje de SQS', error, {
      messageId: record.messageId,
      countryISO: COUNTRY_ISO,
    });

    // Re-lanzar error para que el mensaje vaya a DLQ después de reintentos
    throw error;
  }
};

