import { AppointmentEntity, AppointmentRDSEntity, AppointmentStatus } from '../entities/appointment.entity';
import { AppointmentDTO, AppointmentMessageDTO, CreateAppointmentRequest } from '../dtos/appointment.dto';
import { Context } from '../middleware/context';

/**
 * Mapper para transformar entre DTOs y Entidades de Appointment
 * Sigue el patrón Mapper para separar la representación externa de la interna
 */
export class AppointmentMapper {
  /**
   * Convierte un DTO de request a Entity de DynamoDB
   * @param request - DTO de creación
   * @param appointmentId - ID generado para el agendamiento
   * @param ctx - Contexto de ejecución
   * @returns Entity para DynamoDB
   */
  static toEntity(
    request: CreateAppointmentRequest,
    appointmentId: string,
    ctx: Context
  ): AppointmentEntity {
    const now = new Date().toISOString();
    
    return {
      appointmentId,
      insuredId: request.insuredId,
      scheduleId: request.scheduleId,
      countryISO: request.countryISO,
      status: AppointmentStatus.PENDING,
      createdAt: now,
      updatedAt: now,
      transactionId: ctx.transactionId,
      applicationId: ctx.applicationId,
    };
  }

  /**
   * Convierte Entity a DTO de respuesta
   * @param entity - Entity de DynamoDB
   * @returns DTO de appointment
   */
  static toDTO(entity: AppointmentEntity): AppointmentDTO {
    return {
      appointmentId: entity.appointmentId,
      insuredId: entity.insuredId,
      scheduleId: entity.scheduleId,
      countryISO: entity.countryISO,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      completedAt: entity.completedAt,
      errorMessage: entity.errorMessage,
    };
  }

  /**
   * Convierte Entity a Message DTO para SNS/SQS
   * @param entity - Entity de DynamoDB
   * @returns DTO de mensaje
   */
  static toMessageDTO(entity: AppointmentEntity): AppointmentMessageDTO {
    return {
      appointmentId: entity.appointmentId,
      insuredId: entity.insuredId,
      scheduleId: entity.scheduleId,
      countryISO: entity.countryISO,
      context: {
        applicationId: entity.applicationId,
        transactionId: entity.transactionId,
        timestamp: entity.createdAt,
      },
    };
  }

  /**
   * Convierte Message DTO a Entity para procesamiento
   * @param message - DTO de mensaje
   * @returns Entity parcial
   */
  static fromMessageDTO(message: AppointmentMessageDTO): Partial<AppointmentEntity> {
    return {
      appointmentId: message.appointmentId,
      insuredId: message.insuredId,
      scheduleId: message.scheduleId,
      countryISO: message.countryISO,
      transactionId: message.context.transactionId,
      applicationId: message.context.applicationId,
    };
  }

  /**
   * Convierte datos de appointment a Entity de RDS
   * @param appointmentId - ID del appointment
   * @param insuredId - Código del asegurado
   * @param scheduleId - ID del schedule
   * @param countryISO - Código del país
   * @param scheduleDetails - Detalles del espacio (centro, especialidad, médico, fecha)
   * @returns Entity para RDS
   */
  static toRDSEntity(
    appointmentId: string,
    insuredId: string,
    scheduleId: number,
    countryISO: string,
    scheduleDetails: {
      centerId: number;
      specialtyId: number;
      medicId: number;
      appointmentDate: string;
    }
  ): Omit<AppointmentRDSEntity, 'createdAt' | 'updatedAt'> {
    return {
      appointmentId,
      insuredId,
      centerId: scheduleDetails.centerId,
      specialtyId: scheduleDetails.specialtyId,
      medicId: scheduleDetails.medicId,
      appointmentDate: scheduleDetails.appointmentDate,
      scheduleId,
      countryISO,
      status: 'confirmed',
      metadata: JSON.stringify({
        source: 'medical-appointment-api',
        processedAt: new Date().toISOString(),
      }),
    };
  }

  /**
   * Convierte lista de entities a lista de DTOs
   * @param entities - Lista de entities
   * @returns Lista de DTOs
   */
  static toDTOList(entities: AppointmentEntity[]): AppointmentDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }
}

