import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen text-[#fff6f4]">
      <Outlet />
    </div>
  );
}
