export const formatSalary = (job) => {
  if (!job) return "Not disclosed";
  if (job.fixedSalary) return Number(job.fixedSalary).toLocaleString();
  if (job.salaryFrom && job.salaryTo) {
    return `${Number(job.salaryFrom).toLocaleString()} - ${Number(
      job.salaryTo
    ).toLocaleString()}`;
  }
  return "Not disclosed";
};

export const formatDate = (date) => {
  if (!date) return "Not recorded";
  return new Date(date).toLocaleDateString();
};
