// компонент списка учеников с поиском, добавлением и удалением
const StudentList = () => {
    const [students, setStudents] = React.useState([])
    const [searchTerm, setSearchTerm] = React.useState('')
    const [showForm, setShowForm] = React.useState(false)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState('')
    const [formData, setFormData] = React.useState({ 
        full_name: '', 
        class_id: 1,
        email: '', 
        password: 'student123'
    })

    React.useEffect(() => {
        fetch('/api/students')
            .then(res => {
                if (!res.ok) throw new Error('Ошибка загрузки данных')
                return res.json()
            })
            .then(data => {
                setStudents(data)
                setLoading(false)
            })
            .catch(err => {
                setError(err.message)
                setLoading(false)
            })
    }, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        setError('')
        if (!formData.full_name || !formData.email) {
            setError('Обязательно заполните ФИО и Email')
            return
        }
        try {
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (!res.ok) throw new Error('Не удалось сохранить')
            setShowForm(false)
            window.location.reload()
        } catch (err) {
            setError(err.message)
        }
    }

    if (loading) return React.createElement('div', { className: 'spinner' })

    // Логика фильтрации (поиск по ФИО)
    const filteredStudents = students.filter(st => 
        st.user && st.user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return React.createElement('div', { className: 'glass-card' },
        // Верхняя панель: Поиск и кнопка добавления
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' } },
            React.createElement('input', {
                className: 'input',
                placeholder: 'Поиск по ФИО...',
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                style: { width: '100%', maxWidth: '300px', marginBottom: 0 }
            }),
            React.createElement('button', { 
                className: 'btn', 
                onClick: () => { setShowForm(!showForm); setError('') } 
            }, showForm ? 'Отмена' : 'Добавить ученика')
        ),
        
        error && React.createElement('div', { className: 'error-msg' }, error),
        
        showForm && React.createElement('form', { 
            onSubmit: handleAdd, 
            style: { background: 'var(--bg-main)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border-color)' } 
        },
            React.createElement('input', { 
                className: 'input', 
                placeholder: 'ФИО ученика', 
                value: formData.full_name,
                onChange: (e) => setFormData({...formData, full_name: e.target.value})
            }),
            React.createElement('input', { 
                className: 'input', 
                type: 'email', 
                placeholder: 'Email (логин)', 
                value: formData.email,
                onChange: (e) => setFormData({...formData, email: e.target.value})
            }),
            React.createElement('input', { 
                className: 'input', 
                type: 'number', 
                placeholder: 'ID класса', 
                value: formData.class_id,
                onChange: (e) => setFormData({...formData, class_id: Number(e.target.value)})
            }),
            React.createElement('button', { className: 'btn', type: 'submit' }, 'Сохранить')
        ),

        React.createElement('table', null,
            React.createElement('thead', null,
                React.createElement('tr', null,
                    React.createElement('th', null, 'ФИО'),
                    React.createElement('th', null, 'Email'),
                    React.createElement('th', null, 'Класс'),
                    React.createElement('th', { style: { textAlign: 'right' } }, 'Действия')
                )
            ),
            React.createElement('tbody', null,
                filteredStudents.map(st => 
                    React.createElement('tr', { key: st.id },
                        React.createElement('td', { style: { fontWeight: 500 } }, st.user ? st.user.full_name : '—'),
                        React.createElement('td', { style: { color: 'var(--text-secondary)' } }, st.user ? st.user.email : '—'),
                        React.createElement('td', null, st.class_id),
                        React.createElement('td', { style: { textAlign: 'right' } },
                            React.createElement('button', {
                                className: 'btn',
                                style: { background: '#D32F2F', padding: '6px 12px', fontSize: '12px' },
                                onClick: async () => {
                                    if (window.confirm(`Удалить ученика ${st.user ? st.user.full_name : st.id}?`)) {
                                        await fetch(`/api/students/${st.id}`, { method: 'DELETE' })
                                        window.location.reload()
                                    }
                                }
                            }, 'Удалить')
                        )
                    )
                )
            )
        )
    )
}