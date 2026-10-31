// Decorative background stars. Uses a fixed seed so server and client render the same dots.

const colors = ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFD166", "#3DD6F5"];

function makeStars(count: number) {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, () => ({
    x: rnd() * 100,
    y: rnd() * 100,
    r: 0.4 + rnd() * 1.1,
    c: colors[Math.floor(rnd() * colors.length)],
    o: 0.35 + rnd() * 0.6,
    d: rnd() * 4,
  }));
}

const stars = makeStars(120);

export default function Starfield() {
  return (
    <svg className="starfield" aria-hidden="true" width="100%" height="100%">
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={`${s.x}%`}
          cy={`${s.y}%`}
          r={s.r}
          fill={s.c}
          opacity={s.o}
          style={{ animationDelay: `${s.d}s` }}
        />
      ))}
    </svg>
  );
}
