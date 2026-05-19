// компонент журнала оценок
const GradeBook = () => {
    const [grades, setGrades] = React.useState([])
    const [showForm, setShowForm] = React.useState(false)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState('')
    const [formData, setFormData] = React.useState({
        student_id: 1,
        subject_id: 1,
        teacher_id: 1,
        grade_value: 5,
        grade_type: 'current',
        work_type: 'КР',
        quarter: 1,
        date: new Date().toISOString().split('T')[0]
    })

    React.useEffect(() => {
        //функция для загрузки оценок
        fetch('/api/grades')
            .then(res => {
                if (!res.ok) throw new Error('Ошибка загрузки')
                return res.json()
            })
            .then(data => {
                setGrades(data)
                setLoading(false)
            })
            .catch(err => {
                setError(err.message)
                setLoading(false)
            })
    }, [])

    //функция для выставления оценки
    const handleAdd = async (e) => {
        e.preventDefault()
        setError('')
        if (!formData.student_id || !formData.grade_value) {
            setError('Заполните обязательные поля')
            return
        }
        try {
            const res = await fetch('/api/grades', {
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
            React.createElement('h3', { style: { color: 'white', margin: 0 } }, 'Журнал оценок'),
            React.createElement('button', { className: 'btn', onClick: () => setShowForm(!showForm) }, 
                showForm ? 'Отмена' : 'Выставить оценку')
        ),

        error && React.createElement('div', { className: 'error-msg' }, error),

        showForm && React.createElement('form', {
            onSubmit: handleAdd,
            style: { background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }
        },
            React.createElement('input', { className: 'input', type: 'number', placeholder: 'ID ученика',
                value: formData.student_id, onChange: (e) => setFormData({...formData, student_id: Number(e.target.value)}) }),
            React.createElement('input', { className: 'input', type: 'number', placeholder: 'ID предмета',
                value: formData.subject_id, onChange: (e) => setFormData({...formData, subject_id: Number(e.target.value)}) }),
            React.createElement('input', { className: 'input', type: 'number', placeholder: 'ID учителя',
                value: formData.teacher_id, onChange: (e) => setFormData({...formData, teacher_id: Number(e.target.value)}) }),
            React.createElement('input', { className: 'input', type: 'number', placeholder: 'Оценка (2-5)', min: 2, max: 5,
                value: formData.grade_value, onChange: (e) => setFormData({...formData, grade_value: Number(e.target.value)}) }),
            React.createElement('input', { className: 'input', placeholder: 'Вид работы (КР, ДЗ)',
                value: formData.work_type, onChange: (e) => setFormData({...formData, work_type: e.target.value}) }),
            React.createElement('input', { className: 'input', type: 'number', placeholder: 'Четверть (1-4)', min: 1, max: 4,
                value: formData.quarter, onChange: (e) => setFormData({...formData, quarter: Number(e.target.value)}) }),
            React.createElement('input', { className: 'input', type: 'date',
                value: formData.date, onChange: (e) => setFormData({...formData, date: e.target.value}) }),
            React.createElement('button', { className: 'btn', type: 'submit' }, 'Сохранить оценку')
        ),

        React.createElement(ExportButton, { data: grades, filename: 'zhurnal_ocenok.csv' }),

        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', color: 'white' } },
            React.createElement('thead', null,
                React.createElement('tr', { style: { borderBottom: '2px solid rgba(255,255,255,0.3)' } },
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Ученик ID'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Предмет ID'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Оценка'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Вид работы'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Четверть')
                )
            ),
            React.createElement('tbody', null,
                grades.map(g =>
                    React.createElement('tr', { key: g.id, style: { borderBottom: '1px solid rgba(255,255,255,0.1)' } },
                        React.createElement('td', { style: { padding: '10px' } }, g.student_id),
                        React.createElement('td', { style: { padding: '10px' } }, g.subject_id),
                        React.createElement('td', { style: { padding: '10px', fontWeight: 'bold' } }, g.grade_value),
                        React.createElement('td', { style: { padding: '10px' } }, g.work_type),
                        React.createElement('td', { style: { padding: '10px' } }, g.quarter)
                    )
                )
            )
        )
    )
}