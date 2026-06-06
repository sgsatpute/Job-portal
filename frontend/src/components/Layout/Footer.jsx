import { useContext } from "react";
import { FaBriefcase } from "react-icons/fa";
import { Context } from "../../main";

const Footer = () => {
  const { isAuthorized } = useContext(Context);

  if (!isAuthorized) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <span className="text-brand-600">
            <FaBriefcase />
          </span>
          JobPortal
        </div>
        <p>Developed by Saurav Satpute. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
