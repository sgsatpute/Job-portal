import { FaApple, FaMicrosoft } from "react-icons/fa";
import { SiTesla } from "react-icons/si";

const PopularCompanies = () => {
  const companies = [
    {
      id: 1,
      title: "Microsoft",
      location: "Gurugram, Haryana",
      openPositions: 10,
      icon: <FaMicrosoft />,
    },
    {
      id: 2,
      title: "Tesla",
      location: "Pune, Maharashtra",
      openPositions: 5,
      icon: <SiTesla />,
    },
    {
      id: 3,
      title: "Apple",
      location: "Bengaluru, Karnataka",
      openPositions: 20,
      icon: <FaApple />,
    },
  ];

  return (
    <section className="bg-slate-100">
      <div className="page-wrap">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-950">Top Companies</h2>
          <p className="mt-2 text-slate-600">Representative hiring partners and open role volume.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {companies.map((element) => (
            <div key={element.id} className="card-surface p-6">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-50 text-2xl text-brand-700">
                  {element.icon}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-950">{element.title}</p>
                  <p className="text-sm text-slate-500">{element.location}</p>
                </div>
              </div>
              <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-brand-700">
                Open Positions: {element.openPositions}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCompanies;
