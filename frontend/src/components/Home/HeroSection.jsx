import { useContext } from "react";
import { FaBuilding, FaSuitcase, FaUsers, FaUserPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Context } from "../../main";

const HeroSection = () => {
  const { isAuthorized, user } = useContext(Context);
  const details = [
    {
      id: 1,
      title: "1,200+",
      subTitle: "Active roles",
      icon: <FaSuitcase />,
    },
    {
      id: 2,
      title: "450+",
      subTitle: "Hiring teams",
      icon: <FaBuilding />,
    },
    {
      id: 3,
      title: "8,500+",
      subTitle: "Candidates",
      icon: <FaUsers />,
    },
    {
      id: 4,
      title: "24 hrs",
      subTitle: "Average response",
      icon: <FaUserPlus />,
    },
  ];

  return (
    <section className="bg-white">
      <div className="page-wrap grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
        <div>
          <span className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-100">
            Placement-ready MERN job portal
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-normal text-slate-950">
            Find better roles and manage hiring in one focused workspace.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            JobPortal connects job seekers with relevant openings and gives
            employers a clean workflow for applications, resume review, and
            status tracking.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/job/getall" className="primary-btn">
              Browse Jobs
            </Link>
            {!isAuthorized ? (
              <Link to="/register" className="secondary-btn">
                Create Account
              </Link>
            ) : user?.role === "Employer" ? (
              <Link to="/job/post" className="secondary-btn">
                Post a Job
              </Link>
            ) : (
              <Link to="/applications/me" className="secondary-btn">
                View Dashboard
              </Link>
            )}
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 shadow-soft">
          <img
            src="/heroS.jpg"
            alt="Professionals working together"
            className="h-full min-h-[320px] w-full object-cover"
          />
        </div>
      </div>
      <div className="page-wrap grid gap-4 pb-10 pt-0 sm:grid-cols-2 lg:grid-cols-4">
        {details.map((element) => (
          <div key={element.id} className="card-surface flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-50 text-xl text-brand-700">
              {element.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-slate-950">{element.title}</p>
              <p className="text-sm text-slate-500">{element.subTitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
