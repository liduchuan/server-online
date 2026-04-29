export interface ServerItem {
  name: string;
  website: string;
}

export interface ServerOnlineItem {
  name: string;
  website: string;
  online: boolean;
  statusCode: number | null;
  error: string | null;
  checkedAt: string;
}

export const server: ServerItem[] = [
  {
    name: "Celhive DEV 登录页面",
    website: "https://www.celhive.ai/login",
  },
  {
    name: "Juchats 登录页面",
    website: "https://www.juchats.com/login",
  },
  {
    name: "Lanobanana",
    website: "https://lanobanana.com",
  },
];
