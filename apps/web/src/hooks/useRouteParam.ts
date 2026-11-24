import { useParams } from "react-router";
import type { z } from "zod";

export function useRouteParam<Schema extends z.ZodType<string>>(
  name: string,
  schema: Schema,
): z.infer<Schema> | undefined {
  const params = useParams();
  const parsed = schema.safeParse(params[name]);
  return parsed.success ? parsed.data : undefined;
}
