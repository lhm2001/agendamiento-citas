import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { Context } from '../middleware/context';
import { AppointmentCompletedEventDTO } from '../dtos/appointment.dto';
import { Environment } from '../utils/environment';
import Logger from '../utils/logger';

/**
 * Cliente para interactuar con EventBridge
 * Publica eventos de agendamientos completados
 */
export class EventBridgeClientService {
  private readonly client: EventBridgeClient;
  private readonly eventBusName: string;

  constructor() {
    this.client = new EventBridgeClient({ region: Environment.AWS_REGION });
    this.eventBusName = Environment.EVENTBRIDGE_BUS;
  }

  /**
   * Publica un evento de agendamiento completado
   * @param ctx - Contexto de ejecución
   * @param event - Datos del evento
   * @returns ID de la entrada del evento
   */
  async publishAppointmentCompleted(
    ctx: Context,
    event: AppointmentCompletedEventDTO
  ): Promise<string> {
    Logger.debug(ctx, 'Publicando evento a EventBridge', {
      eventBusName: this.eventBusName,
      appointmentId: event.appointmentId,
    });

    const command = new PutEventsCommand({
      Entries: [
        {
          EventBusName: this.eventBusName,
          Source: 'appointment.processor',
          DetailType: 'AppointmentCompleted',
          Detail: JSON.stringify(event),
          Time: new Date(),
        },
      ],
    });

    const result = await this.client.send(command);

    if (result.FailedEntryCount && result.FailedEntryCount > 0) {
      Logger.error(ctx, 'Error publicando evento en EventBridge', result.Entries?.[0]?.ErrorMessage);
      throw new Error(`Error publicando evento: ${result.Entries?.[0]?.ErrorMessage}`);
    }

    Logger.info(ctx, 'Evento publicado exitosamente en EventBridge', {
      eventId: result.Entries?.[0]?.EventId,
      appointmentId: event.appointmentId,
    });

    return result.Entries?.[0]?.EventId || '';
  }
}

