import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Context } from '../middleware/context';
import { AppointmentEntity, AppointmentStatus } from '../entities/appointment.entity';
import { Environment } from '../utils/environment';
import Logger from '../utils/logger';

/**
 * Repository para operaciones de DynamoDB
 * Capa de acceso a datos que abstrae la interacción con DynamoDB
 */
export class AppointmentDynamoRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor() {
    const client = new DynamoDBClient({ region: Environment.AWS_REGION });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = Environment.DYNAMODB_TABLE;
  }

  /**
   * Guarda un nuevo agendamiento en DynamoDB
   * @param ctx - Contexto de ejecución
   * @param appointment - Entity a guardar
   * @returns Entity guardada
   */
  async create(ctx: Context, appointment: AppointmentEntity): Promise<AppointmentEntity> {
    Logger.debug(ctx, 'Guardando appointment en DynamoDB', {
      appointmentId: appointment.appointmentId,
      insuredId: appointment.insuredId,
    });

    const command = new PutCommand({
      TableName: this.tableName,
      Item: appointment,
    });

    await this.docClient.send(command);

    Logger.info(ctx, 'Appointment guardado exitosamente en DynamoDB', {
      appointmentId: appointment.appointmentId,
    });

    return appointment;
  }

  /**
   * Obtiene un agendamiento por su ID
   * @param ctx - Contexto de ejecución
   * @param appointmentId - ID del appointment
   * @returns Entity encontrada o null
   */
  async findById(ctx: Context, appointmentId: string): Promise<AppointmentEntity | null> {
    Logger.debug(ctx, 'Buscando appointment en DynamoDB', { appointmentId });

    const command = new GetCommand({
      TableName: this.tableName,
      Key: { appointmentId },
    });

    const result = await this.docClient.send(command);

    if (!result.Item) {
      Logger.debug(ctx, 'Appointment no encontrado', { appointmentId });
      return null;
    }

    return result.Item as AppointmentEntity;
  }

  /**
   * Obtiene todos los agendamientos de un asegurado
   * @param ctx - Contexto de ejecución
   * @param insuredId - Código del asegurado
   * @returns Lista de entities
   */
  async findByInsuredId(ctx: Context, insuredId: string): Promise<AppointmentEntity[]> {
    Logger.debug(ctx, 'Buscando appointments por insuredId', { insuredId });

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'InsuredIdIndex',
      KeyConditionExpression: 'insuredId = :insuredId',
      ExpressionAttributeValues: {
        ':insuredId': insuredId,
      },
      ScanIndexForward: false, // Ordenar por fecha descendente
    });

    const result = await this.docClient.send(command);

    Logger.info(ctx, 'Appointments encontrados', {
      insuredId,
      count: result.Items?.length || 0,
    });

    return (result.Items || []) as AppointmentEntity[];
  }

  /**
   * Actualiza el estado de un agendamiento
   * @param ctx - Contexto de ejecución
   * @param appointmentId - ID del appointment
   * @param status - Nuevo estado
   * @param errorMessage - Mensaje de error opcional
   * @returns Entity actualizada
   */
  async updateStatus(
    ctx: Context,
    appointmentId: string,
    status: AppointmentStatus,
    errorMessage?: string
  ): Promise<AppointmentEntity> {
    Logger.debug(ctx, 'Actualizando estado de appointment', {
      appointmentId,
      status,
    });

    const now = new Date().toISOString();
    const updateExpression: string[] = ['updatedAt = :updatedAt', '#status = :status'];
    const expressionAttributeValues: Record<string, string> = {
      ':updatedAt': now,
      ':status': status,
    };
    const expressionAttributeNames: Record<string, string> = {
      '#status': 'status',
    };

    if (status === AppointmentStatus.COMPLETED) {
      updateExpression.push('completedAt = :completedAt');
      expressionAttributeValues[':completedAt'] = now;
    }

    if (errorMessage) {
      updateExpression.push('errorMessage = :errorMessage');
      expressionAttributeValues[':errorMessage'] = errorMessage;
    }

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { appointmentId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: 'ALL_NEW',
    });

    const result = await this.docClient.send(command);

    Logger.info(ctx, 'Estado de appointment actualizado', {
      appointmentId,
      newStatus: status,
    });

    return result.Attributes as AppointmentEntity;
  }
}

