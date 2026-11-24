import type { EnquiryRequest, EnquiryResponse, ProductId } from "@catalogue/contracts";
import { UpstreamUnavailableError } from "../../errors/upstream-unavailable-error.ts";
import { ValidationError } from "../../errors/validation-error.ts";
import type { Mailer } from "../../ports/mailer.ts";
import type { ProductSource } from "../../ports/product-source.ts";
import { buildEnquiryEmail, type EnquiredProduct } from "./enquiry-email.ts";

export type EnquiryService = {
  submitEnquiry(enquiry: EnquiryRequest): Promise<EnquiryResponse>;
};

type EnquiryServiceDependencies = {
  productSource: ProductSource;
  mailer: Mailer;
  salesInbox: string;
};

const unknownProductMessage = "This product is no longer available, so we can't send an enquiry.";

export function createEnquiryService({
  productSource,
  mailer,
  salesInbox,
}: EnquiryServiceDependencies): EnquiryService {
  async function findEnquiredProduct(id: ProductId): Promise<EnquiredProduct | undefined> {
    try {
      const product = await productSource.findProductById(id);
      return product === undefined ? undefined : { status: "found", product };
    } catch (error) {
      if (error instanceof UpstreamUnavailableError) {
        return { status: "unavailable", id };
      }
      throw error;
    }
  }

  return {
    async submitEnquiry(enquiry) {
      const enquiredProduct = await findEnquiredProduct(enquiry.productId);
      if (enquiredProduct === undefined) {
        throw new ValidationError({ productId: [unknownProductMessage] }, unknownProductMessage);
      }
      await mailer.send(buildEnquiryEmail({ enquiry, enquiredProduct, salesInbox }));
      return { status: "received" };
    },
  };
}
