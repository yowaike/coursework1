// компонент списка учеников
const StudentList = () => {
    const [students, setStudents] = React.useState([])

    React.useEffect(() => {
        //функция для получения студентов с сервера
        fetch('/api/students')
            .then(res => res.json())
            .then(data => setStudents(data))
    }, [])

    if (students.length === 0) return React.createElement('p', { style: { color: 'white' } }, 'Список пуст или загрузка...')

    return React.createElement('div', { className: 'glass-card' },
        React.createElement('h3', { style: { color: 'white', marginTop: 0 } }, 'Список учеников'),
        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', color: 'white', marginTop: '10px' } },
            React.createElement('thead', null,
                React.createElement('tr', { style: { borderBottom: '2px solid rgba(255,255,255,0.3)' } },
                    React.createElement('th', { style: { textAlign: 'left', padding: '10px' } }, 'ФИО'),
                    React.createElement('th', { style: { textAlign: 'left', padding: '10px' } }, 'Класс ID'),
                    React.createElement('th', { style: { textAlign: 'left', padding: '10px' } }, 'Email')
                )
            ),
            React.createElement('tbody', null,
                students.map(st => 
                    React.createElement('tr', { key: st.id, style: { borderBottom: '1px solid rgba(255,255,255,0.1)' } },
                        React.createElement('td', { style: { padding: '10px' } }, st.user ? st.user.full_name : '—'),
                        React.createElement('td', { style: { padding: '10px' } }, st.class_id),
                        React.createElement('td', { style: { padding: '10px' } }, st.user ? st.user.email : '—')
                    )
                )
            )
        )
    )
}