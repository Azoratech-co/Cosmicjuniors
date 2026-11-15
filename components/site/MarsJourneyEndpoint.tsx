import type { LandingSiteDetails } from "@/lib/landing-sites";
import { detailedCoordinates, getJourneyDefinition, getRouteSnapshot, solRange } from "@/lib/mars-journeys";
import MarsInfo from "./MarsInfo";
import styles from "./LandingGlobe.module.css";

export default function MarsJourneyEndpoint({ site, reveal }: { site: Pick<LandingSiteDetails, "id" | "agency">; reveal?: boolean }) {
  const definition = getJourneyDefinition(site.id);
  const snapshot = getRouteSnapshot(site.id);
  const contact = definition.contact;

  return (
    <section className={styles.infoCard} aria-label={definition.endpointLabel}>
      <MarsInfo
        reveal={reveal}
        label={definition.endpointLabel}
        title={definition.endpointArea}
        summary={contact ? definition.endpointNote : undefined}
        fields={snapshot ? [
          ["Coordinates", detailedCoordinates(snapshot.last)],
          ["Agency", site.agency],
          ["Coverage", solRange(snapshot.last)],
          ["Snapshot", <time dateTime={snapshot.snapshotDate}>{snapshot.snapshotDate}</time>],
        ] : [["Agency", site.agency]]}
        more={contact
          ? { title: contact.label, content: <time dateTime={contact.date}>{contact.date}</time> }
          : { content: definition.endpointNote }}
        sources={<>
          <a href={definition.endpointSource} target="_blank" rel="noopener noreferrer">Endpoint evidence</a>
          {contact && <a href={contact.source} target="_blank" rel="noopener noreferrer">NASA reference</a>}
        </>}
      />
    </section>
  );
}
