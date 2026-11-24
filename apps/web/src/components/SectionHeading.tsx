import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  level?: 1 | 2;
  description?: ReactNode;
  aside?: ReactNode;
  className?: string;
};

const headingStyles = {
  1: "text-3xl font-bold tracking-tight",
  2: "text-xl font-bold tracking-tight",
} as const;

export function SectionHeading({
  title,
  level = 2,
  description,
  aside,
  className,
}: SectionHeadingProps) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <Heading className={headingStyles[level]}>{title}</Heading>
        {aside}
      </div>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
