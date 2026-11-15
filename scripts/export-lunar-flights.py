"""Generate the Moon explorer flights from NASA/JPL postflight states.

Run with numpy and spiceypy: python scripts/export-lunar-flights.py KERNEL_DIR OUTPUT_DIR
KERNEL_DIR contains NAIF's naif0012.tls, pck00011.tpc, and de440s.bsp.
Sources: NASA SP-4029 (Apollo 15 translunar injection and mission timelines)
and the Apollo 11 and 15–17 Mission Reports (trajectory parameters).
Apollo uses cubic Hermite interpolation of the reported spacecraft states.
Surveyor 3 uses JPL TR 32-1292 table 15 and the terminal event time in
JPL TR 32-1177, with Earth, Moon, and Sun gravity and endpoint constraints.
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import spiceypy as spice
from solar_orbits import add_solar_orbits

# Range zero UTC, then (GET, center, latitude, longitude, nautical miles,
# inertial feet/sec, flight-path angle, heading east of north).
MISSIONS = {
    11: ("1969-07-16T13:32:00+00:00", [
        ("2:50:13.03", "Earth", 9.983, -164.8373, 180.581, 35545.6, 7.367, 60.073),
        ("4:40:04.7", "Earth", 21.16, -68.46, 16627.3, 14663.0, 64.25, 113.74),
        ("26:45:01.8", "Earth", 6.00, -11.17, 109477.2, 5010.0, 76.88, 128.87),
        ("75:49:50.4", "Moon", -1.57, -169.58, 86.7, 8250.0, -9.99, -62.80),
    ]),
    15: ("1971-07-26T13:34:00+00:00", [
        ("2:56:03.61", "Earth", 24.9700, -142.1295, 173.679, 35579.1, 7.430, 73.173),
        ("4:18:01.2", "Earth", 5.61, -46.87, 12826.9, 16402.2, 61.45, 119.11),
        ("28:40:22.7", "Earth", -13.36, -19.18, 114784.0, 4845.6, 77.18, 118.17),
        ("73:31:15.7", "Moon", -0.95, -55.40, 12617.7, 3966.8, -81.10, -140.00),
        ("74:06:47.1", "Moon", -1.46, -56.65, 11235.3, 4026.3, -80.20, -139.94),
        ("78:31:46.70", "Moon", -27.79, -172.05, 86.7, 8188.6, -8.93, -54.47),
    ]),
    16: ("1972-04-16T17:54:00+00:00", [
        ("2:39:28.42", "Earth", -11 - 59/60, 162 + 29/60, 171.0, 35565.7, 7.47, 59.5),
        ("3:59:15", "Earth", 32 + 38/60, -111 - 13/60, 12492.7, 16533.5, 61.07, 88.39),
        ("30:39:02.67", "Earth", 25 + 13/60, -106 - 30/60, 119345.3, 4508.1, 76.72, 111.50),
        ("69:59:01", "Moon", -2 - 45/60, -54 - 56/60, 11135.4, 3896.5, -79.85, -82.39),
        ("74:28:27.87", "Moon", 8 + 9/60, -166 - 38/60, 93.9, 8105.4, -9.51, -89.95),
    ]),
    17: ("1972-12-07T05:33:00+00:00", [
        ("3:18:28", "Earth", 5.14, -53.86, 162.4, 35589.6, 6.947, 118.040),
        ("4:45:00", "Earth", -27.91, 37.68, 13393.6, 16012.8, 61.80, 83.485),
        ("35:30:02", "Earth", -17.04, -22.82, 123246.9, 4066.8, 76.48, 66.84),
        ("81:32:40", "Moon", -0.49, -69.50, 11370.6, 3774.6, -79.90, 258.16),
        ("86:14:22.60", "Moon", -11.33, 177.38, 76.8, 8110.2, -9.90, 273.70),
    ]),
}

KM_PER_NAUTICAL_MILE = 1.852
KM_PER_FOOT = 0.0003048
DISTANCE_UNIT_KM = 384400
AU_KM = 149597870.7
EARTH_RADIUS_KM = 6378.137
MOON_RADIUS_KM = 1737.4


def utc_time(range_zero, elapsed):
    hours, minutes, seconds = map(float, elapsed.split(":"))
    return range_zero + timedelta(hours=hours, minutes=minutes, seconds=seconds)


def moon_state(time):
    return spice.spkezr("MOON", time, "J2000", "NONE", "EARTH")[0]


def spacecraft_state(time, body, latitude, longitude, altitude, speed, angle, heading):
    lat, lon, flight_path, azimuth = np.radians([latitude, longitude, angle, heading])
    up = np.array([np.cos(lat)*np.cos(lon), np.cos(lat)*np.sin(lon), np.sin(lat)])
    east = np.array([-np.sin(lon), np.cos(lon), 0.0])
    north = np.cross(up, east)
    if body == "Earth":
        surface = spice.georec(lon, lat, 0, EARTH_RADIUS_KM, 1/298.257223563)
        position = surface + altitude * KM_PER_NAUTICAL_MILE * surface / np.linalg.norm(surface)
    else:
        position = up * (MOON_RADIUS_KM + altitude * KM_PER_NAUTICAL_MILE)
    direction = np.cos(flight_path) * (np.cos(azimuth)*north + np.sin(azimuth)*east) + np.sin(flight_path)*up
    rotation = spice.pxform(f"IAU_{body.upper()}", "J2000", time)
    return np.concatenate((rotation @ position, rotation @ direction * speed * KM_PER_FOOT))


def interpolate(time, start, end, first, last):
    duration = end - start
    u = (time - start) / duration
    return ((2*u**3 - 3*u**2 + 1) * first[:3] + (u**3 - 2*u**2 + u) * duration * first[3:]
            + (-2*u**3 + 3*u**2) * last[:3] + (u**3 - u**2) * duration * last[3:])


def normalize(vector):
    return vector / np.linalg.norm(vector)


def display_flight(start, end, times, positions):
    arrival_moon = moon_state(times[-1])
    x_axis = normalize(arrival_moon[:3])
    z_axis = normalize(np.cross(arrival_moon[:3], arrival_moon[3:]))
    basis = np.array([x_axis, np.cross(z_axis, x_axis), z_axis])

    def display_vector(position):
        return np.round(basis @ position / DISTANCE_UNIT_KM, 9).tolist()

    local_samples = []
    solar_samples = []
    ecliptic = spice.pxform("J2000", "ECLIPJ2000", times[0])
    for time, position in zip(times, positions, strict=True):
        moon = moon_state(time)[:3]
        if np.linalg.norm(position) < 6378 or np.linalg.norm(position - moon) < MOON_RADIUS_KM:
            raise ValueError("Reconstructed trajectory intersects a body")
        local_samples.append([display_vector(position), [0, 0, 0], display_vector(moon)])
        earth = spice.spkpos("EARTH", time, "ECLIPJ2000", "NONE", "SUN")[0]
        solar_positions = np.array([
            earth + ecliptic @ position, earth, earth + ecliptic @ moon,
        ])
        solar_samples.append(np.round(solar_positions / AU_KM, 10).tolist())
    return add_solar_orbits({
        "start": start, "end": end, "samples": local_samples, "solarSamples": solar_samples,
    }, lunar=True)


def export_flight(range_zero, events):
    times_utc = [utc_time(datetime.fromisoformat(range_zero), row[0]).isoformat(timespec="milliseconds").replace("+00:00", "Z")
                 for row in events]
    times = [spice.str2et(time) for time in times_utc]
    states = [spacecraft_state(time, *row[1:]) for time, row in zip(times, events)]
    centers = [row[1] for row in events]
    if centers[-2] == "Earth":
        # Apollo 11 has no recorded late-coast point in the source table.
        # Anchor the approach by integrating backward from its recorded arrival state.
        approach = times[-1] - 6 * 3600
        state = propagate(states[-1] + moon_state(times[-1]), times[-1], approach)
        times.insert(-1, approach)
        states.insert(-1, state - moon_state(approach))
        centers.insert(-1, "Moon")
    sample_times = np.linspace(times[0], times[-1], 721)
    interval = 0
    positions = []
    for time in sample_times:
        while interval < len(times) - 2 and time > times[interval + 1]:
            interval += 1
        start, end = times[interval:interval + 2]
        first, last = states[interval:interval + 2]
        first_body, last_body = centers[interval:interval + 2]
        moon = moon_state(time)[:3]
        if first_body == last_body == "Moon":
            position = interpolate(time, start, end, first, last) + moon
        else:
            if last_body == "Moon":
                last = last + moon_state(end)
            position = interpolate(time, start, end, first, last)
        positions.append(position)
    return display_flight(times_utc[0], times_utc[-1], sample_times, positions)


def acceleration_term(displacement):
    return displacement / np.linalg.norm(displacement)**3


def state_derivative(time, state):
    position = state[:3]
    moon = moon_state(time)[:3]
    sun = spice.spkpos("SUN", time, "J2000", "NONE", "EARTH")[0]
    # Differential third-body terms account for the acceleration of the Earth-centered origin.
    acceleration = (-398601.27 * acceleration_term(position)
                    + 4902.6309 * (acceleration_term(moon - position) - acceleration_term(moon))
                    + 132712440041.3 * (acceleration_term(sun - position) - acceleration_term(sun)))
    return np.concatenate((state[3:], acceleration))


def propagate(state, start, end):
    time = start
    while time != end:
        step = float(np.clip(end - time, -60, 60))
        a = state_derivative(time, state)
        b = state_derivative(time + step/2, state + a*step/2)
        c = state_derivative(time + step/2, state + b*step/2)
        d = state_derivative(time + step, state + c*step)
        state = state + step/6 * (a + 2*b + 2*c + d)
        time += step
    return state


def fit_surveyor_leg(state, start, end, target):
    fitted = state.copy()
    velocity_step = 1e-5
    for _ in range(6):
        arrival = propagate(fitted, start, end)[:3]
        error = arrival - target
        if np.linalg.norm(error) < 0.01:
            if np.linalg.norm(fitted[3:] - state[3:]) > 0.05:
                raise ValueError("Surveyor velocity correction exceeds reconstruction tolerance")
            return fitted
        jacobian = np.column_stack([
            (propagate(fitted + delta, start, end)[:3] - arrival) / velocity_step
            for delta in np.eye(6)[3:] * velocity_step
        ])
        fitted[3:] -= np.linalg.solve(jacobian, error)
    raise ValueError("Surveyor trajectory did not converge")


def export_surveyor():
    spice.lmpool([
        "FRAME_SURVEYOR_MEAN_DATE = 1899999",
        "FRAME_1899999_NAME = 'SURVEYOR_MEAN_DATE'",
        "FRAME_1899999_CLASS = 5",
        "FRAME_1899999_CLASS_ID = 1899999",
        "FRAME_1899999_CENTER = 399",
        "FRAME_1899999_RELATIVE = 'J2000'",
        "FRAME_1899999_DEF_STYLE = 'PARAMETERIZED'",
        "FRAME_1899999_FAMILY = 'MEAN_EQUATOR_AND_EQUINOX_OF_DATE'",
        "FRAME_1899999_PREC_MODEL = 'EARTH_IAU_1976'",
        "FRAME_1899999_ROTATION_STATE = 'ROTATING'",
    ])

    def geocentric(time, position, velocity):
        rotation = spice.pxform("SURVEYOR_MEAN_DATE", "J2000", time)
        return np.concatenate((rotation @ position, rotation @ velocity))

    injection_utc = "1967-04-17T07:38:39.838Z"
    descent_utc = "1967-04-20T00:01:16.700Z"
    injection, midcourse, descent, unbraked = map(spice.str2et, [
        injection_utc, "1967-04-18T05:00:05.000Z", descent_utc, "1967-04-20T00:01:48.158Z",
    ])
    pre = geocentric(injection, [5839.9228, -1730.0102, -2413.5785], [1.8340446, 10.101593, -3.8397087])
    post = geocentric(midcourse, [-152113.39, 111775.36, 43749.888], [-1.3821714, 0.60990978, 0.51919389])
    impact = spice.latrec(1735.7, *np.radians([-23.20032, -2.9760013]))
    impact_j2000 = moon_state(unbraked)[:3] + spice.pxform("IAU_MOON", "J2000", unbraked) @ impact
    before = fit_surveyor_leg(pre, injection, midcourse, post[:3])
    after = fit_surveyor_leg(post, midcourse, unbraked, impact_j2000)
    times = np.linspace(injection, descent, 721)
    positions = []
    previous, state = injection, before
    for time in times:
        if previous < midcourse <= time:
            previous, state = midcourse, after
        state = propagate(state, previous, time)
        positions.append(state[:3])
        previous = time
    altitude = np.linalg.norm(positions[-1] - moon_state(descent)[:3]) - MOON_RADIUS_KM
    if not 65 < altitude < 85:
        raise ValueError(f"Surveyor powered descent start altitude is unexpected: {altitude:.1f} km")
    return display_flight(injection_utc, descent_utc, times, positions)


if __name__ == "__main__":
    kernels, output = map(Path, sys.argv[1:])
    for kernel in ("naif0012.tls", "pck00011.tpc", "de440s.bsp"):
        spice.furnsh(str(kernels / kernel))
    output.mkdir(parents=True, exist_ok=True)
    for number, (range_zero, events) in MISSIONS.items():
        flight = export_flight(range_zero, events)
        (output / f"apollo-{number}-flight.json").write_text(
            json.dumps(flight, separators=(",", ":")) + "\n", encoding="utf-8"
        )
    (output / "surveyor-3-flight.json").write_text(
        json.dumps(export_surveyor(), separators=(",", ":")) + "\n", encoding="utf-8"
    )
