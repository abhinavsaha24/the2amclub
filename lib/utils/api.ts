import { NextResponse, NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { BaseError } from "../errors";
import { logger } from "../logger";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    requestId: string;
  };
}

export function successResponse<T>(data: T, message?: string, status: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  if (message) response.message = message;
  
  return NextResponse.json(response, { status });
}

export function errorResponse(error: any, action: string = "unknown_action") {
  const requestId = uuidv4();
  
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred.";
  let details = undefined;

  if (error instanceof BaseError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.data;
  } else if (error instanceof Error) {
    message = error.message;
  }

  // Log the error
  logger.error({
    action,
    requestId,
    status: "failure",
    error: {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      code,
    },
  });

  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      requestId,
    },
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Wrapper for API route handlers to inject request IDs and centralize try/catch
 */
export function withApiHandler(
  action: string,
  handler: (req: NextRequest, requestId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
      const response = await handler(req, requestId);
      
      // Log successful request (optional, can be noisy for every GET request)
      if (req.method !== "GET") {
        logger.info({
          action,
          requestId,
          status: "success",
          duration_ms: Date.now() - startTime,
        });
      }

      return response;
    } catch (error) {
      return errorResponse(error, action);
    }
  };
}
