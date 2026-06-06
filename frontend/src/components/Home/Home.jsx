import HeroSection from "./HeroSection";
import PopularCategories from "./PopularCategories";
import PopularCompanies from "./PopularCompanies";
import HowItWorks from "./HowItWorks";

const Home = () => {
  return (
    <main className="bg-slate-50">
      <HeroSection />
      <PopularCategories />
      <PopularCompanies />
      <HowItWorks />
    </main>
  );
};

export default Home;
