// компонент панели управления
const Dashboard = () => {
    const [activeTab, setActiveTab] = React.useState('profile')
    const role = 'admin' // пока захардкодим роль для теста

    // функция для выхода из системы
    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/'
    }

    const menuItems = [
        { id: 'profile', label: 'Профиль' },
        { id: 'students', label: 'Ученики' },
        { id: 'teachers', label: 'Учителя' },
        { id: 'grades', label: 'Оценки' },
        { id: 'analytics', label: 'Аналитика' }
    ]

    // функция для рендера контента
    const renderContent = () => {
        if (activeTab === 'students') {
            return React.createElement(StudentList)
        }
        if (activeTab === 'teachers') {
            return React.createElement(TeacherList)
        }
        return React.createElement('div', { className: 'glass-card', style: { color: 'white' } },
            React.createElement('h2', null, 'Раздел: ' + activeTab),
            React.createElement('p', null, 'Контент для этого раздела скоро появится.')
        )
    }

    return React.createElement('div', { style: { display: 'flex', minHeight: '100vh' } },
        // боковое меню
        React.createElement('div', {
            className: 'glass-card',
            style: { width: '250px', margin: '20px', height: 'calc(100vh - 40px)' }
        },
            React.createElement('h3', { style: { color: 'white' } }, 'Меню'),
            menuItems.map(item =>
                React.createElement('div', {
                    key: item.id,
                    onClick: () => setActiveTab(item.id),
                    style: {
                        padding: '10px',
                        cursor: 'pointer',
                        background: activeTab === item.id ? 'rgba(255,255,255,0.3)' : 'transparent',
                        borderRadius: '8px',
                        marginBottom: '5px'
                    }
                }, item.label)
            ),
            React.createElement('button', {
                className: 'btn',
                style: { width: '100%', marginTop: '20px', background: '#e74c3c' },
                onClick: handleLogout
            }, 'Выйти')
        ),
        // основной контент
        React.createElement('div', { style: { flex: 1, padding: '20px' } },
            renderContent()
        )
    )
}

// функция для рендера компонента
const root = ReactDOM.createRoot(document.getElementById('dashboard-root'))
root.render(React.createElement(Dashboard))