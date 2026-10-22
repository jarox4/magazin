import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiLogin } from '../api/client';
import { useAuth } from '../context/AuthContext';
import InputMask from 'react-imask'

export function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      const { token, user } = await apiLogin(email, pass);
      login(token, user);
      nav('/shop');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={logoMark}>M</div>
          <h1 style={{ fontSize: 24, marginBottom: 6 }}>Добро пожаловать!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Войти в аккаунт</p>
        </div>
        {err && <div style={errStyle}>{err}</div>}
        <form onSubmit={submit}>
          <label style={labelStyle}>Электронная почта</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="67@xd.com" required style={{ marginBottom: 16 }} />
          <label style={labelStyle}>Пароль</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required style={{ marginBottom: 24 }} />
          <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'Входим...' : 'Войти'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          Нет аккаунта? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Создать сейчас</Link>
        </p>
      </div>
    </div>
  );
}

export function Register() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', address: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      const { apiRegister } = await import('../api/client');
      const { token, user } = await apiRegister(form);
      login(token, user);
      nav('/shop');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Registration failed');
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
  return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={logoMark}>M</div>
          <h1 style={{ fontSize: 24, marginBottom: 6 }}>Создать аккаунт</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Начать покупки сейчас</p>
        </div>
        {err && <div style={errStyle}>{err}</div>}
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Полное имя *</label>
              <input value={form.full_name} onChange={set('full_name')} placeholder="John Shmoe" required style={{ marginBottom: 4 }} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Электронная почта *</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="67@xd.com" required style={{ marginBottom: 4 }} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Пароль *</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Минимум 6 символов" required style={{ marginBottom: 4 }} />
            </div>
            <div>
              <label style={labelStyle}>Номер телефона</label>
                <input
                  value={form.phone}
                  onChange={handlePhone}
                  placeholder="+7 (___) ___-__-__"
                  inputMode="tel"
                  maxLength={18}
                />
            </div>
            <div>
              <label style={labelStyle}>Адрес</label>
              <input value={form.address} onChange={set('address')} placeholder="St. Pushkina, house of Kolotushkina" style={{ marginBottom: 4 }} />
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ ...btnStyle, marginTop: 20 }}>
            {loading ? 'Создаем аккаунт' : 'Создать аккаунт'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          Есть аккаунт? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Войти</Link>
        </p>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: 'calc(100vh - 64px)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: 24,
};
const cardStyle: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 'var(--radius)',
  border: '1.5px solid var(--border)', padding: '40px 36px',
  width: '100%', maxWidth: 400, boxShadow: 'var(--shadow)',
};
const logoMark: React.CSSProperties = {
  width: 48, height: 48, background: 'var(--accent)', borderRadius: 12,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#fff', fontWeight: 700, fontSize: 22, margin: '0 auto 16px',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--text)', marginBottom: 6,
};
const errStyle: React.CSSProperties = {
  background: 'var(--danger-light)', border: '1px solid #f5c6c2',
  color: 'var(--danger)', borderRadius: 'var(--radius-sm)',
  padding: '10px 14px', fontSize: 14, marginBottom: 16,
};
const btnStyle: React.CSSProperties = {
  width: '100%', padding: '12px', background: 'var(--accent)',
  color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
  fontSize: 15, fontWeight: 600, cursor: 'pointer',
};
