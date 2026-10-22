import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { apiGetOrders, apiGetOrder, apiCancelOrder } from '../api/client';
import type { Order } from '../types';

const STATUS_COLOR: Record<string, string> = {
  pending: '#e67e22', confirmed: '#2980b9', shipped: '#8e44ad',
  delivered: '#27ae60', cancelled: '#c0392b',
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageWrap><p style={{ color: 'var(--text-muted)' }}>Загружаем заказы</p></PageWrap>;

  if (orders.length === 0) return (
    <PageWrap>
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Нету заказов</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Ваша история заказов будет появляться здесь</p>
        <Link to="/shop" style={greenBtn}>В магазин</Link>
      </div>
    </PageWrap>
  );

  return (
    <PageWrap>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 28 }}>Мои заказы</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {orders.map(o => (
          <Link to={`/orders/${o.id}`} key={o.id} style={{
            display: 'block', background: 'var(--surface)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '20px 24px',
            boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.15s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Заказ #{o.id}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {new Date(o.created_at).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}
                  {' · '}{o.items.length} товаров{o.items.length !== 1 ? '' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <StatusBadge status={o.status} />
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>€{o.total_price.toFixed(2)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageWrap>
  );
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const success = params.get('success') === '1';

  const load = () => apiGetOrder(Number(id)).then(setOrder).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const cancel = async () => {
    if (!confirm('Отменить этот заказ?')) return;
    await apiCancelOrder(Number(id));
    load();
  };

  if (loading) return <PageWrap><p style={{ color: 'var(--text-muted)' }}>Загружаем..</p></PageWrap>;
  if (!order) return <PageWrap><p>Заказ не найден</p></PageWrap>;

  return (
    <PageWrap>
      {success && (
        <div style={{
          background: '#e8f8f0', border: '1.5px solid #a3d9b8', borderRadius: 'var(--radius)',
          padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>✅</span>
          <div>
            <p style={{ fontWeight: 600, color: '#1e7a4a' }}>Заказ успешно размещен!</p>
            <p style={{ fontSize: 13, color: '#2d8a55' }}>Мы подтвердим ваш заказ в скором времени.</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link to="/orders" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← Мои заказы</Link>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>Заказ #{order.id}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Размещен {new Date(order.created_at).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
          </p>
        </div>
        <StatusBadge status={order.status} large />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 15 }}>Товары</div>
            {order.items.map(item => (
              <div key={item.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 20px', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 15 }}>{item.product_name}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>€{item.unit_price.toFixed(2)} × {item.quantity}</p>
                </div>
                <span style={{ fontWeight: 600 }}>€{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', fontWeight: 700, fontSize: 17 }}>
              <span>Итого</span>
              <span style={{ color: 'var(--accent)' }}>€{order.total_price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <InfoCard title="Доставка">
            <p style={{ fontSize: 14 }}>{order.address}</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{order.phone}</p>
            {order.notes && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>{order.notes}</p>}
          </InfoCard>

          {order.status === 'pending' && (
            <button onClick={cancel} style={{
              padding: '10px', background: 'var(--danger-light)', color: 'var(--danger)',
              border: '1.5px solid #f5c6c2', borderRadius: 'var(--radius-sm)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>Отменить заказ</button>
          )}
        </div>
      </div>
    </PageWrap>
  );
}

function StatusBadge({ status, large }: { status: string; large?: boolean }) {
  return (
    <span style={{
      background: STATUS_COLOR[status] + '18',
      color: STATUS_COLOR[status],
      border: `1.5px solid ${STATUS_COLOR[status]}40`,
      borderRadius: 99, padding: large ? '6px 16px' : '4px 10px',
      fontSize: large ? 14 : 12, fontWeight: 600, textTransform: 'capitalize',
    }}>{status}</span>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>{title}</div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  );
}

function PageWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>{children}</div>;
}

const greenBtn: React.CSSProperties = {
  display: 'inline-block', padding: '11px 24px', background: 'var(--accent)',
  color: '#fff', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 14,
};
