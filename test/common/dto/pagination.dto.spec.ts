import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';

describe('PaginationDto', () => {
  it('should default page to 1 and limit to 20 when omitted', () => {
    const dto = plainToInstance(PaginationDto, {});

    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('should coerce string query values to numbers', () => {
    const dto = plainToInstance(PaginationDto, { page: '3', limit: '50' });

    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(50);
  });

  it('should pass validation for valid page/limit values', async () => {
    const dto = plainToInstance(PaginationDto, { page: 2, limit: 10 });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('should fail validation when page is below 1', async () => {
    const dto = plainToInstance(PaginationDto, { page: 0 });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('should fail validation when limit exceeds 100', async () => {
    const dto = plainToInstance(PaginationDto, { limit: 101 });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('should fail validation for a non-integer page', async () => {
    const dto = plainToInstance(PaginationDto, { page: 1.5 });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });
});
