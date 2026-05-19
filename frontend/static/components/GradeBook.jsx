// компонент журнала оценок в премиальном стиле
const GradeBook = () => {
    const [grades, setGrades] = React.useState([])
    const [showForm, setShowForm] = React.useState(false)
    const [loading, setLoading] = React.useState(true)
    const [selectedClass, setSelectedClass] = React.useState('7A')
    const [selectedQuarter, setSelectedQuarter] = React.useState('2')
    const [formData, setFormData] = React.useState({
        student_id: 1,
        subject_id: 1,
        teacher_id: 1,
        grade_value: 5,
        work_type: 'КР',
        quarter: 2,
        date: new Date().toISOString().split('T')[0]
    })

    React.useEffect(() => {
        fetch('/api/grades')
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => {
                setGrades(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        try {
            await fetch('/api/grades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            setShowForm(false)
            window.location.reload()
        } catch (err) {
            console.error(err)
        }
    }

    // функция для получения класса оценки
    const getGradeClass = (grade) => {
        if (grade >= 5) return 'grade-5'
        if (grade === 4) return 'grade-4'
        if (grade === 3) return 'grade-3'
        return 'grade-2'
    }

    if (loading) return React.createElement('div', { className: 'spinner' })

    return React.createElement('div', null,
        // заголовок страницы
        React.createElement('div', { style: { marginBottom: '32px' } },
            React.createElement('h1', { style: { fontSize: '36px', marginBottom: '8px' } }, 'ОЦЕНКИ'),
            React.createElement('p', { style: { color: 'var(--text-secondary)', margin: 0 } }, 'Электронный журнал успеваемости')
        ),

        // фильтры
        React.createElement('div', { className: 'glass-card', style: { marginBottom: '24px', padding: '20px' } },
            React.createElement('div', { style: { display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' } },
                React.createElement('div', null,
                    React.createElement('label', { style: { display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' } }, 'Класс'),
                    React.createElement('select', { 
                        className: 'input', 
                        value: selectedClass, 
                        onChange: (e) => setSelectedClass(e.target.value),
                        style: { width: '150px', marginBottom: 0 }
                    },
                        React.createElement('option', null, '7A'),
                        React.createElement('option', null, '7Б'),
                        React.createElement('option', null, '8A')
                    )
                ),
                React.createElement('div', null,
                    React.createElement('label', { style: { display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' } }, 'Четверть'),
                    React.createElement('select', { 
                        className: 'input', 
                        value: selectedQuarter,
                        onChange: (e) => setSelectedQuarter(e.target.value),
                        style: { width: '150px', marginBottom: 0 }
                    },
                        React.createElement('option', null, '1 четверть'),
                        React.createElement('option', null, '2 четверть'),
                        React.createElement('option', null, '3 четверть'),
                        React.createElement('option', null, '4 четверть')
                    )
                ),
                React.createElement('button', { className: 'btn', style: { marginTop: '22px' } }, 'ПОКАЗАТЬ'),
                React.createElement('div', { style: { flex: 1 } }),
                React.createElement(ExportButton, { data: grades, filename: 'zhurnal_ocenok.csv' })
            )
        ),

        // кнопка добавления
        React.createElement('button', { 
            className: 'btn', 
            onClick: () => setShowForm(!showForm),
            style: { background: 'var(--bg-sidebar)', color: 'var(--text-primary)', marginBottom: '24px' }
        }, showForm ? 'ОТМЕНА' : 'ДОБАВИТЬ ТЕКУЩУЮ ОЦЕНКУ'),

        // форма добавления
        showForm && React.createElement('div', { className: 'glass-card', style: { marginBottom: '24px' } },
            React.createElement('h3', { style: { fontSize: '18px', marginBottom: '20px' } }, 'Новая оценка'),
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' } },
                React.createElement('input', { className: 'input', type: 'number', placeholder: 'ID ученика', value: formData.student_id, onChange: (e) => setFormData({...formData, student_id: Number(e.target.value)}) }),
                React.createElement('input', { className: 'input', type: 'number', placeholder: 'ID предмета', value: formData.subject_id, onChange: (e) => setFormData({...formData, subject_id: Number(e.target.value)}) }),
                React.createElement('input', { className: 'input', type: 'number', placeholder: 'ID учителя', value: formData.teacher_id, onChange: (e) => setFormData({...formData, teacher_id: Number(e.target.value)}) }),
                React.createElement('input', { className: 'input', type: 'number', placeholder: 'Оценка (2-5)', min: 2, max: 5, value: formData.grade_value, onChange: (e) => setFormData({...formData, grade_value: Number(e.target.value)}) }),
                React.createElement('input', { className: 'input', placeholder: 'Тип работы (КР, ДЗ)', value: formData.work_type, onChange: (e) => setFormData({...formData, work_type: e.target.value}) }),
                React.createElement('input', { className: 'input', type: 'number', placeholder: 'Четверть', min: 1, max: 4, value: formData.quarter, onChange: (e) => setFormData({...formData, quarter: Number(e.target.value)}) })
            ),
            React.createElement('button', { className: 'btn', onClick: handleAdd }, 'СОХРАНИТЬ ОЦЕНКУ')
        ),

        // таблица оценок
        React.createElement('div', { className: 'glass-card' },
            React.createElement('table', null,
                React.createElement('thead', null,
                    React.createElement('tr', null,
                        React.createElement('th', null, 'Ученик'),
                        React.createElement('th', { style: { textAlign: 'center' } }, 'Математика'),
                        React.createElement('th', { style: { textAlign: 'center' } }, 'Русский язык'),
                        React.createElement('th', { style: { textAlign: 'center' } }, 'Английский'),
                        React.createElement('th', { style: { textAlign: 'center' } }, 'Физика'),
                        React.createElement('th', { style: { textAlign: 'center' } }, 'Средняя'),
                        React.createElement('th', { style: { textAlign: 'center' } }, 'Четвертная')
                    )
                ),
                React.createElement('tbody', null,
                    // пример данных (в реальности нужно группировать по ученикам)
                    React.createElement('tr', null,
                        React.createElement('td', { style: { fontWeight: 500 } }, 'Иванов И.И.'),
                        React.createElement('td', { style: { textAlign: 'center' } }, React.createElement('span', { className: 'grade-badge grade-5' }, '5')),
                        React.createElement('td', { style: { textAlign: 'center' } }, React.createElement('span', { className: 'grade-badge grade-4' }, '4')),
                        React.createElement('td', { style: { textAlign: 'center' } }, React.createElement('span', { className: 'grade-badge grade-5' }, '5')),
                        React.createElement('td', { style: { textAlign: 'center' } }, React.createElement('span', { className: 'grade-badge grade-5' }, '5')),
                        React.createElement('td', { style: { textAlign: 'center', color: 'var(--text-secondary)' } }, '4.75'),
                        React.createElement('td', { style: { textAlign: 'center' } }, React.createElement('span', { className: 'grade-badge grade-5' }, '5'))
                    ),
                    React.createElement('tr', null,
                        React.createElement('td', { style: { fontWeight: 500 } }, 'Петров П.П.'),
                        React.createElement('td', { style: { textAlign: 'center' } }, React.createElement('span', { className: 'grade-badge grade-3' }, '3')),
                        React.createElement('td', { style: { textAlign: 'center' } }, React.createElement('span', { className: 'grade-badge grade-4' }, '4')),
                        React.createElement('td', { style: { textAlign: 'center' } }, React.createElement('span', { className: 'grade-badge grade-3' }, '3')),
                        React.createElement('td', { style: { textAlign: 'center' } }, React.createElement('span', { className: 'grade-badge grade-4' }, '4')),
                        React.createElement('td', { style: { textAlign: 'center', color: 'var(--text-secondary)' } }, '3.50'),
                        React.createElement('td', { style: { textAlign: 'center' } }, React.createElement('span', { className: 'grade-badge grade-4' }, '4'))
                    )
                )
            )
        )
    )
}