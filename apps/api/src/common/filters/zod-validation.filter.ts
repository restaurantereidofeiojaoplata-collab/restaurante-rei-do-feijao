import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { z } from "zod";

@Catch(z.ZodError)
export class ZodValidationFilter implements ExceptionFilter {
  catch(exception: z.ZodError<any>, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    const errors = exception.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    }));

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.issues.map((e) => e.message).join(', '),
      errors,
      error: "Bad Request"
    });
  }
}
