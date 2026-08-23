import type { SocialHandles } from "@/utils/build-social-links";
import Tag from "@/components/tag";
import SocialLinks from "@/components/social-links";
import {
  GoogleCalendarIcon,
  OutlookCalendarIcon,
  CalendarIcon,
} from "@/components/icons";
import styles from "./venue-hero-details.module.css";

interface VenueHeroDetailsProps {
  /** Venue id — the filename of its feed in the data-calendar release. */
  venueId: string;
  venueName: string;
  /** The venue's `type` from the dataset, rendered as-is. */
  venueType: string;
  socials?: SocialHandles;
}

/**
 * The row that sits under the title in a venue's DetailPageHero: social links,
 * the venue type, and the three calendar subscription targets.
 *
 * Shared by the venue page and its calendar page so the two carry an identical
 * header — the calendar page differs only in where its back link points.
 */
export default function VenueHeroDetails({
  venueId,
  venueName,
  venueType,
  socials,
}: VenueHeroDetailsProps) {
  const calendarUrl = `https://github.com/clusterflick/data-calendar/releases/latest/download/${venueId}`;
  const webcalUrl = `webcal://github.com/clusterflick/data-calendar/releases/latest/download/${venueId}`;

  return (
    <div className={styles.heroTagRow}>
      <div className={styles.heroTagRowSide}>
        <SocialLinks socials={socials} />
      </div>
      <div>
        <Tag color="blue">{venueType}</Tag>
      </div>
      <div className={styles.heroTagRowSide}>
        <a
          href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.heroSocialLink}
          title="Add to Google Calendar"
        >
          <GoogleCalendarIcon size={20} />
        </a>
        <a
          href={`https://outlook.live.com/calendar/0/addfromweb/?url=${encodeURIComponent(calendarUrl)}&name=${encodeURIComponent(venueName)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.heroSocialLink}
          style={{ padding: 4 }}
          title="Add to Outlook Calendar"
        >
          <OutlookCalendarIcon size={28} />
        </a>
        <a
          href={webcalUrl}
          className={styles.heroSocialLink}
          title="Subscribe to calendar"
        >
          <CalendarIcon size={20} />
        </a>
      </div>
    </div>
  );
}
