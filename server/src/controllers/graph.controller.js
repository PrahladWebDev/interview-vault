import Question from '../models/Question.js';
import Collection from '../models/Collection.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Builds a graph where questions are the primary nodes and topics/companies/
// collections are "hub" nodes they connect through. A direct question-to-
// question graph on shared topic/company would produce O(n^2) edges once a
// vault has more than a few dozen questions per topic, so hub nodes keep the
// edge count linear while still visually clustering related questions.
export const getGraph = asyncHandler(async (req, res) => {
  const owner = req.user._id;

  const [questions, collections] = await Promise.all([
    Question.find({ owner }).select('title topic company difficulty solved favorite'),
    Collection.find({ owner }).select('name color questions'),
  ]);

  const nodes = [];
  const edges = [];
  const topicIds = new Map();
  const companyIds = new Map();

  for (const q of questions) {
    nodes.push({
      id: `question:${q._id}`,
      type: 'question',
      label: q.title,
      difficulty: q.difficulty,
      solved: q.solved,
      favorite: q.favorite,
      refId: q._id,
    });

    if (q.topic) {
      const topicNodeId = `topic:${q.topic}`;
      if (!topicIds.has(q.topic)) {
        topicIds.set(q.topic, topicNodeId);
        nodes.push({ id: topicNodeId, type: 'topic', label: q.topic });
      }
      edges.push({
        id: `e:${topicNodeId}:${q._id}`,
        source: topicNodeId,
        target: `question:${q._id}`,
        kind: 'topic',
      });
    }

    if (q.company) {
      const companyNodeId = `company:${q.company}`;
      if (!companyIds.has(q.company)) {
        companyIds.set(q.company, companyNodeId);
        nodes.push({ id: companyNodeId, type: 'company', label: q.company });
      }
      edges.push({
        id: `e:${companyNodeId}:${q._id}`,
        source: companyNodeId,
        target: `question:${q._id}`,
        kind: 'company',
      });
    }
  }

  for (const c of collections) {
    const collectionNodeId = `collection:${c._id}`;
    nodes.push({ id: collectionNodeId, type: 'collection', label: c.name, color: c.color });
    for (const qId of c.questions) {
      edges.push({
        id: `e:${collectionNodeId}:${qId}`,
        source: collectionNodeId,
        target: `question:${qId}`,
        kind: 'collection',
      });
    }
  }

  res.json({ success: true, nodes, edges });
});
