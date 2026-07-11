import { PipeTransform, ArgumentMetadata, Injectable } from "@nestjs/common";

@Injectable()
export class XssSanitizerPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Only sanitize payloads sent via request body
    if (metadata.type !== "body") {
      return value;
    }
    return this.sanitize(value);
  }

  /**
   * Recursively sanitizes input strings to strip script and iframe tags
   * to protect the database and frontend from XSS injections.
   */
  private sanitize(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === "string") {
      return obj
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
        .replace(/<iframe[^>]*>([\s\S]*?)<\/iframe>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/onload\s*=/gi, "")
        .replace(/onerror\s*=/gi, "")
        .replace(/onclick\s*=/gi, "");
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    if (typeof obj === "object") {
      const sanitizedObj: Record<string, any> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitizedObj[key] = this.sanitize(obj[key]);
        }
      }
      return sanitizedObj;
    }

    return obj;
  }
}
