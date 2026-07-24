import { 
  MdBarChart, 
  MdHourglassEmpty, 
  MdCheckCircle, 
  MdCancel, 
  MdPeople, 
  MdStorefront 
} from "react-icons/md";
import styles from "./AdminDashboardOverview.module.css";

const AdminDashboardOverview = ({ stats, designs, onReviewClick, BASE_URL }) => {
  const pendingDesigns = designs.filter((d) => d.status === "pending").slice(0, 5);

  return (
    <div className={styles.section}>
      <h1 className={styles.pageTitle}>Dashboard Overview</h1>

      <div className={styles.statsGrid}>
        <div className={`container-box ${styles.statCard}`}>
          <MdBarChart className={styles.statIcon} />
          <div className={styles.statValue}>{stats.totalDesigns}</div>
          <div className={styles.statLabel}>Total Designs</div>
        </div>

        <div className={`container-box ${styles.statCard} ${styles.statPending}`}>
          <MdHourglassEmpty className={styles.statIcon} />
          <div className={styles.statValue}>{stats.pendingDesigns}</div>
          <div className={styles.statLabel}>Pending Approval</div>
        </div>

        <div className={`container-box ${styles.statCard} ${styles.statApproved}`}>
          <MdCheckCircle className={styles.statIcon} />
          <div className={styles.statValue}>{stats.approvedDesigns}</div>
          <div className={styles.statLabel}>Approved</div>
        </div>

        <div className={`container-box ${styles.statCard} ${styles.statRejected}`}>
          <MdCancel className={styles.statIcon} />
          <div className={styles.statValue}>{stats.rejectedDesigns}</div>
          <div className={styles.statLabel}>Rejected</div>
        </div>

        <div className={`container-box ${styles.statCard}`}>
          <MdPeople className={styles.statIcon} />
          <div className={styles.statValue}>{stats.totalUsers}</div>
          <div className={styles.statLabel}>Total Users</div>
        </div>

        <div className={`container-box ${styles.statCard}`}>
          <MdStorefront className={styles.statIcon} />
          <div className={styles.statValue}>{stats.totalSellers}</div>
          <div className={styles.statLabel}>Sellers</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`container-box ${styles.activityBox}`}>
        <h3>Recent Pending Designs</h3>
        <div className={styles.activityList}>
          {pendingDesigns.map((design) => (
            <div key={design._id} className={styles.activityItem}>
              <img
                src={design.thumbnail || (design.thumbnail_path ? `${BASE_URL}/${design.thumbnail_path}` : "https://via.placeholder.com/150")}
                alt={design.title}
                className={styles.activityThumb}
              />
              <div className={styles.activityInfo}>
                <strong>{design.title}</strong>
                <small>by {design.seller_email}</small>
              </div>
              <button
                className="btn-primary-custom"
                onClick={() => onReviewClick(design)}
              >
                Review
              </button>
            </div>
          ))}
          {pendingDesigns.length === 0 && (
            <p className={styles.emptyText}>No pending designs</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
