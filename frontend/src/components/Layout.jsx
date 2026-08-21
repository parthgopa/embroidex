import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingCartWidget from "./FloatingCartWidget";

const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 120px)" }}>
        {children || <Outlet />}
      </main>
      <FloatingCartWidget />
      <Footer />
    </>
  );
};

export default Layout;