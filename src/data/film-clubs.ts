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
    url: "https://actonfilmclub.com",
    aliases: [],
    matchers: [{ [FilterId.ShowingTitleSearch]: "Acton Film Club" }],
  },
  {
    id: "arabic-cinema-club",
    name: "Arabic Cinema Club",
    url: "https://www.instagram.com/thearabfilmclub/",
    aliases: [],
    matchers: [{ [FilterId.ShowingTitleSearch]: "Arabic Cinema Club" }],
  },
  {
    id: "bloody-mary-film-club",
    name: "Bloody Mary Film Club",
    url: "https://www.facebook.com/thebmfc",
    aliases: ["bloody-mary"],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Bloody Mary Film Club" },
      { [FilterId.ShowingTitleSearch]: "Bloody Mary" },
    ],
  },
  {
    id: "bar-trash",
    name: "Bar Trash",
    url: "https://tokenhomo.com/bar-trash/",
    aliases: [],
    matchers: [{ [FilterId.ShowingTitleSearch]: "Bar Trash" }],
  },
  {
    id: "cinebug",
    name: "Cinebug",
    url: "https://www.instagram.com/cinebugldn/",
    aliases: [],
    matchers: [{ [FilterId.ShowingTitleSearch]: "Cinebug" }],
  },
  {
    id: "bounce-cinema",
    name: "Bounce Cinema",
    url: "https://www.bouncecinema.com",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Bounce Cinema" },
      { [FilterId.ShowingTitleSearch]: "Bounce Short Film" },
    ],
  },
  {
    id: "distorted-frame",
    name: "Distorted Frame",
    url: "https://www.instagram.com/distortedframefilmclub/",
    aliases: [],
    matchers: [{ [FilterId.ShowingTitleSearch]: "Distorted Frame" }],
  },
  {
    id: "ghibliotheque",
    name: "Ghibliotheque",
    url: "https://linktr.ee/ghibliotheque",
    aliases: [],
    matchers: [{ [FilterId.ShowingTitleSearch]: "Ghibliotheque" }],
  },
  {
    id: "gothique-film-society",
    name: "Gothique Film Society",
    url: "http://www.thegothiquefilmsociety.org.uk/",
    aliases: ["gothique"],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Gothique Film Society" },
      { [FilterId.ShowingTitleSearch]: "Gothique" },
    ],
  },
  {
    id: "japanese-film-club",
    name: "Japanese Film Club",
    url: "https://japanesefilm.club",
    aliases: [],
    matchers: [{ [FilterId.ShowingTitleSearch]: "Japanese Film Club" }],
  },
  {
    id: "kung-fu-cinema",
    name: "Kung Fu Cinema / Drunken Scorpion",
    url: "https://www.instagram.com/kungfucinema/",
    aliases: ["Kung Fu Cinema", "Drunken Scorpion"],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Kung Fu Cinema" },
      { [FilterId.ShowingTitleSearch]: "Drunken Scorpion" },
    ],
  },
  {
    id: "lost-reels",
    name: "Lost Reels",
    url: "https://lostreels.co.uk/",
    aliases: [],
    matchers: [{ [FilterId.ShowingTitleSearch]: "Lost Reels" }],
  },
  {
    id: "new-east-cinema",
    name: "New East Cinema",
    url: "https://neweastcinema.co.uk",
    aliases: [],
    matchers: [{ [FilterId.ShowingTitleSearch]: "New East Cinema" }],
  },
  {
    id: "queer-horror-nights",
    name: "Queer Horror Nights",
    url: "https://tokenhomo.com/queer-horror-nights/",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Queer Horror Nights" },
      { [FilterId.ShowingTitleSearch]: "Queer Horror" },
    ],
  },
  {
    id: "pitchblack-playback",
    name: "Pitchblack Playback",
    url: "https://pitchblackplayback.com",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Pitchblack Playback" },
      { [FilterId.ShowingTitleSearch]: "Pitchblack" },
    ],
  },
  {
    id: "rebel-reel",
    name: "Rebel Reel",
    url: "https://www.rebelreelcineclub.com/",
    aliases: [],
    matchers: [{ [FilterId.ShowingTitleSearch]: "Rebel Reel" }],
  },
  {
    id: "rio-feminist-film-group",
    name: "Rio Feminist Film Group",
    url: "https://www.instagram.com/riofeminists/",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Rio Feminist Film" },
      {
        [FilterId.ShowingTitleSearch]: "Feminist Film",
        [FilterId.Venues]: ["riocinema.org.uk"],
      },
    ],
  },
  {
    id: "richmond-film-society",
    name: "Richmond Film Society",
    url: "https://www.richmondfilmsoc.org.uk/",
    aliases: ["richmond"],
    matchers: [{ [FilterId.ShowingTitleSearch]: "Richmond Film Society" }],
  },
  {
    id: "violet-hour",
    name: "Violet Hour",
    url: "https://www.instagram.com/violethour.cinema/",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Violet Hour" },
      { [FilterId.PerformanceNotesSearch]: "Violet Hour" },
    ],
  },
  {
    id: "wimbledon-film-club",
    name: "Wimbledon Film Club",
    url: "https://wimbledonfilmclub.co.uk",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Wimbledon Film Club" },
      { [FilterId.ShowingUrlSearch]: "wimbledonfilmclub" },
    ],
  },
  {
    id: "category-h-film-club",
    name: "Category H Film Club",
    url: "https://www.instagram.com/categoryhfilms/",
    aliases: [],
    matchers: [{ [FilterId.ShowingTitleSearch]: "Category H" }],
  },
  {
    id: "supakino",
    name: "Supakino",
    url: "https://www.supakino.com",
    aliases: [],
    matchers: [{ [FilterId.ShowingTitleSearch]: "Supakino" }],
  },
];
