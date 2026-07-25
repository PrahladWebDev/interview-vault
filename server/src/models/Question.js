import mongoose from 'mongoose';

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
export const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'];
export const EXPERIENCE_LEVELS = ['Intern', 'Junior', 'Mid', 'Senior', 'Staff+'];
export const ROUNDS = ['Online Assessment', 'Phone Screen', 'Technical', 'System Design', 'Hiring Manager', 'Bar Raiser'];

// Spaced repetition intervals in days, in order.
export const REVISION_INTERVALS_DAYS = [1, 3, 7, 15, 30, 60, 90];

const codeExampleSchema = new mongoose.Schema(
  {
    language: { type: String, enum: LANGUAGES, required: true },
    code: { type: String, default: '' },
  },
  { _id: false }
);

const resourceLinkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '' },

    company: { type: String, trim: true, default: '', index: true },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, default: 'Mid' },
    round: { type: String, enum: ROUNDS, default: 'Technical' },
    difficulty: { type: String, enum: DIFFICULTIES, default: 'Medium', index: true },
    topic: { type: String, trim: true, default: '', index: true },
    subtopic: { type: String, trim: true, default: '' },
    tags: [{ type: String, trim: true, index: true }],

    favorite: { type: Boolean, default: false, index: true },
    solved: { type: Boolean, default: false, index: true },
    personalRating: { type: Number, min: 0, max: 5, default: 0 },

    codeExamples: [codeExampleSchema],

    explanation: {
      detailed: { type: String, default: '' },
      timeComplexity: { type: String, default: '' },
      spaceComplexity: { type: String, default: '' },
      edgeCases: { type: String, default: '' },
      commonMistakes: { type: String, default: '' },
      interviewTips: { type: String, default: '' },
      alternativeSolutions: { type: String, default: '' },
    },

    resources: {
      youtube: [resourceLinkSchema],
      blog: [resourceLinkSchema],
      docs: [resourceLinkSchema],
      pdf: [resourceLinkSchema],
    },

    notes: { type: String, default: '' },

    // Free-form written answer for theory/conceptual questions (e.g. "What is JS?"),
    // separate from code explanation and personal notes.
    theoryAnswer: { type: String, default: '' },

    // Spaced repetition state
    revision: {
      stage: { type: Number, default: 0 }, // index into REVISION_INTERVALS_DAYS
      lastReviewedAt: { type: Date, default: null },
      nextRevisionDate: { type: Date, default: null },
      status: {
        type: String,
        enum: ['new', 'learning', 'due', 'mastered'],
        default: 'new',
      },
    },

    solvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

questionSchema.index({ title: 'text', description: 'text', notes: 'text', theoryAnswer: 'text', tags: 'text' });
questionSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model('Question', questionSchema);