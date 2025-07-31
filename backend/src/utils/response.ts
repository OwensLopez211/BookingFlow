interface ApiResponse<T = any> {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  }
  
  export const createResponse = <T>(
    statusCode: number,
    data?: T,
    error?: string,
    message?: string
  ): ApiResponse => {
    const body = {
      success: statusCode >= 200 && statusCode < 300,
      ...(data && { data }),
      ...(error && { error }),
      ...(message && { message }),
      timestamp: new Date().toISOString(),
    };
  
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify(body),
    };
  };
  
  export const successResponse = <T>(data: T, message?: string) =>
    createResponse(200, data, undefined, message);
  
  export const errorResponse = (error: string, statusCode = 400) =>
    createResponse(statusCode, undefined, error);
  
  export const unauthorizedResponse = (message = 'No autorizado') =>
    createResponse(401, undefined, message);
  
  export const notFoundResponse = (message = 'Recurso no encontrado') =>
    createResponse(404, undefined, message);
  
  export const serverErrorResponse = (message = 'Error interno del servidor') =>
    createResponse(500, undefined, message);