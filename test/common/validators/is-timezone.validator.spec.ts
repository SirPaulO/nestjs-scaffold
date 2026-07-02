import { validate } from 'class-validator';
import { IsTimezone } from '@common/validators/is-timezone.validator';

class TimezoneDto {
  @IsTimezone()
  timezone!: string;
}

describe('IsTimezone', () => {
  it.each(['America/New_York', 'Europe/London', 'UTC', 'Asia/Tokyo'])(
    'should accept %s',
    async (timezone) => {
      const dto = new TimezoneDto();
      dto.timezone = timezone;

      expect(await validate(dto)).toHaveLength(0);
    },
  );

  it('should reject an unrecognised timezone identifier', async () => {
    const dto = new TimezoneDto();
    dto.timezone = 'Fake/Timezone';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual(
      expect.objectContaining({
        isTimezone: expect.stringContaining('valid IANA timezone'),
      }),
    );
  });

  it('should reject a non-string value', async () => {
    const dto = new TimezoneDto();
    dto.timezone = 123 as unknown as string;

    expect(await validate(dto)).toHaveLength(1);
  });
});
