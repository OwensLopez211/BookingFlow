export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }
  
  export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  }
  
  export type LoadingState = 'idle' | 'loading' | 'success' | 'error';