import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    color: { type: String, default: '#6366F1', trim: true },

    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  },
  { timestamps: true }
);

collectionSchema.index({ owner: 1, name: 1 }, { unique: true });

export default mongoose.model('Collection', collectionSchema);
