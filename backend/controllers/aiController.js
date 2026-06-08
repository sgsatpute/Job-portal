import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { User } from "../models/userSchema.js";
import { USER_ROLES } from "../constants/applicationConstants.js";
import { env } from "../config/env.js";

const MAX_FIELD_LENGTH = 1400;
const MAX_RESUME_CONTEXT_LENGTH = 6000;
const MAX_JOB_DESCRIPTION_LENGTH = 500;

const RESPONSE_KEYS = {
  careerAdvice: [
    "summary",
    "matchScore",
    "strengths",
    "gaps",
    "nextSteps",
    "resumeTips",
    "interviewQuestions",
  ],
  resumeAnalysis: [
    "summary",
    "score",
    "level",
    "detectedSkills",
    "strengths",
    "issues",
    "improvements",
    "keywordSuggestions",
    "nextSteps",
  ],
  jobMatch: [
    "summary",
    "matchScore",
    "matchingSkills",
    "missingSkills",
    "strengths",
    "gaps",
    "roadmap",
  ],
  coverLetter: ["subject", "coverLetter", "highlights", "tips"],
  interviewQuestions: [
    "role",
    "technicalQuestions",
    "hrQuestions",
    "projectQuestions",
    "preparationTips",
  ],
  skillRoadmap: [
    "matchScore",
    "summary",
    "missingSkills",
    "roadmap",
    "practiceTasks",
  ],
  applicationSummary: [
    "summary",
    "fitScore",
    "strengths",
    "concerns",
    "resumeHighlights",
    "interviewFocus",
    "recommendation",
  ],
  jobDescription: [
    "description",
    "responsibilities",
    "requirements",
    "skills",
    "salarySuggestion",
    "screeningQuestions",
  ],
};

const TECH_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Redux",
  "Tailwind CSS",
  "HTML",
  "CSS",
  "Node.js",
  "Express.js",
  "MongoDB",
  "Mongoose",
  "REST API",
  "JWT",
  "Git",
  "GitHub",
  "Docker",
  "AWS",
  "Vercel",
  "Render",
  "Cloudinary",
  "Python",
  "Java",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "Data Structures",
  "Algorithms",
  "Machine Learning",
  "Artificial Intelligence",
  "Communication",
  "Problem Solving",
];

const STOP_WORDS = new Set([
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
  "your",
  "you",
  "our",
  "will",
  "are",
  "have",
  "has",
  "must",
  "can",
  "using",
  "based",
  "team",
  "candidate",
  "company",
  "required",
  "responsibilities",
]);

const normalizeText = (value, fallback = "", limit = MAX_FIELD_LENGTH) =>
  String(value || fallback)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);

const clampScore = (score, fallback = 0) =>
  Math.min(Math.max(Number(score) || fallback, 0), 100);

const toArray = (value, fallback = []) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return fallback;
};

const splitSkills = (value) =>
  normalizeText(value)
    .split(/[,|;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 30);

const keywordSet = (value) =>
  new Set(
    normalizeText(value, "", MAX_RESUME_CONTEXT_LENGTH)
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  );

const skillSearchText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/#/g, " sharp ")
    .replace(/[^a-z0-9]+/g, " ");

const skillAppearsInText = (skill, text) => {
  const haystack = skillSearchText(text);
  const tokens = skillSearchText(skill).split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
};

const uniqueList = (items, limit = 12) => [
  ...new Set((items || []).map((item) => normalizeText(item, "", 120)).filter(Boolean)),
].slice(0, limit);

const detectSkills = (text, explicitSkills = "") => {
  const listedSkills = splitSkills(explicitSkills);
  const detectedSkills = TECH_SKILLS.filter((skill) => skillAppearsInText(skill, text));
  return uniqueList([...listedSkills, ...detectedSkills], 20);
};

const formatSalary = (job) => {
  if (!job) return "";
  if (job.fixedSalary) return Number(job.fixedSalary).toLocaleString();
  if (job.salaryFrom && job.salaryTo) {
    return `${Number(job.salaryFrom).toLocaleString()} - ${Number(
      job.salaryTo
    ).toLocaleString()}`;
  }
  return "Not disclosed";
};

const buildJobContext = (job) => ({
  id: job?._id?.toString(),
  title: normalizeText(job?.title),
  category: normalizeText(job?.category),
  jobType: normalizeText(job?.jobType || "Full-time"),
  description: normalizeText(job?.description),
  city: normalizeText(job?.city),
  country: normalizeText(job?.country),
  location: normalizeText(job?.location),
  salary: formatSalary(job),
  companyName: normalizeText(
    job?.postedBy?.profile?.companyName || job?.postedBy?.name || "Employer"
  ),
});

const buildUserContext = (user, resumeText = "") => ({
  id: user?._id?.toString(),
  name: normalizeText(user?.name),
  email: normalizeText(user?.email),
  phone: normalizeText(user?.phone),
  role: normalizeText(user?.role),
  resumeUploaded: Boolean(user?.resume?.url),
  resumeText: normalizeText(resumeText, "", MAX_RESUME_CONTEXT_LENGTH),
  profileHeadline: normalizeText(user?.profile?.headline),
  profileLocation: normalizeText(user?.profile?.location),
  profileSkills: normalizeText(user?.profile?.skills),
  profileExperience: normalizeText(user?.profile?.experience),
  profileEducation: normalizeText(user?.profile?.education),
  companyName: normalizeText(user?.profile?.companyName),
  companyWebsite: normalizeText(user?.profile?.companyWebsite),
  companyDescription: normalizeText(user?.profile?.companyDescription),
});

const getUserWithResumeText = async (userId) =>
  User.findById(userId).select("+resumeText");

const extractGeminiText = (payload) =>
  (payload?.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "")
    .join("\n")
    .trim();

const parseJsonResponse = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) throw error;
    return JSON.parse(match[0]);
  }
};

