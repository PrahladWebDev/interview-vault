import { motion } from 'framer-motion';

// A quiet drifting node-graph in the background — a nod to the app's
// knowledge-graph identity, kept subtle so it doesn't compete with the form.
const NODES = [
  { x: 60, y: 80 }, { x: 220, y: 40 }, { x: 340, y: 140 }, { x: 120, y: 220 },
  { x: 420, y: 260 }, { x: 260, y: 320 }, { x: 500, y: 90 }, { x: 40, y: 340 },
];
const EDGES = [[0,1],[1,2],[2,4],[0,3],[3,5],[4,6],[3,7],[5,6]];

export default function AuthShell({ children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-4">
      <div className="pointer-events-none absolute inset-0 bg-glow-radial" />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]"
        viewBox="0 0 560 400"
        preserveAspectRatio="xMidYMid slice"
      >
        {EDGES.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            stroke="url(#edge-gradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: i * 0.08, ease: 'easeInOut' }}
          />
        ))}
        {NODES.map((n, i) => (
          <motion.circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={4}
            fill={i % 2 === 0 ? '#5B8DEF' : '#A855F7'}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
          />
        ))}
        <defs>
          <linearGradient id="edge-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5B8DEF" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
