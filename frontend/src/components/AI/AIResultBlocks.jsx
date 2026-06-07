import { FaRobot } from "react-icons/fa";

const providerLabels = {
  gemini: "Gemini",
  openai: "OpenAI",
  "smart-fallback": "Smart advisor",
};

export const ProviderBadge = ({ provider }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
    <FaRobot />
    {providerLabels[provider] || "AI"}
  </span>
);

export const ScoreBlock = ({ label, value }) => (
  <div className="rounded-lg border border-brand-100 bg-brand-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
      {label}
    </p>
    <p className="mt-2 text-3xl font-bold text-slate-950">{value}%</p>
  </div>
);

export const ListBlock = ({ title, items }) => {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (safeItems.length === 0) return null;
  const renderItem = (item) => {
    if (typeof item === "string") return item;
    return (
      item.step ||
      item.focus ||
      item.question ||
      item.title ||
      item.skill ||
      Object.values(item)
        .filter((value) => typeof value === "string")
        .join(" - ")
    );
  };

  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <h3 className="text-sm font-bold text-slate-950">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        {safeItems.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-600" />
            <span>{renderItem(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const RoadmapBlock = ({ title = "Roadmap", items }) => {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (safeItems.length === 0) return null;

  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <h3 className="text-sm font-bold text-slate-950">{title}</h3>
      <div className="mt-3 space-y-3">
        {safeItems.map((item, index) => {
          if (typeof item === "string") {
            return (
              <div key={`${title}-${index}`} className="text-sm leading-6 text-slate-700">
                {item}
              </div>
            );
          }

          return (
            <div key={`${title}-${index}`} className="rounded-lg bg-white p-3 text-sm">
              <p className="font-semibold text-slate-950">
                {item.step || `Step ${index + 1}`}
              </p>
              {item.focus && <p className="mt-1 text-slate-700">{item.focus}</p>}
              {item.outcome && (
                <p className="mt-1 text-xs font-semibold text-brand-700">
                  Outcome: {item.outcome}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AIWarning = ({ warning }) => {
  if (!warning) return null;

  return (
    <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
      {warning}
    </p>
  );
};
