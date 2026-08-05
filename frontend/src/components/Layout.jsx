import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingCartWidget from "./FloatingCartWidget";

const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <div>{children}</div>
      <FloatingCartWidget />
      <Footer />
    </>
  );
};

export default Layout;