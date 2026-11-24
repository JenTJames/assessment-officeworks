import type { EnquiryRequest, Price, Product } from "@catalogue/contracts";
import type { EmailMessage } from "../../ports/mailer.ts";

export type EnquiredProduct =
  { status: "found"; product: Product } | { status: "unavailable"; id: Product["id"] };

type EnquiryEmailInput = {
  enquiry: EnquiryRequest;
  enquiredProduct: EnquiredProduct;
  salesInbox: string;
};

const notProvided = "Not provided";

function formatPrice({ minorUnits, currency }: Price): string {
  return `${currency} ${(minorUnits / 100).toFixed(2)}`;
}

function singleLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function orNotProvided(value: string | undefined): string {
  return value === undefined || value.trim() === "" ? notProvided : value.trim();
}

function productLines(enquiredProduct: EnquiredProduct): string[] {
  if (enquiredProduct.status === "unavailable") {
    return [
      `ID: ${enquiredProduct.id}`,
      "Product details could not be loaded when this enquiry was sent.",
    ];
  }
  const { product } = enquiredProduct;
  return [
    `ID: ${product.id}`,
    `Title: ${singleLine(product.title)}`,
    `Category: ${product.category.name}`,
    `Price: ${formatPrice(product.price)}`,
  ];
}

function subjectFor(enquiredProduct: EnquiredProduct): string {
  return enquiredProduct.status === "found"
    ? `Product enquiry: ${singleLine(enquiredProduct.product.title)}`
    : `Product enquiry: product ${enquiredProduct.id}`;
}

export function buildEnquiryEmail({
  enquiry,
  enquiredProduct,
  salesInbox,
}: EnquiryEmailInput): EmailMessage {
  const text = [
    "A customer has sent an enquiry about a product.",
    "",
    "PRODUCT",
    ...productLines(enquiredProduct),
    "",
    "CUSTOMER",
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Phone: ${orNotProvided(enquiry.phone)}`,
    "",
    "MESSAGE",
    orNotProvided(enquiry.message),
    "",
    "Reply to this email to respond to the customer.",
  ].join("\n");

  return {
    to: salesInbox,
    replyTo: { name: singleLine(enquiry.name), address: enquiry.email },
    subject: subjectFor(enquiredProduct),
    text,
  };
}
