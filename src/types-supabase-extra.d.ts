export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  updated_at: string;
  updated_by?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  created_by?: string;
  is_active: boolean;
}
