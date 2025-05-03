const { existsSync, mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { compress, trimUndefinedRecursively } = require("compress-json");
const data = require("../combined-data/combined-data.json");

function getHash(inputString) {
  const hash = crypto.createHash("sha256");
  hash.update(inputString);
  return hash.digest("hex").slice(0, 10);
}
const classifications = ["U", "PG", "12", "12A", "15", "18"];
function removeShowingOverviews(data) {
  Object.values(data.movies).forEach((movie) => {
    const showings = Object.values(movie.showings);

    // Derrive classification if required
    if (!movie.classification) {
      const showingClassifications = showings.reduce(
        (collection, { overview: { classification } }) =>
          classification && classifications.includes(classification)
            ? collection.add(classification)
            : collection,
        new Set(),
      );

      // Showings must agree on the same classification
      if (showingClassifications.size === 1) {
        movie.classification = [...showingClassifications][0].toUpperCase();
      }
    }

    // Get duration if required
    if (!movie.duration) {
      const showingWithDuration = showings.find(({ duration }) => !!duration);
      if (showingWithDuration) movie.duration = showingWithDuration.duration;
    }

    // Delete overview
    showings.forEach((showing) => delete showing.overview);
  });
  return data;
}

function trimRottenTomatoData(data) {
  Object.values(data.movies).forEach((movie) => {
    if (movie.rottenTomatoes) {
      delete movie.rottenTomatoes.audience.verified;
      delete movie.rottenTomatoes.audience.all?.dislikes;
      delete movie.rottenTomatoes.audience.all?.likes;
      delete movie.rottenTomatoes.critics.top;
      delete movie.rottenTomatoes.critics.all?.dislikes;
      delete movie.rottenTomatoes.critics.all?.likes;
    }
  });
  return data;
}

const urlPrefixes = [
  "https://www.rottentomatoes.com/m/",
  "http://www.cinemamuseum.org.uk/",
  "https://bookings.thegardencinema.co.uk/TheGardenCinema.dll/TSelectItems.waSelectItemsPrompt.TcsWebMenuItem_0.TcsWebTab_0.TcsPerformance_",
  "https://cinelumiere.savoysystems.co.uk/CineLumiere.dll/TSelectItems.waSelectItemsPrompt.TcsWebMenuItem_600.TcsWebTab_601.",
  "https://experience.cineworld.co.uk/select-tickets?sitecode=",
  "https://genesis.admit-one.co.uk/seats/?perfCode=",
  "https://princecharlescinema.com/film/",
  "https://princecharlescinema.com/prince-charles-cinema/booknow/",
  "https://purchase.everymancinema.com/startticketing/",
  "https://purchase.jw3.org.uk/ChooseSeats/",
  "https://richmix.org.uk/book-online/",
  "https://richmix.org.uk/cinema/",
  "https://riocinema.org.uk/Rio.dll/WhatsOn?f=",
  "https://riversidestudios.co.uk/see-and-do/",
  "https://thearzner.com/TheArzner.dll/Booking?Booking=TSelectItems.waSelectItemsPrompt.TcsWebMenuItem_0.TcsWebTab_0.TcsPerformance_",
  "https://thearzner.com/TheArzner.dll/WhatsOn?f=",
  "https://thecastlecinema.com/bookings/",
  "https://thecastlecinema.com/programme/",
  "https://thelexicinema.co.uk/TheLexiCinema.dll/Booking?Booking=TSelectItems.waSelectItemsPrompt.TcsWebMenuItem_0.TcsWebTab_0.TcsPerformance_",
  "https://thelexicinema.co.uk/TheLexiCinema.dll/WhatsOn?f=",
  "https://ticketing.picturehouses.com/Ticketing/visSelectTickets.aspx?cinemacode=",
  "https://ticketlab.co.uk/event/id/",
  "https://ticketlab.co.uk/series/id/",
  "https://tickets.barbican.org.uk/choose-seats/",
  "https://web1.empire.mycloudcinema.com/#/book/",
  "https://web2.empire.mycloudcinema.com/#/book/",
  "https://web3.empire.mycloudcinema.com/#/book/",
  "https://whatson.bfi.org.uk/imax/Online/default.asp?default.asp?doWork::WScontent::loadArticle=Load&BOparam::WScontent::loadArticle::article_id=",
  "https://whatson.bfi.org.uk/Online/default.asp?default.asp?doWork::WScontent::loadArticle=Load&BOparam::WScontent::loadArticle::article_id=",
  "https://www.actonecinema.co.uk/checkout/showing/",
  "https://www.actonecinema.co.uk/movie/",
  "https://www.barbican.org.uk/whats-on/",
  "https://www.chiswickcinema.co.uk/films/",
  "https://www.chiswickcinema.co.uk/tickets/",
  "https://www.cineworld.co.uk/films/",
  "https://www.closeupfilmcentre.com/film_programmes/",
  "https://www.curzon.com/films/",
  "https://www.curzon.com/ticketing/seats/",
  "https://www.ealingproject.co.uk/checkout/showing/",
  "https://www.ealingproject.co.uk/movie/",
  "https://www.electriccinema.co.uk/film/",
  "https://www.electriccinema.co.uk/tickets/",
  "https://www.eventbrite.co.uk/e/",
  "https://www.eventbrite.com/checkout-external?eid=",
  "https://www.eventbrite.com/e/",
  "https://www.everymancinema.com/film-listing/",
  "https://www.genesiscinema.co.uk/event/",
  "https://www.institut-francais.org.uk/cinema/",
  "https://www.jw3.org.uk/book/",
  "https://www.jw3.org.uk/whats-on/",
  "https://www.myvue.com/book-tickets/summary/",
  "https://www.myvue.com/cinema/",
  "https://www.odeon.co.uk/films/",
  "https://www.odeon.co.uk/ticketing/seat-picker/?showtimeId=",
  "https://www.olympiccinema.com/film/",
  "https://www.phoenixcinema.co.uk/checkout/showing/",
  "https://www.phoenixcinema.co.uk/movie/",
  "https://www.picturehouses.com/movie-details/",
  "https://www.regentstreetcinema.com/checkout/showing/",
  "https://www.regentstreetcinema.com/movie/",
  "https://www.riocinema.org.uk/Rio.dll/Booking?Booking=TSelectItems.waSelectItemsPrompt.TcsWebMenuItem_0.TcsWebTab_0.TcsPerformance_",
  "https://www.sidcupstoryteller.co.uk/checkout/showing/",
  "https://www.sidcupstoryteller.co.uk/movie/",
  "https://www.thecinemaatselfridges.com/film/",
  "https://www.thecinemainthepowerstation.com/film/",
  "https://www.thegardencinema.co.uk/film/",
  "https://www.throwleyyardcinema.co.uk/checkout/showing/",
  "https://www.throwleyyardcinema.co.uk/movie/",
  "https://www.ticketsource.co.uk/close-up-cinema/",
];

function extractCommonUrlPrefix(data) {
  data.urlPrefixes = urlPrefixes;

  Object.values(data.movies).forEach((movie) => {
    if (movie.rottenTomatoes) {
      urlPrefixes.forEach((prefix, index) => {
        movie.rottenTomatoes.url = movie.rottenTomatoes.url.replace(
          prefix,
          `{${index}}`,
        );
      });
    }

    const showings = Object.values(movie.showings);
    showings.forEach((showing) => {
      urlPrefixes.forEach((prefix, index) => {
        showing.url = showing.url.replace(prefix, `{${index}}`);
      });
    });

    const performances = Object.values(movie.performances);
    performances.forEach((performance) => {
      urlPrefixes.forEach((prefix, index) => {
        performance.bookingUrl = performance.bookingUrl.replace(
          prefix,
          `{${index}}`,
        );
      });
    });
  });
  return data;
}

function removeIdProperty(data) {
  Object.keys(data.genres).forEach((id) => {
    if (data.genres[id].id === id) delete data.genres[id].id;
  });
  Object.keys(data.venues).forEach((id) => {
    if (data.venues[id].id === id) delete data.venues[id].id;
  });
  Object.keys(data.people).forEach((id) => {
    if (data.people[id].id === id) delete data.people[id].id;
  });
  Object.keys(data.movies).forEach((id) => {
    const movie = data.movies[id];
    if (movie.id === id) delete data.movies[id].id;

    Object.keys(movie.showings).forEach((showingId) => {
      if (movie.showings[showingId].id === showingId) {
        delete movie.showings[showingId].id;
      }
    });
  });
  return data;
}

function removeNormalizedTitle(data) {
  Object.values(data.movies).forEach((movie) => {
    delete movie.normalizedTitle;
  });
  return data;
}

function removeOptionalData(data) {
  return [
    removeShowingOverviews,
    trimRottenTomatoData,
    extractCommonUrlPrefix,
    removeIdProperty,
    removeNormalizedTitle,
  ].reduce((reducedData, reduction) => reduction(reducedData), data);
}

try {
  const reducedData = removeOptionalData(data);
  const { generatedAt, genres, people, venues, urlPrefixes, movies } =
    reducedData;

  const files = {
    common: { generatedAt, genres, people, venues, urlPrefixes },
  };
  Object.keys(movies).forEach((id) => {
    const movie = movies[id];
    const initial = id[id.length - 1];
    const key = /[a-z]/i.test(initial) ? "other" : initial;
    files[key] = files[key] || {};
    files[key][id] = movie;
  });

  trimUndefinedRecursively(files);

  Object.keys(files).forEach((id) => {
    const compressed = JSON.stringify(compress(files[id]));
    const outputPath = path.join(__dirname, "..", "public");
    if (!existsSync(outputPath)) mkdirSync(outputPath, { recursive: true });
    const outputFilename = `data.${id}.${getHash(compressed)}.json`;
    writeFileSync(path.join(outputPath, outputFilename), compressed);
  });
} catch (e) {
  throw e;
}
