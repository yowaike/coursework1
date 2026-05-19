// компонент расписания с формой добавления
const ScheduleList = () => {
    const [schedule, setSchedule] = React.useState([])
    const [showForm, setShowForm] = React.useState(false)
    const [formData, setFormData] = React.useState({ 
        class_id: 1, 
        subject_id: 1, 
        teacher_id: 1, 
        day_of_week: 1, 
        start_time: '08:00', 
        room: '101' 
    })

    React.useEffect(() => {
        //функция для получения расписания
        fetch('/api/schedule')
            .then(res => res.json())
            .then(data => setSchedule(data))
    }, [])

    //функция для добавления урока
    const handleAdd = async (e) => {
        e.preventDefault()
        await fetch('/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        setShowForm(false)
        window.location.reload()
    }

    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

    return React.createElement('div', { className: 'glass-card' },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' } },
            React.createElement('h3', { style: { color: 'white', margin: 0 } }, 'Расписание'),
            React.createElement('button', { className: 'btn', onClick: () => setShowForm(!showForm) }, 
                showForm ? 'Отмена' : 'Добавить урок')
        ),
        
        showForm && React.createElement('form', { 
            onSubmit: handleAdd, 
            style: { background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '15px' } 
        },
            React.createElement('input', { className: 'input', type: 'number', placeholder: 'ID класса', 
                value: formData.class_id, onChange: (e) => setFormData({...formData, class_id: Number(e.target.value)}) }),
            React.createElement('input', { className: 'input', type: 'number', placeholder: 'ID предмета', 
                value: formData.subject_id, onChange: (e) => setFormData({...formData, subject_id: Number(e.target.value)}) }),
            React.createElement('input', { className: 'input', type: 'number', placeholder: 'ID учителя', 
                value: formData.teacher_id, onChange: (e) => setFormData({...formData, teacher_id: Number(e.target.value)}) }),
            React.createElement('select', { className: 'input', 
                value: formData.day_of_week, onChange: (e) => setFormData({...formData, day_of_week: Number(e.target.value)}) },
                days.map((d, i) => React.createElement('option', { key: i, value: i+1, style: { color: 'black' } }, d))
            ),
            React.createElement('input', { className: 'input', type: 'time', 
                value: formData.start_time, onChange: (e) => setFormData({...formData, start_time: e.target.value}) }),
            React.createElement('input', { className: 'input', placeholder: 'Кабинет', 
                value: formData.room, onChange: (e) => setFormData({...formData, room: e.target.value}) }),
            React.createElement('button', { className: 'btn', type: 'submit' }, 'Добавить')
        ),

        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', color: 'white' } },
            React.createElement('thead', null,
                React.createElement('tr', { style: { borderBottom: '2px solid rgba(255,255,255,0.3)' } },
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'День'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Время'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Предмет'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Кабинет')
                )
            ),
            React.createElement('tbody', null,
                schedule.map(item => 
                    React.createElement('tr', { key: item.id, style: { borderBottom: '1px solid rgba(255,255,255,0.1)' } },
                        React.createElement('td', { style: { padding: '10px' } }, days[item.day_of_week - 1] || item.day_of_week),
                        React.createElement('td', { style: { padding: '10px' } }, item.start_time),
                        React.createElement('td', { style: { padding: '10px' } }, item.subject_id),
                        React.createElement('td', { style: { padding: '10px' } }, item.room || '—')
                    )
                )
            )
        )
    )
}