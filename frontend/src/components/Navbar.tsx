import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); nav('/'); };

  return (
    <header style={{
      background: 'var(--surface)', borderBottom: '1.5px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--accent)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14,
          }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>Stock store</span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/shop" style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            fontSize: 14, fontWeight: 500, color: 'var(--text-muted)',
            transition: 'color 0.15s',
          }}>В магазин</Link>

          <Link to="/cart" style={{ position: 'relative', padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: 20 }}>🛒</span>
            {count > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 8,
                background: 'var(--accent)', color: '#fff',
                borderRadius: 99, fontSize: 10, fontWeight: 700,
                padding: '1px 5px', lineHeight: 1.4,
              }}>{count}</span>
            )}
          </Link>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', background: 'var(--surface2)',
                border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                fontSize: 14, fontWeight: 500,
              }}>
                <span style={{
                  width: 26, height: 26, background: 'var(--accent)', borderRadius: '50%',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>{user.full_name[0].toUpperCase()}</span>
                {user.full_name.split(' ')[0]}
              </button>
              {menuOpen && (
                <div onClick={() => setMenuOpen(false)} style={{
                  position: 'absolute', right: 0, top: 48,
                  background: 'var(--surface)', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
                  minWidth: 180, overflow: 'hidden', zIndex: 200,
                }}>
                  <Link to="/orders" style={menuItem}>Мои заказы</Link>
                  <Link to="/profile" style={menuItem}>Профиль</Link>
                  {/*
                      {user.role === 'admin' && (
                          <Link to="/admin" style={menuItem}>⚙️ Админ панель</Link>
                      )}
                      */
                  }
                  <div style={{ height: 1, background: 'var(--border)' }} />
                  <button onClick={handleLogout} style={{ ...menuItem, width: '100%', textAlign: 'left', color: 'var(--danger)' }}>
                    Выйти из аккаунта
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                fontSize: 14, fontWeight: 500, color: 'var(--text-muted)',
              }}>Логин</Link>
              <Link to="/register" style={{
                padding: '8px 18px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)', color: '#fff',
                fontSize: 14, fontWeight: 600,
              }}>Зарегистрироваться</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

const menuItem: React.CSSProperties = {
  display: 'block', padding: '11px 16px',
  fontSize: 14, fontWeight: 500, color: 'var(--text)',
  background: 'transparent', border: 'none', cursor: 'pointer',
  transition: 'background 0.1s',
};
