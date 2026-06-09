import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { RecommendationScore } from "../models/recommendationScoreSchema.js";
import { SavedJob } from "../models/savedJobSchema.js";
import { User } from "../models/userSchema.js";

const skillCatalog = [
  { label: "React", aliases: ["react", "react js", "reactjs"], weight: 9 },
  { label: "JavaScript", aliases: ["javascript", "ecmascript"], weight: 8 },
  { label: "TypeScript", aliases: ["typescript", "ts"], weight: 8 },
  { label: "Node.js", aliases: ["node", "node js", "nodejs"], weight: 9 },
  { label: "Express.js", aliases: ["express", "express js", "expressjs"], weight: 8 },
  { label: "MongoDB", aliases: ["mongodb", "mongo", "mongoose"], weight: 8 },
  { label: "SQL", aliases: ["sql", "mysql", "postgresql", "postgres"], weight: 7 },
  { label: "Python", aliases: ["python", "django", "flask"], weight: 7 },
  { label: "Java", aliases: ["java", "spring", "spring boot"], weight: 7 },
  { label: "HTML", aliases: ["html", "html5"], weight: 5 },
  { label: "CSS", aliases: ["css", "css3"], weight: 5 },
  { label: "Tailwind CSS", aliases: ["tailwind", "tailwind css"], weight: 6 },
  { label: "Redux", aliases: ["redux", "redux toolkit"], weight: 6 },
  { label: "REST API", aliases: ["rest", "rest api", "api", "apis"], weight: 7 },
  { label: "JWT Auth", aliases: ["jwt", "json web token", "authentication"], weight: 6 },
  { label: "Testing", aliases: ["testing", "unit test", "integration test"], weight: 6 },
  { label: "Jest", aliases: ["jest", "supertest"], weight: 5 },
  { label: "Docker", aliases: ["docker", "container", "containers"], weight: 6 },
  { label: "Git", aliases: ["git", "github", "version control"], weight: 5 },
  { label: "CI/CD", aliases: ["ci cd", "github actions", "pipeline"], weight: 6 },
  { label: "Redis", aliases: ["redis", "bullmq", "queue"], weight: 5 },
  { label: "Socket.IO", aliases: ["socket io", "socketio", "websocket"], weight: 5 },
  { label: "Cloudinary", aliases: ["cloudinary", "file upload"], weight: 4 },
  { label: "Security", aliases: ["security", "helmet", "rate limiting", "xss", "csrf"], weight: 6 },
  { label: "AWS", aliases: ["aws", "amazon web services"], weight: 6 },
  { label: "Azure", aliases: ["azure", "microsoft azure"], weight: 6 },
  { label: "Next.js", aliases: ["next", "next js", "nextjs"], weight: 7 },
  { label: "Kubernetes", aliases: ["kubernetes", "k8s"], weight: 6 },
];

const stopWords = new Set([
  "and",
  "or",
  "the",
  "a",
  "an",
  "with",
  "for",
  "to",
  "of",
  "in",
  "on",
  "by",
  "from",
  "role",
  "job",
  "developer",
  "engineer",
  "software",
  "full",
  "time",
  "part",
  "internship",
]);

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const clamp = (value, min = 0, max = 100) =>
  Math.min(Math.max(Math.round(Number(value) || 0), min), max);

const unique = (items) => [...new Set(items.filter(Boolean))];

const idToString = (id) => id?.toString?.() || String(id || "");

const containsPhrase = (text, phrase) => {
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase) return false;
  return ` ${text} `.includes(` ${normalizedPhrase} `);
};

const extractSkills = (text = "") => {
  const normalizedText = normalizeText(text);
  return skillCatalog.filter((skill) =>
    skill.aliases.some((alias) => containsPhrase(normalizedText, alias))
  );
};

const tokenize = (text = "") =>
  unique(
    normalizeText(text)
      .split(" ")
      .filter((token) => token.length > 2 && !stopWords.has(token))
  );

