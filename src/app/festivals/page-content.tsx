import Image from "next/image";
import Link from "next/link";
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
}

export default function FestivalsPageContent({
  festivals,
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
            ? "No festivals currently showing"
            : `${count} ${count === 1 ? "festival" : "festivals"} currently showing`}
        </p>
      </HeroSection>

      <Divider />

      <div className={styles.content}>
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
                <Link href={festival.href} className={styles.festivalCard}>
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
                    <div className={styles.festivalCardMeta}>
                      {festival.dateFrom !== null &&
                        festival.dateTo !== null && (
                          <span className={styles.festivalCardMetaItem}>
                            <CalendarIcon size={14} />
                            {formatDateShort(new Date(festival.dateFrom), {
                              includeYearIfDifferent: true,
                            })}{" "}
                            &ndash;{" "}
                            {formatDateShort(new Date(festival.dateTo), {
                              includeYearIfDifferent: true,
                            })}
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
                  <div className={styles.festivalCardFooter}>
                    <span className={styles.festivalCardCta}>
                      Explore festival <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
