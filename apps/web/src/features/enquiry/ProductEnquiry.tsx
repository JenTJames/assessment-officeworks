import type { ProductId } from "@catalogue/contracts";
import { useId } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { brand } from "@/config/brand";
import { enquiryAnchor } from "@/lib/paths";
import { EnquiryForm } from "./components/EnquiryForm";
import { EnquirySent } from "./components/EnquirySent";
import { useSubmitEnquiry } from "./hooks/useSubmitEnquiry";

type ProductEnquiryProps = {
  productId: ProductId;
};

export function ProductEnquiry({ productId }: ProductEnquiryProps) {
  const headingId = useId();
  const enquiry = useSubmitEnquiry();

  return (
    <section
      id={enquiryAnchor}
      aria-labelledby={headingId}
      className="grid scroll-mt-6 gap-8 border-t pt-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
    >
      <div className="flex flex-col gap-2">
        <h2 id={headingId} className="text-xl font-bold tracking-tight">
          {brand.copy.enquiryTitle}
        </h2>
        <p className="text-muted-foreground">{brand.copy.enquiryDescription}</p>
        <p className="text-sm text-muted-foreground">{brand.copy.enquiryResponseNote}</p>
      </div>
      <Card>
        <CardContent>
          {enquiry.isSuccess ? (
            <EnquirySent
              email={enquiry.variables.email}
              onSendAnother={() => {
                enquiry.reset();
              }}
            />
          ) : (
            <EnquiryForm
              onSubmit={async (values) => {
                await enquiry.mutateAsync({ ...values, productId });
              }}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
