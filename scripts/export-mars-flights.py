"""Export the JPL cruise SPKs for Pathfinder, Spirit, Phoenix, and InSight.

Usage: python scripts/export-mars-flights.py KERNEL_DIR OUTPUT_DIR
Requires SpiceyPy and the filenames below plus naif0012.tls and de440s.bsp.
The explorer flight registry links to the source kernel archives.
Positions are geometric, Sun-centered ECLIPJ2000 vectors in AU, using the
same sample format and frame as the Opportunity flight.
"""

import json
import sys
from pathlib import Path

import spiceypy as spice
from solar_orbits import add_solar_orbits


MISSIONS = {
    "sojourner": ("mpf_crus.bsp", -53, 4),
    "spirit": ("mer2_cruise.bsp", -254, 499),
    "phoenix": ("phx_cruise.bsp", -84, 499),
    "insight": ("insight_cru_ops_v1.bsp", -189, 4),
}


def export_flight(kernels, filename, spacecraft, mars):
    spice.kclear()
    for name in ("naif0012.tls", "de440s.bsp", filename):
        spice.furnsh(str(kernels / name))

    coverage = spice.spkcov(str(kernels / filename), spacecraft)
    if spice.wncard(coverage) != 1:
        raise ValueError(f"{filename} must have one continuous cruise window")
    start, end = spice.wnfetd(coverage, 0)
    au = spice.convrt(1, "AU", "KM")

    def position(body, time):
        # The Pathfinder and InSight cruise SPKs reference the Mars system barycenter.
        vector = spice.spkpos(str(body), time, "ECLIPJ2000", "NONE", "SUN")[0]
        return [round(float(value) / au, 9) for value in vector]

    times = [start + (end - start) * index / 480 for index in range(480)] + [end]
    flight = {
        "start": spice.et2utc(start, "ISOC", 3) + "Z",
        "end": spice.et2utc(end, "ISOC", 3) + "Z",
        "samples": [[position(body, time) for body in (spacecraft, 399, mars)] for time in times],
    }
    # The cruise kernel can embed an older planetary ephemeris.
    # Give DE440 priority for the orbit guides beyond the mission.
    spice.furnsh(str(kernels / "de440s.bsp"))
    return add_solar_orbits(flight, lunar=False)


if __name__ == "__main__":
    kernels, output = map(Path, sys.argv[1:])
    output.mkdir(parents=True, exist_ok=True)
    for mission, parameters in MISSIONS.items():
        flight = export_flight(kernels, *parameters)
        (output / f"{mission}-flight.json").write_text(
            json.dumps(flight, separators=(",", ":")) + "\n", encoding="utf-8"
        )
