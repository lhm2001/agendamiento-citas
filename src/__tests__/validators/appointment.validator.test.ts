import { validateSchema, createAppointmentSchema, insuredIdParamSchema } from '../../validators/appointment.validator';

describe('Appointment Validators', () => {
  describe('createAppointmentSchema', () => {
    it('debería validar un request válido', () => {
      // Arrange
      const validRequest = {
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'PE',
      };

      // Act
      const result = validateSchema(createAppointmentSchema, validRequest);

      // Assert
      expect(result).toEqual(validRequest);
    });

    it('debería rechazar insuredId con formato incorrecto', () => {
      // Arrange
      const invalidRequest = {
        insuredId: '123', // Debe tener 5 dígitos
        scheduleId: 100,
        countryISO: 'PE',
      };

      // Act & Assert
      expect(() => validateSchema(createAppointmentSchema, invalidRequest)).toThrow(
        'insuredId debe ser un código de 5 dígitos'
      );
    });

    it('debería aceptar insuredId con ceros adelante', () => {
      // Arrange
      const validRequest = {
        insuredId: '00001',
        scheduleId: 100,
        countryISO: 'PE',
      };

      // Act
      const result = validateSchema(createAppointmentSchema, validRequest);

      // Assert
      expect(result.insuredId).toBe('00001');
    });

    it('debería rechazar scheduleId no positivo', () => {
      // Arrange
      const invalidRequest = {
        insuredId: '00123',
        scheduleId: -1,
        countryISO: 'PE',
      };

      // Act & Assert
      expect(() => validateSchema(createAppointmentSchema, invalidRequest)).toThrow(
        'scheduleId debe ser un número positivo'
      );
    });

    it('debería rechazar countryISO inválido', () => {
      // Arrange
      const invalidRequest = {
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'US', // Solo PE o CL son válidos
      };

      // Act & Assert
      expect(() => validateSchema(createAppointmentSchema, invalidRequest)).toThrow(
        'countryISO debe ser PE o CL'
      );
    });

    it('debería rechazar si falta campo requerido', () => {
      // Arrange
      const invalidRequest = {
        insuredId: '00123',
        // falta scheduleId
        countryISO: 'PE',
      };

      // Act & Assert
      expect(() => validateSchema(createAppointmentSchema, invalidRequest)).toThrow(
        'scheduleId es requerido'
      );
    });

    it('debería validar con countryISO CL', () => {
      // Arrange
      const validRequest = {
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'CL',
      };

      // Act
      const result = validateSchema(createAppointmentSchema, validRequest);

      // Assert
      expect(result.countryISO).toBe('CL');
    });
  });

  describe('insuredIdParamSchema', () => {
    it('debería validar insuredId válido', () => {
      // Arrange
      const validParam = { insuredId: '00123' };

      // Act
      const result = validateSchema(insuredIdParamSchema, validParam);

      // Assert
      expect(result.insuredId).toBe('00123');
    });

    it('debería rechazar insuredId inválido', () => {
      // Arrange
      const invalidParam = { insuredId: '123' };

      // Act & Assert
      expect(() => validateSchema(insuredIdParamSchema, invalidParam)).toThrow(
        'insuredId debe ser un código de 5 dígitos'
      );
    });
  });
});

