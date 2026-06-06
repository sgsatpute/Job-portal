import { FaUserPlus } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import { MdFindInPage } from "react-icons/md";

const HowItWorks = () => {
  const items = [
    {
      title: "Create Profile",
      text: "Job seekers can maintain profile details and a Cloudinary-hosted PDF resume.",
      icon: <FaUserPlus />,
    },
    {
      title: "Discover Roles",
      text: "Search by keyword and narrow jobs by type, location, and salary range.",
      icon: <MdFindInPage />,
    },
    {
      title: "Track Decisions",
      text: "Applications move through Pending, Shortlisted, and Rejected states.",
      icon: <IoMdSend />,
    },
  ];

  return (
    <section className="bg-white">
      <div className="page-wrap">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-950">Placement Workflow</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            A straightforward flow for candidates and employers from application
            to review.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="card-surface p-6">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-lg bg-brand-50 text-2xl text-brand-700">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
