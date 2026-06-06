import {
  MdAccountBalance,
  MdOutlineAnimation,
  MdOutlineDesignServices,
  MdOutlineWebhook,
} from "react-icons/md";
import { FaReact } from "react-icons/fa";
import { GiArtificialIntelligence } from "react-icons/gi";
import { IoGameController } from "react-icons/io5";
import { TbAppsFilled } from "react-icons/tb";

const PopularCategories = () => {
  const categories = [
    {
      id: 1,
      title: "Graphics & Design",
      subTitle: "305 open positions",
      icon: <MdOutlineDesignServices />,
    },
    {
      id: 2,
      title: "Mobile App Development",
      subTitle: "500 open positions",
      icon: <TbAppsFilled />,
    },
    {
      id: 3,
      title: "Frontend Web Development",
      subTitle: "200 open positions",
      icon: <MdOutlineWebhook />,
    },
    {
      id: 4,
      title: "MERN Stack Development",
      subTitle: "1000+ open positions",
      icon: <FaReact />,
    },
    {
      id: 5,
      title: "Account & Finance",
      subTitle: "150 open positions",
      icon: <MdAccountBalance />,
    },
    {
      id: 6,
      title: "Artificial Intelligence",
      subTitle: "867 open positions",
      icon: <GiArtificialIntelligence />,
    },
    {
      id: 7,
      title: "Video Animation",
      subTitle: "50 open positions",
      icon: <MdOutlineAnimation />,
    },
    {
      id: 8,
      title: "Game Development",
      subTitle: "80 open positions",
      icon: <IoGameController />,
    },
  ];

  return (
    <section className="page-wrap">
      <div className="mb-8 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-950">Popular Categories</h2>
        <p className="text-slate-600">High-demand areas for students and professionals.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((element) => (
          <div key={element.id} className="card-surface flex gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-xl text-brand-700">
              {element.icon}
            </div>
            <div>
              <p className="font-bold text-slate-950">{element.title}</p>
              <p className="mt-1 text-sm text-slate-500">{element.subTitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PopularCategories;
