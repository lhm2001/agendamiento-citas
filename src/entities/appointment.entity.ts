/**
 * Estados posibles de un agendamiento
 */
export enum AppointmentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Entidad de Agendamiento para DynamoDB
 * Representa un agendamiento en su estado temporal
 */
export interface AppointmentEntity {
  /** ID único del agendamiento (UUID) */
  appointmentId: string;
  
  /** Código del asegurado (5 dígitos, puede tener ceros adelante) */
  insuredId: string;
  
  /** ID del espacio de agendamiento */
  scheduleId: number;
  
  /** Código ISO del país (PE o CL) */
  countryISO: string;
  
  /** Estado actual del agendamiento */
  status: AppointmentStatus;
  
  /** Fecha y hora de creación (ISO 8601) */
  createdAt: string;
  
  /** Fecha y hora de última actualización (ISO 8601) */
  updatedAt: string;
  
  /** Mensaje de error si el estado es FAILED */
  errorMessage?: string;
  
  /** Timestamp de cuando fue completado */
  completedAt?: string;
  
  /** Contexto de trazabilidad */
  transactionId: string;
  applicationId: string;
}

/**
 * Entidad de Agendamiento para RDS MySQL
 * Representa un agendamiento persistido en la BD del país
 */
export interface AppointmentRDSEntity {
  /** ID único del agendamiento */
  appointmentId: string;
  
  /** Código del asegurado */
  insuredId: string;
  
  /** ID del centro médico */
  centerId: number;
  
  /** ID de la especialidad */
  specialtyId: number;
  
  /** ID del médico */
  medicId: number;
  
  /** Fecha y hora de la cita (ISO 8601) */
  appointmentDate: string;
  
  /** ID del espacio de agendamiento */
  scheduleId: number;
  
  /** Código ISO del país */
  countryISO: string;
  
  /** Estado del agendamiento */
  status: string;
  
  /** Fecha de creación */
  createdAt: Date;
  
  /** Fecha de actualización */
  updatedAt: Date;
  
  /** Información adicional (JSON) */
  metadata?: string;
}

/**
 * Información detallada de un Schedule
 * Este objeto viene del sistema y contiene los datos del espacio
 */
export interface ScheduleInfo {
  /** ID del schedule */
  scheduleId: number;
  
  /** ID del centro médico */
  centerId: number;
  
  /** Nombre del centro médico */
  centerName?: string;
  
  /** ID de la especialidad */
  specialtyId: number;
  
  /** Nombre de la especialidad */
  specialtyName?: string;
  
  /** ID del médico */
  medicId: number;
  
  /** Nombre del médico */
  medicName?: string;
  
  /** Fecha y hora de la cita (ISO 8601) */
  date: string;
  
  /** Disponibilidad */
  available: boolean;
}

