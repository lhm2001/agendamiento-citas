import { AppointmentStatus } from '../entities/appointment.entity';

/**
 * DTO para crear un agendamiento (Request)
 */
export interface CreateAppointmentRequest {
  /** Código del asegurado (5 dígitos) */
  insuredId: string;
  
  /** ID del espacio de agendamiento */
  scheduleId: number;
  
  /** Código ISO del país (PE o CL) */
  countryISO: string;
}

/**
 * DTO de respuesta para creación de agendamiento
 */
export interface CreateAppointmentResponse {
  /** Indica si la operación fue exitosa */
  success: boolean;
  
  /** Mensaje descriptivo */
  message: string;
  
  /** Datos del agendamiento creado */
  data: {
    /** ID único del agendamiento */
    appointmentId: string;
    
    /** Estado actual */
    status: AppointmentStatus;
    
    /** ID de transacción para tracking */
    transactionId: string;
  };
}

/**
 * DTO de respuesta para obtener agendamientos
 */
export interface GetAppointmentsResponse {
  /** Indica si la operación fue exitosa */
  success: boolean;
  
  /** Lista de agendamientos */
  data: AppointmentDTO[];
  
  /** Total de registros */
  total: number;
}

/**
 * DTO de un agendamiento individual
 */
export interface AppointmentDTO {
  /** ID único del agendamiento */
  appointmentId: string;
  
  /** Código del asegurado */
  insuredId: string;
  
  /** ID del espacio de agendamiento */
  scheduleId: number;
  
  /** Código ISO del país */
  countryISO: string;
  
  /** Estado actual */
  status: AppointmentStatus;
  
  /** Fecha de creación */
  createdAt: string;
  
  /** Fecha de actualización */
  updatedAt: string;
  
  /** Fecha de completado (si aplica) */
  completedAt?: string;
  
  /** Mensaje de error (si aplica) */
  errorMessage?: string;
}

/**
 * DTO para mensajes en SNS/SQS
 */
export interface AppointmentMessageDTO {
  /** ID del agendamiento */
  appointmentId: string;
  
  /** Código del asegurado */
  insuredId: string;
  
  /** ID del espacio */
  scheduleId: number;
  
  /** País */
  countryISO: string;
  
  /** Contexto de trazabilidad */
  context: {
    applicationId: string;
    transactionId: string;
    timestamp: string;
  };
}

/**
 * DTO para evento de completado en EventBridge
 */
export interface AppointmentCompletedEventDTO {
  /** ID del agendamiento */
  appointmentId: string;
  
  /** Código del asegurado */
  insuredId: string;
  
  /** País */
  countryISO: string;
  
  /** Timestamp de procesamiento */
  processedAt: string;
  
  /** Contexto */
  context: {
    applicationId: string;
    transactionId: string;
  };
}

/**
 * DTO para error en el API
 */
export interface ErrorResponse {
  /** Indica que hubo un error */
  success: false;
  
  /** Mensaje de error */
  message: string;
  
  /** Código de error */
  errorCode?: string;
  
  /** Detalles adicionales (solo en desarrollo) */
  details?: Record<string, unknown>;
}

