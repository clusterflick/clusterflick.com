import Image from "next/image";
import Link from "next/link";
import NavCard from "@/components/nav-card";
import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import Divider from "@/components/divider";
import PreloadCinemaData from "@/components/preload-cinema-data";
import EmptyState from "@/components/empty-state";
import { CalendarIcon } from "@/components/icons";
import { formatDateShort } from "@/utils/format-date";
import type { FestivalListItem } from "./page";
import styles from "./page.module.css";

interface FestivalsPageContentProps {
  festivals: FestivalListItem[];
  venues: { name: string; href: string }[];
}

export default function FestivalsPageContent({
  festivals,
  venues,
}: FestivalsPageContentProps) {
  const count = festivals.length;

  return (
    <main id="main-content">
      <PreloadCinemaData />
      <PageHeader backUrl="/" backText="Back to film list" />

      <HeroSection
        backgroundImage="/images/light-circles.jpg"
        backgroundImageAlt="Decorative light circles"
        backdropHeight="standard"
        align="center"
      >
        <OutlineHeading className={styles.title}>Festivals</OutlineHeading>
        <p className={styles.subtitle}>
          {count === 0
            ? "No festivals currently running"
            : `${count} ${count === 1 ? "festival" : "festivals"} running`}
        </p>
      </HeroSection>

      <Divider />

      <div className={styles.content}>
        {count > 0 && (
          <p className={styles.intro}>
            Clusterflick tracks film festivals happening right now across
            London.
            {venues.length > 0 && (
              <>
                {" "}
                Current festivals are screening at{" "}
                {venues.map((venue, i) => (
                  <span key={venue.href}>
                    <Link href={venue.href}>{venue.name}</Link>
                    {i < venues.length - 2
                      ? ", "
                      : i === venues.length - 2
                        ? " and "
                        : ""}
                  </span>
                ))}
                .
              </>
            )}
          </p>
        )}
        {festivals.length === 0 ? (
          <EmptyState
            icon={{
              src: "/images/icons/neon-ticket-ripped.svg",
              width: 120,
              height: 80,
            }}
            message="No festivals currently showing"
            hint="Check back soon — festival listings are updated regularly"
          />
        ) : (
          <ul className={styles.festivalGrid}>
            {festivals.map((festival) => (
              <li key={festival.id}>
                <NavCard href={festival.href} className={styles.festivalCard}>
                  <div className={styles.festivalCardLogo}>
                    {festival.imagePath ? (
                      <Image
                        src={festival.imagePath}
                        alt={`${festival.name} logo`}
                        width={96}
                        height={96}
                        className={styles.festivalLogo}
                      />
                    ) : (
                      <div className={styles.festivalLogoPlaceholder} />
                    )}
                  </div>
                  <div className={styles.festivalCardBody}>
                    <div className={styles.festivalCardName}>
                      {festival.name}
                    </div>
                    <p className={styles.festivalCardDescription}>
                      {festival.seoDescription
                        ? festival.seoDescription.charAt(0).toUpperCase() +
                          festival.seoDescription.slice(1)
                        : ""}
                    </p>
                    <div className={styles.festivalCardMeta}>
                      {festival.dateFrom !== null &&
                        festival.dateTo !== null && (
                          <span className={styles.festivalCardMetaItem}>
                            <CalendarIcon size={14} />
                            {formatDateShort(new Date(festival.dateFrom), {
                              includeYearIfDifferent: true,
                            })}
                            {new Date(festival.dateFrom).toDateString() !==
                              new Date(festival.dateTo).toDateString() && (
                              <>
                                {" "}
                                &ndash;{" "}
                                {formatDateShort(new Date(festival.dateTo), {
                                  includeYearIfDifferent: true,
                                })}
                              </>
                            )}
                          </span>
                        )}
                      <span className={styles.festivalCardMetaItem}>
                        <span className={styles.festivalFilmCount}>
                          {festival.movieCount}{" "}
                          {festival.movieCount === 1 ? "film" : "films"}
                        </span>
                      </span>
                    </div>
                  </div>
                </NavCard>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
