import React, { useState } from 'react';
import Login from './pages/Login';
import Tasks from './pages/Tasks';

function App() {
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (!user) return <Login onLoggedIn={setUser} />;
  
  return (
    <div>
      <div style={{ 
        padding: '10px 20px', 
        backgroundColor: '#f8f9fa', 
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>Добро пожаловать, {user.firstName} {user.lastName}!</strong>
          <span style={{ marginLeft: '10px', color: '#6c757d' }}>
            ({user.role === 'manager' ? 'Менеджер' : 'Сотрудник'})
          </span>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Выйти
        </button>
      </div>
      <Tasks />
    </div>
  );
}

export default App;
