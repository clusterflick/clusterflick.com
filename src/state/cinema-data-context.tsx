import type { CinemaData } from "@/types";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Loader from "rsuite/cjs/Loader";
import expandAndCombine from "@/utils/expand-and-combine";

async function getDataForListing(
  filenames: string[],
  setData: Dispatch<SetStateAction<CinemaData | null>>,
  id: string,
) {
  const initial = id[id.length - 1];
  const key = /[a-z]/i.test(initial) ? "other" : initial;
  const commonFilename = filenames.find((filename) =>
    filename.startsWith("data.common."),
  );
  const listingFilename = filenames.find((filename) =>
    filename.startsWith(`data.${key}.`),
  );

  if (commonFilename && listingFilename) {
    console.time("Retrieved listing data");
    const data = await getData([commonFilename, listingFilename]);
    console.timeEnd("Retrieved listing data");
    setData(data);
  }

  // Get all the rest of the data now that we've loaded the listing data
  setTimeout(async () => {
    console.time("Retrieved follow-up data");
    const data = await getData(filenames);
    console.timeEnd("Retrieved follow-up data");
    setData(data);
  }, 100);
}

async function getData(filenames: string[]) {
  const compressedFiles = await Promise.all(
    filenames.map(async (filename) => (await fetch(`/${filename}`)).json()),
  );
  return expandAndCombine(filenames, compressedFiles);
}

const CinemaDataContext = createContext<{
  data: CinemaData | null;
  setData: Dispatch<SetStateAction<CinemaData | null>>;
  hydrateUrl: (truncatedUrl: string) => string;
}>({
  data: null,
  setData: () => {},
  hydrateUrl: () => "",
});

export const useCinemaData = () => useContext(CinemaDataContext);

export function CinemaDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CinemaData | null>(null);

  const hydrateUrl = (truncatedUrl: string) => {
    const match = truncatedUrl.match(/^{(\d+)}/);
    if (!match) return truncatedUrl;
    const index = parseInt(match[1], 10);
    return truncatedUrl.replace(`{${index}}`, data!.urlPrefixes[index]);
  };

  return (
    <CinemaDataContext.Provider value={{ data, setData, hydrateUrl }}>
      {children}
    </CinemaDataContext.Provider>
  );
}

export function GetCinemaData({ children }: { children: ReactNode }) {
  const params = useParams();
  const filenames = process.env.NEXT_PUBLIC_DATA_FILENAME!.split(",");
  const { data, setData } = useCinemaData();

  useEffect(function () {
    if (data) return;

    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (id) {
      getDataForListing(filenames, setData, id);
      return;
    }

    (async () => {
      const data = await getData(filenames);
      setData(data);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) {
    return (
      <div>
        <Loader backdrop content="Loading..." />
      </div>
    );
  }
  return <>{children}</>;
}
