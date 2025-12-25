import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { UserLayout } from "@/layouts/UserLayout";
import { UserHomePage } from "@/pages/user/UserHomePage";
import { TenantsPage } from "@/pages/user/TenantsPage";
import { TenantDetailPage } from "@/pages/user/TenantDetailPage";
import { CartPage } from "@/pages/user/CartPage";
import { CheckoutPage } from "@/pages/user/CheckoutPage";
import { OrderHistoryPage } from "@/pages/user/OrderHistoryPage";
import { ProfilePage } from "@/pages/user/ProfilePage";
import { OrderTrackingPage } from "@/pages/user/OrderTrackingPage";
import { UserOrdersPage } from "@/pages/user/UserOrdersPage";
import { SellerLayout } from "@/layouts/SellerLayout";
import { SellerDashboard } from "@/pages/seller/SellerDashboard";
import { SellerProducts } from "@/pages/seller/SellerProducts";
import { SellerOrders } from "@/pages/seller/SellerOrders";
import { SellerRevenue } from "@/pages/seller/SellerRevenue";
import { SellerStore } from "@/pages/seller/SellerStore";
import { AdminLayout } from '@/layouts/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminTenants } from '@/pages/admin/AdminTenants';
import { AdminProducts } from '@/pages/admin/AdminProducts';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminPayments } from '@/pages/admin/AdminPayments';
import { AdminReports } from '@/pages/admin/AdminReports';
import { AdminWithdrawals } from '@/pages/admin/AdminWithdrawals';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />

            {/* User Routes */}
            <Route path="/user" element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserLayout />
              </ProtectedRoute>
            }>
              <Route index element={<UserHomePage />} />
              <Route path="tenants" element={<TenantsPage />} />
              <Route path="tenant/:id" element={<TenantDetailPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="orders" element={<UserOrdersPage />} />
              <Route path="history" element={<OrderHistoryPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="order/:orderId" element={<OrderTrackingPage />} />
            </Route>

            {/* Seller Routes */}
            <Route path="/seller" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<SellerDashboard />} />
              <Route path="products" element={<SellerProducts />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="revenue" element={<SellerRevenue />} />
              <Route path="store" element={<SellerStore />} />
              <Route path="settings" element={
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-2">Settings</h2>
                  <p className="text-muted-foreground">Coming Soon...</p>
                </div>
              } />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="tenants" element={<AdminTenants />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

