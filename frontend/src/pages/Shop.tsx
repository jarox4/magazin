import { useEffect, useState } from 'react';
import { apiGetProducts, apiGetCategories } from '../api/client';
import type { Product, Category } from '../types';
import { useCart } from '../context/CartContext';

export function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(0);
  const [loading, setLoading] = useState(true);
  const { add, items } = useCart();

  useEffect(() => {
    apiGetCategories().then(setCats);
  }, []);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      apiGetProducts({ category: category || undefined, search: search || undefined })
        .then(setProducts).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, category]);

  const inCart = (id: number) => items.find(i => i.product.id === id)?.quantity ?? 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 8 }}>Магазин</h1>
        <p style={{ color: 'var(--text-muted)' }}>{products.length} товаров доступно</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <input
          placeholder="Искать товары" value={search} onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300, flex: '1 1 200px' }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setCategory(0)}
            style={catBtn(category === 0)}
          >Все</button>
          {cats.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} style={catBtn(category === c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <p style={{ fontSize: 18, fontWeight: 500 }}>товары не найдены</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>Попробуйте поменять фильтры поиска</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
          {products.map(p => (
            <ProductCard key={p.id} product={p} inCart={inCart(p.id)} onAdd={() => add(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product: p, inCart, onAdd }: { product: Product; inCart: number; onAdd: () => void }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1.5px solid var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.15s, transform 0.15s',
      display: 'flex', flexDirection: 'column',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
    >
      {/* Image placeholder */}
      <div style={{
        height: 180, background: 'var(--surface2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 48, position: 'relative',
      }}>
        {p.image_url
          ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span>{categoryEmoji(p.category_name)}</span>
        }
        {inCart > 0 && (
          <span style={{
            position: 'absolute', top: 10, right: 10,
            background: 'var(--accent)', color: '#fff',
            fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '2px 8px',
          }}>В корзине: {inCart}</span>
        )}
      </div>

      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {p.category_name}
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>{p.name}</h3>
        {p.description && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5, flex: 1,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {p.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>€{p.price.toFixed(2)}</span>
          <span style={{ fontSize: 12, color: p.quantity < 5 ? 'var(--warning)' : 'var(--text-muted)' }}>
            {p.quantity} осталось
          </span>
        </div>
        <button onClick={handleAdd} disabled={p.quantity === 0} style={{
          marginTop: 12, padding: '10px', borderRadius: 'var(--radius-sm)',
          background: added ? '#27ae60' : 'var(--accent)',
          color: '#fff', fontSize: 14, fontWeight: 600, border: 'none',
          transition: 'background 0.2s',
          opacity: p.quantity === 0 ? 0.5 : 1,
        }}>
          {p.quantity === 0 ? 'Закончились' : added ? '✓ Добавлено!' : 'Добавить в корзину'}
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <div style={{ height: 180, background: 'var(--surface2)', animation: 'pulse 1.5s infinite' }} />
      <div style={{ padding: 16 }}>
        {[60, 100, 80].map((w, i) => (
          <div key={i} style={{ height: 12, background: 'var(--surface2)', borderRadius: 4, width: `${w}%`, marginBottom: 8 }} />
        ))}
      </div>
    </div>
  );
}

const catBtn = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px', borderRadius: 99,
  border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
  background: active ? 'var(--accent-light)' : 'var(--surface)',
  color: active ? 'var(--accent)' : 'var(--text-muted)',
  fontSize: 13, fontWeight: 500, cursor: 'pointer',
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
});

function categoryEmoji(cat: string) {
  const map: Record<string, string> = {
    'Электроника': '💻', 'Еда и напитки': '☕', 'Одежда': '👕',
    'Инструменты': '🔧', 'Медицина': '💊', 'Мебель': '🪑',
  };
  return map[cat] ?? '📦';
}
