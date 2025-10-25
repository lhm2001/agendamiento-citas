import { Context } from '../middleware/context';
import { ScheduleInfo } from '../entities/appointment.entity';
import Logger from '../utils/logger';

/**
 * Cliente para obtener información de schedules
 * En un sistema real, esto consultaría un servicio externo o BD
 * Para este reto, simulamos la respuesta
 */
export class ScheduleClientService {
  /**
   * Obtiene información detallada de un schedule
   * @param ctx - Contexto de ejecución
   * @param scheduleId - ID del schedule
   * @returns Información del schedule
   */
  async getScheduleInfo(ctx: Context, scheduleId: number): Promise<ScheduleInfo> {
    Logger.debug(ctx, 'Obteniendo información de schedule', { scheduleId });

    // SIMULACIÓN: En un sistema real, esto haría una consulta a BD o API externa
    // Por ahora, generamos datos ficticios basados en el scheduleId
    const mockSchedule: ScheduleInfo = {
      scheduleId,
      centerId: Math.floor(scheduleId / 100) + 1,
      centerName: `Centro Médico ${Math.floor(scheduleId / 100) + 1}`,
      specialtyId: Math.floor((scheduleId % 100) / 10) + 1,
      specialtyName: this.getSpecialtyName(Math.floor((scheduleId % 100) / 10) + 1),
      medicId: (scheduleId % 10) + 1,
      medicName: `Dr. Médico ${(scheduleId % 10) + 1}`,
      date: this.generateAppointmentDate(scheduleId),
      available: true,
    };

    Logger.info(ctx, 'Schedule info obtenida', {
      scheduleId,
      centerId: mockSchedule.centerId,
      specialtyId: mockSchedule.specialtyId,
    });

    return mockSchedule;
  }

  /**
   * Valida si un schedule está disponible
   * @param ctx - Contexto de ejecución
   * @param scheduleId - ID del schedule
   * @returns true si está disponible
   */
  async isScheduleAvailable(ctx: Context, scheduleId: number): Promise<boolean> {
    Logger.debug(ctx, 'Validando disponibilidad de schedule', { scheduleId });

    // SIMULACIÓN: En un sistema real, verificaría disponibilidad en BD
    const schedule = await this.getScheduleInfo(ctx, scheduleId);

    return schedule.available;
  }

  /**
   * Obtiene nombre de especialidad según ID
   * @param specialtyId - ID de especialidad
   * @returns Nombre de especialidad
   */
  private getSpecialtyName(specialtyId: number): string {
    const specialties: Record<number, string> = {
      1: 'Medicina General',
      2: 'Pediatría',
      3: 'Cardiología',
      4: 'Dermatología',
      5: 'Oftalmología',
      6: 'Traumatología',
      7: 'Ginecología',
      8: 'Neurología',
      9: 'Psiquiatría',
    };

    return specialties[specialtyId] || `Especialidad ${specialtyId}`;
  }

  /**
   * Genera una fecha de cita basada en el scheduleId
   * @param scheduleId - ID del schedule
   * @returns Fecha en formato ISO
   */
  private generateAppointmentDate(scheduleId: number): string {
    const now = new Date();
    const daysToAdd = (scheduleId % 30) + 1;
    const hour = 8 + (scheduleId % 10);
    const minute = (scheduleId % 2) === 0 ? 0 : 30;

    now.setDate(now.getDate() + daysToAdd);
    now.setHours(hour, minute, 0, 0);

    return now.toISOString();
  }
}

