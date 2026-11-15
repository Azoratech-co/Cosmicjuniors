export type FlightMission = {
  name: string;
  file: string;
  destination: "Mars" | "Moon";
  overview: string;
  trajectory: string;
  spacecraftLabel?: string;
  startLabel?: string;
  endLabel?: string;
  reconstruction?: string;
};

type FlightMissions = readonly [FlightMission, ...FlightMission[]];

const opportunityFlights: FlightMissions = [{
  name: "Opportunity",
  file: "/models/mars/opportunity-flight.json",
  destination: "Mars",
  overview: "https://science.nasa.gov/mission/mer-opportunity/",
  trajectory: "https://naif.jpl.nasa.gov/pub/naif/pds/data/mer1-m-spice-6-v1.0/mer1sp_1000/data/spk/",
}];

const lunarRoverFlights: FlightMissions = [
  {
    name: "Apollo 15",
    file: "/models/moon/apollo-15-flight.json",
    destination: "Moon",
    overview: "https://www.nasa.gov/missions/apollo/apollo-15-mission-details/",
    trajectory: "https://sma.nasa.gov/SignificantIncidents/assets/apollo-15-mission-report.pdf",
  },
  {
    name: "Apollo 16",
    file: "/models/moon/apollo-16-flight.json",
    destination: "Moon",
    overview: "https://www.nasa.gov/missions/apollo/apollo-16-mission-details/",
    trajectory: "https://www.nasa.gov/wp-content/uploads/static/history/alsj/a16/A16_MissionReport.pdf",
  },
  {
    name: "Apollo 17",
    file: "/models/moon/apollo-17-flight.json",
    destination: "Moon",
    overview: "https://www.nasa.gov/missions/apollo/apollo-17-mission-details/",
    trajectory: "https://www.nasa.gov/wp-content/uploads/static/history/alsj/a17/A17_MissionReport.pdf",
  },
];

export const explorerFlights: Partial<Record<string, FlightMissions>> = {
  opportunity: opportunityFlights,
  sojourner: [{
    name: "Sojourner",
    spacecraftLabel: "Pathfinder",
    destination: "Mars",
    file: "/models/mars/sojourner-flight.json",
    overview: "https://science.nasa.gov/mission/mars-pathfinder/",
    trajectory: "https://naif.jpl.nasa.gov/pub/naif/pds/MPF/MPSP_0001/",
    startLabel: "Start of track",
    endLabel: "Mars approach",
    reconstruction: "Mars Pathfinder carried Sojourner to Mars. This archived track begins on February 4, 1997, about two months after launch. JPL used tracking data through June 23, 1997, and predicted the rest of the flight to Mars.",
  }],
  spirit: [{
    name: "Spirit",
    destination: "Mars",
    file: "/models/mars/spirit-flight.json",
    overview: "https://science.nasa.gov/mission/mer-spirit/",
    trajectory: "https://naif.jpl.nasa.gov/pub/naif/pds/data/mer2-m-spice-6-v1.0/mer2sp_1000/data/spk/",
    reconstruction: "JPL reconstructed this cruise track from about 32 minutes after liftoff to Mars atmospheric entry.",
  }],
  insight: [{
    name: "InSight",
    destination: "Mars",
    file: "/models/mars/insight-flight.json",
    overview: "https://science.nasa.gov/mission/insight/",
    trajectory: "https://naif.jpl.nasa.gov/pub/naif/pds/pds4/insight/insight_spice/document/spiceds_v002.html",
    reconstruction: "JPL reconstructed this cruise track from about 90 minutes after liftoff to Mars atmospheric entry.",
  }],
  phoenix: [{
    name: "Phoenix",
    destination: "Mars",
    file: "/models/mars/phoenix-flight.json",
    overview: "https://science.nasa.gov/mission/mars-phoenix/",
    trajectory: "https://naif.jpl.nasa.gov/pub/naif/PHOENIX/kernels/spk/",
    reconstruction: "JPL’s reconstructed cruise track begins after liftoff and ends near Phoenix’s entry into the Martian atmosphere.",
  }],
  "lunar-rover": lunarRoverFlights,
  "tranquility-base": [{
    name: "Apollo 11",
    destination: "Moon",
    file: "/models/moon/apollo-11-flight.json",
    overview: "https://www.nasa.gov/missions/apollo/apollo-11/apollo-11-mission-overview/",
    trajectory: "https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/A11_MissionReport.pdf",
  }],
  "surveyor-3": [{
    name: "Surveyor 3",
    destination: "Moon",
    file: "/models/moon/surveyor-3-flight.json",
    overview: "https://ntrs.nasa.gov/citations/19670028267",
    trajectory: "https://ntrs.nasa.gov/citations/19690009698",
    endLabel: "Powered descent begins",
    reconstruction: "Reconstructed from JPL’s Surveyor 3 tracking solutions using Earth, Moon, and Sun gravity. Surveyor 3 approached the Moon directly. This track ends as the descent engines ignite.",
  }],
};
