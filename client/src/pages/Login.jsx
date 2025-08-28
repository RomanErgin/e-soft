import React, { useState } from 'react';
import axios from 'axios';

export default function Login({ onLoggedIn }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:8000/api/auth/login', { login, password });
      localStorage.setItem('token', res.data.token);
      onLoggedIn(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка авторизации');
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '40px auto', padding: '20px' }}>
      <h2>Вход в систему</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <input 
            placeholder="Логин" 
            value={login} 
            onChange={(e) => setLogin(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '16px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '16px' }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
        <button 
          type="submit"
          style={{ 
            width: '100%', 
            padding: '12px', 
            fontSize: '16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Войти
        </button>
      </form>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4 style={{ marginTop: 0 }}>Тестовые учетные записи:</h4>
        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
          <p><strong>Менеджер:</strong></p>
          <p>Логин: <code>manager</code></p>
          <p>Пароль: <code>password123</code></p>
          <br />
          <p><strong>Сотрудники:</strong></p>
          <p>Логин: <code>employee1</code> | Пароль: <code>password123</code></p>
          <p>Логин: <code>employee2</code> | Пароль: <code>password123</code></p>
        </div>
      </div>
    </div>
  );
}
