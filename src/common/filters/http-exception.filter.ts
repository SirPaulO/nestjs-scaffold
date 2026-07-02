import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppErrorCode } from '../constants/error-codes';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string | null;
  errorCode: string;
  details: object | null;
}

/**
 * Global exception filter that ensures all API errors return a consistent JSON structure:
 * `{ statusCode, message, error, errorCode, details }`
 *
 * Features:
 * - Debug mode via APP_DEBUG env var or X-Debug-Mode header (non-production only)
 * - Vague 403 messages when debug is off (security)
 * - Validation error extraction from class-validator (BadRequestException)
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  private isDebugMode(request: Request): boolean {
    // Verbose error details are never exposed in production, regardless of
    // APP_DEBUG or the X-Debug-Mode header — both are dev/staging-only knobs.
    if (process.env.NODE_ENV === 'production') {
      return false;
    }

    const appDebug = process.env.APP_DEBUG === 'true';
    const headerDebug = request.headers['x-debug-mode'] === 'true';
    return appDebug || headerDebug;
  }

  private defaultErrorCode(status: number): string {
    switch (status) {
      case 400:
        return AppErrorCode.BAD_REQUEST;
      case 401:
        return AppErrorCode.UNAUTHORIZED;
      case 403:
        return AppErrorCode.FORBIDDEN;
      case 404:
        return AppErrorCode.NOT_FOUND;
      case 409:
        return AppErrorCode.CONFLICT;
      case 422:
        return AppErrorCode.VALIDATION_ERROR;
      default:
        return AppErrorCode.INTERNAL_SERVER_ERROR;
    }
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const debugMode = this.isDebugMode(request);

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const errorResponse = this.buildHttpErrorResponse(
        status,
        exceptionResponse,
        debugMode,
      );
      response.status(status).json(errorResponse);
    } else {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      );

      const errorResponse: ErrorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        error: null,
        errorCode: AppErrorCode.INTERNAL_SERVER_ERROR,
        details: null,
      };

      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }

  private buildHttpErrorResponse(
    status: number,
    exceptionResponse: string | object,
    debugMode: boolean,
  ): ErrorResponse {
    if (typeof exceptionResponse === 'string') {
      return this.buildSimpleResponse(status, exceptionResponse, debugMode);
    }

    const responseObj = exceptionResponse as Record<string, unknown>;

    // Validation errors from class-validator
    if (
      Array.isArray(responseObj.message) &&
      responseObj.message.length > 0 &&
      typeof responseObj.message[0] === 'string'
    ) {
      const validationErrors = responseObj.message as string[];
      return {
        statusCode: status,
        message: debugMode
          ? `Validation failed: ${validationErrors.join(', ')}`
          : 'Validation failed',
        error: 'VALIDATION_ERROR',
        errorCode: AppErrorCode.VALIDATION_ERROR,
        details: { validationErrors },
      };
    }

    // Extract AppErrorCode from the `error` description field
    const errorField = responseObj.error;
    const appErrorCode =
      typeof errorField === 'string' &&
      errorField === errorField.toUpperCase() &&
      errorField.includes('_')
        ? errorField
        : null;

    const message =
      typeof responseObj.message === 'string'
        ? responseObj.message
        : 'An error occurred';

    if (status === HttpStatus.FORBIDDEN && !debugMode) {
      return {
        statusCode: status,
        message: 'Forbidden',
        error: appErrorCode ?? 'Forbidden',
        errorCode: appErrorCode ?? this.defaultErrorCode(status),
        details: null,
      };
    }

    return {
      statusCode: status,
      message: status >= 500 && !debugMode ? 'Internal Server Error' : message,
      error:
        appErrorCode ??
        (typeof responseObj.error === 'string' ? responseObj.error : null),
      errorCode: appErrorCode ?? this.defaultErrorCode(status),
      details: null,
    };
  }

  private buildSimpleResponse(
    status: number,
    message: string,
    debugMode: boolean,
  ): ErrorResponse {
    if (status === HttpStatus.FORBIDDEN && !debugMode) {
      return {
        statusCode: status,
        message: 'Forbidden',
        error: 'Forbidden',
        errorCode: this.defaultErrorCode(status),
        details: null,
      };
    }

    return {
      statusCode: status,
      message,
      error: null,
      errorCode: this.defaultErrorCode(status),
      details: null,
    };
  }
}
