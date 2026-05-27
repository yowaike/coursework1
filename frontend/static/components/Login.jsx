// компонент входа в систему
const Login = () => {
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [error, setError] = React.useState('')
    const [loading, setLoading] = React.useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        
        const formData = new URLSearchParams()
        formData.append('username', email)
        formData.append('password', password)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
                credentials: 'include'
            })
            
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.detail || 'Ошибка входа')
            }
            
            window.location.href = '/dashboard'
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return React.createElement('div', { 
        style: { 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            minHeight: '100vh', background: '#F9F7F2' 
        } 
    },
        React.createElement('div', { className: 'glass-card', style: { width: '100%', maxWidth: '420px', textAlign: 'center', padding: '40px' } },
            React.createElement('div', { style: { marginBottom: '32px' } },
                React.createElement('h1', { style: { fontFamily: "'Playfair Display', serif", fontSize: '28px', marginBottom: '8px', color: '#1A1A1A' } }, 'Электронный дневничок'),
                React.createElement('p', { style: { color: '#7A7A7A', fontSize: '14px', margin: 0 } }, 'Войдите в свою учётную запись')
            ),
            
            error && React.createElement('div', { 
                style: { 
                    background: '#FFEBEE', color: '#D32F2F', padding: '12px', 
                    borderRadius: '8px', marginBottom: '16px', fontSize: '14px'
                } 
            }, error),
            
            React.createElement('form', { onSubmit: handleLogin },
                React.createElement('input', { 
                    className: 'input', type: 'email', placeholder: 'Email', 
                    value: email, onChange: (e) => setEmail(e.target.value), 
                    required: true, disabled: loading
                }),
                React.createElement('input', { 
                    className: 'input', type: 'password', placeholder: 'Пароль', 
                    value: password, onChange: (e) => setPassword(e.target.value), 
                    required: true, disabled: loading
                }),
                React.createElement('button', { 
                    className: 'btn', type: 'submit', style: { width: '100%' }, disabled: loading
                }, loading ? 'Вход...' : 'ВОЙТИ')
            )
        )
    )
}

const rootElement = document.getElementById('login-root')
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(React.createElement(Login))
}