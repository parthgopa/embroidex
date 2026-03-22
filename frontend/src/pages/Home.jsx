import { Link } from "react-router-dom";
import { 
  MdDesignServices, 
  MdFlashOn, 
  MdAttachMoney, 
  MdSecurity, 
  MdVerified, 
  MdStars,
  MdTrendingUp,
  MdPalette,
  MdCategory,
  MdPeople
} from "react-icons/md";
import { FaQuoteLeft } from "react-icons/fa";
import styles from "./Home.module.css";

const Home = () => {
  return (
    <div className={styles.page}>

      {/* SECTION 1: HERO SECTION */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Discover Premium <span className={styles.highlight}>Embroidery Designs</span>
              </h1>

              <p className={styles.heroSubtitle}>
                The world's largest marketplace for high-quality embroidery files. 
                Buy from talented creators, sell your designs, and bring your creative visions to life.
              </p>

              <div className={styles.heroStats}>
                <div className={styles.statItem}>
                  <MdDesignServices className={styles.statIcon} />
                  <div>
                    <strong>10,000+</strong>
                    <span>Designs</span>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <MdPeople className={styles.statIcon} />
                  <div>
                    <strong>5,000+</strong>
                    <span>Creators</span>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <MdTrendingUp className={styles.statIcon} />
                  <div>
                    <strong>50,000+</strong>
                    <span>Downloads</span>
                  </div>
                </div>
              </div>

              <div className={styles.heroButtons}>
                <Link to="/explore" className="btn-primary-custom">
                  <MdPalette style={{ marginRight: '8px' }} />
                  Explore Designs
                </Link>
                <Link to="/seller/register" className="btn-outline-custom">
                  <MdAttachMoney style={{ marginRight: '8px' }} />
                  Start Selling
                </Link>
              </div>
            </div>

            <div className={styles.heroImage}>
              <div className={styles.heroImagePlaceholder}>
                <MdDesignServices className={styles.heroImageIcon} />
                <p>Premium Embroidery Designs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FEATURES & BENEFITS */}
      <section className={styles.featuresSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Why Choose Embroidex?</h2>
            <p className={styles.sectionSubtitle}>
              The ultimate marketplace trusted by embroidery enthusiasts worldwide
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <MdDesignServices className={styles.featureIcon} />
              </div>
              <h3>Premium Quality</h3>
              <p>Curated collection of high-quality embroidery designs from talented creators worldwide. Every design meets our strict quality standards.</p>
              <ul className={styles.featureList}>
                <li>✓ Professional-grade designs</li>
                <li>✓ Multiple file formats</li>
                <li>✓ High-resolution previews</li>
              </ul>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <MdFlashOn className={styles.featureIcon} />
              </div>
              <h3>Instant Download</h3>
              <p>Purchase and download your designs immediately. No waiting, no delays. Start your embroidery project right away with instant access.</p>
              <ul className={styles.featureList}>
                <li>✓ Immediate file access</li>
                <li>✓ Unlimited re-downloads</li>
                <li>✓ Cloud storage backup</li>
              </ul>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <MdAttachMoney className={styles.featureIcon} />
              </div>
              <h3>Earn Money</h3>
              <p>Sell your embroidery designs and reach thousands of buyers looking for unique patterns. Set your own prices and keep 80% of sales.</p>
              <ul className={styles.featureList}>
                <li>✓ Global marketplace reach</li>
                <li>✓ Competitive commission rates</li>
                <li>✓ Monthly payouts</li>
              </ul>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <MdSecurity className={styles.featureIcon} />
              </div>
              <h3>Secure Payments</h3>
              <p>Safe and encrypted transactions with multiple payment options. Your financial information is protected with industry-standard security.</p>
              <ul className={styles.featureList}>
                <li>✓ SSL encrypted checkout</li>
                <li>✓ Multiple payment methods</li>
                <li>✓ Buyer protection guarantee</li>
              </ul>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <MdVerified className={styles.featureIcon} />
              </div>
              <h3>Quality Approved</h3>
              <p>Every design is manually reviewed and approved by our expert team to ensure the highest standards and customer satisfaction.</p>
              <ul className={styles.featureList}>
                <li>✓ Manual quality checks</li>
                <li>✓ File integrity verification</li>
                <li>✓ Design authenticity guarantee</li>
              </ul>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <MdStars className={styles.featureIcon} />
              </div>
              <h3>Community Support</h3>
              <p>Join a vibrant community of embroidery artists and enthusiasts. Get help, share tips, and connect with fellow creators.</p>
              <ul className={styles.featureList}>
                <li>✓ Active community forums</li>
                <li>✓ Expert support team</li>
                <li>✓ Tutorial resources</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: CATEGORIES & COLLECTIONS */}
      <section className={styles.categoriesSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Explore by Category</h2>
            <p className={styles.sectionSubtitle}>
              Find the perfect design for your project from our extensive collection
            </p>
          </div>

          <div className={styles.categoriesGrid}>
            {[
              { name: "Floral & Nature", count: "2,500+ designs", color: "#10b981" },
              { name: "Animals & Wildlife", count: "1,800+ designs", color: "#f59e0b" },
              { name: "Geometric Patterns", count: "1,200+ designs", color: "#3b82f6" },
              { name: "Vintage & Classic", count: "950+ designs", color: "#8b5cf6" },
              { name: "Modern & Abstract", count: "1,400+ designs", color: "#ec4899" },
              { name: "Seasonal & Holiday", count: "800+ designs", color: "#ef4444" },
              { name: "Monograms & Letters", count: "600+ designs", color: "#06b6d4" },
              { name: "Cultural & Traditional", count: "700+ designs", color: "#f97316" }
            ].map((category, index) => (
              <Link to="/explore" key={index} className={styles.categoryCard}>
                <div className={styles.categoryIcon} style={{ backgroundColor: category.color }}>
                  <MdCategory />
                </div>
                <div className={styles.categoryInfo}>
                  <h4>{category.name}</h4>
                  <p>{category.count}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className={styles.ctaBox}>
            <h3>Can't find what you're looking for?</h3>
            <p>Browse our complete collection or use advanced filters to discover the perfect design</p>
            <Link to="/explore" className="btn-primary-custom">
              View All Categories
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4: TESTIMONIALS & SUCCESS STORIES */}
      <section className={styles.testimonialsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>What Our Community Says</h2>
            <p className={styles.sectionSubtitle}>
              Trusted by thousands of embroidery enthusiasts and professionals
            </p>
          </div>

          <div className={styles.testimonialsGrid}>
            <div className={styles.testimonialCard}>
              <FaQuoteLeft className={styles.quoteIcon} />
              <p className={styles.testimonialText}>
                "Embroidex has completely transformed my embroidery business. The quality of designs is outstanding, and the instant download feature saves me so much time. I've found designs here that I couldn't find anywhere else!"
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>SM</div>
                <div>
                  <strong>Sarah Mitchell</strong>
                  <span>Professional Embroiderer</span>
                </div>
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <FaQuoteLeft className={styles.quoteIcon} />
              <p className={styles.testimonialText}>
                "As a seller, I've been able to reach customers worldwide and earn a steady income from my designs. The platform is easy to use, and the support team is always helpful. Highly recommend to any designer!"
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>RK</div>
                <div>
                  <strong>Rajesh Kumar</strong>
                  <span>Design Creator</span>
                </div>
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <FaQuoteLeft className={styles.quoteIcon} />
              <p className={styles.testimonialText}>
                "The variety and quality of embroidery designs on Embroidex is unmatched. I've purchased over 50 designs for my projects, and every single one has been perfect. The customer service is excellent too!"
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>EJ</div>
                <div>
                  <strong>Emily Johnson</strong>
                  <span>Hobbyist & Crafter</span>
                </div>
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <FaQuoteLeft className={styles.quoteIcon} />
              <p className={styles.testimonialText}>
                "I started selling my designs on Embroidex 6 months ago, and it's been an incredible journey. The platform handles everything from payments to file delivery, so I can focus on creating. My sales have exceeded expectations!"
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>ML</div>
                <div>
                  <strong>Maria Lopez</strong>
                  <span>Independent Designer</span>
                </div>
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <FaQuoteLeft className={styles.quoteIcon} />
              <p className={styles.testimonialText}>
                "The search and filter features make it so easy to find exactly what I need. The preview images are detailed, and the file quality is always top-notch. This is my go-to marketplace for all embroidery designs!"
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>DW</div>
                <div>
                  <strong>David Wilson</strong>
                  <span>Small Business Owner</span>
                </div>
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <FaQuoteLeft className={styles.quoteIcon} />
              <p className={styles.testimonialText}>
                "Embroidex has helped me grow my embroidery side hustle into a full-time business. The community is supportive, the designs are high quality, and the earning potential is real. Thank you, Embroidex!"
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>AP</div>
                <div>
                  <strong>Anita Patel</strong>
                  <span>Full-Time Seller</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.statsBar}>
            <div className={styles.statBarItem}>
              <strong>4.9/5</strong>
              <span>Average Rating</span>
            </div>
            <div className={styles.statBarItem}>
              <strong>15,000+</strong>
              <span>Happy Customers</span>
            </div>
            <div className={styles.statBarItem}>
              <strong>98%</strong>
              <span>Satisfaction Rate</span>
            </div>
            <div className={styles.statBarItem}>
              <strong>24/7</strong>
              <span>Support Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: CALL TO ACTION & GET STARTED */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Get Started?</h2>
            <p className={styles.ctaSubtitle}>
              Join thousands of embroidery enthusiasts and start your creative journey today
            </p>

            <div className={styles.ctaCards}>
              <div className={styles.ctaCard}>
                <h3>For Buyers</h3>
                <p>Discover and download premium embroidery designs instantly</p>
                <ul className={styles.ctaList}>
                  <li>✓ Browse 10,000+ designs</li>
                  <li>✓ Instant download access</li>
                  <li>✓ Multiple file formats</li>
                  <li>✓ Secure payment options</li>
                  <li>✓ 7-day money-back guarantee</li>
                </ul>
                <Link to="/explore" className="btn-primary-custom">
                  Start Exploring
                </Link>
              </div>

              <div className={styles.ctaCard}>
                <h3>For Sellers</h3>
                <p>Turn your embroidery designs into a profitable business</p>
                <ul className={styles.ctaList}>
                  <li>✓ Reach global audience</li>
                  <li>✓ Keep 80% of sales</li>
                  <li>✓ Easy upload process</li>
                  <li>✓ Monthly payouts</li>
                  <li>✓ Marketing support included</li>
                </ul>
                <Link to="/seller/register" className="btn-primary-custom">
                  Start Selling
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.faqSection}>
            <h3 className={styles.faqTitle}>Frequently Asked Questions</h3>
            
            <div className={styles.faqGrid}>
              <div className={styles.faqItem}>
                <h4>What file formats do you support?</h4>
                <p>We support all major embroidery formats including DST, PES, JEF, EXP, HUS, VIP, VP3, XXX, and more. Most designs are provided in multiple formats for maximum compatibility with your embroidery machine.</p>
              </div>

              <div className={styles.faqItem}>
                <h4>How do I start selling my designs?</h4>
                <p>Simply create an account, register as a seller, and upload your designs with preview images. Our team will review your submission within 24-48 hours. Once approved, your designs will be available for purchase immediately.</p>
              </div>

              <div className={styles.faqItem}>
                <h4>What payment methods do you accept?</h4>
                <p>We accept all major credit cards, debit cards, UPI, net banking, and digital wallets. All transactions are processed through secure, encrypted payment gateways to protect your financial information.</p>
              </div>

              <div className={styles.faqItem}>
                <h4>Can I download designs multiple times?</h4>
                <p>Yes! Once you purchase a design, you have unlimited download access. You can re-download your purchased designs anytime from your account dashboard, even if you lose the original files.</p>
              </div>

              <div className={styles.faqItem}>
                <h4>What is your refund policy?</h4>
                <p>If you receive a faulty file or the design doesn't match the description, contact us within 7 days for a full refund. We also offer exchanges if you're not satisfied with your purchase. Customer satisfaction is our top priority.</p>
              </div>

              <div className={styles.faqItem}>
                <h4>Are designs licensed for commercial use?</h4>
                <p>Licensing varies by design and seller. Each product page clearly states the license type. Many designs include commercial licenses, allowing you to use them for business purposes. Always check the specific terms before purchasing.</p>
              </div>
            </div>

            <div className={styles.faqCta}>
              <p>Still have questions?</p>
              <button className="btn-outline-custom">Contact Support</button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
