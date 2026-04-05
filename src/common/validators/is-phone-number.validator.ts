import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Validates phone numbers in E.164-like international format.
 * Accepts: +1-555-123-4567, +44 20 7123 4567, +1 (555) 123-4567
 */
export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          const phoneRegex =
            /^\+\d{1,3}[\s-]?(\(\d{1,4}\)|\d{1,4})[\s-]?\d{3,4}[\s-]?\d{3,4}$/;
          return phoneRegex.test(value);
        },
        defaultMessage(): string {
          return 'Phone number must be in international format (e.g., +1-555-123-4567)';
        },
      },
    });
  };
}
