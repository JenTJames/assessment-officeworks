import { enquiryLimits, enquiryRequestSchema, honeypotFieldName } from "@catalogue/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon } from "lucide-react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { brand } from "@/config/brand";
import { ApiError, describeError } from "@/lib/api-error";

const enquiryFormSchema = enquiryRequestSchema.omit({ productId: true });

type EnquiryFormInput = z.input<typeof enquiryFormSchema>;
type EnquiryFieldName = keyof EnquiryFormInput;
export type EnquiryFormValues = z.output<typeof enquiryFormSchema>;

const emptyEnquiry: EnquiryFormInput = {
  name: "",
  email: "",
  phone: "",
  message: "",
  [honeypotFieldName]: "",
};

function isVisibleField(name: string): name is EnquiryFieldName {
  return name !== honeypotFieldName && Object.hasOwn(enquiryFormSchema.shape, name);
}

type EnquiryFormProps = {
  onSubmit: (values: EnquiryFormValues) => Promise<void>;
};

export function EnquiryForm({ onSubmit }: EnquiryFormProps) {
  const honeypotId = useId();
  const form = useForm({ resolver: zodResolver(enquiryFormSchema), defaultValues: emptyEnquiry });
  const { isSubmitting, errors } = form.formState;

  function showServerError(error: Error) {
    const fieldErrors = error instanceof ApiError ? Object.entries(error.fields) : [];
    const visibleFieldErrors = fieldErrors.filter(([name]) => isVisibleField(name));
    for (const [name, [message]] of visibleFieldErrors) {
      if (isVisibleField(name)) {
        form.setError(name, { type: "server", message }, { shouldFocus: true });
      }
    }
    if (visibleFieldErrors.length === 0 || visibleFieldErrors.length < fieldErrors.length) {
      form.setError("root", { type: "server", message: describeError(error).message });
    }
  }

  async function submit(values: EnquiryFormValues) {
    try {
      await onSubmit(values);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      showServerError(error);
    }
  }

  return (
    <Form {...form}>
      <form
        noValidate
        aria-label={brand.copy.enquiryTitle}
        onSubmit={(event) => {
          void form.handleSubmit(submit)(event);
        }}
        className="flex flex-col gap-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    maxLength={enquiryLimits.nameMaxLength}
                    aria-required="true"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    maxLength={enquiryLimits.emailMaxLength}
                    aria-required="true"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Phone <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input type="tel" autoComplete="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Message <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea rows={5} maxLength={enquiryLimits.messageMaxLength} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div aria-hidden="true" className="sr-only">
          <label htmlFor={honeypotId}>Leave this field empty</label>
          <input
            id={honeypotId}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...form.register(honeypotFieldName)}
          />
        </div>
        {errors.root?.message ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 px-3 py-2.5 text-sm text-destructive"
          >
            <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {errors.root.message}
          </p>
        ) : null}
        <Button type="submit" disabled={isSubmitting} className="h-11 self-start px-6">
          {isSubmitting ? brand.copy.enquirySubmitting : brand.copy.enquirySubmit}
        </Button>
      </form>
    </Form>
  );
}
