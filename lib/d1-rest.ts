import { getDb } from "@/lib/db";

type QueryResult<T> = {
  rows: T[];
  changes: number;
};

export async function queryD1<
  T extends Record<string, unknown> = Record<string, unknown>
>({
  sql,
  params = [],
}: {
  sql: string;
  params?: Array<string | number | null>;
}): Promise<QueryResult<T>> {
  const db =
    await getDb();

  const statement =
    db
      .prepare(sql)
      .bind(...params);

  const result =
    await statement.run<T>();

  if (!result.success) {
    throw new Error(
      "D1 query did not complete successfully."
    );
  }

  return {
    rows: (result.results ?? []) as T[],
    changes:
      result.meta?.changes ?? 0,
  };
}
