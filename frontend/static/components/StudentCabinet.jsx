// кабинет ученика: дневник с личными оценками и заметками
const StudentCabinet = () => {
    // функция для хранения оценок
    const [grades, setGrades] = React.useState([])
    // функция для хранения заметок
    const [notes, setNotes] = React.useState([])
    // функция для хранения расписания
    const [schedule, setSchedule] = React.useState([])
    // функция для хранения профиля ученика
    const [student, setStudent] = React.useState(null)
    // функция для хранения списка предметов
    const [subjects, setSubjects] = React.useState([])
    // функция для хранения текста новой заметки
    const [noteText, setNoteText] = React.useState('')
    // функция для управления загрузкой
    const [loading, setLoading] = React.useState(true)
    // функция для хранения ошибки
    const [error, setError] = React.useState('')

    // функция для загрузки данных при монтировании
    React.useEffect(() => {
        loadData()
    }, [])

    // функция для загрузки всех данных
    const loadData = () => {
        setLoading(true)
        setError('')
        fetch('/api/students/me', { credentials: 'include' })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(studentData => {
                setStudent(studentData)
                return Promise.all([
                    fetch('/api/grades/my', { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject()),
                    fetch('/api/notes', { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject()),
                    fetch(`/api/schedule?class_id=${studentData.class_id}`, { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject()),
                    fetch('/api/subjects', { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject())
                ]).then(([gradesData, notesData, scheduleData, subjectsData]) => {
                    setGrades(gradesData)
                    // фильтруем заметки — только для этого ученика
                    setNotes(notesData.filter(n => n.student_id === studentData.id))
                    setSchedule(scheduleData)
                    setSubjects(subjectsData)
                    setLoading(false)
                })
            })
            .catch(() => {
                setError('Не удалось загрузить данные.')
                setLoading(false)
            })
    }

    // функция для добавления заметки
    const handleAddNote = async (e) => {
        e.preventDefault()
        if (!student || !noteText.trim()) return
        try {
            await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    student_id: student.id,
                    text: noteText.trim(),
                    date: new Date().toISOString().split('T')[0]
                })
            })
            setNoteText('')
            // обновляем заметки
            const updated = await fetch('/api/notes', { credentials: 'include' }).then(r => r.json())
            setNotes(updated.filter(n => n.student_id === student.id))
        } catch (err) {
            // тихо игнорируем
        }
    }

    // функция для отображения загрузки
    if (loading) return React.createElement('div', { className: 'spinner' })

    // функция для отображения ошибки
    if (error) return React.createElement('div', { className: 'glass-card', style: { textAlign: 'center', padding: '40px' } },
        React.createElement('p', { style: { color: '#D32F2F', marginBottom: '20px' } }, error),
        React.createElement('button', { className: 'btn', onClick: loadData }, 'Повторить загрузку')
    )

    // маппинг ID предметов в названия
    const subjectNames = subjects.reduce((map, subject) => {
        map[subject.id] = subject.name
        return map
    }, {})

    // группировка оценок по предметам
    const gradesBySubject = {}
    grades.forEach(g => {
        if (!gradesBySubject[g.subject_id]) {
            gradesBySubject[g.subject_id] = []
        }
        gradesBySubject[g.subject_id].push(g)
    })

    const allGrades = grades.map(g => g.grade_value).filter(val => typeof val === 'number')
    const overallAverage = allGrades.length > 0 ? (allGrades.reduce((sum, value) => sum + value, 0) / allGrades.length).toFixed(2) : '—'

    return React.createElement('div', null,
        // заголовок с информацией об ученике
        React.createElement('div', { className: 'page-header' },
            React.createElement('div', null,
                React.createElement('h1', { className: 'page-title' }, 'Мой дневник'),
                student && React.createElement('p', { className: 'page-subtitle' },
                    `${student.user ? student.user.full_name : ''} · класс ${student.class_name || student.class_id}`
                )
            )
        ),

        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' } },
            // табель успеваемости
            React.createElement('div', { className: 'glass-card' },
                React.createElement('h3', { className: 'panel-title' }, 'Табель успеваемости'),
                Object.keys(gradesBySubject).length > 0 ?
                    React.createElement('table', null,
                        React.createElement('thead', null,
                            React.createElement('tr', null,
                                React.createElement('th', null, 'Предмет'),
                                React.createElement('th', { style: { textAlign: 'center' } }, '1 четв'),
                                React.createElement('th', { style: { textAlign: 'center' } }, '2 четв'),
                                React.createElement('th', { style: { textAlign: 'center' } }, '3 четв'),
                                React.createElement('th', { style: { textAlign: 'center' } }, '4 четв'),
                                React.createElement('th', { style: { textAlign: 'center' } }, 'Год')
                            )
                        ),
                        React.createElement('tbody', null,
                            Object.entries(gradesBySubject).map(([subjectId, subjectGrades]) => {
                                // собираем четвертные оценки
                                const quarterGrades = {}
                                subjectGrades.forEach(g => {
                                    if (g.grade_type === 'quarter') {
                                        quarterGrades[g.quarter] = g.grade_value
                                    }
                                })
                                // считаем годовую
                                const yearGrades = [1, 2, 3, 4].map(q => quarterGrades[q] || 0).filter(v => v > 0)
                                const yearly = yearGrades.length > 0 ?
                                    Math.round(yearGrades.reduce((sum, val) => sum + val, 0) / yearGrades.length)
                                    : '—'

                                return React.createElement('tr', { key: subjectId },
                                    React.createElement('td', { style: { fontWeight: 500 } }, subjectNames[subjectId] || `ID ${subjectId}`),
                                    [1, 2, 3, 4].map(q =>
                                        React.createElement('td', { key: q, style: { textAlign: 'center' } },
                                            quarterGrades[q] ?
                                                React.createElement('span', { className: `grade-badge grade-${quarterGrades[q]}` }, quarterGrades[q])
                                                : React.createElement('span', { style: { color: 'var(--text-secondary)' } }, '—')
                                        )
                                    ),
                                    React.createElement('td', { style: { textAlign: 'center', fontWeight: 600 } }, yearly)
                                )
                            })
                        )
                    ) :
                    React.createElement('p', { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' } }, 'Оценок пока нет')
            ),

            React.createElement('div', null,
                React.createElement('div', { className: 'glass-card', style: { marginBottom: '24px' } },
                    React.createElement('h3', { className: 'panel-title' }, 'Расписание'),
                    schedule.length > 0 ?
                        React.createElement('div', { style: { display: 'grid', gap: '0' } },
                            schedule.map(item => React.createElement('div', { key: item.id, className: 'lesson-item' },
                                React.createElement('div', { className: 'lesson-item__time' }, item.start_time),
                                React.createElement('div', { className: 'lesson-item__body' },
                                    React.createElement('div', { className: 'lesson-item__subject' }, item.subject_name || item.subject_id),
                                    React.createElement('div', { className: 'lesson-item__meta' },
                                        `${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][item.day_of_week - 1] || item.day_of_week}${item.room ? ' · каб. ' + item.room : ''}`
                                    )
                                )
                            ))
                        ) :
                        React.createElement('p', { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' } }, 'Расписание пока не доступно')
                ),

                React.createElement('div', { className: 'glass-card' },
                    React.createElement('h3', { className: 'panel-title' }, 'Заметки'),
                    React.createElement('div', { className: 'item-card__stats', style: { marginBottom: '16px', paddingTop: 0, borderTop: 'none' } },
                        React.createElement('div', { className: 'item-card__stat' },
                            React.createElement('span', { className: 'item-card__stat-value' }, overallAverage),
                            React.createElement('span', { className: 'item-card__stat-label' }, 'Средний балл')
                        ),
                        React.createElement('button', { className: 'btn btn--compact btn--ghost', onClick: loadData, style: { alignSelf: 'end' } }, 'Обновить')
                    ),
                    React.createElement('form', { onSubmit: handleAddNote, style: { marginBottom: '20px' } },
                        React.createElement('textarea', {
                            className: 'input',
                            rows: 4,
                            placeholder: 'Добавить заметку...',
                            value: noteText,
                            onChange: e => setNoteText(e.target.value)
                        }),
                        React.createElement('button', {
                            className: 'btn btn--compact',
                            type: 'submit',
                            disabled: !noteText.trim(),
                            style: { width: '100%' }
                        }, 'Сохранить')
                    ),
                    notes.length > 0 ?
                        React.createElement('div', { className: 'note-list' },
                            notes.map(note => React.createElement('article', { key: note.id, className: 'note-card' },
                                React.createElement('span', { className: 'note-card__date', style: { display: 'block', marginBottom: '8px' } }, note.date),
                                React.createElement('p', { className: 'note-card__text', style: { marginBottom: 0 } }, note.text)
                            ))
                        )
                        : React.createElement('p', { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' } }, 'Заметок пока нет')
                )
            )
        )
    )
}