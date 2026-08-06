import { useState, useEffect } from "react";
import HeroSection from "../components/Home/HeroSection";
import ShowcaseSections from "../components/Home/ShowcaseSections";
import CategoriesSection from "../components/Home/CategoriesSection";
import TestimonialsSection from "../components/Home/TestimonialsSection";
import CTASection from "../components/Home/CTASection";
import API from "../services/api";
import styles from "./Home.module.css";

const Home = () => {
  const [homepageData, setHomepageData] = useState({
    topCategories: [],
    showcases: []
  });

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        const res = await API.get("/homepage/data");
        setHomepageData(res.data);
      } catch (err) {
        console.error("Failed to fetch homepage data", err);
      }
    };
    fetchHomepageData();
  }, []);

  return (
    <div className={styles.page}>
      {/* Professional Modular Components */}
      <HeroSection topCategories={homepageData.topCategories} />
      
      {/* Dynamic Category Showcases (Replaces FeaturesSection) */}
      <ShowcaseSections showcases={homepageData.showcases} />

      <CategoriesSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};

export default Home;
