import type { CinemaData } from "@/types";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { decompress } from "compress-json";
import Loader from "rsuite/cjs/Loader";

const CinemaDataContext = createContext<{
  data: CinemaData | null;
  setData: Dispatch<SetStateAction<CinemaData | null>>;
}>({
  data: null,
  setData: () => {},
});

export const useCinemaData = () => useContext(CinemaDataContext);

export function CinemaDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CinemaData | null>(null);

  return (
    <CinemaDataContext.Provider value={{ data, setData }}>
      {children}
    </CinemaDataContext.Provider>
  );
}

export function GetCinemaData({ children }: { children: ReactNode }) {
  const dataFilename =
    process.env.NEXT_PUBLIC_DATA_FILENAME || "combined-data.json";
  const { data, setData } = useCinemaData();

  useEffect(function () {
    if (data) return;

    (async () => {
      const response = await fetch(`/${dataFilename}`);
      const compressedData = await response.json();
      setData(decompress(compressedData));
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
