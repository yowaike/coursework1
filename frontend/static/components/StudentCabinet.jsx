// StudentCabinet.jsx 
const StudentCabinet = () => {
    const [grades, setGrades] = React.useState([])
    const [notes, setNotes] = React.useState([])
    const [schedule, setSchedule] = React.useState([])
    const [student, setStudent] = React.useState(null)
    const [subjects, setSubjects] = React.useState([])
    const [finalGrades, setFinalGrades] = React.useState([])
    const [noteText, setNoteText] = React.useState('')
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState('')
    const [selectedSubject, setSelectedSubject] = React.useState(null)
    const [modalOpen, setModalOpen] = React.useState(false)

    React.useEffect(() => {
        loadData()
    }, [])

    const loadData = () => {
        setLoading(true)
        setError('')
        fetch('/api/students/me', { credentials: 'include' })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(studentData => {
                setStudent(studentData)
                return Promise.all([
                    fetch('/api/grades/my', { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject()),
                    fetch('/api/final-grades', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
                    fetch('/api/notes', { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject()),
                    fetch(`/api/schedule?class_id=${studentData.class_id}`, { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject()),
                    fetch('/api/subjects', { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject())
                ]).then(([gradesData, finalGradesData, notesData, scheduleData, subjectsData]) => {
                    setGrades(gradesData)
                    setFinalGrades(finalGradesData || [])
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
            const updated = await fetch('/api/notes', { credentials: 'include' }).then(r => r.json())
            setNotes(updated.filter(n => n.student_id === student.id))
        } catch (err) { }
    }

    const openSubjectModal = (subjectId, subjectName) => {
        const subjectGrades = grades.filter(g => g.subject_id === subjectId).sort((a, b) => new Date(b.date) - new Date(a.date))
        setSelectedSubject({ id: subjectId, name: subjectName, grades: subjectGrades })
        setModalOpen(true)
    }

    if (loading) return React.createElement('div', { className: 'spinner' })
    if (error) return React.createElement('div', { className: 'glass-card', style: { textAlign: 'center', padding: '40px' } },
        React.createElement('p', { style: { color: '#D32F2F', marginBottom: '20px' } }, error),
        React.createElement('button', { className: 'btn', onClick: loadData }, 'Повторить загрузку')
    )

    const subjectNames = subjects.reduce((map, subject) => {
        map[subject.id] = subject.name
        return map
    }, {})

    const finalBySubject = finalGrades.reduce((acc, fg) => {
        acc[fg.subject_id] = fg
        return acc
    }, {})

    const allGradesBySubject = {}
    grades.forEach(g => {
        if (!allGradesBySubject[g.subject_id]) allGradesBySubject[g.subject_id] = []
        allGradesBySubject[g.subject_id].push(g)
    })

    const previewGradesBySubject = {}
    Object.keys(allGradesBySubject).forEach(subjId => {
        const sorted = [...allGradesBySubject[subjId]].sort((a, b) => new Date(b.date) - new Date(a.date))
        previewGradesBySubject[subjId] = sorted.slice(0, 3)
    })

    const overallAverage = (() => {
        const allVals = grades.map(g => g.grade_value).filter(v => typeof v === 'number')
        return allVals.length ? (allVals.reduce((a, b) => a + b, 0) / allVals.length).toFixed(2) : '—'
    })()

    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    const scheduleByDay = {}
    schedule.forEach(item => {
        const dayIndex = item.day_of_week - 1
        if (!scheduleByDay[dayIndex]) scheduleByDay[dayIndex] = []
        scheduleByDay[dayIndex].push(item)
    })
    for (let day in scheduleByDay) {
        scheduleByDay[day].sort((a, b) => a.start_time.localeCompare(b.start_time))
    }

    return React.createElement('div', null,
        React.createElement('div', { className: 'page-header' },
            React.createElement('div', null,
                React.createElement('h1', { className: 'page-title' }, 'Мой дневник'),
                student && React.createElement('p', { className: 'page-subtitle' },
                    `${student.user ? student.user.full_name : ''} · класс ${student.class_name || student.class_id}`
                )
            )
        ),

        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' } },
            // Левая колонка: оценки и табель
            React.createElement('div', null,
                React.createElement('div', { className: 'glass-card', style: { marginBottom: '24px' } },
                    React.createElement('h3', { className: 'panel-title' }, 'Текущие оценки'),
                    Object.keys(previewGradesBySubject).length > 0
                        ? React.createElement('div', { style: { display: 'grid', gap: '14px' } },
                            Object.entries(previewGradesBySubject).map(([subjectId, previewList]) => {
                                const fullList = allGradesBySubject[subjectId] || []
                                const last = fullList[0]
                                return React.createElement('div', {
                                    key: subjectId,
                                    style: { padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)', cursor: 'pointer' },
                                    onClick: () => openSubjectModal(Number(subjectId), subjectNames[subjectId])
                                },
                                    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '8px' } },
                                        React.createElement('div', null,
                                            React.createElement('div', { style: { fontWeight: 600 } }, subjectNames[subjectId] || `ID ${subjectId}`),
                                            last && React.createElement('div', { style: { fontSize: '12px', color: 'var(--text-secondary)' } }, `${last.date} · ${last.work_type}`)
                                        )
                                    ),
                                    React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' } },
                                        previewList.map((g, idx) =>
                                            React.createElement('span', { key: idx, className: `grade-badge grade-${g.grade_value}`, style: { width: 30, height: 30, fontSize: 13, cursor: 'pointer' } }, g.grade_value)
                                        ),
                                        fullList.length > 3 && React.createElement('span', { style: { fontSize: '12px', color: 'var(--text-secondary)', alignSelf: 'center' } }, `+ ещё ${fullList.length - 3}`)
                                    ),
                                    React.createElement('div', { style: { marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' } }, 'Нажмите, чтобы увидеть все оценки')
                                )
                            })
                        )
                        : React.createElement('p', { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' } }, 'Оценок пока нет')
                ),

                React.createElement('div', { className: 'glass-card' },
                    React.createElement('h3', { className: 'panel-title' }, 'Табель успеваемости'),
                    Object.keys(allGradesBySubject).length > 0 ?
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
                                Object.entries(allGradesBySubject).map(([subjectId, subjectGrades]) => {
                                    const quarterGrades = {}
                                    subjectGrades.forEach(g => {
                                        if (g.grade_type === 'quarter') quarterGrades[g.quarter] = g.grade_value
                                    })
                                    const fg = finalBySubject[Number(subjectId)]
                                    const yearly = fg?.value ?? '—'
                                    return React.createElement('tr', { key: subjectId, onClick: () => openSubjectModal(Number(subjectId), subjectNames[subjectId]), style: { cursor: 'pointer' } },
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
                )
            ),

            // Правая колонка: расписание + заметки
            React.createElement('div', null,
                React.createElement('div', { className: 'glass-card', style: { marginBottom: '24px' } },
                    React.createElement('h3', { className: 'panel-title' }, 'Расписание'),
                    schedule.length === 0 ?
                        React.createElement('p', { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' } }, 'Расписание пока не доступно') :
                        React.createElement('div', { className: 'schedule-grid' },
                            days.map((dayName, idx) => {
                                const lessons = scheduleByDay[idx] || []
                                return React.createElement('div', { key: idx, className: 'schedule-day' },
                                    React.createElement('div', { className: 'schedule-day__title' }, dayName),
                                    lessons.length === 0 ?
                                        React.createElement('div', { className: 'schedule-day__empty' }, 'Нет уроков') :
                                        lessons.map(lesson =>
                                            React.createElement('div', { key: lesson.id, className: 'lesson-item' },
                                                React.createElement('div', { className: 'lesson-item__time' }, lesson.start_time),
                                                React.createElement('div', { className: 'lesson-item__body' },
                                                    React.createElement('div', { className: 'lesson-item__subject' }, lesson.subject_name || subjectNames[lesson.subject_id] || '—'),
                                                    React.createElement('div', { className: 'lesson-item__meta' },
                                                        lesson.room ? `каб. ${lesson.room}` : ''
                                                    )
                                                )
                                            )
                                        )
                                )
                            })
                        )
                ),

                React.createElement('div', { className: 'glass-card' },
                    React.createElement('div', { className: 'item-card__stats', style: { marginBottom: '16px', paddingTop: 0, borderTop: 'none' } },
                        React.createElement('div', { className: 'item-card__stat' },
                            React.createElement('span', { className: 'item-card__stat-value' }, overallAverage),
                            React.createElement('span', { className: 'item-card__stat-label' }, 'Средний балл')
                        ),
                        React.createElement('button', { className: 'btn btn--compact btn--ghost', onClick: loadData, style: { alignSelf: 'end' } }, 'Обновить')
                    ),
                    React.createElement('h4', { style: { margin: '16px 0 8px 0', fontSize: '16px' } }, 'Личные заметки'),
                    React.createElement('form', { onSubmit: handleAddNote, style: { marginBottom: '20px' } },
                        React.createElement('textarea', { className: 'input', rows: 4, placeholder: 'Добавить личную заметку...', value: noteText, onChange: e => setNoteText(e.target.value) }),
                        React.createElement('button', { className: 'btn btn--compact', type: 'submit', disabled: !noteText.trim(), style: { width: '100%' } }, 'Сохранить')
                    ),
                    notes.filter(n => n.author_role === 'student').length > 0 ?
                        React.createElement('div', { className: 'note-list' },
                            notes.filter(n => n.author_role === 'student').map(note =>
                                React.createElement('article', { key: note.id, className: 'note-card' },
                                    React.createElement('span', { className: 'note-card__date', style: { display: 'block', marginBottom: '8px' } }, note.date),
                                    React.createElement('p', { className: 'note-card__text', style: { marginBottom: 0 } }, note.text)
                                )
                            )
                        ) :
                        React.createElement('p', { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' } }, 'Личных заметок пока нет'),
                    React.createElement('h4', { style: { margin: '16px 0 8px 0', fontSize: '16px' } }, 'Заметки от учителя / завуча'),
                    notes.filter(n => n.author_role !== 'student').length > 0 ?
                        React.createElement('div', { className: 'note-list' },
                            notes.filter(n => n.author_role !== 'student').map(note =>
                                React.createElement('article', { key: note.id, className: 'note-card' },
                                    React.createElement('span', { className: 'note-card__date', style: { display: 'block', marginBottom: '8px' } }, note.date),
                                    React.createElement('p', { className: 'note-card__text', style: { marginBottom: 0 } }, note.text)
                                )
                            )
                        ) :
                        React.createElement('p', { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' } }, 'Нет заметок от учителя или завуча')
                )
            )
        ),

        modalOpen && selectedSubject && React.createElement('div', {
            style: {
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
            },
            onClick: () => setModalOpen(false)
        },
            React.createElement('div', {
                className: 'glass-card',
                style: { width: '90%', maxWidth: '700px', maxHeight: '80vh', overflow: 'auto', padding: '28px' },
                onClick: e => e.stopPropagation()
            },
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' } },
                    React.createElement('h2', { style: { margin: 0 } }, selectedSubject.name),
                    React.createElement('button', { className: 'btn btn--ghost', onClick: () => setModalOpen(false) }, '✕')
                ),
                React.createElement('div', { className: 'table-wrap' },
                    React.createElement('table', null,
                        React.createElement('thead', null,
                            React.createElement('tr', null,
                                React.createElement('th', null, 'Дата'),
                                React.createElement('th', null, 'Оценка'),
                                React.createElement('th', null, 'Вид работы'),
                                React.createElement('th', null, 'Четверть'),
                                React.createElement('th', null, 'Учитель')
                            )
                        ),
                        React.createElement('tbody', null,
                            selectedSubject.grades.length > 0 ?
                                selectedSubject.grades.map((g, idx) =>
                                    React.createElement('tr', { key: idx },
                                        React.createElement('td', null, g.date),
                                        React.createElement('td', null, React.createElement('span', { className: `grade-badge grade-${g.grade_value}` }, g.grade_value)),
                                        React.createElement('td', null, g.work_type),
                                        React.createElement('td', null, g.quarter),
                                        React.createElement('td', null, g.teacher_name || '—')
                                    )
                                ) :
                                React.createElement('tr', null,
                                    React.createElement('td', { colSpan: 5, style: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' } }, 'Нет оценок по этому предмету')
                                )
                        )
                    )
                )
            )
        )
    )
}