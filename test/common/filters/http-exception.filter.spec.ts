import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  ImATeapotException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { AppErrorCode } from '@common/constants/error-codes';

function buildHost(headers: Record<string, unknown> = {}): {
  host: ArgumentsHost;
  response: { status: jest.Mock; json: jest.Mock };
} {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
}

describe('HttpExceptionFilter', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  describe('debug gating', () => {
    it('should never reveal validation details in production, even with APP_DEBUG=true', () => {
      process.env.NODE_ENV = 'production';
      process.env.APP_DEBUG = 'true';
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      filter.catch(
        new BadRequestException(['name must not be empty']),
        host,
      );

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Validation failed' }),
      );
    });

    it('should never reveal validation details in production, even with the debug header', () => {
      process.env.NODE_ENV = 'production';
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost({ 'x-debug-mode': 'true' });

      filter.catch(
        new BadRequestException(['name must not be empty']),
        host,
      );

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Validation failed' }),
      );
    });

    it('should reveal validation details outside production when APP_DEBUG=true', () => {
      process.env.NODE_ENV = 'development';
      process.env.APP_DEBUG = 'true';
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      filter.catch(
        new BadRequestException(['name must not be empty']),
        host,
      );

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed: name must not be empty',
        }),
      );
    });

    it('should reveal validation details outside production via the X-Debug-Mode header', () => {
      process.env.NODE_ENV = 'development';
      process.env.APP_DEBUG = 'false';
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost({ 'x-debug-mode': 'true' });

      filter.catch(
        new BadRequestException(['name must not be empty']),
        host,
      );

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed: name must not be empty',
        }),
      );
    });

    it('should hide details outside production when neither APP_DEBUG nor the header is set', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.APP_DEBUG;
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      filter.catch(
        new BadRequestException(['name must not be empty']),
        host,
      );

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Validation failed' }),
      );
    });
  });

  describe('string exception responses (raw HttpException)', () => {
    // Nest's named exception classes (ForbiddenException, NotFoundException, …)
    // always wrap a string argument into an object response — the plain
    // string-response branch only fires for a bare `HttpException`.
    it('should return a vague Forbidden message when debug is off', () => {
      process.env.NODE_ENV = 'production';
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      filter.catch(
        new HttpException('you cannot see this', HttpStatus.FORBIDDEN),
        host,
      );

      expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
        error: 'Forbidden',
        errorCode: AppErrorCode.FORBIDDEN,
        details: null,
      });
    });

    it('should reveal the real Forbidden message when debug is on', () => {
      process.env.NODE_ENV = 'development';
      process.env.APP_DEBUG = 'true';
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      filter.catch(
        new HttpException('secret reason', HttpStatus.FORBIDDEN),
        host,
      );

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'secret reason' }),
      );
    });

    it('should return the real message for non-Forbidden string responses', () => {
      process.env.NODE_ENV = 'production';
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      filter.catch(
        new HttpException('reservation not found', HttpStatus.NOT_FOUND),
        host,
      );

      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'reservation not found',
        error: null,
        errorCode: AppErrorCode.NOT_FOUND,
        details: null,
      });
    });
  });

  describe('object exception responses', () => {
    it('should extract an AppErrorCode-shaped error field', () => {
      process.env.NODE_ENV = 'production';
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      filter.catch(
        new UnauthorizedException(
          'Invalid token',
          AppErrorCode.INVALID_TOKEN,
        ),
        host,
      );

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: AppErrorCode.INVALID_TOKEN,
          error: AppErrorCode.INVALID_TOKEN,
        }),
      );
    });

    it('should fall back to the status-derived error code when the error field is not AppErrorCode-shaped', () => {
      process.env.NODE_ENV = 'production';
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      filter.catch(new ConflictException('duplicate booking'), host);

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: AppErrorCode.CONFLICT,
        }),
      );
    });

    it('should return a vague Forbidden message for object responses when debug is off', () => {
      process.env.NODE_ENV = 'production';
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      // No AppErrorCode-shaped `error` field supplied, so Nest defaults it
      // to the plain reason phrase ("Forbidden") — not upper-snake-case —
      // which must NOT be mistaken for an AppErrorCode.
      filter.catch(new ForbiddenException('secret internal reason'), host);

      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
        error: 'Forbidden',
        errorCode: AppErrorCode.FORBIDDEN,
        details: null,
      });
    });

    it('should hide 5xx messages in production', () => {
      process.env.NODE_ENV = 'production';
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      filter.catch(
        new InternalServerErrorException('stack trace leaked here'),
        host,
      );

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Internal Server Error' }),
      );
    });

    it('should reveal 5xx messages outside production when debug is on', () => {
      process.env.NODE_ENV = 'development';
      process.env.APP_DEBUG = 'true';
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      filter.catch(
        new InternalServerErrorException('exact failure reason'),
        host,
      );

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'exact failure reason' }),
      );
    });

    it('should default the error code for a status with no explicit mapping', () => {
      process.env.NODE_ENV = 'production';
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      filter.catch(new ImATeapotException("I'm a teapot"), host);

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: AppErrorCode.INTERNAL_SERVER_ERROR,
        }),
      );
    });
  });

  describe('unhandled (non-HttpException) errors', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
    });

    it('should log and return a generic 500 for a thrown Error', () => {
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      filter.catch(new Error('unexpected failure'), host);

      expect(errorSpy).toHaveBeenCalledWith(
        'Unhandled exception',
        expect.stringContaining('unexpected failure'),
      );
      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        error: null,
        errorCode: AppErrorCode.INTERNAL_SERVER_ERROR,
        details: null,
      });
    });

    it('should log and return a generic 500 for a thrown non-Error value', () => {
      const filter = new HttpExceptionFilter();
      const { host, response } = buildHost();

      filter.catch('a raw string was thrown', host);

      expect(errorSpy).toHaveBeenCalledWith(
        'Unhandled exception',
        'a raw string was thrown',
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        }),
      );
    });
  });
});
