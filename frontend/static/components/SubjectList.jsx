// компонент списка предметов с формой добавления
const SubjectList = () => {
    const [subjects, setSubjects] = React.useState([])
    const [showForm, setShowForm] = React.useState(false)
    const [formData, setFormData] = React.useState({ name: '', description: '' })

    React.useEffect(() => {
        //функция для получения предметов
        fetch('/api/subjects')
            .then(res => res.json())
            .then(data => setSubjects(data))
    }, [])

    //функция для добавления предмета
    const handleAdd = async (e) => {
        e.preventDefault()
        await fetch('/api/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        setShowForm(false)
        window.location.reload()
    }

    return React.createElement('div', { className: 'glass-card' },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' } },
            React.createElement('h3', { style: { color: 'white', margin: 0 } }, 'Справочник предметов'),
            React.createElement('button', { className: 'btn', onClick: () => setShowForm(!showForm) }, showForm ? 'Отмена' : 'Добавить предмет')
        ),
        showForm && React.createElement('form', { onSubmit: handleAdd, style: { background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '15px' } },
            React.createElement('input', { className: 'input', placeholder: 'Название предмета', value: formData.name, onChange: (e) => setFormData({...formData, name: e.target.value}) }),
            React.createElement('textarea', { className: 'input', rows: 2, placeholder: 'Описание', value: formData.description, onChange: (e) => setFormData({...formData, description: e.target.value}) }),
            React.createElement('button', { className: 'btn', type: 'submit' }, 'Сохранить')
        ),
        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', color: 'white' } },
            React.createElement('thead', null,
                React.createElement('tr', { style: { borderBottom: '2px solid rgba(255,255,255,0.3)' } },
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Название'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Описание')
                )
            ),
            React.createElement('tbody', null,
                subjects.map(s => React.createElement('tr', { key: s.id, style: { borderBottom: '1px solid rgba(255,255,255,0.1)' } },
                    React.createElement('td', { style: { padding: '10px' } }, s.name),
                    React.createElement('td', { style: { padding: '10px' } }, s.description || '—')
                ))
            )
        )
    )
}