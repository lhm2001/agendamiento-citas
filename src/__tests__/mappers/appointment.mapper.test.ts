import { AppointmentMapper } from '../../mappers/appointment.mapper';
import { CreateAppointmentRequest } from '../../dtos/appointment.dto';
import { AppointmentStatus } from '../../entities/appointment.entity';
import { createContext } from '../../middleware/context';

describe('AppointmentMapper', () => {
  describe('toEntity', () => {
    it('debería convertir CreateAppointmentRequest a Entity', () => {
      // Arrange
      const ctx = createContext('test-app', 'tx-123');
      const request: CreateAppointmentRequest = {
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'PE',
      };
      const appointmentId = 'appt-123';

      // Act
      const entity = AppointmentMapper.toEntity(request, appointmentId, ctx);

      // Assert
      expect(entity.appointmentId).toBe(appointmentId);
      expect(entity.insuredId).toBe(request.insuredId);
      expect(entity.scheduleId).toBe(request.scheduleId);
      expect(entity.countryISO).toBe(request.countryISO);
      expect(entity.status).toBe(AppointmentStatus.PENDING);
      expect(entity.transactionId).toBe(ctx.transactionId);
      expect(entity.applicationId).toBe(ctx.applicationId);
      expect(entity.createdAt).toBeDefined();
      expect(entity.updatedAt).toBeDefined();
    });
  });

  describe('toDTO', () => {
    it('debería convertir Entity a DTO', () => {
      // Arrange
      const entity = {
        appointmentId: 'appt-123',
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'PE',
        status: AppointmentStatus.PENDING,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        transactionId: 'tx-123',
        applicationId: 'app-1',
      };

      // Act
      const dto = AppointmentMapper.toDTO(entity);

      // Assert
      expect(dto.appointmentId).toBe(entity.appointmentId);
      expect(dto.insuredId).toBe(entity.insuredId);
      expect(dto.scheduleId).toBe(entity.scheduleId);
      expect(dto.countryISO).toBe(entity.countryISO);
      expect(dto.status).toBe(entity.status);
      expect(dto.createdAt).toBe(entity.createdAt);
      expect(dto.updatedAt).toBe(entity.updatedAt);
    });
  });

  describe('toMessageDTO', () => {
    it('debería convertir Entity a MessageDTO', () => {
      // Arrange
      const entity = {
        appointmentId: 'appt-123',
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'PE',
        status: AppointmentStatus.PENDING,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        transactionId: 'tx-123',
        applicationId: 'app-1',
      };

      // Act
      const messageDTO = AppointmentMapper.toMessageDTO(entity);

      // Assert
      expect(messageDTO.appointmentId).toBe(entity.appointmentId);
      expect(messageDTO.insuredId).toBe(entity.insuredId);
      expect(messageDTO.scheduleId).toBe(entity.scheduleId);
      expect(messageDTO.countryISO).toBe(entity.countryISO);
      expect(messageDTO.context.applicationId).toBe(entity.applicationId);
      expect(messageDTO.context.transactionId).toBe(entity.transactionId);
      expect(messageDTO.context.timestamp).toBe(entity.createdAt);
    });
  });

  describe('toRDSEntity', () => {
    it('debería convertir datos a RDS Entity', () => {
      // Arrange
      const appointmentId = 'appt-123';
      const insuredId = '00123';
      const scheduleId = 100;
      const countryISO = 'PE';
      const scheduleDetails = {
        centerId: 1,
        specialtyId: 2,
        medicId: 3,
        appointmentDate: '2024-12-30T12:30:00Z',
      };

      // Act
      const rdsEntity = AppointmentMapper.toRDSEntity(
        appointmentId,
        insuredId,
        scheduleId,
        countryISO,
        scheduleDetails
      );

      // Assert
      expect(rdsEntity.appointmentId).toBe(appointmentId);
      expect(rdsEntity.insuredId).toBe(insuredId);
      expect(rdsEntity.scheduleId).toBe(scheduleId);
      expect(rdsEntity.countryISO).toBe(countryISO);
      expect(rdsEntity.centerId).toBe(scheduleDetails.centerId);
      expect(rdsEntity.specialtyId).toBe(scheduleDetails.specialtyId);
      expect(rdsEntity.medicId).toBe(scheduleDetails.medicId);
      expect(rdsEntity.appointmentDate).toBe(scheduleDetails.appointmentDate);
      expect(rdsEntity.status).toBe('confirmed');
      expect(rdsEntity.metadata).toBeDefined();
    });
  });

  describe('toDTOList', () => {
    it('debería convertir lista de entities a lista de DTOs', () => {
      // Arrange
      const entities = [
        {
          appointmentId: 'appt-1',
          insuredId: '00123',
          scheduleId: 100,
          countryISO: 'PE',
          status: AppointmentStatus.PENDING,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          transactionId: 'tx-1',
          applicationId: 'app-1',
        },
        {
          appointmentId: 'appt-2',
          insuredId: '00123',
          scheduleId: 101,
          countryISO: 'CL',
          status: AppointmentStatus.COMPLETED,
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T01:00:00.000Z',
          completedAt: '2024-01-02T01:00:00.000Z',
          transactionId: 'tx-2',
          applicationId: 'app-1',
        },
      ];

      // Act
      const dtos = AppointmentMapper.toDTOList(entities);

      // Assert
      expect(dtos).toHaveLength(2);
      expect(dtos[0].appointmentId).toBe('appt-1');
      expect(dtos[1].appointmentId).toBe('appt-2');
      expect(dtos[1].completedAt).toBeDefined();
    });
  });
});