const calculateSkillSignal = ({ candidateText, jobText, maxPoints = 55 }) => {
  const candidateSkills = extractSkills(candidateText);
  const jobSkills = extractSkills(jobText);
  const candidateSkillLabels = new Set(candidateSkills.map((skill) => skill.label));

  const matchingSkills = jobSkills
    .filter((skill) => candidateSkillLabels.has(skill.label))
    .map((skill) => skill.label);
  const missingSkills = jobSkills
    .filter((skill) => !candidateSkillLabels.has(skill.label))
    .map((skill) => skill.label);

  const totalWeight = jobSkills.reduce((sum, skill) => sum + skill.weight, 0);
  const matchedWeight = jobSkills
    .filter((skill) => candidateSkillLabels.has(skill.label))
    .reduce((sum, skill) => sum + skill.weight, 0);

  const fallbackScore = Math.min(candidateSkills.length * 3, maxPoints * 0.45);
  const points = totalWeight
    ? (matchedWeight / totalWeight) * maxPoints
    : fallbackScore;

  return {
    points: clamp(points, 0, maxPoints),
    candidateSkills: candidateSkills.map((skill) => skill.label),
    jobSkills: jobSkills.map((skill) => skill.label),
    matchingSkills,
    missingSkills,
  };
};

const textOverlapScore = ({ sourceText, targetText, maxPoints }) => {
  const sourceTokens = new Set(tokenize(sourceText));
  const targetTokens = tokenize(targetText);
  if (!sourceTokens.size || !targetTokens.length) return 0;

  const matches = targetTokens.filter((token) => sourceTokens.has(token)).length;
  return clamp((matches / targetTokens.length) * maxPoints, 0, maxPoints);
};

const profileCompletenessScore = (user, maxPoints = 8) => {
  const profile = user?.profile || {};
  const signals = [
    profile.headline,
    profile.skills,
    profile.experience,
    profile.education,
    profile.location,
    user?.resume?.url,
    user?.resumeText,
  ];
  const completed = signals.filter(Boolean).length;
  return clamp((completed / signals.length) * maxPoints, 0, maxPoints);
};

const locationScore = ({ candidateLocation = "", job, application, maxPoints }) => {
  const candidateText = normalizeText(
    [candidateLocation, application?.address].filter(Boolean).join(" ")
  );
  const jobLocationText = normalizeText(
    [job?.city, job?.country, job?.location].filter(Boolean).join(" ")
  );

  if (!candidateText || !jobLocationText) return 0;
  if (containsPhrase(jobLocationText, "remote")) return clamp(maxPoints * 0.75, 0, maxPoints);
  if (job.city && containsPhrase(candidateText, job.city)) return maxPoints;
  if (job.country && containsPhrase(candidateText, job.country)) return clamp(maxPoints * 0.6, 0, maxPoints);
  return 0;
};

const freshnessScore = (date, maxPoints) => {
  if (!date) return 0;
  const ageInDays = (Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000);
  if (ageInDays <= 7) return maxPoints;
  if (ageInDays <= 30) return clamp(maxPoints * 0.7, 0, maxPoints);
  if (ageInDays <= 90) return clamp(maxPoints * 0.4, 0, maxPoints);
  return 1;
};

const salaryScore = (job) => {
  if (job?.fixedSalary || (job?.salaryFrom && job?.salaryTo)) return 4;
  return 1;
};

const applicationQualityScore = (application) => {
  const coverLetterLength = normalizeText(application?.coverLetter).length;
  const coverLetterScore =
    coverLetterLength >= 250 ? 5 : coverLetterLength >= 120 ? 3 : coverLetterLength ? 1 : 0;
  const statusScore =
    application?.status === "Shortlisted"
      ? 5
      : application?.status === "Pending"
        ? 3
        : application?.status === "Rejected"
          ? 0
          : 1;

  return clamp(coverLetterScore + statusScore, 0, 10);
};

const confidenceFor = ({ candidateText, jobSkills, matchingSkills }) => {
  const richProfile = normalizeText(candidateText).length >= 250;
  const enoughJobSignals = jobSkills.length >= 3;
  const enoughMatches = matchingSkills.length >= 2;

  if (richProfile && enoughJobSignals && enoughMatches) return "High";
  if ((richProfile && enoughMatches) || matchingSkills.length >= 1) return "Medium";
  return "Low";
};

const buildCandidateText = (user) =>
  [
    user?.profile?.headline,
    user?.profile?.skills,
    user?.profile?.experience,
    user?.profile?.education,
    user?.profile?.location,
    user?.resumeText,
  ]
    .filter(Boolean)
    .join(" ");

