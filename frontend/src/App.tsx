import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { FarmerLayout } from './layouts/FarmerLayout';

// Common Components
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Farmer Pages
import { Home } from './pages/farmer/Home';
import { ProductListing } from './pages/farmer/ProductListing';
import { ProductDetail } from './pages/farmer/ProductDetail';
import { Cart } from './pages/farmer/Cart';
import { Checkout } from './pages/farmer/Checkout';
import { OrderSuccess } from './pages/farmer/OrderSuccess';
import { OrderDetail } from './pages/farmer/OrderDetail';
import { MyOrders } from './pages/farmer/MyOrders';
import { Account } from './pages/farmer/Account';
import { SearchPage } from './pages/farmer/SearchPage';
import { CategoryProducts } from './pages/farmer/CategoryProducts';
import { RemedyDetail } from './pages/farmer/RemedyDetail';
import { RegisterProfile } from './pages/farmer/RegisterProfile';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Dealer / Krishi Kendra Pages
import { DealerLogin } from './pages/dealer/DealerLogin';
import { DealerOnboard } from './pages/dealer/DealerOnboard';
import { DealerDashboard } from './pages/dealer/DealerDashboard';

// Super Admin Master Workspace
import { AdminWorkspace } from './pages/admin/AdminWorkspace';

// Rider Delivery Web Portal
import { RiderDeliveryScreen } from './pages/rider/RiderDeliveryScreen';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Rider Delivery Portal (Token-authorized, full-screen mobile view) */}
      <Route path="/rider/order/:orderId" element={<RiderDeliveryScreen />} />

      {/* Farmer Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/farmer/register-profile" element={<RegisterProfile />} />
      <Route path="/register-profile" element={<RegisterProfile />} />

      {/* Dealer / Krishi Kendra Partner Routes */}
      <Route path="/dealer/login" element={<DealerLogin />} />
      <Route path="/dealer/onboard" element={<DealerOnboard />} />
      <Route
        path="/dealer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['SELLER', 'SUPER_ADMIN', 'ADMIN']}>
            <DealerDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/dealer/workspace" element={<Navigate to="/dealer/dashboard" replace />} />
      <Route
        path="/dealer/orders"
        element={
          <ProtectedRoute allowedRoles={['SELLER', 'SUPER_ADMIN', 'ADMIN']}>
            <DealerDashboard initialTab="orders" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dealer/products"
        element={
          <ProtectedRoute allowedRoles={['SELLER', 'SUPER_ADMIN', 'ADMIN']}>
            <DealerDashboard initialTab="products" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dealer/products/new"
        element={
          <ProtectedRoute allowedRoles={['SELLER', 'SUPER_ADMIN', 'ADMIN']}>
            <DealerDashboard initialTab="products" openAddProduct={true} />
          </ProtectedRoute>
        }
      />

      {/* Super Admin Master Desk */}
      <Route
        path="/admin/workspace"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <AdminWorkspace />
          </ProtectedRoute>
        }
      />
      <Route path="/admin" element={<Navigate to="/admin/workspace" replace />} />
      <Route path="/admin/*" element={<Navigate to="/admin/workspace" replace />} />

      {/* Customer / Farmer Storefront Routes */}
      <Route path="/" element={<FarmerLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<ProductListing />} />
        <Route path="products/:slug" element={<ProductDetail />} />
        <Route path="remedy/:slug" element={<RemedyDetail />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="category/:categorySlug" element={<CategoryProducts />} />
        <Route path="cart" element={<Cart />} />
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="order-success/:orderId"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route path="account" element={<Account />} />
        <Route path="profile" element={<Account />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
