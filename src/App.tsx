import { Navigate, Route, Routes } from "react-router-dom";
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
import ShopDetail from "./pages/catalog/ShopDetail";
import Admin from "./pages/admin/Admin";
import HelloAdmin from "./pages/admin/Helloadmin";
import AdminApplications from "./pages/admin/applications/AdminApplications";
import AdminCategories from "./pages/admin/categories/AdminCategories";
import AdminShops from "./pages/admin/shops/AdminShops";
import AdminUsers from "./pages/admin/users/AdminUsers";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Register from "./pages/login/Register";
import OwnerOrders from "./pages/owner/OwnerOrders";
import Profile from "./pages/profile/Profile";

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
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
            path="/owner/orders"
            element={(
              <ProtectedRoute role={["owner", "admin"]}>
                <OwnerOrders />
              </ProtectedRoute>
            )}
          />
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