const buildJobText = (job) =>
  [
    job?.title,
    job?.category,
    job?.description,
    job?.jobType,
    job?.city,
    job?.country,
    job?.location,
  ]
    .filter(Boolean)
    .join(" ");

const buildReasons = ({
  matchingSkills,
  missingSkills,
  confidence,
  locationPoints,
  savedByCandidate,
  alreadyApplied,
  applicationStatus,
}) => {
  const reasons = [];

  if (matchingSkills.length) {
    reasons.push(`Matches ${matchingSkills.slice(0, 4).join(", ")}.`);
  } else {
    reasons.push("Limited direct skill match found.");
  }

  if (missingSkills.length) {
    reasons.push(`Missing or weak signals: ${missingSkills.slice(0, 4).join(", ")}.`);
  }

  if (locationPoints > 0) {
    reasons.push("Location signal aligns with the profile or application.");
  }

  if (savedByCandidate) {
    reasons.push("Candidate saved this job, showing explicit interest.");
  }

  if (alreadyApplied) {
    reasons.push("Candidate already applied to this job.");
  }

  if (applicationStatus) {
    reasons.push(`Current application status: ${applicationStatus}.`);
  }

  reasons.push(`${confidence} confidence based on available profile and job data.`);
  return reasons;
};

const persistRecommendation = ({
  type,
  user,
  job,
  application,
  score,
  matchingSkills,
  missingSkills,
  reasons,
  scoreBreakdown,
  confidence,
}) =>
  RecommendationScore.findOneAndUpdate(
    {
      type,
      user,
      job,
      application,
    },
    {
      score,
      matchingSkills,
      missingSkills,
      reasons,
      scoreBreakdown,
      confidence,
      calculatedAt: new Date(),
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

const scoreJobForCandidate = ({ user, job, appliedJobIds, savedJobIds }) => {
  const candidateText = buildCandidateText(user);
  const jobText = buildJobText(job);
  const skillSignal = calculateSkillSignal({ candidateText, jobText, maxPoints: 55 });
  const titleCategoryPoints = textOverlapScore({
    sourceText: candidateText,
    targetText: [job.title, job.category].join(" "),
    maxPoints: 12,
  });
  const locationPoints = locationScore({
    candidateLocation: user?.profile?.location,
    job,
    maxPoints: 8,
  });
  const jobTypePoints = containsPhrase(normalizeText(candidateText), job.jobType)
    ? 4
    : 2;
  const savedByCandidate = savedJobIds.has(idToString(job._id));
  const alreadyApplied = appliedJobIds.has(idToString(job._id));

  const scoreBreakdown = {
    skills: skillSignal.points,
    titleCategory: titleCategoryPoints,
    location: locationPoints,
    jobType: jobTypePoints,
    salary: salaryScore(job),
    freshness: freshnessScore(job.jobPostedOn, 5),
    profileCompleteness: profileCompletenessScore(user, 8),
    savedInterest: savedByCandidate ? 4 : 0,
    alreadyAppliedPenalty: alreadyApplied ? -18 : 0,
  };

  const rawScore = Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0);
  const confidence = confidenceFor({
    candidateText,
    jobSkills: skillSignal.jobSkills,
    matchingSkills: skillSignal.matchingSkills,
  });
  const score = clamp(rawScore, 0, 100);

  return {
    job,
    score,
    confidence,
    scoreBreakdown,
    alreadyApplied,
    savedByCandidate,
    matchingSkills: skillSignal.matchingSkills,
    missingSkills: skillSignal.missingSkills,
    candidateSkills: skillSignal.candidateSkills,
    jobSkills: skillSignal.jobSkills,
    reasons: buildReasons({
      matchingSkills: skillSignal.matchingSkills,
      missingSkills: skillSignal.missingSkills,
      confidence,
      locationPoints,
      savedByCandidate,
      alreadyApplied,
    }),
  };
};

const scoreCandidateForJob = ({ job, application, savedJobIds }) => {
  const candidate = application.applicantID?.user;
  const candidateText = unique([
    buildCandidateText(candidate),
    application.resumeText,
    application.coverLetter,
    application.address,
  ]).join(" ");
  const jobText = buildJobText(job);
  const skillSignal = calculateSkillSignal({ candidateText, jobText, maxPoints: 55 });
  const textRelevancePoints = textOverlapScore({
    sourceText: candidateText,
    targetText: [job.title, job.category, job.description].join(" "),
    maxPoints: 10,
  });
  const locationPoints = locationScore({
    candidateLocation: candidate?.profile?.location,
    application,
    job,
    maxPoints: 5,
  });
  const savedByCandidate = savedJobIds.has(idToString(application.applicantID?.user?._id));
  const resumeEvidencePoints = normalizeText(application.resumeText).length >= 250 ? 5 : 1;

  const scoreBreakdown = {
    skills: skillSignal.points,
    textRelevance: textRelevancePoints,
    applicationQuality: applicationQualityScore(application),
    profileCompleteness: profileCompletenessScore(candidate, 8),
    location: locationPoints,
    savedInterest: savedByCandidate ? 3 : 0,
    recency: freshnessScore(application.appliedAt, 4),
    resumeEvidence: resumeEvidencePoints,
  };

  const rawScore = Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0);
  const confidence = confidenceFor({
    candidateText,
    jobSkills: skillSignal.jobSkills,
    matchingSkills: skillSignal.matchingSkills,
  });
  const score = clamp(rawScore, 0, 100);

  return {
    application,
    candidate,
    score,
    confidence,
    scoreBreakdown,
    savedByCandidate,
    matchingSkills: skillSignal.matchingSkills,
    missingSkills: skillSignal.missingSkills,
    candidateSkills: skillSignal.candidateSkills,
    jobSkills: skillSignal.jobSkills,
    reasons: buildReasons({
      matchingSkills: skillSignal.matchingSkills,
      missingSkills: skillSignal.missingSkills,
      confidence,
      locationPoints,
      savedByCandidate,
      applicationStatus: application.status,
    }),
  };
};

