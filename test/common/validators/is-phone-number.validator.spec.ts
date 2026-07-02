import { validate } from 'class-validator';
import { IsPhoneNumber } from '@common/validators/is-phone-number.validator';

class PhoneDto {
  @IsPhoneNumber()
  phone!: string;
}

describe('IsPhoneNumber', () => {
  it.each([
    '+1-555-123-4567',
    '+44 20 7123 4567',
    '+1 (555) 123-4567',
  ])('should accept %s', async (phone) => {
    const dto = new PhoneDto();
    dto.phone = phone;

    expect(await validate(dto)).toHaveLength(0);
  });

  it.each(['not-a-phone', '555-1234', '', 12345])(
    'should reject %s',
    async (phone) => {
      const dto = new PhoneDto();
      dto.phone = phone as unknown as string;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toEqual(
        expect.objectContaining({
          isPhoneNumber: expect.stringContaining('international format'),
        }),
      );
    },
  );
});
