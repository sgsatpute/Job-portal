import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";

const MAX_FIELD_LENGTH = 1400;

const REQUIRED_RESPONSE_KEYS = [
  "summary",
  "matchScore",
  "strengths",
  "gaps",
  "nextSteps",
  "resumeTips",
  "interviewQuestions",
];

const normalizeText = (value, fallback = "") =>
  String(value || fallback)
    .trim()
    .slice(0, MAX_FIELD_LENGTH);

const splitSkills = (value) =>
  normalizeText(value)
    .split(/[,|\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 20);

const keywordSet = (value) =>
  new Set(
    normalizeText(value)
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
  );

const buildSmartFallback = (context) => {
  const skillList = splitSkills(context.skills);
  const jobKeywords = keywordSet(
    [
      context.targetRole,
      context.jobTitle,
      context.jobCategory,
      context.jobDescription,
    ].join(" ")
  );
  const skillKeywords = keywordSet(skillList.join(" "));
  const matchedSkills = skillList.filter((skill) =>
    [...keywordSet(skill)].some((word) => jobKeywords.has(word))
  );
  const priorityKeywords = [
    ...jobKeywords,
  ]
    .filter(
      (word) =>
        !skillKeywords.has(word) &&
        ![
          "job",
          "role",
          "work",
          "with",
          "for",
          "and",
          "the",
          "this",
          "that",
          "from",
        ].includes(word)
    )
    .slice(0, 6);
  const baseScore = Math.min(
    88,
    Math.max(42, 45 + matchedSkills.length * 8 + skillList.length * 2)
  );

  return {
    summary: `You are targeting ${context.targetRole || context.jobTitle || "this role"}. Your current profile shows ${skillList.length || "some"} listed skill${skillList.length === 1 ? "" : "s"}. Focus on proving the most relevant skills with projects, measurable outcomes, and a concise resume summary.`,
    matchScore: baseScore,
    strengths:
      matchedSkills.length > 0
        ? matchedSkills.slice(0, 4)
        : [
            "Clear role interest",
            "Profile can be shaped toward this opening",
            "Room to show project-based evidence",
          ],
    gaps:
      priorityKeywords.length > 0
        ? priorityKeywords.map((word) => `Add evidence for ${word}`)
        : [
            "Add more role-specific keywords",
            "Mention measurable project outcomes",
            "Show tools, frameworks, and deployment experience",
          ],
    nextSteps: [
      "Rewrite your resume summary for the exact target role.",
      "Add 2-3 projects that prove the strongest required skills.",
      "Prepare short answers for why you are a fit for this company and role.",
      "Apply only after your resume includes the role title and matching skills.",
    ],
    resumeTips: [
      "Keep the resume to one page if you are a fresher or early-career candidate.",
      "Use bullet points with action, technology, and result.",
      "Put the most relevant project near the top.",
    ],
    interviewQuestions: [
      `Why are you interested in ${context.targetRole || context.jobTitle || "this role"}?`,
      "Which project best proves your fit for this job?",
      "What technical skill do you need to improve for this role?",
    ],
  };
};

const extractOpenAIText = (payload) => {
  if (payload?.output_text) return payload.output_text;

  return (payload?.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("\n")
    .trim();
};

const parseJsonResponse = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw error;
    return JSON.parse(match[0]);
  }
};

const isValidAdvice = (value) =>
  value &&
  REQUIRED_RESPONSE_KEYS.every((key) => Object.prototype.hasOwnProperty.call(value, key));

const callOpenAI = async (context) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions:
        "You are an expert Indian placement and career coach for a MERN job portal. Return only valid JSON with keys: summary string, matchScore number from 0 to 100, strengths string array, gaps string array, nextSteps string array, resumeTips string array, interviewQuestions string array. Be specific, practical, and concise.",
      input: JSON.stringify(context),
      max_output_tokens: 900,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI returned ${response.status}`);
  }

  const payload = await response.json();
  const text = extractOpenAIText(payload);
  const parsed = parseJsonResponse(text);

  if (!isValidAdvice(parsed)) {
    throw new Error("OpenAI response did not match the expected advice shape.");
  }

  return parsed;
};

export const generateCareerAdvice = catchAsyncErrors(async (req, res, next) => {
  const context = {
    userRole: req.user.role,
    userName: req.user.name,
    profileHeadline: normalizeText(req.user.profile?.headline),
    profileLocation: normalizeText(req.user.profile?.location),
    targetRole: normalizeText(req.body.targetRole),
    skills: normalizeText(req.body.skills),
    experience: normalizeText(req.body.experience),
    goal: normalizeText(req.body.goal),
    jobTitle: normalizeText(req.body.jobTitle),
    jobCategory: normalizeText(req.body.jobCategory),
    jobType: normalizeText(req.body.jobType),
    jobDescription: normalizeText(req.body.jobDescription),
    jobLocation: normalizeText(req.body.jobLocation),
    salary: normalizeText(req.body.salary),
  };

  if (!context.targetRole && !context.jobTitle) {
    return next(new ErrorHandler("Please enter a target role or select a job.", 400));
  }

  if (!context.skills && !context.experience) {
    return next(
      new ErrorHandler("Please add at least your skills or experience.", 400)
    );
  }

  const fallbackAdvice = buildSmartFallback(context);
  let advice = fallbackAdvice;
  let provider = "smart-fallback";
  let warning = "";

  try {
    const openAIAdvice = await callOpenAI(context);
    if (openAIAdvice) {
      advice = {
        ...fallbackAdvice,
        ...openAIAdvice,
        matchScore: Math.min(Math.max(Number(openAIAdvice.matchScore) || 0, 0), 100),
      };
      provider = "openai";
    } else {
      warning =
        "OPENAI_API_KEY is not configured, so JobPortal used the built-in smart advisor.";
    }
  } catch (error) {
    warning =
      "AI provider was unavailable, so JobPortal used the built-in smart advisor.";
  }

  res.status(200).json({
    success: true,
    provider,
    warning,
    advice,
  });
});
