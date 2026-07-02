import { validate } from 'class-validator';
import { IsStrongPassword } from '@common/validators/is-strong-password.validator';

class PasswordDto {
  @IsStrongPassword()
  password!: string;
}

describe('IsStrongPassword', () => {
  it('should accept a password with upper/lower/digit/special and 8+ chars', async () => {
    const dto = new PasswordDto();
    dto.password = 'Str0ng!Pass';

    expect(await validate(dto)).toHaveLength(0);
  });

  it('should reject a password shorter than 8 characters', async () => {
    const dto = new PasswordDto();
    dto.password = 'Sh0rt!';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject a password missing an uppercase letter', async () => {
    const dto = new PasswordDto();
    dto.password = 'str0ng!pass';

    expect(await validate(dto)).toHaveLength(1);
  });

  it('should reject a password missing a lowercase letter', async () => {
    const dto = new PasswordDto();
    dto.password = 'STR0NG!PASS';

    expect(await validate(dto)).toHaveLength(1);
  });

  it('should reject a password missing a digit', async () => {
    const dto = new PasswordDto();
    dto.password = 'Strong!Pass';

    expect(await validate(dto)).toHaveLength(1);
  });

  it('should reject a password missing a special character', async () => {
    const dto = new PasswordDto();
    dto.password = 'Str0ngPass';

    expect(await validate(dto)).toHaveLength(1);
  });

  it('should reject a non-string value', async () => {
    const dto = new PasswordDto();
    dto.password = 12345678 as unknown as string;

    expect(await validate(dto)).toHaveLength(1);
  });
});
