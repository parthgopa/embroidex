import styles from "./AdminFooter.module.css";

const AdminFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <p className={styles.footerText}>
          © {currentYear} Embroidex Admin Panel. All rights reserved.
        </p>
        <div className={styles.footerLinks}>
          <a href="#" className={styles.footerLink}>Privacy Policy</a>
          <span className={styles.separator}>•</span>
          <a href="#" className={styles.footerLink}>Terms of Service</a>
          <span className={styles.separator}>•</span>
          <a href="#" className={styles.footerLink}>Support</a>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;
