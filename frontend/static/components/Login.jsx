// компонент для страницы входа
const Login = () => {
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        const formData = new URLSearchParams()
        formData.append('username', email)
        formData.append('password', password)
        
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
        if (res.ok) {
            window.location.href = '/dashboard'
        } else {
            alert('Ошибка входа')
        }
    }

    return React.createElement('div', { className: 'glass-card', style: { maxWidth: '400px', margin: '100px auto' } },
        React.createElement('h2', null, 'Вход в систему'),
        React.createElement('form', { onSubmit: handleSubmit },
            React.createElement('input', {
                className: 'input',
                type: 'email',
                placeholder: 'Email',
                value: email,
                onChange: (e) => setEmail(e.target.value)
            }),
            React.createElement('input', {
                className: 'input',
                type: 'password',
                placeholder: 'Пароль',
                value: password,
                onChange: (e) => setPassword(e.target.value)
            }),
            React.createElement('button', { className: 'btn', type: 'submit' }, 'Войти')
        )
    )
}

//функция для рендера компонента
const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(React.createElement(Login))