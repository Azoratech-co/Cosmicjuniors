"""Add DE440 orbit continuations to the flight viewer's bundled data.

Usage: python scripts/solar_orbits.py KERNEL_DIR PUBLIC_MODELS_DIR
KERNEL_DIR contains de440s.bsp and naif0012.tls. Both flight exporters also
call add_solar_orbits so regenerated trajectories retain their guides.
"""

import json
import sys
from math import atan2, cos, sin
from pathlib import Path

import spiceypy as spice


SECONDS_PER_DAY = 86400
EARTH_YEAR = 365.256 * SECONDS_PER_DAY
MARS_YEAR = 686.980 * SECONDS_PER_DAY
AU_KM = 149597870.7


def solar_position(body, epoch):
    vector = spice.spkpos(body, epoch, "ECLIPJ2000", "NONE", "SUN")[0]
    return [round(float(value) / AU_KM, 9) for value in vector]


def continuation(body, start, end, period, first, last):
    """Follow the body from arrival until it returns to its departure longitude."""
    longitude = atan2(first[1], first[0])

    def longitude_difference(time):
        x, y, _ = solar_position(body, time)
        delta = atan2(y, x) - longitude
        return atan2(sin(delta), cos(delta))

    # The sidereal period gives a bracket. Solving for the true longitude
    # avoids assuming a perfectly repeating orbit or closing the path by hand.
    lower = start + period - 14 * SECONDS_PER_DAY
    upper = start + period + 14 * SECONDS_PER_DAY
    if not longitude_difference(lower) <= 0 <= longitude_difference(upper):
        raise ValueError(f"{body}: cannot bracket one solar revolution")
    for _ in range(32):
        middle = (lower + upper) / 2
        if longitude_difference(middle) < 0:
            lower = middle
        else:
            upper = middle
    if end >= upper:
        return []
    return [last] + [solar_position(body, end + (upper - end) * step / 240)
                     for step in range(1, 241)]


def add_solar_orbits(flight, *, lunar):
    start, end = [spice.str2et(flight[key]) for key in ("start", "end")]
    samples = flight["solarSamples"] if lunar else flight["samples"]
    flight.pop("earthOrbit", None)
    flight["solarOrbitGuides"] = [
        continuation("EARTH", start, end, EARTH_YEAR, samples[0][1], samples[-1][1]),
        continuation("MOON" if lunar else "MARS BARYCENTER", start, end,
                     EARTH_YEAR if lunar else MARS_YEAR, samples[0][2], samples[-1][2]),
    ]
    return flight


if __name__ == "__main__":
    kernels, models = map(Path, sys.argv[1:])
    for name in ("naif0012.tls", "de440s.bsp"):
        spice.furnsh(str(kernels / name))
    for world in ("mars", "moon"):
        for path in sorted((models / world).glob("*-flight.json")):
            flight = json.loads(path.read_text(encoding="utf-8"))
            add_solar_orbits(flight, lunar=world == "moon")
            path.write_text(json.dumps(flight, separators=(",", ":")) + "\n", encoding="utf-8")
