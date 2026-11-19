import { getStaticData } from "@/utils/get-static-data";
import { getDepartedData } from "@/utils/get-departed-data";
import { getMovieUrlMap } from "@/utils/get-movie-url-map";

export const dynamic = "force-static";

/**
 * Read by the movie-redirects Worker (clusterflick/movie-redirects), which
 * sits in front of `/movies/*` and answers a 404 there with a redirect when
 * this says where the film went. Nothing on the site reads it.
 *
 * A fixed name, so the Worker can find it, and so the "Cache JSON blobs" rule
 * would hold it at the edge for a year: the Worker fetches it with
 * `cache: "no-store"` and keeps its own copy for a few minutes instead.
 */
export async function GET() {
  const data = await getStaticData();
  const departed = getDepartedData();

  return Response.json(
    getMovieUrlMap({
      live: data.movies,
      departed: departed.movies,
      generatedAt: data.generatedAt,
    }),
  );
}
