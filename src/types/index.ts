export interface ConnectionConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  password?: string;
  database?: number;
  tls: boolean;
}

export interface KeyInfo {
  key: string;
  type: string;
  ttl: number;
  size?: number;
}
