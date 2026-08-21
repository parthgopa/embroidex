import { useState } from "react";
import { Link } from "react-router-dom";
import { MdArrowForward, MdCheckCircle, MdExpandMore, MdExpandLess } from "react-icons/md";
import styles from "./CTASection.module.css";

const CTASection = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const buyerFeatures = [
    "Browse 10,000+ designs",
    "Instant download access",
    "Multiple file formats",
    "Secure payment options",
    "7-day money-back guarantee"
  ];

  const sellerFeatures = [
    "Reach global audience",
    "Keep 80% of sales",
    "Easy upload process",
    "Monthly payouts",
    "Marketing support included"
  ];

  const faqs = [
    {
      question: "What file formats do you support?",
      answer: "We support all major embroidery formats including DST, PES, JEF, EXP, HUS, VIP, VP3, XXX, and more. Most designs are provided in multiple formats for maximum compatibility with your embroidery machine."
    },
    {
      question: "How do I start selling my designs?",
      answer: "Simply create an account, register as a seller, and upload your designs with preview images. Our team will review your submission within 24-48 hours. Once approved, your designs will be available for purchase immediately."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, UPI, net banking, and digital wallets. All transactions are processed through secure, encrypted payment gateways to protect your financial information."
    },
    {
      question: "Can I download designs multiple times?",
      answer: "Yes! Once you purchase a design, you have unlimited download access. You can re-download your purchased designs anytime from your account dashboard, even if you lose the original files."
    },
    {
      question: "What is your refund policy?",
      answer: "If you receive a faulty file or the design doesn't match the description, contact us within 7 days for a full refund. We also offer exchanges if you're not satisfied with your purchase. Customer satisfaction is our top priority."
    },
    {
      question: "Are designs licensed for commercial use?",
      answer: "Licensing varies by design and seller. Each product page clearly states the license type. Many designs include commercial licenses, allowing you to use them for business purposes. Always check the specific terms before purchasing."
    }
  ];

  return (
    <section className={styles.ctaSection}>
      <div className="container">
        {/* Main CTA */}
        {/* <div className={styles.ctaHero}>
          <span className={styles.ctaBadge}>Get Started Today</span>
          <h2 className={styles.ctaTitle}>Ready to Get Started?</h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of embroidery enthusiasts and start your creative journey today
          </p>
        </div> */}

        {/* Dual Cards */}
        {/* <div className={styles.ctaCards}>
          <div className={styles.ctaCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>🛍️</div>
              <h3 className={styles.cardTitle}>For Buyers</h3>
              <p className={styles.cardDescription}>
                Discover and download premium embroidery designs instantly
              </p>
            </div>

            <ul className={styles.featureList}>
              {buyerFeatures.map((feature, index) => (
                <li key={index} className={styles.featureItem}>
                  <MdCheckCircle className={styles.checkIcon} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link to="/explore" className={`btn-primary-custom ${styles.cardButton}`}>
              Start Buying
              <MdArrowForward />
            </Link>
          </div>

          <div className={`${styles.ctaCard} ${styles.featured}`}>
            <div className={styles.featuredBadge}>Most Popular</div>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>💰</div>
              <h3 className={styles.cardTitle}>For Sellers</h3>
              <p className={styles.cardDescription}>
                Turn your embroidery designs into a profitable business
              </p>
            </div>

            <ul className={styles.featureList}>
              {sellerFeatures.map((feature, index) => (
                <li key={index} className={styles.featureItem}>
                  <MdCheckCircle className={styles.checkIcon} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link to="/seller/register" className={`btn-primary-custom ${styles.cardButton}`}>
              Start Selling
              <MdArrowForward />
            </Link>
          </div>
        </div> */}

        {/* FAQ Section - Vertical Accordion */}
        <div className={styles.faqSection}>
          <div className={styles.faqHeader}>
            <h3 className={styles.faqTitle}>Frequently Asked Questions</h3>
            <p className={styles.faqSubtitle}>Everything you need to know about Embroidex</p>
          </div>

          <div className={styles.faqVerticalList}>
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`${styles.faqItemAccordion} ${isOpen ? styles.faqItemOpen : ""}`}
                >
                  <button
                    type="button"
                    className={styles.faqQuestionBtn}
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.faqQuestionText}>{faq.question}</span>
                    <span className={styles.faqChevron}>
                      {isOpen ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className={styles.faqAnswerBody}>
                      <p className={styles.faqAnswerText}>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.faqCta}>
            <p className={styles.faqCtaText}>Still have questions?</p>
            <button className="btn-outline-custom">
              Contact Support
              <MdArrowForward style={{ marginLeft: '8px' }} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
