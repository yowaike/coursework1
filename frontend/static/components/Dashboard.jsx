// компонент панели управления в стиле luxury minimalism
const Dashboard = () => {
    const [activeTab, setActiveTab] = React.useState('profile')
    const [userRole, setUserRole] = React.useState(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        fetch('/api/auth/me', { credentials: 'include' })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => setUserRole(data.role))
            .catch(() => window.location.href = '/')
            .finally(() => setLoading(false))
    }, [])

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        window.location.href = '/'
    }

    const allMenuItems = [
        { id: 'profile', label: 'Профиль', roles: ['admin', 'teacher', 'student'] },
        { id: 'classes', label: 'Классы', roles: ['admin'] },
        { id: 'subjects', label: 'Предметы', roles: ['admin'] },
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
        if (loading) return React.createElement('div', { className: 'spinner' })
        if (activeTab === 'classes') return React.createElement(ClassList)
        if (activeTab === 'subjects') return React.createElement(SubjectList)
        if (activeTab === 'students') return React.createElement(StudentList)
        if (activeTab === 'teachers') return React.createElement(TeacherList)
        if (activeTab === 'schedule') return React.createElement(ScheduleList)
        if (activeTab === 'grades') return React.createElement(GradeBook)
        if (activeTab === 'analytics') return React.createElement(Analytics)
        if (activeTab === 'teacher_cab') return React.createElement(TeacherCabinet)
        if (activeTab === 'student_cab') return React.createElement(StudentCabinet)
        
        return React.createElement('div', null,
            React.createElement('h1', null, 'Добро пожаловать'),
            React.createElement('p', { style: { color: 'var(--text-secondary)' } }, `Роль: ${userRole}. Выберите раздел в меню.`)
        )
    }

    return React.createElement('div', { style: { display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" } },
        // боковое меню (сайдбар)
        React.createElement('div', { 
            style: { 
                width: '260px', 
                background: 'var(--bg-sidebar)', 
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 16px'
            } 
        },
            // логотип
            React.createElement('div', { style: { textAlign: 'center', marginBottom: '40px' } },
                React.createElement('h1', { style: { fontSize: '24px', letterSpacing: '4px', marginBottom: '4px' } }, 'ДНЕВНИК'),
                React.createElement('span', { style: { fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-secondary)' } }, 'Электронная система')
            ),
            
            // пункты меню
            React.createElement('div', { style: { flex: 1 } },
                menuItems.map(item => 
                    React.createElement('div', {
                        key: item.id,
                        onClick: () => setActiveTab(item.id),
                        style: { 
                            padding: '14px 16px', 
                            cursor: 'pointer',
                            borderRadius: '8px',
                            marginBottom: '4px',
                            fontWeight: activeTab === item.id ? 500 : 400,
                            color: activeTab === item.id ? '#FFFFFF' : 'var(--text-primary)',
                            background: activeTab === item.id ? 'var(--accent-color)' : 'transparent',
                            transition: 'all 0.2s'
                        }
                    }, item.label)
                )
            ),
            
            // выход
            React.createElement('div', { 
                onClick: handleLogout, 
                style: { 
                    padding: '14px 16px', 
                    cursor: 'pointer', 
                    color: 'var(--text-secondary)', 
                    fontSize: '13px',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: '20px'
                } 
            }, 'Выйти из системы')
        ),
        
        // основная область
        React.createElement('div', { style: { flex: 1, padding: '40px', overflowY: 'auto' } },
            renderContent()
        )
    )
}

const root = ReactDOM.createRoot(document.getElementById('dashboard-root'))
root.render(React.createElement(Dashboard))