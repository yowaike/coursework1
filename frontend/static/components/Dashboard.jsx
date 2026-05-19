// компонент панели управления с проверкой ролей
const Dashboard = () => {
    const [activeTab, setActiveTab] = React.useState('profile')
    const [userRole, setUserRole] = React.useState(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        //функция для проверки авторизации и получения роли
        fetch('/api/auth/me', { credentials: 'include' })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => setUserRole(data.role))
            .catch(() => window.location.href = '/')
            .finally(() => setLoading(false))
    }, [])

    // функция для выхода из системы
    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        window.location.href = '/'
    }

    // меню в зависимости от роли
    const allMenuItems = [
        { id: 'profile', label: 'Профиль', roles: ['admin', 'teacher', 'student'] },
        { id: 'students', label: 'Ученики', roles: ['admin'] },
        { id: 'teachers', label: 'Учителя', roles: ['admin'] },
        { id: 'schedule', label: 'Расписание', roles: ['admin'] },
        { id: 'grades', label: 'Оценки', roles: ['admin', 'teacher'] },
        { id: 'analytics', label: 'Аналитика', roles: ['admin'] },
        { id: 'teacher_cab', label: 'Мой кабинет', roles: ['teacher'] },
        { id: 'student_cab', label: 'Мой дневник', roles: ['student'] }
    ]

    const menuItems = allMenuItems.filter(item => item.roles.includes(userRole))

    // функция для рендера контента
    const renderContent = () => {
        if (loading) return React.createElement('p', { style: { color: 'white', textAlign: 'center', marginTop: '50px' } }, 'Загрузка...')
        if (activeTab === 'students') return React.createElement(StudentList)
        if (activeTab === 'teachers') return React.createElement(TeacherList)
        if (activeTab === 'schedule') return React.createElement(ScheduleList)
        if (activeTab === 'grades') return React.createElement(GradeBook)
        if (activeTab === 'analytics') return React.createElement(Analytics)
        if (activeTab === 'teacher_cab') return React.createElement(TeacherCabinet)
        if (activeTab === 'student_cab') return React.createElement(StudentCabinet)
        
        return React.createElement('div', { className: 'glass-card', style: { color: 'white' } },
            React.createElement('h2', null, 'Добро пожаловать!'),
            React.createElement('p', null, `Ваша роль: ${userRole}. Выберите раздел в меню.`)
        )
    }

    return React.createElement('div', { style: { display: 'flex', minHeight: '100vh' } },
        React.createElement('div', { 
            className: 'glass-card', 
            style: { width: '250px', margin: '20px', height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' } 
        },
            React.createElement('h3', { style: { color: 'white', marginBottom: '20px' } }, 'Меню'),
            React.createElement('div', { style: { flex: 1 } },
                menuItems.map(item => 
                    React.createElement('div', {
                        key: item.id,
                        onClick: () => setActiveTab(item.id),
                        style: { 
                            padding: '12px', 
                            cursor: 'pointer',
                            background: activeTab === item.id ? 'rgba(255,255,255,0.25)' : 'transparent',
                            borderRadius: '8px',
                            marginBottom: '6px',
                            color: 'white',
                            transition: '0.2s'
                        }
                    }, item.label)
                )
            ),
            React.createElement('button', { 
                className: 'btn', 
                style: { width: '100%', background: '#e74c3c', marginTop: '10px' },
                onClick: handleLogout 
            }, 'Выйти')
        ),
        React.createElement('div', { style: { flex: 1, padding: '20px', overflowY: 'auto' } },
            renderContent()
        )
    )
}

// функция для рендера компонента
const root = ReactDOM.createRoot(document.getElementById('dashboard-root'))
root.render(React.createElement(Dashboard))