import { AppointmentService } from '../../services/appointment.service';
import { AppointmentDynamoRepository } from '../../repositories/appointment-dynamo.repository';
import { SNSClientService } from '../../integrations/sns.client';
import { ScheduleClientService } from '../../integrations/schedule.client';
import { createContext } from '../../middleware/context';
import { AppointmentStatus } from '../../entities/appointment.entity';

// Mocks
jest.mock('../../repositories/appointment-dynamo.repository');
jest.mock('../../integrations/sns.client');
jest.mock('../../integrations/schedule.client');

describe('AppointmentService', () => {
  let service: AppointmentService;
  let mockDynamoRepository: jest.Mocked<AppointmentDynamoRepository>;
  let mockSNSClient: jest.Mocked<SNSClientService>;
  let mockScheduleClient: jest.Mocked<ScheduleClientService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Crear instancia del servicio
    service = new AppointmentService();

    // Obtener instancias mockeadas
    mockDynamoRepository = AppointmentDynamoRepository.prototype as jest.Mocked<AppointmentDynamoRepository>;
    mockSNSClient = SNSClientService.prototype as jest.Mocked<SNSClientService>;
    mockScheduleClient = ScheduleClientService.prototype as jest.Mocked<ScheduleClientService>;
  });

  describe('createAppointment', () => {
    it('debería crear un agendamiento exitosamente', async () => {
      // Arrange
      const ctx = createContext('test-app', 'test-tx-123');
      const request = {
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'PE',
      };

      mockScheduleClient.isScheduleAvailable = jest.fn().mockResolvedValue(true);
      mockDynamoRepository.create = jest.fn().mockResolvedValue({
        appointmentId: 'test-id',
        ...request,
        status: AppointmentStatus.PENDING,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        transactionId: ctx.transactionId,
        applicationId: ctx.applicationId,
      });
      mockSNSClient.publishAppointment = jest.fn().mockResolvedValue('msg-123');

      // Act
      const result = await service.createAppointment(ctx, request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(AppointmentStatus.PENDING);
      expect(result.data.appointmentId).toBeDefined();
      expect(mockScheduleClient.isScheduleAvailable).toHaveBeenCalledWith(ctx, request.scheduleId);
      expect(mockDynamoRepository.create).toHaveBeenCalled();
      expect(mockSNSClient.publishAppointment).toHaveBeenCalled();
    });

    it('debería lanzar error si el schedule no está disponible', async () => {
      // Arrange
      const ctx = createContext('test-app');
      const request = {
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'PE',
      };

      mockScheduleClient.isScheduleAvailable = jest.fn().mockResolvedValue(false);

      // Act & Assert
      await expect(service.createAppointment(ctx, request)).rejects.toThrow(
        'El espacio de agendamiento 100 no está disponible'
      );
      expect(mockDynamoRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getAppointmentsByInsuredId', () => {
    it('debería retornar lista de agendamientos', async () => {
      // Arrange
      const ctx = createContext('test-app');
      const insuredId = '00123';

      const mockEntities = [
        {
          appointmentId: 'appt-1',
          insuredId,
          scheduleId: 100,
          countryISO: 'PE',
          status: AppointmentStatus.PENDING,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          transactionId: 'tx-1',
          applicationId: 'app-1',
        },
      ];

      mockDynamoRepository.findByInsuredId = jest.fn().mockResolvedValue(mockEntities);

      // Act
      const result = await service.getAppointmentsByInsuredId(ctx, insuredId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].appointmentId).toBe('appt-1');
      expect(mockDynamoRepository.findByInsuredId).toHaveBeenCalledWith(ctx, insuredId);
    });

    it('debería retornar lista vacía si no hay agendamientos', async () => {
      // Arrange
      const ctx = createContext('test-app');
      const insuredId = '00123';

      mockDynamoRepository.findByInsuredId = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.getAppointmentsByInsuredId(ctx, insuredId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('completeAppointment', () => {
    it('debería actualizar el estado a completed', async () => {
      // Arrange
      const ctx = createContext('test-app');
      const appointmentId = 'appt-123';

      const mockUpdated = {
        appointmentId,
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'PE',
        status: AppointmentStatus.COMPLETED,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T01:00:00.000Z',
        completedAt: '2024-01-01T01:00:00.000Z',
        transactionId: 'tx-1',
        applicationId: 'app-1',
      };

      mockDynamoRepository.updateStatus = jest.fn().mockResolvedValue(mockUpdated);

      // Act
      const result = await service.completeAppointment(ctx, appointmentId);

      // Assert
      expect(result.status).toBe(AppointmentStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
      expect(mockDynamoRepository.updateStatus).toHaveBeenCalledWith(
        ctx,
        appointmentId,
        AppointmentStatus.COMPLETED
      );
    });
  });
});

