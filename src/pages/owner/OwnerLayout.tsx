import { Outlet } from "react-router-dom";
import OwnerSidebar from "./OwnerSidebar";

function OwnerLayout() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(126,22,38,0.16),transparent_30%),linear-gradient(180deg,#090203_0%,#120406_48%,#090203_100%)] text-[#fff6f4]">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <OwnerSidebar />
        <section className="min-w-0 flex-1 px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          <Outlet />
        </section>
      </div>
    </main>
  );
}

export default OwnerLayout;
