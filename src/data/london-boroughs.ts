import type { Position } from "@/types";

export type LondonBorough = {
  name: string;
  slug: string;
  center: Position;
  radiusMiles: number;
  description: string;
};

export const LONDON_BOROUGHS: LondonBorough[] = [
  // Inner London
  {
    name: "Camden",
    slug: "camden",
    center: { lat: 51.5517, lon: -0.1588 },
    radiusMiles: 2.0,
    description:
      "Camden is a culturally rich borough in North London, famous for Camden Market, a thriving live music scene, and eclectic street life. From the literary heritage of Bloomsbury and Hampstead to the buzzing high streets of Kentish Town and Camden Town, it's a hub for arts, food, and nightlife.",
  },
  {
    name: "City of London",
    slug: "city-of-london",
    center: { lat: 51.5155, lon: -0.0922 },
    radiusMiles: 0.6,
    description:
      "The City of London is the historic heart of the capital and its primary financial district, home to the Bank of England, St Paul's Cathedral, and the Barbican Centre. Despite its compact size, the Square Mile blends centuries of history with striking modern architecture.",
  },
  {
    name: "Greenwich",
    slug: "greenwich",
    center: { lat: 51.4769, lon: 0.0005 },
    radiusMiles: 2.8,
    description:
      "Greenwich is a historic borough in South East London, renowned for the Royal Observatory, the Prime Meridian, and its UNESCO World Heritage Site. With the Cutty Sark, Greenwich Park, and the O2 arena, it balances maritime heritage with modern entertainment.",
  },
  {
    name: "Hackney",
    slug: "hackney",
    center: { lat: 51.545, lon: -0.0553 },
    radiusMiles: 1.8,
    description:
      "Hackney is a diverse and creative borough in East London, known for its vibrant arts scene, multicultural communities, and rapid gentrification. It encompasses areas like Shoreditch, Dalston, and Hackney Wick, blending historic markets, trendy cafes, tech startups, and green spaces like Victoria Park.",
  },
  {
    name: "Hammersmith and Fulham",
    slug: "hammersmith-and-fulham",
    center: { lat: 51.4927, lon: -0.2339 },
    radiusMiles: 1.8,
    description:
      "Hammersmith and Fulham is a West London borough stretching along the Thames, known for its riverside pubs, the Eventim Apollo, and the boutique shops of Fulham and Shepherd's Bush. It's home to major venues, two Premier League football clubs, and a lively mix of residential and cultural life.",
  },
  {
    name: "Islington",
    slug: "islington",
    center: { lat: 51.5465, lon: -0.1058 },
    radiusMiles: 1.5,
    description:
      "Islington is a vibrant inner-city borough in North London, celebrated for its theatres, gastropubs, and the bustling Upper Street. From the Almeida Theatre and Sadler's Wells to the antique markets of Camden Passage, it's a cultural hotspot with a strong community feel.",
  },
  {
    name: "Kensington and Chelsea",
    slug: "kensington-and-chelsea",
    center: { lat: 51.499, lon: -0.1938 },
    radiusMiles: 1.5,
    description:
      "Kensington and Chelsea is one of London's most affluent boroughs, home to world-class museums, the Royal Albert Hall, and the fashionable King's Road. From the grandeur of Kensington Palace to the colourful streets of Notting Hill and Portobello Market, it's steeped in culture and elegance.",
  },
  {
    name: "Lambeth",
    slug: "lambeth",
    center: { lat: 51.4571, lon: -0.1231 },
    radiusMiles: 2.2,
    description:
      "Lambeth is a diverse South London borough spanning the South Bank, Brixton, and Streatham. It's home to iconic cultural landmarks including the National Theatre, BFI Southbank, and the vibrant Brixton Village market, blending world-class arts with a strong multicultural identity.",
  },
  {
    name: "Lewisham",
    slug: "lewisham",
    center: { lat: 51.4414, lon: -0.0117 },
    radiusMiles: 2.2,
    description:
      "Lewisham is a multicultural borough in South East London, encompassing neighbourhoods like Deptford, Brockley, and Catford. Known for its independent arts scene, lively markets, and green spaces such as Hilly Fields, it offers an increasingly creative and community-driven character.",
  },
  {
    name: "Newham",
    slug: "newham",
    center: { lat: 51.5255, lon: 0.0352 },
    radiusMiles: 2.2,
    description:
      "Newham is one of London's most diverse boroughs, situated in East London and home to the Queen Elizabeth Olympic Park, the ExCeL centre, and London City Airport. Once the industrial heartland of the Docklands, it has been transformed by major regeneration and is a rapidly evolving part of the city.",
  },
  {
    name: "Southwark",
    slug: "southwark",
    center: { lat: 51.4733, lon: -0.0734 },
    radiusMiles: 2.2,
    description:
      "Southwark is a culturally rich South London borough stretching from the Thames at London Bridge down to Dulwich. It's home to Borough Market, Tate Modern, Shakespeare's Globe, and the Peckham arts scene, making it one of London's most dynamic areas for food, art, and history.",
  },
  {
    name: "Tower Hamlets",
    slug: "tower-hamlets",
    center: { lat: 51.515, lon: -0.0389 },
    radiusMiles: 1.8,
    description:
      "Tower Hamlets is a historic and diverse East London borough that includes Bethnal Green, Whitechapel, Bow, and Canary Wharf. From the Tower of London and Brick Lane's famous curry houses to the gleaming skyscrapers of the Docklands, it captures London's contrasts in a single borough.",
  },
  {
    name: "Wandsworth",
    slug: "wandsworth",
    center: { lat: 51.4567, lon: -0.191 },
    radiusMiles: 2.5,
    description:
      "Wandsworth is a large South West London borough that takes in Battersea, Tooting, Putney, and Clapham Junction. With Battersea Park, the redeveloped Battersea Power Station, and Tooting's celebrated food scene, it blends leafy residential streets with growing cultural energy.",
  },
  {
    name: "Westminster",
    slug: "westminster",
    center: { lat: 51.4975, lon: -0.1357 },
    radiusMiles: 1.8,
    description:
      "Westminster is the political and ceremonial heart of the UK, home to the Houses of Parliament, Buckingham Palace, and the West End's theatres and cinemas. From Soho and Covent Garden to Mayfair and Piccadilly Circus, it's London's most iconic borough for entertainment and culture.",
  },
  // Outer London
  {
    name: "Barking and Dagenham",
    slug: "barking-and-dagenham",
    center: { lat: 51.5363, lon: 0.0841 },
    radiusMiles: 2.5,
    description:
      "Barking and Dagenham is an East London borough with deep industrial roots, historically centred on the Ford car plant and the Thames riverside. Today it's undergoing significant regeneration, with new creative spaces emerging alongside its established community and the medieval ruins of Barking Abbey.",
  },
  {
    name: "Barnet",
    slug: "barnet",
    center: { lat: 51.6252, lon: -0.1517 },
    radiusMiles: 3.5,
    description:
      "Barnet is one of London's largest boroughs, stretching across leafy North London suburbs including Finchley, Hendon, and High Barnet. It's known for its excellent green spaces, the RAF Museum, and a mix of suburban calm with good transport connections to Central London.",
  },
  {
    name: "Bexley",
    slug: "bexley",
    center: { lat: 51.4549, lon: 0.1505 },
    radiusMiles: 3.0,
    description:
      "Bexley is a suburban borough in South East London with a village-like character, encompassing areas such as Bexleyheath, Sidcup, and Erith. It features Danson Park, Hall Place, and stretches of Thames marshland, offering a quieter pace of life on the edge of the city.",
  },
  {
    name: "Brent",
    slug: "brent",
    center: { lat: 51.5588, lon: -0.2817 },
    radiusMiles: 2.5,
    description:
      "Brent is a vibrant and multicultural borough in North West London, dominated by the iconic Wembley Stadium and Arena. Areas like Kilburn, Willesden, and Harlesden are known for their diverse food scenes, music heritage, and strong community spirit.",
  },
  {
    name: "Bromley",
    slug: "bromley",
    center: { lat: 51.3688, lon: 0.0519 },
    radiusMiles: 4.0,
    description:
      "Bromley is London's largest borough by area, covering a swathe of South East London and Kent borderland. With Crystal Palace Park, the Churchill Theatre, and extensive green belt countryside, it balances suburban living with easy access to the city centre.",
  },
  {
    name: "Croydon",
    slug: "croydon",
    center: { lat: 51.3714, lon: -0.0977 },
    radiusMiles: 3.5,
    description:
      "Croydon is a major South London borough with a rapidly changing town centre, known for its street art, Boxpark food market, and Fairfield Halls arts venue. Once a commercial hub, it's now reinventing itself as a creative and cultural destination on the southern edge of the city.",
  },
  {
    name: "Ealing",
    slug: "ealing",
    center: { lat: 51.513, lon: -0.3089 },
    radiusMiles: 2.8,
    description:
      'Ealing is a leafy West London borough often called the "Queen of the Suburbs," famous for Ealing Studios — one of the oldest film studios in the world. With areas like Acton, Southall, and Hanwell, it combines green spaces, diverse communities, and a proud cinematic heritage.',
  },
  {
    name: "Enfield",
    slug: "enfield",
    center: { lat: 51.6538, lon: -0.0799 },
    radiusMiles: 3.5,
    description:
      "Enfield is London's northernmost borough, stretching from the suburban streets of Southgate and Palmers Green to the rural edges of the Lee Valley. It offers a mix of historic market towns, reservoirs and parkland, and a growing food and arts scene.",
  },
  {
    name: "Haringey",
    slug: "haringey",
    center: { lat: 51.5906, lon: -0.111 },
    radiusMiles: 2.0,
    description:
      "Haringey is a diverse North London borough spanning the contrasting neighbourhoods of Muswell Hill, Crouch End, and Tottenham. Known for Alexandra Palace, its thriving independent food and arts scenes, and passionate football culture, it's a borough of many identities.",
  },
  {
    name: "Harrow",
    slug: "harrow",
    center: { lat: 51.5898, lon: -0.3346 },
    radiusMiles: 2.5,
    description:
      "Harrow is a suburban borough in North West London, best known for the prestigious Harrow School and its hilltop views across the capital. With a diverse population, Harrow offers a blend of quiet residential streets, multicultural high streets, and green spaces like Harrow Weald Common.",
  },
  {
    name: "Havering",
    slug: "havering",
    center: { lat: 51.5779, lon: 0.212 },
    radiusMiles: 4.0,
    description:
      "Havering is London's easternmost borough, encompassing Romford, Hornchurch, and Upminster. With a distinctly Essex-influenced character, it features the Queen's Theatre, large country parks, and the Thames-side marshes of Rainham, offering a semi-rural feel at the city's edge.",
  },
  {
    name: "Hillingdon",
    slug: "hillingdon",
    center: { lat: 51.5441, lon: -0.476 },
    radiusMiles: 4.5,
    description:
      "Hillingdon is London's westernmost borough and home to Heathrow Airport, making it the gateway to the capital. Beyond the airport, it includes the charming towns of Uxbridge and Ruislip, the Colne Valley, and large stretches of countryside and woodland.",
  },
  {
    name: "Hounslow",
    slug: "hounslow",
    center: { lat: 51.4746, lon: -0.368 },
    radiusMiles: 3.0,
    description:
      "Hounslow is a diverse West London borough stretching from the urban bustle of Hounslow and Brentford to the historic grandeur of Chiswick and Osterley Park. Sitting beneath the Heathrow flight path, it blends excellent transport links with riverside walks and a multicultural community.",
  },
  {
    name: "Kingston upon Thames",
    slug: "kingston-upon-thames",
    center: { lat: 51.3925, lon: -0.3057 },
    radiusMiles: 2.8,
    description:
      "Kingston upon Thames is a historic market town borough in South West London, centred on its ancient riverside setting where Saxon kings were crowned. With a bustling town centre, the Rose Theatre, and easy access to Richmond Park and Hampton Court, it's a popular and well-connected part of outer London.",
  },
  {
    name: "Merton",
    slug: "merton",
    center: { lat: 51.4098, lon: -0.1994 },
    radiusMiles: 2.5,
    description:
      "Merton is a South West London borough best known as the home of the All England Club and the Wimbledon Championships. Beyond the tennis, it encompasses the village charm of Wimbledon, the vibrant bustle of Mitcham, and the open spaces of Wimbledon Common and Morden Hall Park.",
  },
  {
    name: "Redbridge",
    slug: "redbridge",
    center: { lat: 51.559, lon: 0.0741 },
    radiusMiles: 2.8,
    description:
      "Redbridge is a suburban borough in North East London, spanning areas like Ilford, Wanstead, and South Woodford. It borders Epping Forest and features Valentines Park, offering leafy residential streets, a diverse population, and a growing local food and culture scene.",
  },
  {
    name: "Richmond upon Thames",
    slug: "richmond-upon-thames",
    center: { lat: 51.4479, lon: -0.326 },
    radiusMiles: 3.0,
    description:
      "Richmond upon Thames is one of London's greenest and most picturesque boroughs, straddling both sides of the river in South West London. Home to Richmond Park, Kew Gardens, and Hampton Court Palace, it's celebrated for its riverside beauty, village atmosphere, and outstanding natural spaces.",
  },
  {
    name: "Sutton",
    slug: "sutton",
    center: { lat: 51.3618, lon: -0.1945 },
    radiusMiles: 2.8,
    description:
      "Sutton is a largely suburban borough on London's southern edge, known for its excellent schools, quiet residential streets, and Beddington Park. With the eco-village of BedZED and easy access to the North Downs, it offers a peaceful character while staying well connected to the city.",
  },
  {
    name: "Waltham Forest",
    slug: "waltham-forest",
    center: { lat: 51.5886, lon: -0.0118 },
    radiusMiles: 2.5,
    description:
      "Waltham Forest is a creative borough in North East London that was the first London Borough of Culture in 2019. Covering Walthamstow, Leyton, and Leytonstone, it's known for the William Morris Gallery, Walthamstow Wetlands, and a flourishing independent food and arts scene.",
  },
];
