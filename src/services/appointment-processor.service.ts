import { Context } from '../middleware/context';
import { AppointmentMessageDTO, AppointmentCompletedEventDTO } from '../dtos/appointment.dto';
import { AppointmentRDSRepository } from '../repositories/appointment-rds.repository';
import { AppointmentMapper } from '../mappers/appointment.mapper';
import { ScheduleClientService } from '../integrations/schedule.client';
import { EventBridgeClientService } from '../integrations/eventbridge.client';
import Logger from '../utils/logger';

/**
 * Servicio de Procesamiento de Agendamientos
 * Procesa mensajes de SQS y guarda en RDS
 */
export class AppointmentProcessorService {
  private readonly scheduleClient: ScheduleClientService;
  private readonly eventBridgeClient: EventBridgeClientService;

  constructor() {
    this.scheduleClient = new ScheduleClientService();
    this.eventBridgeClient = new EventBridgeClientService();
  }

  /**
   * Procesa un agendamiento y lo guarda en RDS del país correspondiente
   * @param ctx - Contexto de ejecución
   * @param message - Mensaje del agendamiento
   * @param countryISO - Código del país
   */
  async processAppointment(
    ctx: Context,
    message: AppointmentMessageDTO,
    countryISO: string
  ): Promise<void> {
    Logger.info(ctx, `Procesando agendamiento para ${countryISO}`, {
      appointmentId: message.appointmentId,
      insuredId: message.insuredId,
      scheduleId: message.scheduleId,
    });

    try {
      // Obtener información detallada del schedule
      const scheduleInfo = await this.scheduleClient.getScheduleInfo(ctx, message.scheduleId);
      Logger.debug(ctx, 'Schedule info obtenida', {
        centerId: scheduleInfo.centerId,
        specialtyId: scheduleInfo.specialtyId,
        medicId: scheduleInfo.medicId,
      });

      // Crear repository de RDS para el país
      const rdsRepository = new AppointmentRDSRepository(countryISO);

      // Mapear a entity de RDS
      const rdsEntity = AppointmentMapper.toRDSEntity(
        message.appointmentId,
        message.insuredId,
        message.scheduleId,
        countryISO,
        {
          centerId: scheduleInfo.centerId,
          specialtyId: scheduleInfo.specialtyId,
          medicId: scheduleInfo.medicId,
          appointmentDate: scheduleInfo.date,
        }
      );

      // Guardar en RDS
      await rdsRepository.create(ctx, rdsEntity);
      Logger.info(ctx, `Agendamiento guardado en RDS ${countryISO}`, {
        appointmentId: message.appointmentId,
      });

      // Publicar evento de completado a EventBridge
      await this.publishCompletedEvent(ctx, message, countryISO);

      Logger.info(ctx, 'Procesamiento de agendamiento completado exitosamente', {
        appointmentId: message.appointmentId,
        countryISO,
      });
    } catch (error) {
      Logger.error(ctx, 'Error procesando agendamiento', error, {
        appointmentId: message.appointmentId,
        countryISO,
      });
      throw error;
    }
  }

  /**
   * Publica evento de agendamiento completado a EventBridge
   * @param ctx - Contexto de ejecución
   * @param message - Mensaje del agendamiento
   * @param countryISO - Código del país
   */
  private async publishCompletedEvent(
    ctx: Context,
    message: AppointmentMessageDTO,
    countryISO: string
  ): Promise<void> {
    const event: AppointmentCompletedEventDTO = {
      appointmentId: message.appointmentId,
      insuredId: message.insuredId,
      countryISO,
      processedAt: new Date().toISOString(),
      context: {
        applicationId: message.context.applicationId,
        transactionId: message.context.transactionId,
      },
    };

    await this.eventBridgeClient.publishAppointmentCompleted(ctx, event);

    Logger.info(ctx, 'Evento de completado publicado', {
      appointmentId: message.appointmentId,
    });
  }
}

