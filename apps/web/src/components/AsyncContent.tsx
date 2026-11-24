import { CircleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { describeError } from "@/lib/api-error";
import { StatusPanel } from "./StatusPanel";

export type AsyncState<Data> = {
  data: Data | undefined;
  error: Error | null;
  refetch: () => void;
};

type AsyncContentProps<Data> = {
  state: AsyncState<Data>;
  loading: ReactNode;
  children: (data: Data) => ReactNode;
};

export function AsyncContent<Data>({ state, loading, children }: AsyncContentProps<Data>) {
  if (state.data !== undefined) {
    return children(state.data);
  }
  if (state.error) {
    const { title, message, canRetry } = describeError(state.error);
    return (
      <StatusPanel
        role="alert"
        tone="destructive"
        icon={CircleAlertIcon}
        title={title}
        message={message}
        action={
          canRetry ? (
            <Button
              variant="outline"
              onClick={() => {
                state.refetch();
              }}
            >
              Try again
            </Button>
          ) : null
        }
      />
    );
  }
  return loading;
}
