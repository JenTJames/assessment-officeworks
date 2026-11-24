import { CircleCheckIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";

type EnquirySentProps = {
  email: string;
  onSendAnother: () => void;
};

export function EnquirySent({ email, onSendAnother }: EnquirySentProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div role="status" className="flex flex-col items-start gap-3">
      <span
        aria-hidden="true"
        className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-foreground"
      >
        <CircleCheckIcon className="size-5" />
      </span>
      <h3 ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">
        {brand.copy.enquirySentTitle}
      </h3>
      <p className="text-sm text-muted-foreground">
        Thanks for getting in touch. Our sales team will reply to{" "}
        <span className="font-medium text-foreground">{email}</span>.
      </p>
      <Button variant="outline" onClick={onSendAnother}>
        {brand.copy.enquirySendAnother}
      </Button>
    </div>
  );
}
