import { formatLandingCoordinates, type MarsRoverSite } from "@/lib/landing-sites";
import styles from "./LandingGlobe.module.css";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export default function MarsLandingInfo({ site }: { site: MarsRoverSite }) {
  return (
    <div className={styles.landingInfo}>
      <p className={styles.place}>{site.name}</p>
      <p>{site.region}</p>
      <p className={styles.coordinates}>{formatLandingCoordinates(site, site.approximate)}</p>
      <p className={styles.date}>{site.agency} · {site.id === "mars-2-prop-m" ? "Impact" : "Landed"}{" "}
        <time dateTime={site.arrivalDate}>{dateFormat.format(new Date(`${site.arrivalDate}T00:00:00Z`))}</time> UTC</p>
      <p className={styles.summary}>{site.summary}</p>
      {site.approximate && <p className={styles.note}>Dashed marker: approximate lander location. This rover never drove on Mars.</p>}
      <div className={styles.sources}>
        <a href={site.source} target="_blank" rel="noopener noreferrer">NASA mission reference</a>
        {site.coordinateSource !== site.source && <a href={site.coordinateSource} target="_blank" rel="noopener noreferrer">NASA coordinates</a>}
      </div>
    </div>
  );
}
