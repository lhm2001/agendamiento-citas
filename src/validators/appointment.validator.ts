import Joi from 'joi';
import { CreateAppointmentRequest } from '../dtos/appointment.dto';

/**
 * Esquema de validación para crear un agendamiento
 */
export const createAppointmentSchema = Joi.object<CreateAppointmentRequest>({
  insuredId: Joi.string()
    .pattern(/^\d{5}$/)
    .required()
    .messages({
      'string.pattern.base': 'insuredId debe ser un código de 5 dígitos',
      'any.required': 'insuredId es requerido',
    }),

  scheduleId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'scheduleId debe ser un número',
      'number.positive': 'scheduleId debe ser un número positivo',
      'any.required': 'scheduleId es requerido',
    }),

  countryISO: Joi.string()
    .valid('PE', 'CL')
    .required()
    .messages({
      'any.only': 'countryISO debe ser PE o CL',
      'any.required': 'countryISO es requerido',
    }),
});

/**
 * Esquema de validación para parámetro insuredId en URL
 */
export const insuredIdParamSchema = Joi.object({
  insuredId: Joi.string()
    .pattern(/^\d{5}$/)
    .required()
    .messages({
      'string.pattern.base': 'insuredId debe ser un código de 5 dígitos',
      'any.required': 'insuredId es requerido',
    }),
});

/**
 * Valida un objeto contra un esquema Joi
 * @param schema - Esquema Joi
 * @param data - Datos a validar
 * @returns Datos validados
 * @throws Error si la validación falla
 */
export const validateSchema = <T>(schema: Joi.ObjectSchema<T>, data: unknown): T => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Validación fallida: ${messages}`);
  }

  return value;
};

