import { type Filters } from "@/types";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Header from "rsuite/cjs/Header";
import Nav from "rsuite/cjs/Nav";
import Stack from "rsuite/cjs/Stack";
import { useFilters } from "@/state/filters-context";
import FilterLink from "@/components/filter-link";
import bestMoviesFilter from "./best-movies-filter";
import "./styles.scss";

export default function AppHeading({
  children = null,
}: {
  children?: ReactNode;
}) {
  const router = useRouter();
  const { defaultFilters, setFilters } = useFilters();

  return (
    <Header className="filter-header">
      <Stack direction="column" spacing={18}>
        <Stack.Item
          style={{ padding: "0 1rem", width: "100vw", overflow: "scroll" }}
        >
          <Nav
            onSelect={(eventKey) => {
              setFilters({ ...(defaultFilters as Filters) });
              router.push(eventKey);
            }}
          >
            <Nav.Item eventKey="/">🏠 Home</Nav.Item>
            <Nav.Item eventKey="/showings?/today/near-me">
              📍 Near me today
            </Nav.Item>
            <Nav.Item
              as={FilterLink}
              filters={{ filteredMovies: bestMoviesFilter }}
            >
              🍅 Best Movies
            </Nav.Item>
            <Nav.Item eventKey="/favourites">⭐️ Favourites</Nav.Item>
            <Nav.Item eventKey="/about">💁 About</Nav.Item>
          </Nav>
        </Stack.Item>
        <Stack.Item style={{ width: "100%" }}>{children}</Stack.Item>
      </Stack>
    </Header>
  );
}
