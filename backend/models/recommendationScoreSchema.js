import mongoose from "mongoose";

const recommendationScoreSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["JOB_FOR_CANDIDATE", "CANDIDATE_FOR_JOB"],
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    index: true,
  },
  job: {
    type: mongoose.Schema.ObjectId,
    ref: "Job",
    index: true,
  },
  application: {
    type: mongoose.Schema.ObjectId,
    ref: "Application",
    index: true,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  reasons: {
    type: [String],
    default: [],
  },
  matchingSkills: {
    type: [String],
    default: [],
  },
  missingSkills: {
    type: [String],
    default: [],
  },
  calculatedAt: {
    type: Date,
    default: Date.now,
  },
});

recommendationScoreSchema.index(
  { type: 1, user: 1, job: 1, application: 1 },
  { unique: true }
);

export const RecommendationScore = mongoose.model(
  "RecommendationScore",
  recommendationScoreSchema
);
