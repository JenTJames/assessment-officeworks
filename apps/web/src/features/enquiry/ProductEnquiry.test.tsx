import {
  enquiryRequestSchema,
  type EnquiryRequest,
  type ErrorResponse,
} from "@catalogue/contracts";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { buildProduct } from "@/test/fixtures";
import { renderRoute } from "@/test/render";
import { apiUrl, errorResponse, server } from "@/test/server";

function recordEnquiries(
  respond = () => HttpResponse.json({ status: "received" }, { status: 202 }),
) {
  const received: EnquiryRequest[] = [];
  server.use(
    http.post(apiUrl("/enquiries"), async ({ request }) => {
      received.push(enquiryRequestSchema.parse(await request.json()));
      return respond();
    }),
  );
  return received;
}

async function openEnquiryForm() {
  renderRoute("/products/1");
  return screen.findByRole("form", { name: "Ask our sales team" });
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
  await user.type(screen.getByLabelText("Email"), "ada@example.com");
}

beforeEach(() => {
  server.use(http.get(apiUrl("/products/1"), () => HttpResponse.json(buildProduct())));
});

describe("product enquiry", () => {
  it("links from the product details to the enquiry form", async () => {
    await openEnquiryForm();

    expect(screen.getByRole("link", { name: "Enquire about this product" })).toHaveAttribute(
      "href",
      "#enquire",
    );
  });

  it("sends the enquiry with the product attached and confirms it was sent", async () => {
    const user = userEvent.setup();
    const received = recordEnquiries();
    await openEnquiryForm();

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText("Phone (optional)"), "+61 2 9999 0000");
    await user.type(screen.getByLabelText("Message (optional)"), "Do you have it in navy?");
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    const confirmation = await screen.findByRole("heading", { name: "Thank you for your enquiry" });
    expect(confirmation).toHaveFocus();
    expect(screen.getByText("ada@example.com")).toBeVisible();
    expect(received).toEqual([
      {
        productId: "1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+61 2 9999 0000",
        message: "Do you have it in navy?",
        website: "",
      },
    ]);
  });

  it("starts a fresh enquiry after one is sent", async () => {
    const user = userEvent.setup();
    recordEnquiries();
    await openEnquiryForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    await user.click(await screen.findByRole("button", { name: "Send another enquiry" }));

    expect(screen.getByLabelText("Name")).toHaveValue("");
  });

  it("validates the fields before sending anything", async () => {
    const user = userEvent.setup();
    const received = recordEnquiries();
    await openEnquiryForm();

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Phone (optional)"), "call me");
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    expect(await screen.findByText("Enter your name")).toBeVisible();
    expect(screen.getByText("Enter a valid email address")).toBeVisible();
    expect(screen.getByText("Enter a valid phone number")).toBeVisible();
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    expect(received).toHaveLength(0);
  });

  it("shows the server's field errors next to the fields", async () => {
    const user = userEvent.setup();
    const body: ErrorResponse = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        fields: { email: ["This email address can't receive mail"] },
      },
    };
    recordEnquiries(() => HttpResponse.json(body, { status: 400 }));
    await openEnquiryForm();

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    expect(await screen.findByText("This email address can't receive mail")).toBeVisible();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("explains when the product can no longer be enquired about", async () => {
    const user = userEvent.setup();
    const message = "This product is no longer available, so we can't send an enquiry.";
    const body: ErrorResponse = {
      error: { code: "VALIDATION_ERROR", message, fields: { productId: [message] } },
    };
    recordEnquiries(() => HttpResponse.json(body, { status: 400 }));
    await openEnquiryForm();

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });

  it("keeps what the customer typed when sending fails", async () => {
    const user = userEvent.setup();
    recordEnquiries(() =>
      errorResponse(429, "RATE_LIMITED", "You've sent several enquiries recently."),
    );
    const form = await openEnquiryForm();

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You've sent several enquiries recently.",
    );
    expect(within(form).getByLabelText("Name")).toHaveValue("Ada Lovelace");
    expect(screen.getByRole("button", { name: "Send enquiry" })).toBeEnabled();
  });

  it("hides the spam trap field from customers", async () => {
    await openEnquiryForm();

    expect(screen.queryByRole("textbox", { name: "Leave this field empty" })).toBeNull();
    expect(screen.getByLabelText("Leave this field empty")).toHaveAttribute("tabindex", "-1");
  });
});
