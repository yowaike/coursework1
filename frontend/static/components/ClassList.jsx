// компонент списка классов с формой добавления
const ClassList = () => {
    const [classes, setClasses] = React.useState([])
    const [showForm, setShowForm] = React.useState(false)
    const [formData, setFormData] = React.useState({ name: '', year: 2024 })

    React.useEffect(() => {
        //функция для получения классов
        fetch('/api/classes')
            .then(res => res.json())
            .then(data => setClasses(data))
    }, [])

    //функция для добавления класса
    const handleAdd = async (e) => {
        e.preventDefault()
        await fetch('/api/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        setShowForm(false)
        window.location.reload()
    }

    return React.createElement('div', { className: 'glass-card' },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' } },
            React.createElement('h3', { style: { color: 'white', margin: 0 } }, 'Справочник классов'),
            React.createElement('button', { className: 'btn', onClick: () => setShowForm(!showForm) }, showForm ? 'Отмена' : 'Добавить класс')
        ),
        showForm && React.createElement('form', { onSubmit: handleAdd, style: { background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '15px' } },
            React.createElement('input', { className: 'input', placeholder: 'Название (например 9А)', value: formData.name, onChange: (e) => setFormData({...formData, name: e.target.value}) }),
            React.createElement('input', { className: 'input', type: 'number', placeholder: 'Год обучения', value: formData.year, onChange: (e) => setFormData({...formData, year: Number(e.target.value)}) }),
            React.createElement('button', { className: 'btn', type: 'submit' }, 'Сохранить')
        ),
        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', color: 'white' } },
            React.createElement('thead', null,
                React.createElement('tr', { style: { borderBottom: '2px solid rgba(255,255,255,0.3)' } },
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Название'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Год')
                )
            ),
            React.createElement('tbody', null,
                classes.map(c => React.createElement('tr', { key: c.id, style: { borderBottom: '1px solid rgba(255,255,255,0.1)' } },
                    React.createElement('td', { style: { padding: '10px' } }, c.name),
                    React.createElement('td', { style: { padding: '10px' } }, c.year)
                ))
            )
        )
    )
}