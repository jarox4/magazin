import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Cart } from './pages/Cart';
import { Login, Register } from './pages/Login';
import { Orders, OrderDetail } from './pages/Orders';
import { Profile } from './pages/Profile'
import type { ReactNode } from 'react';

function Protected({ children }: { children: ReactNode }) {
    console.log("trying authing the user")
  const { user, loading } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (loading) return null;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/orders" element={<Protected><Orders /></Protected>} />
          <Route path="/orders/:id" element={<Protected><OrderDetail /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer style={{
        borderTop: '1.5px solid var(--border)', padding: '24px',
        textAlign: 'center', fontSize: 14, color: 'var(--text-muted)',
        background: 'var(--surface)',
      }}>
        ®® За императора!!!
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