export const recommendJobsForCandidate = async (userId) => {
  const user = await User.findById(userId).select("+resumeText");
  const [applications, savedJobs, jobs] = await Promise.all([
    Application.find({ "applicantID.user": userId }).select("jobID"),
    SavedJob.find({ user: userId }).select("job"),
    Job.find({ expired: false }).sort({ jobPostedOn: -1 }).limit(75),
  ]);

  const appliedJobIds = new Set(applications.map((application) => idToString(application.jobID)));
  const savedJobIds = new Set(savedJobs.map((savedJob) => idToString(savedJob.job)));

  const recommendations = jobs
    .map((job) => scoreJobForCandidate({ user, job, appliedJobIds, savedJobIds }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  await Promise.all(
    recommendations.map((recommendation) =>
      persistRecommendation({
        type: "JOB_FOR_CANDIDATE",
        user: userId,
        job: recommendation.job._id,
        score: recommendation.score,
        matchingSkills: recommendation.matchingSkills,
        missingSkills: recommendation.missingSkills,
        reasons: recommendation.reasons,
        scoreBreakdown: recommendation.scoreBreakdown,
        confidence: recommendation.confidence,
      })
    )
  );

  return recommendations;
};

export const recommendCandidatesForJob = async ({ jobId, employerId }) => {
  const job = await Job.findOne({ _id: jobId, postedBy: employerId });
  if (!job) return null;

  const applications = await Application.find({ jobID: jobId })
    .select("+resumeText")
    .populate({
      path: "applicantID.user",
      select: "name email phone profile resume +resumeText",
    })
    .sort({ appliedAt: -1 });
  const savedJobs = await SavedJob.find({ job: jobId }).select("user");
  const savedCandidateIds = new Set(savedJobs.map((savedJob) => idToString(savedJob.user)));

  const recommendations = applications
    .map((application) =>
      scoreCandidateForJob({ job, application, savedJobIds: savedCandidateIds })
    )
    .sort((a, b) => b.score - a.score);

  await Promise.all(
    recommendations.map((recommendation) =>
      persistRecommendation({
        type: "CANDIDATE_FOR_JOB",
        user: recommendation.candidate?._id,
        job: jobId,
        application: recommendation.application._id,
        score: recommendation.score,
        matchingSkills: recommendation.matchingSkills,
        missingSkills: recommendation.missingSkills,
        reasons: recommendation.reasons,
        scoreBreakdown: recommendation.scoreBreakdown,
        confidence: recommendation.confidence,
      })
    )
  );

  return recommendations;
};
