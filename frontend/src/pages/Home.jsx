import HeroSection from "../components/Home/HeroSection";
import FeaturesSection from "../components/Home/FeaturesSection";
import CategoriesSection from "../components/Home/CategoriesSection";
import TestimonialsSection from "../components/Home/TestimonialsSection";
import CTASection from "../components/Home/CTASection";
import styles from "./Home.module.css";

const Home = () => {
  return (
    <div className={styles.page}>

      {/* Professional Modular Components */}
      <HeroSection />
      <FeaturesSection />
      <CategoriesSection />
      <TestimonialsSection />
      <CTASection />

    </div>
  );
};

export default Home;
