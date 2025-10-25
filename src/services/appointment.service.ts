import { v4 as uuidv4 } from 'uuid';
import { Context } from '../middleware/context';
import {
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  GetAppointmentsResponse,
} from '../dtos/appointment.dto';
import { AppointmentEntity, AppointmentStatus } from '../entities/appointment.entity';
import { AppointmentDynamoRepository } from '../repositories/appointment-dynamo.repository';
import { AppointmentMapper } from '../mappers/appointment.mapper';
import { SNSClientService } from '../integrations/sns.client';
import { ScheduleClientService } from '../integrations/schedule.client';
import Logger from '../utils/logger';

/**
 * Servicio de Agendamientos - Capa de Lógica de Negocio
 * Implementa las reglas de negocio y orquesta operaciones
 */
export class AppointmentService {
  private readonly dynamoRepository: AppointmentDynamoRepository;
  private readonly snsClient: SNSClientService;
  private readonly scheduleClient: ScheduleClientService;

  constructor() {
    this.dynamoRepository = new AppointmentDynamoRepository();
    this.snsClient = new SNSClientService();
    this.scheduleClient = new ScheduleClientService();
  }

  /**
   * Crea un nuevo agendamiento
   * @param ctx - Contexto de ejecución
   * @param request - Datos del agendamiento
   * @returns Respuesta con datos del agendamiento creado
   */
  async createAppointment(
    ctx: Context,
    request: CreateAppointmentRequest
  ): Promise<CreateAppointmentResponse> {
    Logger.info(ctx, 'Iniciando creación de agendamiento', {
      insuredId: request.insuredId,
      scheduleId: request.scheduleId,
      countryISO: request.countryISO,
    });

    // Validación de negocio: Verificar que el schedule existe y está disponible
    await this.validateScheduleAvailability(ctx, request.scheduleId);

    // Generar ID único para el agendamiento
    const appointmentId = uuidv4();

    // Crear entity de DynamoDB
    const appointmentEntity = AppointmentMapper.toEntity(request, appointmentId, ctx);

    // Guardar en DynamoDB con estado "pending"
    await this.dynamoRepository.create(ctx, appointmentEntity);
    Logger.info(ctx, 'Agendamiento guardado en DynamoDB', {
      appointmentId,
      status: AppointmentStatus.PENDING,
    });

    // Crear mensaje para SNS
    const message = AppointmentMapper.toMessageDTO(appointmentEntity);

    // Publicar mensaje a SNS (esto lo enviará al SQS correspondiente)
    await this.snsClient.publishAppointment(ctx, message);
    Logger.info(ctx, 'Mensaje enviado a SNS', {
      appointmentId,
      countryISO: request.countryISO,
    });

    // Retornar respuesta al cliente
    return {
      success: true,
      message: 'Agendamiento en proceso. Recibirá confirmación pronto.',
      data: {
        appointmentId,
        status: AppointmentStatus.PENDING,
        transactionId: ctx.transactionId,
      },
    };
  }

  /**
   * Obtiene todos los agendamientos de un asegurado
   * @param ctx - Contexto de ejecución
   * @param insuredId - Código del asegurado
   * @returns Lista de agendamientos
   */
  async getAppointmentsByInsuredId(
    ctx: Context,
    insuredId: string
  ): Promise<GetAppointmentsResponse> {
    Logger.info(ctx, 'Obteniendo agendamientos por insuredId', { insuredId });

    // Buscar en DynamoDB
    const entities = await this.dynamoRepository.findByInsuredId(ctx, insuredId);

    // Convertir entities a DTOs
    const appointments = AppointmentMapper.toDTOList(entities);

    Logger.info(ctx, 'Agendamientos obtenidos exitosamente', {
      insuredId,
      total: appointments.length,
    });

    return {
      success: true,
      data: appointments,
      total: appointments.length,
    };
  }

  /**
   * Obtiene un agendamiento por ID
   * @param ctx - Contexto de ejecución
   * @param appointmentId - ID del agendamiento
   * @returns Entity del agendamiento o null
   */
  async getAppointmentById(
    ctx: Context,
    appointmentId: string
  ): Promise<AppointmentEntity | null> {
    Logger.debug(ctx, 'Obteniendo agendamiento por ID', { appointmentId });
    return await this.dynamoRepository.findById(ctx, appointmentId);
  }

  /**
   * Actualiza el estado de un agendamiento a completado
   * @param ctx - Contexto de ejecución
   * @param appointmentId - ID del agendamiento
   * @returns Entity actualizada
   */
  async completeAppointment(ctx: Context, appointmentId: string): Promise<AppointmentEntity> {
    Logger.info(ctx, 'Completando agendamiento', { appointmentId });

    // Actualizar estado a "completed"
    const updated = await this.dynamoRepository.updateStatus(
      ctx,
      appointmentId,
      AppointmentStatus.COMPLETED
    );

    Logger.info(ctx, 'Agendamiento completado exitosamente', { appointmentId });

    return updated;
  }

  /**
   * Marca un agendamiento como fallido
   * @param ctx - Contexto de ejecución
   * @param appointmentId - ID del agendamiento
   * @param errorMessage - Mensaje de error
   * @returns Entity actualizada
   */
  async failAppointment(
    ctx: Context,
    appointmentId: string,
    errorMessage: string
  ): Promise<AppointmentEntity> {
    Logger.warn(ctx, 'Marcando agendamiento como fallido', {
      appointmentId,
      errorMessage,
    });

    const updated = await this.dynamoRepository.updateStatus(
      ctx,
      appointmentId,
      AppointmentStatus.FAILED,
      errorMessage
    );

    return updated;
  }

  /**
   * Valida que un schedule esté disponible
   * @param ctx - Contexto de ejecución
   * @param scheduleId - ID del schedule
   * @throws Error si el schedule no está disponible
   */
  private async validateScheduleAvailability(ctx: Context, scheduleId: number): Promise<void> {
    Logger.debug(ctx, 'Validando disponibilidad de schedule', { scheduleId });

    const isAvailable = await this.scheduleClient.isScheduleAvailable(ctx, scheduleId);

    if (!isAvailable) {
      Logger.warn(ctx, 'Schedule no disponible', { scheduleId });
      throw new Error(`El espacio de agendamiento ${scheduleId} no está disponible`);
    }

    Logger.debug(ctx, 'Schedule disponible', { scheduleId });
  }
}