const isValidStructuredResponse = (value, requiredKeys) =>
  value &&
  requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key));

const buildJsonInstruction = (requiredKeys) =>
  `Return only valid JSON. Required top-level keys: ${requiredKeys.join(", ")}. Use concise, practical values.`;

const getUniqueValues = (values) =>
  values.filter((value, index, list) => value && list.indexOf(value) === index);

const readProviderError = async (response) => {
  const body = await response.text().catch(() => "");
  return body ? `: ${body.slice(0, 240)}` : "";
};

const logAIProviderErrors = (errors) => {
  if (!errors.length) return;

  console.warn(
    "[ai] provider fallback",
    errors.map((error) => ({
      provider: error.provider,
      message: error.message,
    }))
  );
};

const callGeminiModelStructured = async ({
  apiKey,
  model,
  system,
  prompt,
  requiredKeys,
  maxTokens,
}) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: [
                  system,
                  buildJsonInstruction(requiredKeys),
                  "",
                  prompt,
                ].join("\n"),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Gemini ${model} returned ${response.status}${await readProviderError(
        response
      )}`
    );
  }

  const payload = await response.json();
  const parsed = parseJsonResponse(extractGeminiText(payload));

  if (!isValidStructuredResponse(parsed, requiredKeys)) {
    throw new Error("Gemini response did not match the expected shape.");
  }

  return parsed;
};

const callGeminiStructured = async ({ system, prompt, requiredKeys, maxTokens }) => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const models = getUniqueValues([
    env.GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
  ]);
  const errors = [];

  for (const model of models) {
    try {
      return await callGeminiModelStructured({
        apiKey,
        model,
        system,
        prompt,
        requiredKeys,
        maxTokens,
      });
    } catch (error) {
      errors.push(error.message);
    }
  }

  throw new Error(errors.join(" | "));
};

const generateStructuredResult = async ({
  system,
  prompt,
  requiredKeys,
  fallback,
  maxTokens = 1100,
  useProvider = true,
}) => {
  if (!useProvider) {
    return {
      provider: "smart-fallback",
      warning: "",
      result: fallback,
    };
  }

  let result = fallback;
  let provider = "smart-fallback";
  let warning = "";
  const providerErrors = [];

  const hasGeminiKey = Boolean(env.GEMINI_API_KEY);

  let geminiResult = null;
  if (hasGeminiKey) {
    try {
      geminiResult = await callGeminiStructured({
        system,
        prompt,
        requiredKeys,
        maxTokens,
      });
    } catch (error) {
      providerErrors.push({ provider: "gemini", message: error.message });
    }
  }

  if (geminiResult) {
    result = {
      ...fallback,
      ...geminiResult,
    };
    provider = "gemini";
  } else if (!hasGeminiKey) {
    warning =
      "No Gemini API key is configured, so JobPortal used the built-in smart advisor.";
  } else {
    logAIProviderErrors(providerErrors);
    warning =
      "AI provider was unavailable, so JobPortal used the built-in smart advisor.";
  }

  return { provider, warning, result };
};

const compareCandidateToJob = (userContext, jobContext, extraCandidateText = "") => {
  const candidateText = [
    userContext.resumeText,
    userContext.profileHeadline,
    userContext.profileSkills,
    userContext.profileExperience,
    userContext.profileEducation,
    extraCandidateText,
  ].join(" ");
  const jobText = [
    jobContext.title,
    jobContext.category,
    jobContext.jobType,
    jobContext.description,
  ].join(" ");
  const candidateSkills = detectSkills(candidateText, userContext.profileSkills);
  const requiredSkills = detectSkills(jobText);
  const matchingSkills = requiredSkills.filter((skill) =>
    candidateSkills.some((candidateSkill) =>
      skillAppearsInText(skill, candidateSkill)
    )
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !matchingSkills.includes(skill)
  );
  const candidateWords = keywordSet(candidateText);
  const jobWords = keywordSet(jobText);
  const overlappingKeywords = [...jobWords].filter((word) => candidateWords.has(word));
  const missingKeywords = [...jobWords]
    .filter((word) => !candidateWords.has(word))
    .slice(0, 8);
  const hasProfileContext = Boolean(
    candidateText.trim() || userContext.resumeUploaded
  );
  const baseScore = hasProfileContext ? 34 : 18;
  const score = clampScore(
    baseScore +
      matchingSkills.length * 10 +
      Math.min(overlappingKeywords.length, 8) * 3 +
      (userContext.resumeUploaded ? 6 : 0) +
      (missingSkills.length === 0 && requiredSkills.length > 0 ? 8 : 0),
    42
  );

  return {
    score,
    matchingSkills: uniqueList(matchingSkills, 8),
    missingSkills: uniqueList(
      missingSkills.length > 0
        ? missingSkills
        : missingKeywords.map((word) => word.replace(/^\w/, (char) => char.toUpperCase())),
      8
    ),
    candidateSkills: uniqueList(candidateSkills, 12),
    requiredSkills: uniqueList(requiredSkills, 12),
    overlappingKeywords,
    missingKeywords,
  };
};

const buildCareerAdviceFallback = (context) => {
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
  const priorityKeywords = [...jobKeywords]
    .filter((word) => !skillKeywords.has(word))
    .slice(0, 6);
  const baseScore = clampScore(45 + matchedSkills.length * 8 + skillList.length * 2, 55);

  return {
    summary: `You are targeting ${
      context.targetRole || context.jobTitle || "this role"
    }. Focus your resume and interview preparation around proof of the most relevant skills, projects, and outcomes.`,
    matchScore: Math.min(baseScore, 88),
    strengths:
      matchedSkills.length > 0
        ? matchedSkills.slice(0, 4)
        : [
            "Clear role interest",
            "Profile can be shaped toward this opening",
            "Project evidence can improve fit quickly",
          ],
    gaps:
      priorityKeywords.length > 0
        ? priorityKeywords.map((word) => `Add evidence for ${word}`)
        : [
            "Add role-specific keywords",
            "Mention measurable project outcomes",
            "Show tools, frameworks, and deployment experience",
          ],
    nextSteps: [
      "Rewrite your resume summary for the exact target role.",
      "Add 2-3 projects that prove the strongest required skills.",
      "Prepare short answers for why you fit this company and role.",
      "Apply only after the resume includes the role title and matching skills.",
    ],
    resumeTips: [
      "Keep the resume to one page if you are a fresher or early-career candidate.",
      "Use bullet points with action, technology, and result.",
      "Put the most relevant project near the top.",
    ],
    interviewQuestions: [
      `Why are you interested in ${
        context.targetRole || context.jobTitle || "this role"
      }?`,
      "Which project best proves your fit for this job?",
      "What technical skill do you need to improve for this role?",
    ],
  };
};

const buildResumeAnalysisFallback = (userContext) => {
  const resumeText = userContext.resumeText;
  const lowerResume = resumeText.toLowerCase();
  const wordCount = resumeText.split(/\s+/).filter(Boolean).length;
  const sections = [
    "education",
    "experience",
    "project",
    "skill",
    "certification",
    "achievement",
  ];
  const presentSections = sections.filter((section) => lowerResume.includes(section));
  const detectedSkills = detectSkills(
    [
      resumeText,
      userContext.profileSkills,
      userContext.profileExperience,
      userContext.profileEducation,
    ].join(" "),
    userContext.profileSkills
  );
  const score = clampScore(
    28 +
      Math.min(wordCount / 18, 18) +
      presentSections.length * 7 +
      Math.min(detectedSkills.length, 10) * 3,
    52
  );
  const level =
    score >= 80 ? "Strong" : score >= 62 ? "Average" : "Needs Improvement";
  const issues = [];

  if (wordCount < 250) issues.push("Resume content looks too short for screening.");
  if (!lowerResume.includes("project")) issues.push("Projects are not clearly visible.");
  if (!lowerResume.includes("achievement") && !/\d+%|\d+\+/.test(resumeText)) {
    issues.push("Measurable outcomes or achievements are missing.");
  }
  if (detectedSkills.length < 5) issues.push("Add more role-specific skills.");

  return {
    summary: `Resume analysis found ${detectedSkills.length} visible skill${
      detectedSkills.length === 1 ? "" : "s"
    } and ${presentSections.length} important section${
      presentSections.length === 1 ? "" : "s"
    }.`,
    score,
    level,
    detectedSkills:
      detectedSkills.length > 0
        ? detectedSkills
        : ["Add technical skills in a dedicated Skills section"],
    strengths:
      presentSections.length > 0
        ? presentSections.map(
            (section) => `${section.replace(/^\w/, (char) => char.toUpperCase())} section is visible`
          )
        : ["Resume is uploaded and ready for improvement"],
    issues:
      issues.length > 0
        ? issues
        : ["Improve keyword density for the exact roles you apply to."],
    improvements: [
      "Add a 2-3 line summary aligned to your target job title.",
      "Write project bullets with action, technology, and measurable result.",
      "Move your strongest technical skills near the top.",
      "Add GitHub, portfolio, or deployed project links if available.",
    ],
    keywordSuggestions: uniqueList(
      [...TECH_SKILLS.filter((skill) => !detectedSkills.includes(skill))],
      8
    ),
    nextSteps: [
      "Update the resume and re-upload the PDF.",
      "Run the job match score for 2-3 target jobs.",
      "Generate a cover letter only after the resume keywords match the role.",
    ],
  };
};

const buildJobMatchFallback = (userContext, jobContext, extraCandidateText = "") => {
  const comparison = compareCandidateToJob(
    userContext,
    jobContext,
    extraCandidateText
  );

  return {
    summary: `Your profile currently shows a ${comparison.score}% match for ${
      jobContext.title || "this job"
    }. Improve the score by adding proof for the missing skills and job keywords.`,
    matchScore: comparison.score,
    matchingSkills:
      comparison.matchingSkills.length > 0
        ? comparison.matchingSkills
        : ["No strong skill overlap detected yet"],
    missingSkills:
      comparison.missingSkills.length > 0
        ? comparison.missingSkills
        : ["Add more job-specific proof"],
    strengths:
      comparison.matchingSkills.length > 0
        ? comparison.matchingSkills.map((skill) => `Visible ${skill} experience`)
        : ["Profile can be tailored toward this role"],
    gaps:
      comparison.missingSkills.length > 0
        ? comparison.missingSkills.map((skill) => `Show practical ${skill} evidence`)
        : ["Add measurable results and deployment proof"],
    roadmap: [
      "Update resume summary with the exact job title.",
      "Add one project bullet for every important missing skill.",
      "Prepare a 60-second project explanation for the interview.",
      "Apply after your resume and cover letter mention the top job keywords.",
    ],
  };
};

const buildCoverLetterFallback = (userContext, jobContext) => {
  const skills = detectSkills(
    [userContext.resumeText, userContext.profileSkills, userContext.profileExperience].join(
      " "
    ),
    userContext.profileSkills
  ).slice(0, 5);
  const skillSentence =
    skills.length > 0
      ? `My experience with ${skills.join(", ")} aligns with the requirements of this role.`
      : "My project experience and willingness to learn align with this opportunity.";

  return {
    subject: `Application for ${jobContext.title || "the open role"}`,
    coverLetter: [
      "Dear Hiring Team,",
      "",
      `I am applying for the ${
        jobContext.title || "open"
      } role at ${jobContext.companyName || "your company"}. ${skillSentence}`,
      "",
      "I can contribute through disciplined execution, clear communication, and a project-focused approach. I would appreciate the opportunity to discuss how my profile fits your hiring needs.",
      "",
      `Regards,\n${userContext.name || "Candidate"}`,
    ].join("\n"),
    highlights:
      skills.length > 0
        ? skills.map((skill) => `${skill} can be emphasized in the letter`)
        : ["Add 2-3 specific project achievements before submitting"],
    tips: [
      "Keep the final letter under 180 words.",
      "Mention the exact company or role name.",
      "Add one measurable project result if you have it.",
    ],
  };
};

const buildInterviewQuestionsFallback = (jobContext) => ({
  role: jobContext.title || "Target Role",
  technicalQuestions: [
    `Which skills are most important for a ${jobContext.title || "candidate"} and why?`,
    `Explain one project that is closest to this ${jobContext.category || "job"} role.`,
    "How would you debug a production issue in a deployed application?",
    "How do you keep code maintainable when requirements change?",
    "What tradeoffs did you make in your most recent project?",
  ],
  hrQuestions: [
    `Why do you want this ${jobContext.jobType || "job"} opportunity?`,
    "Tell me about yourself in one minute.",
    "What is one weakness you are actively improving?",
    "Why should we shortlist you for the next round?",
  ],
  projectQuestions: [
    "Walk through the architecture of your strongest project.",
    "Which part of your project was hardest to build?",
    "How did you test or validate your project?",
    "What would you improve if you rebuilt it?",
  ],
  preparationTips: [
    "Prepare one short project story using problem, action, and result.",
    "Revise the top skills from the job description.",
    "Keep salary and availability answers clear and realistic.",
  ],
});

const buildSkillRoadmapFallback = (userContext, jobContext) => {
  const match = buildJobMatchFallback(userContext, jobContext);
  const missingSkills = match.missingSkills.slice(0, 5);

  return {
    matchScore: match.matchScore,
    summary: `Focus on ${missingSkills.slice(0, 3).join(", ") || "role-specific proof"} to improve fit for ${
      jobContext.title || "this role"
    }.`,
    missingSkills,
    roadmap: [
      {
        step: "Resume keyword alignment",
        focus: "Update summary, skills, and project titles for this role.",
        outcome: "Recruiters can quickly see role relevance.",
      },
      {
        step: "Project proof",
        focus: `Build or improve one project that demonstrates ${
          missingSkills[0] || "the core job skill"
        }.`,
        outcome: "You have concrete evidence for screening and interviews.",
      },
      {
        step: "Interview practice",
        focus: "Prepare answers for project architecture, debugging, and tradeoffs.",
        outcome: "You can explain your work clearly under pressure.",
      },
    ],
    practiceTasks: [
      "Write 5 resume bullets with technology and result.",
      "Record a 90-second explanation of your best project.",
      "Solve 3 role-relevant coding or case questions.",
    ],
  };
};

const buildApplicationSummaryFallback = (application, userContext, jobContext) => {
  const match = compareCandidateToJob(
    userContext,
    jobContext,
    application.coverLetter
  );

  return {
    summary: `${application.name} applied for ${
      jobContext.title || "this role"
    }. The profile shows a ${match.score}% estimated fit based on resume/profile text and cover letter evidence.`,
    fitScore: match.score,
    strengths:
      match.matchingSkills.length > 0
        ? match.matchingSkills.map((skill) => `Relevant ${skill} signal`)
        : ["Candidate submitted resume and cover letter"],
    concerns:
      match.missingSkills.length > 0
        ? match.missingSkills.map((skill) => `Need to verify ${skill}`)
        : ["Validate depth through interview questions"],
    resumeHighlights:
      match.candidateSkills.length > 0
        ? match.candidateSkills.slice(0, 6)
        : ["Open resume to inspect detailed experience"],
    interviewFocus: [
      "Ask for the strongest project walkthrough.",
      "Verify the missing skills with practical questions.",
      "Check communication, availability, and role expectations.",
    ],
    recommendation:
      match.score >= 70
        ? "Consider shortlisting if resume details are genuine."
        : "Screen carefully before shortlisting.",
  };
};

const buildJobDescriptionFallback = (context) => {
  const title = context.title || "Software Developer";
  const skills = uniqueList(
    splitSkills(context.skills).length > 0
      ? splitSkills(context.skills)
      : detectSkills([title, context.category].join(" ")).slice(0, 6),
    8
  );
  const skillText =
    skills.length > 0 ? skills.join(", ") : "relevant technical and communication skills";

  return {
    description: normalizeText(
      `We are hiring a ${title} for a ${
        context.jobType || "Full-time"
      } role in ${[context.city, context.country].filter(Boolean).join(", ") || "our team"}. The candidate should work on practical projects, collaborate clearly, and show strong ownership with ${skillText}.`,
      "",
      MAX_JOB_DESCRIPTION_LENGTH
    ),
    responsibilities: [
      "Build, test, and maintain assigned features.",
      "Collaborate with team members and communicate progress clearly.",
      "Debug issues and improve application quality.",
      "Document important decisions and implementation details.",
    ],
    requirements: [
      `Strong understanding of ${skillText}.`,
      "Ability to explain projects and technical decisions.",
      "Good problem-solving and communication skills.",
    ],
    skills: skills.length > 0 ? skills : ["Problem Solving", "Communication"],
    salarySuggestion: context.salary || "Mention salary range based on experience.",
    screeningQuestions: [
      `Describe one project relevant to ${title}.`,
      "How do you debug an issue when production behavior is different from local?",
      "What is your availability and expected compensation?",
    ],
  };
};

const normalizeCareerAdvice = (advice, fallback) => ({
  ...fallback,
  ...advice,
  matchScore: clampScore(advice.matchScore, fallback.matchScore),
  strengths: toArray(advice.strengths, fallback.strengths).slice(0, 6),
  gaps: toArray(advice.gaps, fallback.gaps).slice(0, 6),
  nextSteps: toArray(advice.nextSteps, fallback.nextSteps).slice(0, 6),
  resumeTips: toArray(advice.resumeTips, fallback.resumeTips).slice(0, 6),
  interviewQuestions: toArray(
    advice.interviewQuestions,
    fallback.interviewQuestions
  ).slice(0, 8),
});

const normalizeResumeAnalysis = (analysis, fallback) => ({
  ...fallback,
  ...analysis,
  score: clampScore(analysis.score, fallback.score),
  level: normalizeText(analysis.level, fallback.level, 40),
  detectedSkills: toArray(analysis.detectedSkills, fallback.detectedSkills).slice(0, 12),
  strengths: toArray(analysis.strengths, fallback.strengths).slice(0, 6),
  issues: toArray(analysis.issues, fallback.issues).slice(0, 6),
  improvements: toArray(analysis.improvements, fallback.improvements).slice(0, 8),
  keywordSuggestions: toArray(
    analysis.keywordSuggestions,
    fallback.keywordSuggestions
  ).slice(0, 10),
  nextSteps: toArray(analysis.nextSteps, fallback.nextSteps).slice(0, 6),
});

const normalizeJobMatch = (match, fallback) => ({
  ...fallback,
  ...match,
  matchScore: clampScore(match.matchScore, fallback.matchScore),
  matchingSkills: toArray(match.matchingSkills, fallback.matchingSkills).slice(0, 8),
  missingSkills: toArray(match.missingSkills, fallback.missingSkills).slice(0, 8),
  strengths: toArray(match.strengths, fallback.strengths).slice(0, 6),
  gaps: toArray(match.gaps, fallback.gaps).slice(0, 6),
  roadmap: toArray(match.roadmap, fallback.roadmap).slice(0, 8),
});

const normalizeJobDescription = (draft, fallback) => ({
  ...fallback,
  ...draft,
  description: normalizeText(
    draft.description,
    fallback.description,
    MAX_JOB_DESCRIPTION_LENGTH
  ),
  responsibilities: toArray(draft.responsibilities, fallback.responsibilities).slice(
    0,
    6
  ),
  requirements: toArray(draft.requirements, fallback.requirements).slice(0, 6),
  skills: toArray(draft.skills, fallback.skills).slice(0, 10),
  screeningQuestions: toArray(
    draft.screeningQuestions,
    fallback.screeningQuestions
  ).slice(0, 6),
});

const findActiveJob = async (jobId) => {
  const job = await Job.findById(jobId).populate("postedBy", "name email profile");
  if (!job || job.expired) {
    throw new ErrorHandler("Job not found or no longer active.", 404);
  }
  return job;
};

export const generateCareerAdvice = catchAsyncErrors(async (req, res, next) => {
  const fullUser = await getUserWithResumeText(req.user._id);
  const context = {
    userRole: fullUser.role,
    userName: fullUser.name,
    profileHeadline: normalizeText(fullUser.profile?.headline),
    profileLocation: normalizeText(fullUser.profile?.location),
    targetRole: normalizeText(req.body.targetRole),
    skills: normalizeText(req.body.skills || fullUser.profile?.skills),
    experience: normalizeText(
      req.body.experience || fullUser.profile?.experience || fullUser.resumeText
    ),
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
      new ErrorHandler("Please add skills, experience, or upload a resume.", 400)
    );
  }

  const fallback = buildCareerAdviceFallback(context);
  const aiResult = await generateStructuredResult({
    system:
      "You are an expert Indian placement and career coach for a MERN job portal.",
    prompt: `Generate career advice for this candidate context:\n${JSON.stringify(
      context
    )}`,
    requiredKeys: RESPONSE_KEYS.careerAdvice,
    fallback,
  });

  res.status(200).json({
    success: true,
    provider: aiResult.provider,
    warning: aiResult.warning,
    advice: normalizeCareerAdvice(aiResult.result, fallback),
  });
});

export const analyzeResume = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.JOB_SEEKER) {
    return next(new ErrorHandler("Only job seekers can analyze a resume.", 403));
  }

  const fullUser = await getUserWithResumeText(req.user._id);
  if (!fullUser.resume?.url) {
    return next(new ErrorHandler("Upload a PDF resume before running analysis.", 400));
  }

  const profileFallbackText = normalizeText(
    [
      fullUser.profile?.headline,
      fullUser.profile?.skills,
      fullUser.profile?.experience,
      fullUser.profile?.education,
    ].join(" "),
    "",
    MAX_RESUME_CONTEXT_LENGTH
  );
  const analysisText = fullUser.resumeText || profileFallbackText;

  if (!analysisText) {
    return next(
      new ErrorHandler(
        "Resume uploaded, but text could not be extracted. Add profile skills and experience or re-upload a text-based PDF resume.",
        400
      )
    );
  }

  const userContext = buildUserContext(fullUser, analysisText);
  const fallback = buildResumeAnalysisFallback(userContext);
  const aiResult = await generateStructuredResult({
    system:
      "You are an ATS-aware resume reviewer for Indian placement candidates. Be direct, practical, and specific.",
    prompt: `Analyze this resume and profile context:\n${JSON.stringify(
      userContext
    )}`,
    requiredKeys: RESPONSE_KEYS.resumeAnalysis,
    fallback,
    maxTokens: 1300,
  });
  const extractionWarning = !fullUser.resumeText
    ? "Resume text could not be extracted, so JobPortal analyzed your profile details instead."
    : "";

  res.status(200).json({
    success: true,
    provider: aiResult.provider,
    warning: [extractionWarning, aiResult.warning].filter(Boolean).join(" "),
    analysis: normalizeResumeAnalysis(aiResult.result, fallback),
  });
});

export const generateJobMatch = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.JOB_SEEKER) {
    return next(new ErrorHandler("Only job seekers can generate a job match.", 403));
  }

  const [job, fullUser] = await Promise.all([
    findActiveJob(req.params.id),
    getUserWithResumeText(req.user._id),
  ]);
  const jobContext = buildJobContext(job);
  const userContext = buildUserContext(fullUser, fullUser.resumeText);
  const fallback = buildJobMatchFallback(userContext, jobContext);
  const useProvider = req.query.generate === "true";
  const aiResult = await generateStructuredResult({
    system:
      "You compare candidate profiles against job descriptions and return realistic placement match guidance.",
    prompt: `Compare this candidate to this job:\n${JSON.stringify({
      candidate: userContext,
      job: jobContext,
    })}`,
    requiredKeys: RESPONSE_KEYS.jobMatch,
    fallback,
    maxTokens: 1000,
    useProvider,
  });

  res.status(200).json({
    success: true,
    provider: aiResult.provider,
    warning: aiResult.warning,
    match: normalizeJobMatch(aiResult.result, fallback),
  });
});

export const generateCoverLetter = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.JOB_SEEKER) {
    return next(new ErrorHandler("Only job seekers can generate a cover letter.", 403));
  }

  const [job, fullUser] = await Promise.all([
    findActiveJob(req.params.id),
    getUserWithResumeText(req.user._id),
  ]);
  const jobContext = buildJobContext(job);
  const userContext = buildUserContext(fullUser, fullUser.resumeText);
  const fallback = buildCoverLetterFallback(userContext, jobContext);
  const aiResult = await generateStructuredResult({
    system:
      "You write short, sincere cover letters for early-career Indian job seekers. Avoid exaggeration.",
    prompt: `Generate a personalized cover letter using this context:\n${JSON.stringify(
      {
        candidate: userContext,
        job: jobContext,
        extraNotes: normalizeText(req.body.notes),
      }
    )}`,
    requiredKeys: RESPONSE_KEYS.coverLetter,
    fallback,
    maxTokens: 900,
  });

  res.status(200).json({
    success: true,
    provider: aiResult.provider,
    warning: aiResult.warning,
    coverLetter: {
      ...fallback,
      ...aiResult.result,
      highlights: toArray(aiResult.result.highlights, fallback.highlights).slice(0, 6),
      tips: toArray(aiResult.result.tips, fallback.tips).slice(0, 5),
    },
  });
});

export const generateInterviewQuestions = catchAsyncErrors(async (req, res, next) => {
  const job = await findActiveJob(req.params.id);
  const jobContext = buildJobContext(job);
  const fallback = buildInterviewQuestionsFallback(jobContext);
  const aiResult = await generateStructuredResult({
    system:
      "You are an interview coach. Generate practical questions for the exact job and skill level.",
    prompt: `Generate interview preparation questions for this job:\n${JSON.stringify(
      jobContext
    )}`,
    requiredKeys: RESPONSE_KEYS.interviewQuestions,
    fallback,
    maxTokens: 1000,
  });

  res.status(200).json({
    success: true,
    provider: aiResult.provider,
    warning: aiResult.warning,
    questions: {
      ...fallback,
      ...aiResult.result,
      technicalQuestions: toArray(
        aiResult.result.technicalQuestions,
        fallback.technicalQuestions
      ).slice(0, 8),
      hrQuestions: toArray(aiResult.result.hrQuestions, fallback.hrQuestions).slice(
        0,
        6
      ),
      projectQuestions: toArray(
        aiResult.result.projectQuestions,
        fallback.projectQuestions
      ).slice(0, 6),
      preparationTips: toArray(
        aiResult.result.preparationTips,
        fallback.preparationTips
      ).slice(0, 6),
    },
  });
});

export const generateSkillRoadmap = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.JOB_SEEKER) {
    return next(new ErrorHandler("Only job seekers can generate a skill roadmap.", 403));
  }

  const [job, fullUser] = await Promise.all([
    findActiveJob(req.params.id),
    getUserWithResumeText(req.user._id),
  ]);
  const jobContext = buildJobContext(job);
  const userContext = buildUserContext(fullUser, fullUser.resumeText);
  const fallback = buildSkillRoadmapFallback(userContext, jobContext);
  const aiResult = await generateStructuredResult({
    system:
      "You create short skill gap roadmaps for placement candidates. Keep steps realistic for 2-4 weeks.",
    prompt: `Create a skill gap roadmap from this candidate and job context:\n${JSON.stringify(
      {
        candidate: userContext,
        job: jobContext,
      }
    )}`,
    requiredKeys: RESPONSE_KEYS.skillRoadmap,
    fallback,
    maxTokens: 1000,
  });

  res.status(200).json({
    success: true,
    provider: aiResult.provider,
    warning: aiResult.warning,
    roadmap: {
      ...fallback,
      ...aiResult.result,
      matchScore: clampScore(aiResult.result.matchScore, fallback.matchScore),
      missingSkills: toArray(
        aiResult.result.missingSkills,
        fallback.missingSkills
      ).slice(0, 8),
      roadmap: toArray(aiResult.result.roadmap, fallback.roadmap).slice(0, 6),
      practiceTasks: toArray(
        aiResult.result.practiceTasks,
        fallback.practiceTasks
      ).slice(0, 6),
    },
  });
});

export const summarizeApplication = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.EMPLOYER) {
    return next(new ErrorHandler("Only employers can summarize applications.", 403));
  }

  const application = await Application.findById(req.params.id)
    .select("+resumeText")
    .populate("jobID")
    .populate("applicantID.user", "name email phone resume profile");
  if (!application) {
    return next(new ErrorHandler("Application not found.", 404));
  }

  if (application.employerID.user.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("You can summarize only your own applications.", 403));
  }

  const applicantUser = await getUserWithResumeText(application.applicantID.user._id);
  const userContext = buildUserContext(
    applicantUser,
    applicantUser.resumeText || application.resumeText
  );
  const jobContext = buildJobContext(application.jobID);
  const fallback = buildApplicationSummaryFallback(
    application,
    userContext,
    jobContext
  );
  const aiResult = await generateStructuredResult({
    system:
      "You are a recruiter assistant. Summarize candidates carefully without making unsupported claims.",
    prompt: `Summarize this candidate application for the employer:\n${JSON.stringify(
      {
        candidate: userContext,
        job: jobContext,
        coverLetter: normalizeText(application.coverLetter, "", 1200),
      }
    )}`,
    requiredKeys: RESPONSE_KEYS.applicationSummary,
    fallback,
    maxTokens: 1000,
  });

  res.status(200).json({
    success: true,
    provider: aiResult.provider,
    warning: aiResult.warning,
    summary: {
      ...fallback,
      ...aiResult.result,
      fitScore: clampScore(aiResult.result.fitScore, fallback.fitScore),
      strengths: toArray(aiResult.result.strengths, fallback.strengths).slice(0, 6),
      concerns: toArray(aiResult.result.concerns, fallback.concerns).slice(0, 6),
      resumeHighlights: toArray(
        aiResult.result.resumeHighlights,
        fallback.resumeHighlights
      ).slice(0, 8),
      interviewFocus: toArray(
        aiResult.result.interviewFocus,
        fallback.interviewFocus
      ).slice(0, 6),
    },
  });
});

export const generateJobDescription = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.EMPLOYER) {
    return next(new ErrorHandler("Only employers can generate job descriptions.", 403));
  }

  const context = {
    title: normalizeText(req.body.title, "", 80),
    category: normalizeText(req.body.category, "", 80),
    jobType: normalizeText(req.body.jobType, "", 40),
    country: normalizeText(req.body.country, "", 80),
    city: normalizeText(req.body.city, "", 80),
    location: normalizeText(req.body.location, "", 200),
    skills: normalizeText(req.body.skills, "", 500),
    salary: normalizeText(req.body.salary, "", 100),
    companyName: normalizeText(
      req.user.profile?.companyName || req.user.name,
      "Company",
      80
    ),
    companyDescription: normalizeText(req.user.profile?.companyDescription, "", 500),
  };

  if (context.title.length < 3) {
    return next(new ErrorHandler("Enter a job title before using AI.", 400));
  }

  const fallback = buildJobDescriptionFallback(context);
  const aiResult = await generateStructuredResult({
    system:
      "You write concise job descriptions for an Indian MERN job portal. Keep the description under 500 characters.",
    prompt: `Generate a job description draft for this employer context:\n${JSON.stringify(
      context
    )}`,
    requiredKeys: RESPONSE_KEYS.jobDescription,
    fallback,
    maxTokens: 1000,
  });

  res.status(200).json({
    success: true,
    provider: aiResult.provider,
    warning: aiResult.warning,
    draft: normalizeJobDescription(aiResult.result, fallback),
  });
});
