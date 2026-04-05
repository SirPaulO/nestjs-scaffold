import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Validates that a YYYY-MM-DD date string is today or in the future.
 */
export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          const [year, month, day] = value.split('-').map(Number);
          const inputDate = new Date(year, month - 1, day);
          inputDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return inputDate >= today;
        },
        defaultMessage(): string {
          return 'Date must be today or in the future';
        },
      },
    });
  };
}
