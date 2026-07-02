import { validate } from 'class-validator';
import { IsFutureDate } from '@common/validators/is-future-date.validator';

class FutureDateDto {
  @IsFutureDate()
  date!: string;
}

function toDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

describe('IsFutureDate', () => {
  it('should pass for today', async () => {
    const dto = new FutureDateDto();
    dto.date = toDateOnly(new Date());

    expect(await validate(dto)).toHaveLength(0);
  });

  it('should pass for a date in the future', async () => {
    const dto = new FutureDateDto();
    const future = new Date();
    future.setDate(future.getDate() + 7);
    dto.date = toDateOnly(future);

    expect(await validate(dto)).toHaveLength(0);
  });

  it('should fail for a date in the past', async () => {
    const dto = new FutureDateDto();
    const past = new Date();
    past.setDate(past.getDate() - 1);
    dto.date = toDateOnly(past);

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual(
      expect.objectContaining({
        isFutureDate: 'Date must be today or in the future',
      }),
    );
  });

  it('should fail for a non-string value', async () => {
    const dto = new FutureDateDto();
    dto.date = 20991231 as unknown as string;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});
