const ResumeModal = ({ resumeUrl, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-5xl rounded-lg bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">Resume Preview</h2>
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <iframe
          src={resumeUrl}
          title="Resume preview"
          className="h-[75vh] w-full rounded-lg border border-slate-200"
        />
      </div>
    </div>
  );
};

export default ResumeModal;
