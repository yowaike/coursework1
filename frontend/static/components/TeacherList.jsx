// компонент списка учителей с формой добавления
const TeacherList = () => {
    const [teachers, setTeachers] = React.useState([])
    const [showForm, setShowForm] = React.useState(false)
    const [formData, setFormData] = React.useState({ full_name: '', subject_id: 1, room_number: '' })

    React.useEffect(() => {
        //функция для получения учителей
        fetch('/api/teachers')
            .then(res => res.json())
            .then(data => setTeachers(data))
    }, [])

    //функция для добавления учителя
    const handleAdd = async (e) => {
        e.preventDefault()
        await fetch('/api/teachers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        setShowForm(false)
        window.location.reload() // простая перезагрузка для обновления списка
    }

    return React.createElement('div', { className: 'glass-card' },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' } },
            React.createElement('h3', { style: { color: 'white', margin: 0 } }, 'Список учителей'),
            React.createElement('button', { 
                className: 'btn', 
                onClick: () => setShowForm(!showForm) 
            }, showForm ? 'Отмена' : 'Добавить учителя')
        ),
        
        showForm && React.createElement('form', { 
            onSubmit: handleAdd, 
            style: { background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '15px' } 
        },
            React.createElement('input', { 
                className: 'input', 
                placeholder: 'ФИО учителя', 
                value: formData.full_name,
                onChange: (e) => setFormData({...formData, full_name: e.target.value})
            }),
            React.createElement('input', { 
                className: 'input', 
                type: 'number', 
                placeholder: 'ID предмета (например 1)', 
                value: formData.subject_id,
                onChange: (e) => setFormData({...formData, subject_id: Number(e.target.value)})
            }),
            React.createElement('input', { 
                className: 'input', 
                placeholder: 'Кабинет', 
                value: formData.room_number,
                onChange: (e) => setFormData({...formData, room_number: e.target.value})
            }),
            React.createElement('button', { className: 'btn', type: 'submit' }, 'Сохранить')
        ),

        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', color: 'white', marginTop: '10px' } },
            React.createElement('thead', null,
                React.createElement('tr', { style: { borderBottom: '2px solid rgba(255,255,255,0.3)' } },
                    React.createElement('th', { style: { textAlign: 'left', padding: '10px' } }, 'ФИО'),
                    React.createElement('th', { style: { textAlign: 'left', padding: '10px' } }, 'Предмет ID'),
                    React.createElement('th', { style: { textAlign: 'left', padding: '10px' } }, 'Кабинет')
                )
            ),
            React.createElement('tbody', null,
                teachers.map(t => 
                    React.createElement('tr', { key: t.id, style: { borderBottom: '1px solid rgba(255,255,255,0.1)' } },
                        React.createElement('td', { style: { padding: '10px' } }, t.user ? t.user.full_name : '—'),
                        React.createElement('td', { style: { padding: '10px' } }, t.subject_id),
                        React.createElement('td', { style: { padding: '10px' } }, t.room_number || '—')
                    )
                )
            )
        )
    )
}