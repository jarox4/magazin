import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiUpdateMe } from '../api/client';

export function Profile() {
  const { user, login, token } = useAuth();
  const [form, setForm] = useState({ full_name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name ?? '',
        phone:     user.phone   ?? '',
        address:   user.address ?? '',
      });
    }
  }, [user]);

  if (!user) return null;

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setSaving(true); setSuccess(false);
    try {
      const updated = await apiUpdateMe(form);
      // Update AuthContext so navbar name reflects change instantly
      login(token!, updated);
      setSuccess(true);
      setEditing(false);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Сохранение не удалось!');
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    setForm({ full_name: user.full_name ?? '', phone: user.phone ?? '', address: user.address ?? '' });
    setEditing(false);
    setErr('');
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--accent)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 26, fontWeight: 700, flexShrink: 0,
        }}>
          {user.full_name[0].toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 2 }}>{user.full_name}</h1>
          <span style={{
            display: 'inline-block',
            background: user.role === 'admin' ? '#fef3c7' : 'var(--accent-light)',
            color: user.role === 'admin' ? '#92400e' : 'var(--accent)',
            border: `1.5px solid ${user.role === 'admin' ? '#fcd34d' : 'rgba(45,106,79,0.25)'}`,
            borderRadius: 99, fontSize: 11, fontWeight: 600,
            padding: '2px 10px', textTransform: 'capitalize',
          }}>{user.role}</span>
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div style={{
          background: '#e8f8f0', border: '1.5px solid #a3d9b8',
          borderRadius: 'var(--radius)', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
        }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <span style={{ fontSize: 14, color: '#1e7a4a', fontWeight: 500 }}>Профиль успешно сохранен</span>
        </div>
      )}

      {/* Error banner */}
      {err && (
        <div style={{
          background: 'var(--danger-light)', border: '1px solid #f5c6c2',
          color: 'var(--danger)', borderRadius: 'var(--radius)',
          padding: '12px 16px', fontSize: 14, marginBottom: 24,
        }}>{err}</div>
      )}

      {/* Card */}
      <div style={{
        background: 'var(--surface)', border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Card header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Личная информация</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{
              padding: '7px 16px', background: 'var(--surface2)',
              border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text)',
            }}>Редактировать</button>
          )}
        </div>

        <div style={{ padding: '24px' }}>
          {editing ? (
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* Full name - full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Полное имя</label>
                  <input
                    value={form.full_name}
                    onChange={set('full_name')}
                    placeholder="Ваше полное имя"
                    required
                  />
                </div>
                <div>
                  <label style={lbl}>Phone</label>
                  <input
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="88005553535"
                  />
                </div>
                <div>
                  <label style={lbl}>Электронная почта</label>
                  <input
                    value={user.email}
                    disabled
                    style={{ opacity: 0.55, cursor: 'not-allowed' }}
                    title="Электронная почта не может быть изменена"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Address</label>
                  <textarea
                    value={form.address}
                    onChange={set('address')}
                    placeholder="Ваш адрес доставки"
                    rows={2}
                    style={{
                      resize: 'none', background: 'var(--surface)',
                      border: '1.5px solid var(--border)', color: 'var(--text)',
                      padding: '10px 14px', width: '100%',
                      fontFamily: 'var(--font)', fontSize: 14,
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={saving} style={{
                  padding: '10px 22px', background: 'var(--accent)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? 'Сохраняем' : 'Сохранить изменения'}
                </button>
                <button type="button" onClick={handleCancel} style={{
                  padding: '10px 22px', background: 'var(--surface2)',
                  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer', color: 'var(--text)',
                }}>
                  Отменить
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <InfoRow label="Полное имя"  value={user.full_name}         full />
              <InfoRow label="Электронная почта"      value={user.email}             full />
              <InfoRow label="Номер телефона"      value={user.phone || '—'}      />
              <InfoRow label="Адрес"    value={user.address || '—'}    />
            </div>
          )}
        </div>
      </div>

      {/* Account info card */}
      <div style={{
        marginTop: 20,
        background: 'var(--surface)', border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Аккаунт</h2>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <InfoRow label="ID пользователя" value={`#${user.id}`} />
            <InfoRow label="Роль"    value={user.role}     />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.6 }}>
            Чтобы изменить почту или пароль обратитесь в поддержку
            {user.role !== 'admin' && (
              <> Чтобы получить права админа, обратитесь к администратору, чтобы он изменил вашу роль</>
            )}
          </p>
        </div>
      </div>

    </div>
  );
}

function InfoRow({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div style={{
      gridColumn: full ? '1 / -1' : undefined,
      padding: '12px 0',
      borderBottom: '1px solid var(--border)',
      display: 'grid', gridTemplateColumns: '160px 1fr',
      alignItems: 'start', gap: 12,
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--text)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--text)', marginBottom: 6,
};
