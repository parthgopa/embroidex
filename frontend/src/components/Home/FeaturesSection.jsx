import { MdDesignServices, MdFlashOn, MdAttachMoney, MdSecurity, MdVerified, MdStars } from "react-icons/md";
import styles from "./FeaturesSection.module.css";

const FeaturesSection = () => {
  const features = [
    {
      icon: <MdDesignServices />,
      title: "Premium Quality",
      description: "Curated collection of high-quality embroidery designs from talented creators worldwide. Every design meets our strict quality standards.",
      points: [
        "Professional-grade designs",
        "Multiple file formats",
        "High-resolution previews"
      ],
      color: "#6366f1"
    },
    {
      icon: <MdFlashOn />,
      title: "Instant Download",
      description: "Purchase and download your designs immediately. No waiting, no delays. Start your embroidery project right away with instant access.",
      points: [
        "Immediate file access",
        "Unlimited re-downloads",
        "Cloud storage backup"
      ],
      color: "#f59e0b"
    },
    {
      icon: <MdAttachMoney />,
      title: "Earn Money",
      description: "Sell your embroidery designs and reach thousands of buyers looking for unique patterns. Set your own prices and keep 80% of sales.",
      points: [
        "Global marketplace reach",
        "Competitive commission rates",
        "Monthly payouts"
      ],
      color: "#10b981"
    },
    {
      icon: <MdSecurity />,
      title: "Secure Payments",
      description: "Safe and encrypted transactions with multiple payment options. Your financial information is protected with industry-standard security.",
      points: [
        "SSL encrypted checkout",
        "Multiple payment methods",
        "Buyer protection guarantee"
      ],
      color: "#ef4444"
    },
    {
      icon: <MdVerified />,
      title: "Quality Approved",
      description: "Every design is manually reviewed and approved by our expert team to ensure the highest standards and customer satisfaction.",
      points: [
        "Manual quality checks",
        "File integrity verification",
        "Design authenticity guarantee"
      ],
      color: "#8b5cf6"
    },
    {
      icon: <MdStars />,
      title: "Community Support",
      description: "Join a vibrant community of embroidery artists and enthusiasts. Get help, share tips, and connect with fellow creators.",
      points: [
        "Active community forums",
        "Expert support team",
        "Tutorial resources"
      ],
      color: "#ec4899"
    }
  ];

  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Why Choose Us</span>
          <h2 className={styles.sectionTitle}>Everything You Need in One Platform</h2>
          <p className={styles.sectionSubtitle}>
            The ultimate marketplace trusted by embroidery enthusiasts worldwide
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIconWrapper} style={{ background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}dd 100%)` }}>
                {feature.icon}
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
              <ul className={styles.featureList}>
                {feature.points.map((point, idx) => (
                  <li key={idx}>
                    <span className={styles.checkIcon}>✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
