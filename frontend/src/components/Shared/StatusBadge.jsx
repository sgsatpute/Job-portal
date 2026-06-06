const styles = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Shortlisted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
};

const StatusBadge = ({ status = "Pending" }) => {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        styles[status] || styles.Pending
      }`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
