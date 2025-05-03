import type { CinemaData } from "@/types";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import Loader from "rsuite/cjs/Loader";
import expandAndCombine from "@/utils/expand-and-combine";

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
  const filenames = process.env.NEXT_PUBLIC_DATA_FILENAME!.split(",");
  const { data, setData } = useCinemaData();

  useEffect(function () {
    if (data) return;

    (async () => {
      console.time("Retrieved all data");
      const compressedFiles = await Promise.all(
        filenames.map(async (filename) => (await fetch(`/${filename}`)).json()),
      );
      const combinedData = expandAndCombine(filenames, compressedFiles);
      console.timeEnd("Retrieved all data");
      console.log("Data:", combinedData);
      setData(combinedData);
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
