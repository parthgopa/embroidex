import { FaQuoteLeft } from "react-icons/fa";
import { MdStar } from "react-icons/md";
import styles from "./TestimonialsSection.module.css";

const TestimonialsSection = () => {
  const testimonials = [
    {
      text: "Embroidex has completely transformed my embroidery business. The quality of designs is outstanding, and the instant download feature saves me so much time. I've found designs here that I couldn't find anywhere else!",
      author: "Sarah Mitchell",
      role: "Professional Embroiderer",
      avatar: "SM",
      rating: 5
    },
    {
      text: "As a seller, I've been able to reach customers worldwide and earn a steady income from my designs. The platform is easy to use, and the support team is always helpful. Highly recommend to any designer!",
      author: "Rajesh Kumar",
      role: "Design Creator",
      avatar: "RK",
      rating: 5
    },
    {
      text: "The variety and quality of embroidery designs on Embroidex is unmatched. I've purchased over 50 designs for my projects, and every single one has been perfect. The customer service is excellent too!",
      author: "Emily Johnson",
      role: "Hobbyist & Crafter",
      avatar: "EJ",
      rating: 5
    },
    {
      text: "I started selling my designs on Embroidex 6 months ago, and it's been an incredible journey. The platform handles everything from payments to file delivery, so I can focus on creating. My sales have exceeded expectations!",
      author: "Maria Lopez",
      role: "Independent Designer",
      avatar: "ML",
      rating: 5
    },
    {
      text: "The search and filter features make it so easy to find exactly what I need. The preview images are detailed, and the file quality is always top-notch. This is my go-to marketplace for all embroidery designs!",
      author: "David Wilson",
      role: "Small Business Owner",
      avatar: "DW",
      rating: 5
    },
    {
      text: "Embroidex has helped me grow my embroidery side hustle into a full-time business. The community is supportive, the designs are high quality, and the earning potential is real. Thank you, Embroidex!",
      author: "Anita Patel",
      role: "Full-Time Seller",
      avatar: "AP",
      rating: 5
    }
  ];

  const stats = [
    { value: "4.9/5", label: "Average Rating" },
    { value: "15,000+", label: "Happy Customers" },
    { value: "98%", label: "Satisfaction Rate" },
    { value: "24/7", label: "Support Available" }
  ];

  return (
    <section className={styles.testimonialsSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Testimonials</span>
          <h2 className={styles.sectionTitle}>What Our Community Says</h2>
          <p className={styles.sectionSubtitle}>
            Trusted by thousands of embroidery enthusiasts and professionals
          </p>
        </div>

        <div className={styles.testimonialsGrid}>
          {testimonials.map((testimonial, index) => (
            <div key={index} className={styles.testimonialCard}>
              <div className={styles.quoteIcon}>
                <FaQuoteLeft />
              </div>
              
              <div className={styles.rating}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <MdStar key={i} className={styles.star} />
                ))}
              </div>

              <p className={styles.testimonialText}>{testimonial.text}</p>

              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>{testimonial.avatar}</div>
                <div className={styles.authorInfo}>
                  <strong className={styles.authorName}>{testimonial.author}</strong>
                  <span className={styles.authorRole}>{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.statsBar}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statBarItem}>
              <strong className={styles.statValue}>{stat.value}</strong>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
