import 'dotenv/config';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Question from '../models/Question.js';
import Activity from '../models/Activity.js';
import mongoose from 'mongoose';

const DEMO_EMAIL = 'demo@interviewvault.dev';
const DEMO_PASSWORD = 'password123';

const sampleQuestions = [
  {
    title: 'Two Sum',
    description: 'Given an array of integers, return indices of the two numbers that add up to a target.',
    company: 'Amazon',
    experienceLevel: 'Junior',
    round: 'Online Assessment',
    difficulty: 'Easy',
    topic: 'DSA',
    subtopic: 'Arrays & Hashing',
    tags: ['array', 'hash-map'],
    solved: true,
    favorite: true,
    personalRating: 4,
    codeExamples: [
      { language: 'javascript', code: 'function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}' },
      { language: 'python', code: 'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return []' },
    ],
    explanation: {
      detailed: 'Use a hash map to store each value and its index while scanning once. For each element, check whether its complement has already been seen.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      edgeCases: 'Duplicate values, no valid pair exists, negative numbers.',
      commonMistakes: 'Using nested loops (O(n^2)) or forgetting to handle the case where an element pairs with itself.',
      interviewTips: 'Clarify whether the array is sorted and whether one solution is guaranteed.',
      alternativeSolutions: 'Sort + two pointers works in O(n log n) if index order does not matter.',
    },
  },
  {
    title: 'Design a Rate Limiter',
    description: 'Design a distributed rate limiter for an API gateway.',
    company: 'Google',
    experienceLevel: 'Senior',
    round: 'System Design',
    difficulty: 'Hard',
    topic: 'System Design',
    subtopic: 'Scalability',
    tags: ['system-design', 'distributed-systems'],
    solved: false,
    favorite: false,
    personalRating: 0,
  },
  {
    title: 'Explain the Event Loop',
    description: 'Walk through how the JavaScript event loop, microtasks, and macrotasks work.',
    company: 'Meta',
    experienceLevel: 'Mid',
    round: 'Technical',
    difficulty: 'Medium',
    topic: 'JavaScript',
    subtopic: 'Runtime',
    tags: ['javascript', 'concepts'],
    solved: true,
    favorite: false,
    personalRating: 5,
  },
  {
    title: 'LRU Cache',
    description: 'Implement a Least Recently Used cache with O(1) get and put.',
    company: 'Microsoft',
    experienceLevel: 'Mid',
    round: 'Technical',
    difficulty: 'Medium',
    topic: 'DSA',
    subtopic: 'Design',
    tags: ['linked-list', 'hash-map', 'design'],
    solved: true,
    favorite: true,
    personalRating: 4,
  },
  {
    title: 'Explain Indexing in MongoDB',
    description: 'How do indexes work in MongoDB and when would you use a compound index?',
    company: 'Uber',
    experienceLevel: 'Mid',
    round: 'Technical',
    difficulty: 'Medium',
    topic: 'MongoDB',
    subtopic: 'Performance',
    tags: ['mongodb', 'database'],
    solved: false,
    favorite: false,
    personalRating: 0,
  },
  {
    title: 'Merge Intervals',
    description: 'Given a collection of intervals, merge all overlapping intervals.',
    company: 'Adobe',
    experienceLevel: 'Junior',
    round: 'Online Assessment',
    difficulty: 'Medium',
    topic: 'DSA',
    subtopic: 'Arrays & Sorting',
    tags: ['array', 'sorting'],
    solved: false,
    favorite: false,
    personalRating: 0,
  },
];

async function seed() {
  await connectDB();

  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({ name: 'Demo User', email: DEMO_EMAIL, password: DEMO_PASSWORD });
    console.log(`[seed] created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  } else {
    console.log('[seed] demo user already exists, reusing it');
  }

  await Question.deleteMany({ owner: user._id });
  await Activity.deleteMany({ owner: user._id });

  const docs = await Question.insertMany(
    sampleQuestions.map((q) => ({ ...q, owner: user._id }))
  );
  console.log(`[seed] inserted ${docs.length} sample questions`);

  // Backfill a few days of activity so the dashboard heatmap isn't empty.
  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    await Activity.create({
      owner: user._id,
      date: key,
      count: Math.max(1, 4 - (i % 4)),
      events: [{ type: 'solved', title: 'Seeded activity', at: d }],
    });
  }
  console.log('[seed] backfilled 10 days of activity for the heatmap');

  await mongoose.disconnect();
  console.log('[seed] done');
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
