const DATABASE_ID =
  process.env.CLOUDFLARE_D1_DATABASE_ID ??
  "d0013932-d793-4b9f-9a4d-5376681a1d34";

type D1Result<T> = {
  result?: Array<{
    results?: T[];
    success?: boolean;
    meta?: {
      changes?: number;
    };
  }>;

  success?: boolean;

  errors?: Array<{
    message?: string;
  }>;
};

export async function queryD1<T>({
  sql,
  params = [],
}: {
  sql: string;
  params?: Array<string | number | null>;
}) {
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID;

  const token =
    process.env.CLOUDFLARE_AI_TOKEN;

  if (!accountId || !token) {
    throw new Error(
      "Cloudflare D1 credentials are not configured."
    );
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${DATABASE_ID}/query`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        sql,
        params,
      }),

      cache: "no-store",
    }
  );

  const data =
    (await response.json()) as D1Result<T>;

  if (!response.ok || data.success === false) {
    throw new Error(
      data.errors?.[0]?.message ??
        `D1 query failed with HTTP ${response.status}`
    );
  }

  const queryResult =
    data.result?.[0];

  if (!queryResult?.success) {
    throw new Error(
      "D1 query did not complete successfully."
    );
  }

  return {
    rows:
      queryResult.results ?? [],
    changes:
      queryResult.meta?.changes ?? 0,
  };
}
