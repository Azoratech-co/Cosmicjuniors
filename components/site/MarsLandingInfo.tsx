import { formatLandingCoordinates, type LandingSiteDetails } from "@/lib/landing-sites";
import type { ReactNode } from "react";
import MarsInfo from "./MarsInfo";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export default function LandingSiteInfo({ site, reveal, showMission, action }: {
  site: LandingSiteDetails;
  reveal?: boolean;
  showMission?: boolean;
  action?: ReactNode;
}) {
  return (
    <MarsInfo
      key={site.id}
      label={showMission ? site.rover : undefined}
      title={site.title}
      summary={site.summary}
      reveal={reveal}
      action={action}
      fields={[
        ["Coordinates", formatLandingCoordinates(site, site.approximate)],
        ["Agency", <>{site.agency} · {site.arrivalLabel ?? "Landed"}{" "}
          <time dateTime={site.arrivalDate}>{dateFormat.format(new Date(`${site.arrivalDate}T00:00:00Z`))}</time> UTC</>],
      ]}
      more={{ title: site.highlight.title, content: site.highlight.description }}
      sources={<>
        <a href={site.source} target="_blank" rel="noopener noreferrer">NASA mission reference</a>
        {site.coordinateSource !== site.source && <a href={site.coordinateSource} target="_blank" rel="noopener noreferrer">{site.coordinateSourceLabel ?? "NASA coordinates"}</a>}
      </>}
    />
  );
}
