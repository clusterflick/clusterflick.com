import { FilterId } from "@/lib/filters/types";
import type { FilterState } from "@/lib/filters/types";

export type FilmClub = {
  id: string;
  name: string;
  url: string;
  aliases: string[];
  matchers: Partial<FilterState>[];
};

export const FILM_CLUBS: FilmClub[] = [
  {
    id: "acton-film-club",
    name: "Acton Film Club",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Acton Film Club" },
    ],
  },
  {
    id: "all-out-of-bubblegum",
    name: "All Out of Bubblegum Film Club",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "All Out of Bubblegum" },
    ],
  },
  {
    id: "anime-girls-online",
    name: "AnimeGirlsOnline",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "AnimeGirlsOnline" },
      { [FilterId.ShowingTitleSearch]: "Anime Girls Online" },
    ],
  },
  {
    id: "arabic-cinema-club",
    name: "Arabic Cinema Club",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Arabic Cinema Club" },
    ],
  },
  {
    id: "arcana",
    name: "Arcana",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Arcana" },
    ],
  },
  {
    id: "bar-trash",
    name: "Bar Trash",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Bar Trash" },
    ],
  },
  {
    id: "bounce-cinema",
    name: "Bounce Cinema",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Bounce Cinema" },
    ],
  },
  {
    id: "distorted-frame",
    name: "Distorted Frame",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Distorted Frame" },
    ],
  },
  {
    id: "electric-scream",
    name: "Electric Scream!",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Electric Scream" },
    ],
  },
  {
    id: "ghibliotheque",
    name: "Ghibliotheque",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Ghibliotheque" },
    ],
  },
  {
    id: "gothique-film-society",
    name: "Gothique Film Society",
    url: "",
    aliases: ["gothique"],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Gothique Film Society" },
      { [FilterId.ShowingTitleSearch]: "Gothique" },
    ],
  },
  {
    id: "japanese-film-club",
    name: "Japanese Film Club",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Japanese Film Club" },
    ],
  },
  {
    id: "kung-fu-cinema",
    name: "Kung Fu Cinema / Drunken Scorpion",
    url: "",
    aliases: ["drunken-scorpion"],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Kung Fu Cinema" },
      { [FilterId.ShowingTitleSearch]: "Drunken Scorpion" },
    ],
  },
  {
    id: "liberated-film-club",
    name: "Liberated Film Club",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Liberated Film Club" },
    ],
  },
  {
    id: "lost-reels",
    name: "Lost Reels",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Lost Reels" },
    ],
  },
  {
    id: "new-east-cinema",
    name: "New East Cinema",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "New East Cinema" },
    ],
  },
  {
    id: "pitchblack-playback",
    name: "Pitchblack Playback",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Pitchblack Playback" },
      { [FilterId.ShowingTitleSearch]: "Pitchblack" },
    ],
  },
  {
    id: "richmond-film-society",
    name: "Richmond Film Society",
    url: "",
    aliases: ["richmond"],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Richmond Film Society" },
    ],
  },
  {
    id: "skateboard-film-club",
    name: "Skateboard Film Club",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Skateboard Film Club" },
    ],
  },
  {
    id: "thrill-seekers",
    name: "Thrill Seekers",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Thrill Seekers" },
    ],
  },
  {
    id: "violet-hour",
    name: "Violet Hour",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Violet Hour" },
    ],
  },
  {
    id: "wimbledon-film-club",
    name: "Wimbledon Film Club",
    url: "",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Wimbledon Film Club" },
    ],
  },
];
