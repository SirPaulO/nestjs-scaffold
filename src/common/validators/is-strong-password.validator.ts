import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          return (
            value.length >= 8 &&
            /[A-Z]/.test(value) &&
            /[a-z]/.test(value) &&
            /\d/.test(value) &&
            /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
          );
        },
        defaultMessage(): string {
          return 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character';
        },
      },
    });
  };
}
