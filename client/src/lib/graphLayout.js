// No physics-simulation dependency is installed, so this computes a simple
// deterministic radial layout instead: each hub type (topic/company/
// collection) gets its own ring, evenly spaced by count, and each question
// node sits at the circular mean angle of the hubs it's connected to, at a
// radius between the innermost and outermost hub rings.

const RING_RADIUS = { topic: 260, company: 420, collection: 580 };
const QUESTION_RADIUS = 340;

export function computeGraphLayout(nodes, edges) {
  const byType = { topic: [], company: [], collection: [], question: [] };
  for (const n of nodes) byType[n.type]?.push(n);

  const angleOf = new Map();
  const positions = new Map();

  for (const type of ['topic', 'company', 'collection']) {
    const list = byType[type];
    list.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(list.length, 1);
      angleOf.set(n.id, angle);
      positions.set(n.id, {
        x: RING_RADIUS[type] * Math.cos(angle),
        y: RING_RADIUS[type] * Math.sin(angle),
      });
    });
  }

  // Build hub-angle lookups per question from edges.
  const hubAnglesByQuestion = new Map();
  for (const e of edges) {
    const [hubId, questionId] = angleOf.has(e.source) ? [e.source, e.target] : [e.target, e.source];
    if (!angleOf.has(hubId)) continue;
    const list = hubAnglesByQuestion.get(questionId) || [];
    list.push(angleOf.get(hubId));
    hubAnglesByQuestion.set(questionId, list);
  }

  byType.question.forEach((n, i) => {
    const angles = hubAnglesByQuestion.get(n.id);
    let angle;
    if (angles?.length) {
      // Circular mean so e.g. angles near 0 and 2π don't average to π.
      const sinSum = angles.reduce((s, a) => s + Math.sin(a), 0);
      const cosSum = angles.reduce((s, a) => s + Math.cos(a), 0);
      angle = Math.atan2(sinSum, cosSum);
    } else {
      angle = (2 * Math.PI * i) / Math.max(byType.question.length, 1);
    }
    // Small deterministic jitter so unconnected/co-angled questions don't stack exactly.
    const jitter = ((i * 37) % 40) - 20;
    positions.set(n.id, {
      x: (QUESTION_RADIUS + jitter) * Math.cos(angle),
      y: (QUESTION_RADIUS + jitter) * Math.sin(angle),
    });
  });

  return nodes.map((n) => ({ ...n, position: positions.get(n.id) || { x: 0, y: 0 } }));
}
