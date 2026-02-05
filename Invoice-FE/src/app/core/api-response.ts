export type ApiResponse<T> = {
  status: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};
