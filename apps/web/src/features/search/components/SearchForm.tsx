import { searchQuerySchema, searchTermMaxLength } from "@catalogue/contracts";
import { SearchIcon } from "lucide-react";
import { useId, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brand } from "@/config/brand";

const termSchema = searchQuerySchema.shape.term;

type SearchFormProps = {
  defaultTerm: string;
  onSearch: (term: string) => void;
};

export function SearchForm({ defaultTerm, onSearch }: SearchFormProps) {
  const inputId = useId();
  const [term, setTerm] = useState(defaultTerm);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = termSchema.safeParse(term);
    if (parsed.success) {
      onSearch(parsed.data);
    }
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex w-full gap-2">
      <label htmlFor={inputId} className="sr-only">
        {brand.copy.searchPlaceholder}
      </label>
      <div className="relative flex-1">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={inputId}
          type="search"
          value={term}
          maxLength={searchTermMaxLength}
          placeholder={brand.copy.searchPlaceholder}
          onChange={(event) => {
            setTerm(event.target.value);
          }}
          className="h-11 rounded-lg bg-muted/50 pl-10"
        />
      </div>
      <Button type="submit" className="h-11 rounded-lg px-5">
        Search
      </Button>
    </form>
  );
}
