export type MarsLandingSite = {
  name: string;
  latitude: number;
  longitude: number;
  color: string;
  source: string;
};

export const opportunityLanding: MarsLandingSite = {
  name: "Eagle Crater",
  latitude: -1.9483,
  longitude: 354.47417,
  color: "#ff293d",
  source: "https://science.nasa.gov/mission/mer-opportunity/",
};

export function landingView(site: MarsLandingSite) {
  return {
    pitch: site.latitude * Math.PI / 180,
    yaw: -(site.longitude + 90) * Math.PI / 180,
  };
}
