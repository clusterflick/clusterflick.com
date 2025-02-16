import type { FavouriteMovie } from "@/types";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import {
  syncWithPersistedUserSettings,
  setPersistedUserSettings,
} from "./user-settings-persistence";

const UserSettingsContext = createContext<{
  favouriteMovies: FavouriteMovie[];
  setFavouriteMovies: Dispatch<SetStateAction<FavouriteMovie[]>>;
}>({
  favouriteMovies: [],
  setFavouriteMovies: () => {},
});

export const useUserSettings = () => useContext(UserSettingsContext);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [favouriteMovies, setFavouriteMovies] = useState<FavouriteMovie[]>([]);

  useEffect(() => {
    syncWithPersistedUserSettings(({ favouriteMovies }) => {
      setFavouriteMovies(favouriteMovies || []);
    });
  }, [setFavouriteMovies]);

  const setFavouriteMoviesPersisted = (
    favouriteMovies: SetStateAction<FavouriteMovie[]>,
  ) => {
    setPersistedUserSettings({ favouriteMovies } as {
      favouriteMovies: FavouriteMovie[];
    });
    return setFavouriteMovies(favouriteMovies);
  };

  return (
    <UserSettingsContext.Provider
      value={{
        favouriteMovies,
        setFavouriteMovies: setFavouriteMoviesPersisted,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
}
