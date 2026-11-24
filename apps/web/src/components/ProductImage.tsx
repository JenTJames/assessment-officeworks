import { cn } from "@/lib/utils";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function ProductImage({ src, alt, className }: ProductImageProps) {
  return (
    <div className={cn("flex items-center justify-center bg-media p-6", className)}>
      <img src={src} alt={alt} loading="lazy" className="size-full object-contain" />
    </div>
  );
}
