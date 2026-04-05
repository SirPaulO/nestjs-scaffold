import { registerDecorator, ValidationOptions } from 'class-validator';

const VALID_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Vienna',
  'Europe/Stockholm',
  'Europe/Warsaw',
  'Europe/Prague',
  'Europe/Budapest',
  'Europe/Athens',
  'Europe/Istanbul',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Pacific/Auckland',
  'UTC',
];

/**
 * Validates that a string is a recognised IANA timezone identifier.
 */
export function IsTimezone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isTimezone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && VALID_TIMEZONES.includes(value);
        },
        defaultMessage(): string {
          return 'Timezone must be a valid IANA timezone identifier (e.g., America/New_York, Europe/London)';
        },
      },
    });
  };
}
