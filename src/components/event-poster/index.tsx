import MoviePoster, { type PosterSize } from "@/components/movie-poster";
import StackedPoster from "@/components/stacked-poster";

/** The slice of an included film a poster reads. */
export interface EventPosterIncludedMovie {
  title: string;
  posterPath?: string;
}

/**
 * The poster that stands for an event on its own: the event's, or failing
 * that the first included film's. Also what a backdrop should use.
 */
export function getPrimaryPosterPath(
  posterPath: string | undefined,
  includedMovies: EventPosterIncludedMovie[] | undefined,
): string | undefined {
  return posterPath || includedMovies?.find((m) => m.posterPath)?.posterPath;
}

/**
 * Whether an event shows as a stack: it includes more than one film, and there
 * are at least two posters between the event and them to fan out.
 */
export function shouldStackPosters(
  posterPath: string | undefined,
  includedMovies: EventPosterIncludedMovie[] | undefined,
): includedMovies is EventPosterIncludedMovie[] {
  if (!includedMovies || includedMovies.length <= 1) return false;
  const posters =
    (posterPath ? 1 : 0) + includedMovies.filter((m) => m.posterPath).length;
  return posters >= 2;
}

interface EventPosterProps {
  title: string;
  posterPath?: string;
  /** A double bill's or marathon's films, for the stacked poster. */
  includedMovies?: EventPosterIncludedMovie[];
  size?: PosterSize;
  /** Hover overlay with the title (and `subtitle`), as the films grid shows. */
  showOverlay?: boolean;
  subtitle?: string;
  /** Hover animation (zoom, or a stack fanning out). Defaults to true. */
  interactive?: boolean;
  /**
   * Fill the available width up to the size's own. Only affects a single
   * poster; a stack is always fluid at `xsmall` and fixed otherwise.
   */
  fluid?: boolean;
  priority?: boolean;
  headingLevel?: "h2" | "h3";
}

/**
 * A film's or event's poster: a `StackedPoster` for an event of several films
 * with posters to show, otherwise a `MoviePoster`, falling back to the first
 * included film's poster when the event has none of its own.
 */
export default function EventPoster({
  title,
  posterPath,
  includedMovies,
  size = "small",
  showOverlay,
  subtitle,
  interactive,
  fluid,
  priority,
  headingLevel,
}: EventPosterProps) {
  if (shouldStackPosters(posterPath, includedMovies)) {
    return (
      <StackedPoster
        mainPosterPath={posterPath}
        mainTitle={title}
        includedMovies={includedMovies}
        size={size}
        subtitle={subtitle}
        showOverlay={showOverlay}
        interactive={interactive}
        priority={priority}
        headingLevel={headingLevel}
      />
    );
  }

  return (
    <MoviePoster
      posterPath={getPrimaryPosterPath(posterPath, includedMovies)}
      title={title}
      size={size}
      subtitle={subtitle}
      showOverlay={showOverlay}
      interactive={interactive}
      fluid={fluid}
      priority={priority}
      headingLevel={headingLevel}
    />
  );
}
