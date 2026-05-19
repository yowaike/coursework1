// компонент списка учеников с формой добавления
const StudentList = () => {
    const [students, setStudents] = React.useState([])
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
        //функция для получения списка студентов
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

    //функция для создания нового ученика
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

    return React.createElement('div', { className: 'glass-card' },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' } },
            React.createElement('h3', { style: { color: 'white', margin: 0 } }, 'Список учеников'),
            React.createElement('button', { 
                className: 'btn', 
                onClick: () => { setShowForm(!showForm); setError('') } 
            }, showForm ? 'Отмена' : 'Добавить ученика')
        ),
        
        error && React.createElement('div', { className: 'error-msg' }, error),
        
        showForm && React.createElement('form', { 
            onSubmit: handleAdd, 
            style: { background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '15px' } 
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

        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', color: 'white', marginTop: '10px' } },
            React.createElement('thead', null,
                React.createElement('tr', { style: { borderBottom: '2px solid rgba(255,255,255,0.3)' } },
                    React.createElement('th', { style: { textAlign: 'left', padding: '10px' } }, 'ФИО'),
                    React.createElement('th', { style: { textAlign: 'left', padding: '10px' } }, 'Email'),
                    React.createElement('th', { style: { textAlign: 'left', padding: '10px' } }, 'Класс')
                )
            ),
            React.createElement('tbody', null,
                students.map(st => 
                    React.createElement('tr', { key: st.id, style: { borderBottom: '1px solid rgba(255,255,255,0.1)' } },
                        React.createElement('td', { style: { padding: '10px' } }, st.user ? st.user.full_name : '—'),
                        React.createElement('td', { style: { padding: '10px' } }, st.user ? st.user.email : '—'),
                        React.createElement('td', { style: { padding: '10px' } }, st.class_id)
                    )
                )
            )
        )
    )
}