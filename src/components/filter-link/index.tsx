import { type ComponentProps } from "react";
import { type Filters } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFilters } from "@/state/filters-context";

type FilterLinkProps = {
  filters: Partial<Filters>;
} & Partial<ComponentProps<typeof Link>>;

const FilterLink = ({ filters, ...props }: FilterLinkProps) => {
  const { setFilters, defaultFilters } = useFilters();
  const router = useRouter();
  return (
    <Link
      {...props}
      href="/"
      onClick={(e) => {
        e.preventDefault();
        const params = setFilters({ ...defaultFilters!, ...filters });
        router.push(`/?${params}`);
      }}
    />
  );
};

export default FilterLink;
