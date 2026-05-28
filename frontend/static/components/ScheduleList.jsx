// компонент расписания в виде сетки по дням недели как в школьных дневниках
const ScheduleList = () => {
    const [schedule, setSchedule] = React.useState([])
    const [classes, setClasses] = React.useState([])
    const [subjects, setSubjects] = React.useState([])
    const [teachers, setTeachers] = React.useState([])
    const [selectedClass, setSelectedClass] = React.useState('')
    const [showForm, setShowForm] = React.useState(false)
    const [editingLesson, setEditingLesson] = React.useState(null)
    const [formData, setFormData] = React.useState({ 
        class_id: 1, subject_id: 1, teacher_id: 1, day_of_week: 1, start_time: '08:00', room: '101' 
    })
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState('')
    const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, id: null, name: '' })

    const days = [
        { num: 1, short: 'Пн', full: 'Понедельник' },
        { num: 2, short: 'Вт', full: 'Вторник' },
        { num: 3, short: 'Ср', full: 'Среда' },
        { num: 4, short: 'Чт', full: 'Четверг' },
        { num: 5, short: 'Пт', full: 'Пятница' },
        { num: 6, short: 'Сб', full: 'Суббота' }
    ]

    React.useEffect(() => {
        Promise.all([
            fetch('/api/schedule', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/classes', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/subjects', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/teachers', { credentials: 'include' }).then(r => r.json())
        ]).then(([sData, cData, subjData, tData]) => {
            setSchedule(sData)
            setClasses(cData)
            setSubjects(subjData)
            setTeachers(tData)
            if (cData.length > 0) {
                setSelectedClass(String(cData[0].id))
                setFormData(prev => ({ ...prev, class_id: cData[0].id }))
            }
            if (subjData.length > 0) setFormData(prev => ({ ...prev, subject_id: subjData[0].id }))
            if (tData.length > 0) setFormData(prev => ({ ...prev, teacher_id: tData[0].id }))
            setLoading(false)
        }).catch(err => {
            setError(err.message)
            setLoading(false)
        })
    }, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        setError('')
        try {
            const res = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            })
            if (!res.ok) throw new Error('Не удалось добавить')
            setShowForm(false)
            const updated = await fetch('/api/schedule', { credentials: 'include' }).then(r => r.json())
            setSchedule(updated)
        } catch (err) {
            setError(err.message)
        }
    }

    const handleUpdate = async (e) => {
        e.preventDefault()
        if (!editingLesson) return
        setError('')
        try {
            const res = await fetch(`/api/schedule/${editingLesson.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || 'Не удалось обновить')
            }
            setEditingLesson(null)
            setShowForm(false)
            const updated = await fetch('/api/schedule', { credentials: 'include' }).then(r => r.json())
            setSchedule(updated)
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/schedule/${confirmModal.id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (!res.ok) throw new Error('Не удалось удалить')
            setConfirmModal({ isOpen: false, id: null, name: '' })
            const updated = await fetch('/api/schedule', { credentials: 'include' }).then(r => r.json())
            setSchedule(updated)
        } catch (err) {
            setError(err.message)
            setConfirmModal({ isOpen: false, id: null, name: '' })
        }
    }

    if (loading) return React.createElement('div', { className: 'spinner' })

    const classMap = classes.reduce((acc, c) => { acc[c.id] = c.name; return acc }, {})
    const subjectMap = subjects.reduce((acc, s) => { acc[s.id] = { name: s.name, color: getSubjectColor(s.id) }; return acc }, {})
    const teacherMap = teachers.reduce((acc, t) => { acc[t.id] = t.user ? t.user.full_name : '—'; return acc }, {})
    const getTeacherOptionLabel = (teacher) => {
        const name = teacher?.user?.full_name || `#${teacher?.id || '—'}`
        const subjectName = teacher?.subject_name || subjectMap[teacher?.subject_id]?.name
        return subjectName ? `${name} (${subjectName})` : name
    }

    const filteredSchedule = selectedClass 
        ? schedule.filter(s => s.class_id === Number(selectedClass)) 
        : schedule

    const scheduleByDay = {}
    days.forEach(d => { scheduleByDay[d.num] = [] })
    filteredSchedule.forEach(item => {
        if (scheduleByDay[item.day_of_week]) {
            scheduleByDay[item.day_of_week].push(item)
        }
    })
    Object.keys(scheduleByDay).forEach(day => {
        scheduleByDay[day].sort((a, b) => a.start_time.localeCompare(b.start_time))
    })

    const selectedClassName = classMap[selectedClass] || 'Все классы'

    return React.createElement('div', null,
        React.createElement('div', { className: 'page-header' },
            React.createElement('div', null,
                React.createElement('h1', { className: 'page-title' }, 'Расписание'),
                React.createElement('p', { className: 'page-subtitle' }, `Класс ${selectedClassName}`)
            ),
            React.createElement('button', {
                className: 'btn btn--compact',
                onClick: () => { setShowForm(!showForm); if (!showForm) setEditingLesson(null); setError('') }
            }, showForm ? 'Отмена' : 'Добавить урок')
        ),

        React.createElement('div', { className: 'glass-card filter-bar' },
            React.createElement('span', { className: 'filter-bar__label' }, 'Класс'),
            classes.map(c =>
                React.createElement('button', {
                    key: c.id,
                    type: 'button',
                    className: 'chip' + (selectedClass === String(c.id) ? ' chip--active' : ''),
                    onClick: () => setSelectedClass(String(c.id))
                }, c.name)
            )
        ),

        error && React.createElement('div', { className: 'error-msg' }, error),

        showForm && React.createElement('div', { className: 'glass-card', style: { marginBottom: '20px' } },
            React.createElement('h3', { className: 'panel-title' }, editingLesson ? 'Редактировать урок' : 'Новый урок'),
            React.createElement('form', { 
                onSubmit: editingLesson ? handleUpdate : handleAdd,
                style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }
            },
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'Класс'),
                    React.createElement('select', { className: 'input', value: formData.class_id, onChange: (e) => setFormData({...formData, class_id: Number(e.target.value)}) },
                        classes.map(c => React.createElement('option', { key: c.id, value: c.id }, c.name))
                    )
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'Предмет'),
                    React.createElement('select', { className: 'input', value: formData.subject_id, onChange: (e) => setFormData({...formData, subject_id: Number(e.target.value)}) },
                        subjects.map(s => React.createElement('option', { key: s.id, value: s.id }, s.name))
                    )
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'Учитель'),
                    React.createElement('select', { className: 'input', value: formData.teacher_id, onChange: (e) => setFormData({...formData, teacher_id: Number(e.target.value)}) },
                        teachers.map(t => React.createElement('option', { key: t.id, value: t.id }, getTeacherOptionLabel(t)))
                    )
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'День недели'),
                    React.createElement('select', { className: 'input', value: formData.day_of_week, onChange: (e) => setFormData({...formData, day_of_week: Number(e.target.value)}) },
                        days.map(d => React.createElement('option', { key: d.num, value: d.num }, d.full))
                    )
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'Время'),
                    React.createElement('input', { className: 'input', type: 'time', value: formData.start_time, onChange: (e) => setFormData({...formData, start_time: e.target.value}) })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'Кабинет'),
                    React.createElement('input', { className: 'input', placeholder: 'Кабинет', value: formData.room, onChange: (e) => setFormData({...formData, room: e.target.value}) })
                ),
                React.createElement('div', { style: { gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' } },
                    React.createElement('button', { className: 'btn btn--ghost', type: 'button', onClick: () => setShowForm(false) }, 'Отмена'),
                    React.createElement('button', { className: 'btn btn--compact', type: 'submit' }, editingLesson ? 'Сохранить' : 'Добавить')
                )
            )
        ),

        React.createElement('div', { className: 'schedule-grid' },
            days.map(day => {
                const lessons = scheduleByDay[day.num] || []
                return React.createElement('div', { key: day.num, className: 'schedule-day' },
                    React.createElement('div', { className: 'schedule-day__title' }, day.full),
                    lessons.length > 0 ?
                        lessons.map((lesson, idx) =>
                            React.createElement('div', { key: lesson.id || idx, className: 'lesson-item' },
                                React.createElement('div', { className: 'lesson-item__time' }, lesson.start_time),
                                React.createElement('div', { className: 'lesson-item__body' },
                                    React.createElement('div', { className: 'lesson-item__subject' },
                                        subjectMap[lesson.subject_id] ? subjectMap[lesson.subject_id].name : lesson.subject_id
                                    ),
                                    React.createElement('div', { className: 'lesson-item__meta' }, teacherMap[lesson.teacher_id] || '—'),
                                    lesson.room && React.createElement('div', { className: 'lesson-item__meta' }, `Кабинет ${lesson.room}`)
                                ),
                                React.createElement('button', {
                                    type: 'button',
                                    className: 'item-card__icon-btn',
                                    onClick: () => {
                                        setEditingLesson(lesson)
                                        setFormData({
                                            class_id: lesson.class_id,
                                            subject_id: lesson.subject_id,
                                            teacher_id: lesson.teacher_id,
                                            day_of_week: lesson.day_of_week,
                                            start_time: lesson.start_time,
                                            room: lesson.room || ''
                                        })
                                        setShowForm(true)
                                        setError('')
                                    },
                                    title: 'Редактировать'
                                }, '✎'),
                                React.createElement('button', {
                                    type: 'button',
                                    className: 'item-card__icon-btn item-card__icon-btn--danger',
                                    onClick: () => setConfirmModal({ isOpen: true, id: lesson.id, name: subjectMap[lesson.subject_id]?.name || 'урок' }),
                                    title: 'Удалить'
                                }, '×')
                            )
                        )
                        : React.createElement('div', { className: 'schedule-day__empty' }, 'Нет уроков')
                )
            })
        ),

        confirmModal.isOpen && React.createElement('div', {
            style: {
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
            },
            onClick: () => setConfirmModal({ isOpen: false, id: null, name: '' })
        },
            React.createElement('div', {
                className: 'glass-card',
                style: { width: '400px', padding: '32px', textAlign: 'center' },
                onClick: (e) => e.stopPropagation()
            },
                React.createElement('h3', { style: { marginBottom: '12px', color: 'var(--text-primary)' } }, 'Удалить урок'),
                React.createElement('p', { style: { color: 'var(--text-secondary)', marginBottom: '24px' } },
                    `Вы уверены, что хотите удалить урок "${confirmModal.name}"?`
                ),
                React.createElement('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center' } },
                    React.createElement('button', { className: 'btn btn--ghost', onClick: () => setConfirmModal({ isOpen: false, id: null, name: '' }) }, 'Отмена'),
                    React.createElement('button', { className: 'btn btn--danger', onClick: handleDelete }, 'Удалить')
                )
            )
        )
    )
}

function getSubjectColor(id) {
    const colors = ['#4A90D9', '#E85D75', '#50B86C', '#F5A623', '#9B59B6', '#1ABC9C', '#E74C3C', '#3498DB', '#2ECC71', '#F39C12']
    return colors[(id - 1) % colors.length]
}
