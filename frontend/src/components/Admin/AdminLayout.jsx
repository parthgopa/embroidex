import { useState } from "react";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import AdminFooter from "./AdminFooter";
import styles from "./AdminLayout.module.css";

const AdminLayout = ({ children, stats, onLogout }) => {
  return (
    <div className={styles.layout}>
      <AdminNavbar onLogout={onLogout} />
      
      <div className={styles.container}>
        <AdminSidebar stats={stats} />
        
        <main className={styles.main}>
          {children}
        </main>
      </div>

      <AdminFooter />
    </div>
  );
};

export default AdminLayout;
