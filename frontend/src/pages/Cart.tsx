import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiCreateOrder } from '../api/client';

export function Cart() {
  const { items, remove, setQty, total, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [phase, setPhase] = useState<'cart' | 'checkout'>('cart');
  const [form, setForm] = useState({ address: user?.address ?? '', phone: user?.phone ?? '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const placeOrder = async () => {
    if (!user) { nav('/login'); return; }
    setErr(''); setLoading(true);
    try {
      const order = await apiCreateOrder({
        address: form.address,
        phone: form.phone,
        notes: form.notes || undefined,
        items: items.map(i => ({ inventory_id: i.product.id, quantity: i.quantity })),
      });
      clear();
      nav(`/orders/${order.id}?success=1`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Order failed');
    } finally { setLoading(false); }
  };
      const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '');
      const local = digits.startsWith('7') || digits.startsWith('8')
        ? digits.slice(1)
        : digits;

      let result = '+7';
      if (local.length === 0) {
        // just +7
      } else if (local.length <= 3) {
        result += ` (${local}`;
      } else if (local.length <= 6) {
        result += ` (${local.slice(0, 3)}) ${local.slice(3)}`;
      } else if (local.length <= 8) {
        result += ` (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
      } else {
        const capped = local.slice(0, 10);
        result += ` (${capped.slice(0, 3)}) ${capped.slice(3, 6)}-${capped.slice(6, 8)}-${capped.slice(8)}`;
      }

      setForm(f => ({ ...f, phone: result }));
    };

  if (items.length === 0) return (
    <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🛒</div>
      <h2 style={{ fontSize: 22, marginBottom: 10 }}>Ваша корзина пуста</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Добавьте товары, чтобы начать</p>
      <Link to="/shop" style={{
        display: 'inline-block', padding: '12px 28px',
        background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)',
        fontWeight: 600, fontSize: 15,
      }}>В магазин</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>
        {phase === 'cart' ? 'Ваша корзина' : 'Оформление'}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
        {/* Left */}
        <div>
          {phase === 'cart' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map(({ product: p, quantity: q }) => (
                <div key={p.id} style={{
                  background: 'var(--surface)', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <div style={{
                    width: 64, height: 64, background: 'var(--surface2)',
                    borderRadius: 'var(--radius-sm)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
                  }}>📦</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{p.name}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.category_name}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setQty(p.id, q - 1)} style={qtyBtn}>−</button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{q}</span>
                    <button onClick={() => setQty(p.id, Math.min(q + 1, p.quantity))} style={qtyBtn}>+</button>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--accent)', minWidth: 80, textAlign: 'right' }}>
                    €{(p.price * q).toFixed(2)}
                  </span>
                  <button onClick={() => remove(p.id)} style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    fontSize: 18, cursor: 'pointer', padding: 4,
                  }}>×</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>Данные доставки</h3>
              {err && <div style={errBox}>{err}</div>}
              <label style={lbl}>Адрес доставки *</label>
              <input value={form.address} onChange={set('address')} placeholder="Полный адрес" style={{ marginBottom: 16 }} required />
              <label style={lbl}>Номер телефона *</label>
              <input value={form.phone} onChange={handlePhone} placeholder="+7(123)456-78-12" inputMode='tel' maxLength={18} />
              <label style={lbl}>Уточнения к заказу</label>
              <textarea value={form.notes} onChange={set('notes')} placeholder="Специальные инструкции(опционально)" rows={3} style={{
                resize: 'none', background: 'var(--surface)', border: '1.5px solid var(--border)',
                color: 'var(--text)', padding: '10px 14px', width: '100%',
                fontFamily: 'var(--font)', fontSize: 14, borderRadius: 'var(--radius-sm)',
              }} />
            </div>
          )}
        </div>

        {/* Summary */}
        <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>Итог заказа</h3>
          {items.map(({ product: p, quantity: q }) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>{p.name} × {q}</span>
              <span style={{ fontWeight: 500 }}>€{(p.price * q).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
            <span>Итого</span>
            <span style={{ color: 'var(--accent)' }}>€{total.toFixed(2)}</span>
          </div>

          {phase === 'cart' ? (
            <>
              <button onClick={() => { if (!user) { nav('/login'); return; } setPhase('checkout'); }} style={mainBtn}>
                {user ? 'Перейти к оплате →' : 'Войдите в аккаунт'}
              </button>
              <Link to="/shop" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 14, color: 'var(--text-muted)' }}>
                ←  Вернуться в магазин
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={placeOrder}
                disabled={loading || !form.address || !form.phone}
                style={{ ...mainBtn, opacity: (!form.address || !form.phone) ? 0.6 : 1 }}
              >
                {loading ? 'Подтверждаем заказ' : 'Подтвердить заказ'}
              </button>
              <button onClick={() => setPhase('cart')} style={{ ...mainBtn, marginTop: 8, background: 'var(--surface2)', color: 'var(--text)', border: '1.5px solid var(--border)' }}>
                ← Назад в корзину
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const qtyBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 'var(--radius-sm)',
  background: 'var(--surface2)', border: '1.5px solid var(--border)',
  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
};
const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };
const mainBtn: React.CSSProperties = {
  width: '100%', padding: '13px', background: 'var(--accent)', color: '#fff',
  border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
};
const errBox: React.CSSProperties = {
  background: 'var(--danger-light)', border: '1px solid #f5c6c2',
  color: 'var(--danger)', borderRadius: 'var(--radius-sm)',
  padding: '10px 14px', fontSize: 14, marginBottom: 16,
};
