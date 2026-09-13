"use client";

/* Blobatar: avatar blob determinista estilo
   blobcast — la forma y colores se derivan del
   correo/ID del usuario, así siempre es el mismo
   para cada persona, sin almacenar nada. */

function hashString(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Blob cerrado suave (Catmull-Rom → Bézier) */
function blobPath(rand: () => number): string {
  const n = 8;
  const pts: Array<[number, number]> = [];

  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = 30 + rand() * 14;
    pts.push([50 + Math.cos(angle) * r, 50 + Math.sin(angle) * r]);
  }

  let d = "";

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];

    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;

    if (i === 0) {
      d += `M ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`;
    }

    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }

  return d + " Z";
}

export default function BlobAvatar({
  seed,
  size = 32,
  className = "",
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const seedNum = hashString(seed || "sportcrz");
  const rand = mulberry32(seedNum);

  const d = blobPath(rand);

  /* Colores armónicos derivados del mismo seed */
  const h1 = Math.floor(rand() * 360);
  const h2 = (h1 + 40 + Math.floor(rand() * 110)) % 360;
  const c1 = `hsl(${h1} 72% 56%)`;
  const c2 = `hsl(${h2} 78% 64%)`;

  const gid = `blob-${seedNum.toString(36)}`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`blobatar ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      <path className="blobatar-blob" d={d} fill={`url(#${gid})`} />
    </svg>
  );
}
