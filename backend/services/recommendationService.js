import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { RecommendationScore } from "../models/recommendationScoreSchema.js";
import { User } from "../models/userSchema.js";

const skillKeywords = [
  "react",
  "javascript",
  "typescript",
  "node",
  "express",
  "mongodb",
  "sql",
  "python",
  "java",
  "docker",
  "aws",
  "azure",
  "git",
  "api",
  "rest",
  "redux",
  "tailwind",
  "testing",
  "jest",
  "ci",
  "cd",
  "redis",
  "socket",
  "cloudinary",
  "security",
];

const normalize = (value = "") => String(value).toLowerCase();

const extractSkills = (text = "") => {
  const normalizedText = normalize(text);
  return skillKeywords.filter((skill) => normalizedText.includes(skill));
};

const unique = (items) => [...new Set(items.filter(Boolean))];

const scoreMatch = ({ candidateText, jobText }) => {
  const candidateSkills = extractSkills(candidateText);
  const jobSkills = extractSkills(jobText);
  const matchingSkills = jobSkills.filter((skill) => candidateSkills.includes(skill));
  const missingSkills = jobSkills.filter((skill) => !candidateSkills.includes(skill));
  const keywordScore =
    jobSkills.length > 0 ? (matchingSkills.length / jobSkills.length) * 70 : 35;
  const textBonus = matchingSkills.length ? 20 : 0;
  const profileBonus = candidateSkills.length ? 10 : 0;
  const score = Math.min(Math.round(keywordScore + textBonus + profileBonus), 100);

  return {
    score,
    matchingSkills,
    missingSkills,
    reasons: [
      matchingSkills.length
        ? `Matches ${matchingSkills.length} role keyword(s).`
        : "Limited direct keyword match found.",
      candidateSkills.length
        ? "Candidate profile/resume contains searchable skills."
        : "Candidate should add more skills to profile or resume.",
    ],
  };
};

const buildCandidateText = (user) =>
  [
    user?.profile?.headline,
    user?.profile?.skills,
    user?.profile?.experience,
    user?.profile?.education,
    user?.resumeText,
  ]
    .filter(Boolean)
    .join(" ");

const buildJobText = (job) =>
  [job.title, job.category, job.description, job.jobType, job.city, job.country]
    .filter(Boolean)
    .join(" ");

export const recommendJobsForCandidate = async (userId) => {
  const user = await User.findById(userId).select("+resumeText");
  const candidateText = buildCandidateText(user);
  const jobs = await Job.find({ expired: false }).sort({ jobPostedOn: -1 }).limit(50);

  const recommendations = jobs
    .map((job) => ({
      job,
      ...scoreMatch({ candidateText, jobText: buildJobText(job) }),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  await Promise.all(
    recommendations.map((recommendation) =>
      RecommendationScore.findOneAndUpdate(
        {
          type: "JOB_FOR_CANDIDATE",
          user: userId,
          job: recommendation.job._id,
        },
        {
          score: recommendation.score,
          matchingSkills: recommendation.matchingSkills,
          missingSkills: recommendation.missingSkills,
          reasons: recommendation.reasons,
          calculatedAt: new Date(),
        },
        { upsert: true, setDefaultsOnInsert: true }
      )
    )
  );

  return recommendations;
};

export const recommendCandidatesForJob = async ({ jobId, employerId }) => {
  const job = await Job.findOne({ _id: jobId, postedBy: employerId });
  if (!job) return null;

  const applications = await Application.find({ jobID: jobId })
    .select("+resumeText")
    .populate("applicantID.user", "name email phone profile resume resumeText")
    .sort({ appliedAt: -1 });

  const recommendations = applications
    .map((application) => {
      const user = application.applicantID?.user;
      const candidateText = unique([
        buildCandidateText(user),
        application.resumeText,
        application.coverLetter,
      ]).join(" ");

      return {
        application,
        candidate: user,
        ...scoreMatch({ candidateText, jobText: buildJobText(job) }),
      };
    })
    .sort((a, b) => b.score - a.score);

  await Promise.all(
    recommendations.map((recommendation) =>
      RecommendationScore.findOneAndUpdate(
        {
          type: "CANDIDATE_FOR_JOB",
          user: recommendation.candidate?._id,
          job: jobId,
          application: recommendation.application._id,
        },
        {
          score: recommendation.score,
          matchingSkills: recommendation.matchingSkills,
          missingSkills: recommendation.missingSkills,
          reasons: recommendation.reasons,
          calculatedAt: new Date(),
        },
        { upsert: true, setDefaultsOnInsert: true }
      )
    )
  );

  return recommendations;
};
