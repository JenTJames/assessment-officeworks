import { Link } from "react-router";
import { brand } from "@/config/brand";
import { paths } from "@/lib/paths";

export function BrandLogo() {
  return (
    <Link
      to={paths.home()}
      className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground"
    >
      <span
        aria-hidden="true"
        className="inline-flex size-7 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground"
      >
        {brand.logoMark}
      </span>
      {brand.name}
    </Link>
  );
}
