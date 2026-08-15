interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_AI_TOKEN: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    CLOUDFLARE_ACCOUNT_ID: string;
    CLOUDFLARE_AI_TOKEN: string;
  }
}
