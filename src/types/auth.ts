export type Permission = {
  id: number;
  name: string;
  code: string;
  description: string;
};

export type AuthRole = {
  id: number;
  name: string;
  code: string;
  description: string;
  is_system: boolean;
  permissions: Permission[];
};

export type ApiUser = {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  role: AuthRole;
  last_login_at: string | null;
  created_at: string;
};

export type AuthUser = ApiUser & {
  picture?: string;
  city?: string;
  timeZone?: string;
  language?: string;
};

export type LoginData = {
  token: string;
  token_type: string;
  user: ApiUser;
};
