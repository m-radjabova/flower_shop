import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import IsLoading from "./components/IsLoading";
import NotFound from "./components/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import AuthLayout from "./layout/AuthLayout";
import MainLayout from "./layout/MainLayout";
import BouquetCatalog from "./pages/catalog/BouquetCatalog";
import BouquetDetail from "./pages/catalog/BouquetDetail";
import Favorites from "./pages/catalog/Favorites";
import BouquetReviews from "./pages/catalog/BouquetReviews";
import Cart from "./pages/catalog/Cart";
import DeliveryCheckout from "./pages/catalog/DeliveryCheckout";
import Shops from "./pages/catalog/Shops";
import ShopDetail from "./pages/catalog/ShopDetail";
import Admin from "./pages/admin/Admin";
import AdminChats from "./pages/admin/chats/AdminChats";
import HelloAdmin from "./pages/admin/Helloadmin";
import AdminApplications from "./pages/admin/applications/AdminApplications";
import AdminCategories from "./pages/admin/categories/AdminCategories";
import AdminShops from "./pages/admin/shops/AdminShops";
import AdminUsers from "./pages/admin/users/AdminUsers";
import Login from "./pages/login/Login";
import Register from "./pages/login/Register";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerBouquetEditor from "./pages/owner/OwnerBouquetEditor";
import OwnerLayout from "./pages/owner/OwnerLayout";
import OwnerBouquets from "./pages/owner/OwnerBouquets";
import OwnerOrders from "./pages/owner/OwnerOrders";
import OwnerReviews from "./pages/owner/OwnerReviews";
import OwnerShop from "./pages/owner/OwnerShop";
import OwnerSupport from "./pages/owner/OwnerSupport";
import Profile from "./pages/profile/Profile";
import ShopApplicationPage from "./pages/profile/ShopApplicationPage";
import Home from "./pages/home/Home";
import Occasions from "./pages/home/Occasions";
import AboutUs from "./pages/home/AboutUs";

function App() {
  const [isBooting, setIsBooting] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("flower-shop-app-ready") !== "true";
  });

  useEffect(() => {
    if (!isBooting) return;

    const timeoutId = window.setTimeout(() => {
      sessionStorage.setItem("flower-shop-app-ready", "true");
      setIsBooting(false);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [isBooting]);

  if (isBooting) {
    return <IsLoading />;
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/occasions" element={<Occasions />} />
          <Route
            path="/favorites"
            element={(
              <ProtectedRoute role={["customer", "owner", "admin"]}>
                <Favorites />
              </ProtectedRoute>
            )}
          />
          <Route path="/bouquets" element={<BouquetCatalog />} />
          <Route path="/bouquets/:bouquetId" element={<BouquetDetail />} />
          <Route path="/bouquets/:bouquetId/reviews" element={<BouquetReviews />} />
          <Route path="/shops" element={<Shops />} />
          <Route path="/shops/:slug" element={<ShopDetail />} />
          <Route
            path="/cart"
            element={(
              <ProtectedRoute role={["customer", "owner", "admin"]}>
                <Cart />
              </ProtectedRoute>
            )}
          />
          <Route path="/delivery" element={<DeliveryCheckout />} />
          <Route
            path="/profile"
            element={(
              <ProtectedRoute role={["customer", "owner", "admin"]}>
                <Profile />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/shop-application"
            element={(
              <ProtectedRoute role={["customer", "owner", "admin"]}>
                <ShopApplicationPage />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route
          path="/owner"
          element={(
            <ProtectedRoute role={["owner", "admin"]}>
              <OwnerLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="shop" element={<OwnerShop />} />
          <Route path="bouquets" element={<OwnerBouquets />} />
          <Route path="bouquets/create" element={<OwnerBouquetEditor />} />
          <Route path="bouquets/:bouquetId/edit" element={<OwnerBouquetEditor />} />
          <Route path="orders" element={<OwnerOrders />} />
          <Route path="reviews" element={<OwnerReviews />} />
          <Route path="support" element={<OwnerSupport />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route
          path="/admin"
          element={(
            <ProtectedRoute role="admin">
              <Admin />
            </ProtectedRoute>
          )}
        >
          <Route index element={<HelloAdmin />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="shops" element={<AdminShops />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="chats" element={<AdminChats />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/sign-up" element={<Navigate to="/register" replace />} />
      </Routes>
    </>
  );
}

export default App;
