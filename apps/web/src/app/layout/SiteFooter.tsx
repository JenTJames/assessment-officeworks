import { brand } from "@/config/brand";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto flex max-w-[75rem] flex-wrap justify-between gap-2 p-6 text-[0.8125rem] text-muted-foreground">
        <span>
          © {new Date().getFullYear()} {brand.name}
        </span>
        <span>{brand.copy.footerNote}</span>
      </div>
    </footer>
  );
}
