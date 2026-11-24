import { SearchIcon } from "lucide-react";
import { StatusPanel } from "@/components/StatusPanel";

export function SearchPrompt() {
  return (
    <StatusPanel
      icon={SearchIcon}
      title="Search the catalogue"
      message="Type a word from a product's name or description into the search box above."
    />
  );
}
