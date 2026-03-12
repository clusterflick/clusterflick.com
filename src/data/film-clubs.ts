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
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Acton Film Club" },
      { [FilterId.PerformanceNotesSearch]: "Acton Film Club" },
    ],
  },
  {
    id: "arabic-cinema-club",
    name: "Arabic Cinema Club",
    url: "https://www.instagram.com/thearabfilmclub/",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Arabic Cinema Club" },
      { [FilterId.PerformanceNotesSearch]: "Arabic Cinema Club" },
    ],
  },
  {
    id: "bloody-mary-film-club",
    name: "Bloody Mary Film Club",
    url: "https://www.facebook.com/thebmfc",
    aliases: ["bloody-mary"],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Bloody Mary Film Club" },
      { [FilterId.ShowingTitleSearch]: "Bloody Mary" },
      { [FilterId.PerformanceNotesSearch]: "Bloody Mary Film Club" },
    ],
  },
  {
    id: "bar-trash",
    name: "Bar Trash",
    url: "https://tokenhomo.com/bar-trash/",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Bar Trash" },
      { [FilterId.PerformanceNotesSearch]: "Bar Trash" },
    ],
  },
  {
    id: "cinebug",
    name: "Cinebug",
    url: "https://www.instagram.com/cinebugldn/",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Cinebug" },
      { [FilterId.PerformanceNotesSearch]: "Cinebug" },
    ],
  },
  {
    id: "bounce-cinema",
    name: "Bounce Cinema",
    url: "https://www.bouncecinema.com",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Bounce Cinema" },
      { [FilterId.ShowingTitleSearch]: "Bounce Short Film" },
      { [FilterId.PerformanceNotesSearch]: "Bounce Cinema" },
    ],
  },
  {
    id: "distorted-frame",
    name: "Distorted Frame",
    url: "https://www.instagram.com/distortedframefilmclub/",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Distorted Frame" },
      { [FilterId.PerformanceNotesSearch]: "Distorted Frame" },
    ],
  },
  {
    id: "ghibliotheque",
    name: "Ghibliotheque",
    url: "https://linktr.ee/ghibliotheque",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Ghibliotheque" },
      { [FilterId.PerformanceNotesSearch]: "Ghibliotheque" },
    ],
  },
  {
    id: "gothique-film-society",
    name: "Gothique Film Society",
    url: "http://www.thegothiquefilmsociety.org.uk/",
    aliases: ["gothique"],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Gothique Film Society" },
      { [FilterId.PerformanceNotesSearch]: "Gothique Film Society" },
    ],
  },
  {
    id: "japanese-film-club",
    name: "Japanese Film Club",
    url: "https://japanesefilm.club",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Japanese Film Club" },
      { [FilterId.PerformanceNotesSearch]: "Japanese Film Club" },
    ],
  },
  {
    id: "kung-fu-cinema",
    name: "Kung Fu Cinema / Drunken Scorpion",
    url: "https://www.instagram.com/kungfucinema/",
    aliases: ["Kung Fu Cinema", "Drunken Scorpion"],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Kung Fu Cinema" },
      { [FilterId.ShowingTitleSearch]: "Drunken Scorpion" },
      { [FilterId.PerformanceNotesSearch]: "Drunken Scorpion" },
    ],
  },
  {
    id: "lost-reels",
    name: "Lost Reels",
    url: "https://lostreels.co.uk/",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Lost Reels" },
      { [FilterId.PerformanceNotesSearch]: "Lost Reels" },
    ],
  },
  {
    id: "new-east-cinema",
    name: "New East Cinema",
    url: "https://neweastcinema.co.uk",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "New East Cinema" },
      { [FilterId.PerformanceNotesSearch]: "New East Cinema" },
    ],
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
      { [FilterId.ShowingTitleSearch]: "Pitchblack Premiere" },
      { [FilterId.ShowingTitleSearch]: "Pitchblack Mixtapes" },
      { [FilterId.ShowingTitleSearch]: "Pitchblack Pictures" },
      { [FilterId.PerformanceNotesSearch]: "Pitchblack Playback" },
    ],
  },
  {
    id: "rebel-reel",
    name: "Rebel Reel",
    url: "https://www.rebelreelcineclub.com/",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Rebel Reel" },
      { [FilterId.PerformanceNotesSearch]: "Rebel Reel" },
    ],
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
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Richmond Film Society" },
      { [FilterId.PerformanceNotesSearch]: "Richmond Film Society" },
    ],
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
      { [FilterId.PerformanceNotesSearch]: "Wimbledon Film Club" },
    ],
  },
  {
    id: "category-h-film-club",
    name: "Category H Film Club",
    url: "https://www.instagram.com/categoryhfilms/",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Category H" },
      { [FilterId.PerformanceNotesSearch]: "Category H Film Club" },
    ],
  },
  {
    id: "sapphic-cinema",
    name: "Sapphic Cinema",
    url: "https://16collective.org",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Sapphic Cinema" },
      { [FilterId.PerformanceNotesSearch]: "Sapphic Cinema" },
    ],
  },
  {
    id: "cine-real",
    name: "Cine Real",
    url: "https://www.cine-real.com",
    aliases: ["Cine-Real"],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Cine Real" },
      { [FilterId.ShowingTitleSearch]: "Cine-Real" },
      { [FilterId.PerformanceNotesSearch]: "Cine Real" },
      { [FilterId.PerformanceNotesSearch]: "Cine-Real" },
    ],
  },
  {
    id: "pink-palace",
    name: "Pink Palace",
    url: "https://www.riocinema.org.uk/pink-palace/",
    aliases: [],
    matchers: [
      {
        [FilterId.ShowingTitleSearch]: "Pink Palace",
        [FilterId.Venues]: ["riocinema.org.uk"],
      },
      { [FilterId.PerformanceNotesSearch]: "Pink Palace" },
    ],
  },
  {
    id: "funeral-parade",
    name: "Funeral Parade",
    url: "https://www.instagram.com/funeralparadepresents/",
    aliases: ["Funeral Parade Presents"],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Funeral Parade" },
      { [FilterId.PerformanceNotesSearch]: "Funeral Parade" },
    ],
  },
  {
    id: "lexi-seniors-film-club",
    name: "Lexi Seniors' Film Club",
    url: "https://thelexicinema.co.uk",
    aliases: [],
    matchers: [
      {
        [FilterId.ShowingTitleSearch]: "Senior",
        [FilterId.Venues]: ["thelexicinema.co.uk"],
      },
    ],
  },
  {
    id: "supakino",
    name: "Supakino",
    url: "https://www.supakino.com",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Supakino" },
      { [FilterId.PerformanceNotesSearch]: "Supakino" },
    ],
  },
  {
    id: "sick-girl-films",
    name: "Sick Girl Films",
    url: "https://www.instagram.com/sickgirlfilms",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Sick Girl Films" },
      { [FilterId.PerformanceNotesSearch]: "Sick Girl Films" },
    ],
  },
  {
    id: "sincerely-camp",
    name: "Sincerely Camp",
    url: "https://www.instagram.com/sincerelycamp",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Sincerely Camp" },
      { [FilterId.PerformanceNotesSearch]: "Sincerely Camp" },
    ],
  },
  {
    id: "offbeat-folk-film-club",
    name: "OffBeat Folk Film Club",
    url: "https://offbeat.film/",
    aliases: ["OffBeat"],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "OffBeat Presents" },
      { [FilterId.ShowingTitleSearch]: "OffBeat:" },
      { [FilterId.PerformanceNotesSearch]: "OffBeat Folk Film Club" },
    ],
  },
  {
    id: "transmissions",
    name: "Transmissions",
    url: "https://www.instagram.com/wearetransmissions",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Transmissions presents" },
      { [FilterId.ShowingTitleSearch]: " x Transmissions" },
    ],
  },
  {
    id: "video-bazaar",
    name: "Video Bazaar",
    url: "https://www.instagram.com/videobazaarpresents",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Video Bazaar" },
      { [FilterId.PerformanceNotesSearch]: "Video Bazaar" },
    ],
  },
  {
    id: "jellied-reels",
    name: "Jellied Reels",
    url: "https://www.instagram.com/jelliedreels/",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "presented by Jellied Reels" },
      { [FilterId.ShowingTitleSearch]: "Jellied Reels presents" },
      { [FilterId.PerformanceNotesSearch]: "Jellied Reels" },
    ],
  },
  {
    id: "frame-by-frame",
    name: "Frame By Frame",
    url: "https://www.instagram.com/frame_by_frame_cinema/",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Frame By Frame" },
      { [FilterId.PerformanceNotesSearch]: "Frame By Frame" },
    ],
  },
  {
    id: "trash-film-club",
    name: "Trash Film Club",
    url: "https://www.instagram.com/trash.film.club/",
    aliases: [],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "Trash Film Club" },
      { [FilterId.PerformanceNotesSearch]: "Trash Film Club" },
    ],
  },
];
