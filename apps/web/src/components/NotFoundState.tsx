import { SearchXIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { paths } from "@/lib/paths";
import { StatusPanel } from "./StatusPanel";

type NotFoundStateProps = {
  message?: string;
};

export function NotFoundState({
  message = "The page you're looking for doesn't exist or has moved.",
}: NotFoundStateProps) {
  return (
    <StatusPanel
      icon={SearchXIcon}
      title="Not found"
      message={message}
      action={
        <Button asChild variant="outline">
          <Link to={paths.home()}>Continue browsing</Link>
        </Button>
      }
    />
  );
}
