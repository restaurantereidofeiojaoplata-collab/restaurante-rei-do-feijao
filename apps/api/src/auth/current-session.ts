export type CurrentSession = {
  branchId?: string | null;
  email: string;
  exp?: number;
  iat?: number;
  permissions: string[];
  restaurantId: string;
  userId: string;
  deviceSessionId?: string | null;
};
