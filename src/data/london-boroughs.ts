import type { Position } from "@/types";

export type LondonBorough = {
  name: string;
  slug: string;
  center: Position;
  radiusMiles: number;
};

export const LONDON_BOROUGHS: LondonBorough[] = [
  // Inner London
  {
    name: "Camden",
    slug: "camden",
    center: { lat: 51.5517, lon: -0.1588 },
    radiusMiles: 2.0,
  },
  {
    name: "City of London",
    slug: "city-of-london",
    center: { lat: 51.5155, lon: -0.0922 },
    radiusMiles: 0.6,
  },
  {
    name: "Greenwich",
    slug: "greenwich",
    center: { lat: 51.4769, lon: 0.0005 },
    radiusMiles: 2.8,
  },
  {
    name: "Hackney",
    slug: "hackney",
    center: { lat: 51.545, lon: -0.0553 },
    radiusMiles: 1.8,
  },
  {
    name: "Hammersmith and Fulham",
    slug: "hammersmith-and-fulham",
    center: { lat: 51.4927, lon: -0.2339 },
    radiusMiles: 1.8,
  },
  {
    name: "Islington",
    slug: "islington",
    center: { lat: 51.5465, lon: -0.1058 },
    radiusMiles: 1.5,
  },
  {
    name: "Kensington and Chelsea",
    slug: "kensington-and-chelsea",
    center: { lat: 51.499, lon: -0.1938 },
    radiusMiles: 1.5,
  },
  {
    name: "Lambeth",
    slug: "lambeth",
    center: { lat: 51.4571, lon: -0.1231 },
    radiusMiles: 2.2,
  },
  {
    name: "Lewisham",
    slug: "lewisham",
    center: { lat: 51.4414, lon: -0.0117 },
    radiusMiles: 2.2,
  },
  {
    name: "Newham",
    slug: "newham",
    center: { lat: 51.5255, lon: 0.0352 },
    radiusMiles: 2.2,
  },
  {
    name: "Southwark",
    slug: "southwark",
    center: { lat: 51.4733, lon: -0.0734 },
    radiusMiles: 2.2,
  },
  {
    name: "Tower Hamlets",
    slug: "tower-hamlets",
    center: { lat: 51.515, lon: -0.0389 },
    radiusMiles: 1.8,
  },
  {
    name: "Wandsworth",
    slug: "wandsworth",
    center: { lat: 51.4567, lon: -0.191 },
    radiusMiles: 2.5,
  },
  {
    name: "Westminster",
    slug: "westminster",
    center: { lat: 51.4975, lon: -0.1357 },
    radiusMiles: 1.8,
  },
  // Outer London
  {
    name: "Barking and Dagenham",
    slug: "barking-and-dagenham",
    center: { lat: 51.5363, lon: 0.0841 },
    radiusMiles: 2.5,
  },
  {
    name: "Barnet",
    slug: "barnet",
    center: { lat: 51.6252, lon: -0.1517 },
    radiusMiles: 3.5,
  },
  {
    name: "Bexley",
    slug: "bexley",
    center: { lat: 51.4549, lon: 0.1505 },
    radiusMiles: 3.0,
  },
  {
    name: "Brent",
    slug: "brent",
    center: { lat: 51.5588, lon: -0.2817 },
    radiusMiles: 2.5,
  },
  {
    name: "Bromley",
    slug: "bromley",
    center: { lat: 51.3688, lon: 0.0519 },
    radiusMiles: 4.0,
  },
  {
    name: "Croydon",
    slug: "croydon",
    center: { lat: 51.3714, lon: -0.0977 },
    radiusMiles: 3.5,
  },
  {
    name: "Ealing",
    slug: "ealing",
    center: { lat: 51.513, lon: -0.3089 },
    radiusMiles: 2.8,
  },
  {
    name: "Enfield",
    slug: "enfield",
    center: { lat: 51.6538, lon: -0.0799 },
    radiusMiles: 3.5,
  },
  {
    name: "Haringey",
    slug: "haringey",
    center: { lat: 51.5906, lon: -0.111 },
    radiusMiles: 2.0,
  },
  {
    name: "Harrow",
    slug: "harrow",
    center: { lat: 51.5898, lon: -0.3346 },
    radiusMiles: 2.5,
  },
  {
    name: "Havering",
    slug: "havering",
    center: { lat: 51.5779, lon: 0.212 },
    radiusMiles: 4.0,
  },
  {
    name: "Hillingdon",
    slug: "hillingdon",
    center: { lat: 51.5441, lon: -0.476 },
    radiusMiles: 4.5,
  },
  {
    name: "Hounslow",
    slug: "hounslow",
    center: { lat: 51.4746, lon: -0.368 },
    radiusMiles: 3.0,
  },
  {
    name: "Kingston upon Thames",
    slug: "kingston-upon-thames",
    center: { lat: 51.3925, lon: -0.3057 },
    radiusMiles: 2.8,
  },
  {
    name: "Merton",
    slug: "merton",
    center: { lat: 51.4098, lon: -0.1994 },
    radiusMiles: 2.5,
  },
  {
    name: "Redbridge",
    slug: "redbridge",
    center: { lat: 51.559, lon: 0.0741 },
    radiusMiles: 2.8,
  },
  {
    name: "Richmond upon Thames",
    slug: "richmond-upon-thames",
    center: { lat: 51.4479, lon: -0.326 },
    radiusMiles: 3.0,
  },
  {
    name: "Sutton",
    slug: "sutton",
    center: { lat: 51.3618, lon: -0.1945 },
    radiusMiles: 2.8,
  },
  {
    name: "Waltham Forest",
    slug: "waltham-forest",
    center: { lat: 51.5886, lon: -0.0118 },
    radiusMiles: 2.5,
  },
];
