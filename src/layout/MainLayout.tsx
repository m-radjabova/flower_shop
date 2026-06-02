import { Outlet } from "react-router-dom";
import Header from "../components/home/Header";
import websiteBackground from "../assets/flower_shop.png";
import Footer from "../components/home/Footer";

export default function MainLayout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070102] text-[#fff6f4]">
      <img
        src={websiteBackground}
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  );
}
