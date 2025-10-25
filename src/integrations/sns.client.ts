import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Context } from '../middleware/context';
import { AppointmentMessageDTO } from '../dtos/appointment.dto';
import { Environment } from '../utils/environment';
import Logger from '../utils/logger';

/**
 * Cliente para interactuar con SNS
 * Publica mensajes a los tópicos correspondientes por país
 */
export class SNSClientService {
  private readonly client: SNSClient;

  constructor() {
    this.client = new SNSClient({ region: Environment.AWS_REGION });
  }

  /**
   * Publica un mensaje de agendamiento al tópico SNS del país
   * @param ctx - Contexto de ejecución
   * @param message - Mensaje de appointment
   * @returns ID del mensaje publicado
   */
  async publishAppointment(ctx: Context, message: AppointmentMessageDTO): Promise<string> {
    const topicArn = this.getTopicArn(message.countryISO);

    Logger.debug(ctx, 'Publicando mensaje a SNS', {
      topicArn,
      appointmentId: message.appointmentId,
      countryISO: message.countryISO,
    });

    const command = new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify(message),
      MessageAttributes: {
        countryISO: {
          DataType: 'String',
          StringValue: message.countryISO,
        },
        appointmentId: {
          DataType: 'String',
          StringValue: message.appointmentId,
        },
      },
    });

    const result = await this.client.send(command);

    Logger.info(ctx, 'Mensaje publicado exitosamente en SNS', {
      messageId: result.MessageId,
      topicArn,
      appointmentId: message.appointmentId,
    });

    return result.MessageId || '';
  }

  /**
   * Obtiene el ARN del tópico según el país
   * @param countryISO - Código del país
   * @returns ARN del tópico
   */
  private getTopicArn(countryISO: string): string {
    switch (countryISO) {
      case 'PE':
        return Environment.SNS_TOPIC_PE;
      case 'CL':
        return Environment.SNS_TOPIC_CL;
      default:
        throw new Error(`País no soportado: ${countryISO}`);
    }
  }
}

