import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Home() {
  const { user } = useAuth();
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #1a3d2e 0%, #2d6a4f 100%)',
        color: '#fff', padding: '80px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-1px', marginBottom: 20, lineHeight: 1.15 }}>
            Качественные продукты<br />прямо в ваш дом
          </h1>
          <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 36, lineHeight: 1.6 }}>
            Просматривайте наш обширный каталог, здесь вы найдете отличные цены и выгодные предложения на качественные товары
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/shop" style={{
              padding: '14px 32px', background: '#fff', color: 'var(--accent)',
              borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 16,
            }}>В магазин →</Link>
            {!user && (
              <Link to="/register" style={{
                padding: '14px 32px', background: 'rgba(255,255,255,0.15)',
                color: '#fff', borderRadius: 'var(--radius-sm)',
                fontWeight: 600, fontSize: 16, border: '1.5px solid rgba(255,255,255,0.3)',
              }}>Создать акканут</Link>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, marginBottom: 48 }}>Почему мы?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {[
            { icon: '📦', title: 'Широкий выбор', desc: 'Электроника, инструменты, одежда, еда и много чего еще - все в одном месте' },
            { icon: '🚚', title: 'Быстрая доставка', desc: 'Заказы быстро доставляются на ваши подтвержденные адресса' },
            { icon: '🔒', title: 'Защищенные заказы', desc: 'Ваши заказы отслеживаются и защищаются от начала и до конца' },
            { icon: '💚', title: 'Легкие возвраты', desc: 'Отменяйте сделанные заказы из личного кабинета мгновенно' },
          ].map(f => (
            <div key={f.title} style={{
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '28px 24px', textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
