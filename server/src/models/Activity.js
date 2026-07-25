import mongoose from 'mongoose';

// One document per (user, calendar day) that had any solving/review activity.
// Powers the GitHub-style heatmap, streaks, and recent activity feed.
const activitySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD' in server-local time
    count: { type: Number, default: 0 },
    events: [
      {
        type: { type: String, enum: ['solved', 'reviewed', 'added', 'updated', 'imported'] },
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        title: String,
        remembered: { type: Boolean, default: null }, // only set for 'reviewed' events
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

activitySchema.index({ owner: 1, date: 1 }, { unique: true });

export default mongoose.model('Activity', activitySchema);
