interface ApiResponse<T = any> {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}
export declare const createResponse: <T>(statusCode: number, data?: T, error?: string, message?: string) => ApiResponse;
export declare const successResponse: <T>(data: T, message?: string) => ApiResponse<any>;
export declare const errorResponse: (error: string, statusCode?: number) => ApiResponse<any>;
export declare const unauthorizedResponse: (message?: string) => ApiResponse<any>;
export declare const notFoundResponse: (message?: string) => ApiResponse<any>;
export declare const serverErrorResponse: (message?: string) => ApiResponse<any>;
export {};
