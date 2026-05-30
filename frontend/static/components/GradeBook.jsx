const TEACHER_WORK_TYPES = ['ДЗ', 'КР', 'ОТВ', 'СР', 'ТЕСТ']

const GradeBook = () => {
    const [grades, setGrades] = React.useState([])
    const [classes, setClasses] = React.useState([])
    const [subjects, setSubjects] = React.useState([])
    const [selectedClass, setSelectedClass] = React.useState('')
    const [selectedQuarter, setSelectedQuarter] = React.useState('')
    const [gradeTypeFilter, setGradeTypeFilter] = React.useState('')
    const [selectedStudent, setSelectedStudent] = React.useState(null)
    const [userRole, setUserRole] = React.useState(null)
    const [studentsData, setStudentsData] = React.useState([])
    const [teachersData, setTeachersData] = React.useState([])
    const [scheduleData, setScheduleData] = React.useState([])
    const [teacherProfile, setTeacherProfile] = React.useState(null)
    const [gradeMessage, setGradeMessage] = React.useState('')
    const [editingGradeId, setEditingGradeId] = React.useState(null)
    const [editGradeForm, setEditGradeForm] = React.useState({ grade_value: 5, work_type: 'ДЗ', quarter: 1, date: '' })
    const [gradeForm, setGradeForm] = React.useState({
        student_id: '',
        subject_id: '',
        teacher_id: '',
        grade_value: 5,
        work_type: 'ДЗ',
        grade_type: 'current',
        quarter: 1,
        date: new Date().toISOString().split('T')[0]
    })
    const [loading, setLoading] = React.useState(true)

    const handleDeleteGrade = async (gradeId) => {
        setGradeMessage('')
        try {
            const res = await fetch(`/api/grades/${gradeId}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (res.ok) {
                setGradeMessage('Оценка удалена')
                const updated = await fetch('/api/grades', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
                setGrades(updated)
            } else {
                const errorData = await res.json().catch(() => ({}))
                setGradeMessage(errorData.detail || 'Ошибка при удалении оценки')
            }
        } catch (err) {
            setGradeMessage('Ошибка соединения')
        }
    }

    React.useEffect(() => {
        fetch('/api/auth/me', { credentials: 'include' })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(auth => {
                setUserRole(auth.role)
                const tasks = [
                    fetch('/api/grades', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
                    fetch('/api/classes', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
                    fetch('/api/subjects', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
                ]
                if (auth.role === 'admin') {
                    tasks.push(fetch('/api/students', { credentials: 'include' }).then(r => r.ok ? r.json() : []))
                    tasks.push(fetch('/api/teachers', { credentials: 'include' }).then(r => r.ok ? r.json() : []))
                    tasks.push(fetch('/api/schedule', { credentials: 'include' }).then(r => r.ok ? r.json() : []))
                } else if (auth.role === 'teacher') {
                    tasks.push(fetch('/api/students/my', { credentials: 'include' }).then(r => r.ok ? r.json() : []))
                    tasks.push(fetch('/api/teachers/me', { credentials: 'include' }).then(r => r.ok ? r.json() : null))
                }
                return Promise.all(tasks).then(results => ({ auth, results }))
            })
            .then(({ auth, results }) => {
                const [g, c, s, students = [], teachersOrProfile = [], scheduleRows = []] = results
                setGrades(g)
                setClasses(c)
                setSubjects(s)
                setStudentsData(students)
                if (auth.role === 'admin') {
                    setTeachersData(teachersOrProfile)
                    setScheduleData(scheduleRows)
                    setGradeForm(prev => ({
                        ...prev,
                        student_id: students[0]?.id || '',
                        subject_id: s[0]?.id || '',
                        teacher_id: teachersOrProfile[0]?.id || '',
                        grade_type: 'quarter',
                        work_type: 'ЧЕТВ'
                    }))
                } else if (auth.role === 'teacher') {
                    setTeacherProfile(teachersOrProfile)
                    setGradeForm(prev => ({
                        ...prev,
                        student_id: students[0]?.id || '',
                        subject_id: teachersOrProfile?.subject_id || s[0]?.id || '',
                        teacher_id: teachersOrProfile?.id || '',
                        grade_type: 'current',
                        work_type: 'ДЗ'
                    }))
                } else {
                    setGradeForm(prev => ({
                        ...prev,
                        subject_id: s[0]?.id || ''
                    }))
                }
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const selectedStudentRecord = React.useMemo(
        () => studentsData.find(s => String(s.id) === String(gradeForm.student_id)),
        [studentsData, gradeForm.student_id]
    )

    const availableTeachers = React.useMemo(() => {
        if (userRole !== 'admin') return teachersData
        if (!selectedStudentRecord?.class_id) {
            return teachersData.filter(t => !gradeForm.subject_id || String(t.subject_id) === String(gradeForm.subject_id))
        }
        const filteredSchedule = scheduleData.filter(row =>
            row.class_id === selectedStudentRecord.class_id &&
            (!gradeForm.subject_id || String(row.subject_id) === String(gradeForm.subject_id))
        )
        const teacherIds = [...new Set(filteredSchedule.map(x => x.teacher_id))]
        const bySchedule = teachersData.filter(t => teacherIds.includes(t.id))
        if (bySchedule.length > 0) return bySchedule
        return teachersData.filter(t => !gradeForm.subject_id || String(t.subject_id) === String(gradeForm.subject_id))
    }, [userRole, teachersData, scheduleData, selectedStudentRecord, gradeForm.subject_id])

    React.useEffect(() => {
        if (userRole !== 'admin') return
        if (!availableTeachers.length) return
        const hasCurrent = availableTeachers.some(t => String(t.id) === String(gradeForm.teacher_id))
        if (!hasCurrent) {
            setGradeForm(prev => ({ ...prev, teacher_id: availableTeachers[0].id }))
        }
    }, [userRole, availableTeachers, gradeForm.teacher_id])

    const handleAddGrade = async (e) => {
        if (e && e.preventDefault) e.preventDefault()
        setGradeMessage('')
        if (!gradeForm.student_id || !gradeForm.subject_id || !gradeForm.teacher_id) {
            setGradeMessage('Выберите ученика, предмет и учителя')
            return
        }
        try {
            const res = await fetch('/api/grades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    student_id: Number(gradeForm.student_id),
                    subject_id: Number(gradeForm.subject_id),
                    teacher_id: Number(gradeForm.teacher_id),
                    grade_type: userRole === 'admin' ? 'quarter' : 'current',
                    grade_value: Number(gradeForm.grade_value),
                    work_type: userRole === 'admin'
                        ? 'ЧЕТВ'
                        : gradeForm.work_type,
                    quarter: Number(gradeForm.quarter),
                    date: gradeForm.date
                })
            })
            if (res.ok) {
                setGradeMessage('Оценка добавлена')
                const updated = await fetch('/api/grades', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
                setGrades(updated)
            } else {
                const errorData = await res.json().catch(() => ({}))
                setGradeMessage(errorData.detail || 'Ошибка при добавлении оценки')
            }
        } catch (err) {
            setGradeMessage('Ошибка соединения')
        }
    }

    const startEditGrade = (g) => {
        setEditingGradeId(g.id)
        setEditGradeForm({
            grade_value: g.grade_value,
            work_type: g.work_type || 'ДЗ',
            quarter: g.quarter,
            date: g.date
        })
        setGradeMessage('')
    }

    const saveEditedGrade = async () => {
    if (!editingGradeId) return
    setGradeMessage('')
    try {
        const payload = {}
        if (editGradeForm.grade_value !== undefined && editGradeForm.grade_value !== null) 
            payload.grade_value = Number(editGradeForm.grade_value)
        if (editGradeForm.quarter !== undefined && editGradeForm.quarter !== null) 
            payload.quarter = Number(editGradeForm.quarter)
        if (editGradeForm.date) 
            payload.date = editGradeForm.date
        if (userRole !== 'admin' && editGradeForm.work_type) 
            payload.work_type = editGradeForm.work_type

        const res = await fetch(`/api/grades/${editingGradeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        })
        if (!res.ok) {
            let errorText = await res.text()
            throw new Error(errorText || 'Ошибка при обновлении')
        }
        setEditingGradeId(null)
        setGradeMessage('Оценка обновлена')
        const updated = await fetch('/api/grades', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
        setGrades(updated)
    } catch (err) {
        console.error(err)
        setGradeMessage('Ошибка: ' + err.message)
    }
}

    if (loading) return React.createElement('div', { className: 'spinner' })

    const subjectMap = subjects.reduce((a, s) => { a[s.id] = s.name; return a }, {})
    const workTypeOptions = TEACHER_WORK_TYPES

    let filtered = grades
    if (selectedClass) filtered = filtered.filter(g => g.class_id === Number(selectedClass))
    if (selectedQuarter) filtered = filtered.filter(g => g.quarter === Number(selectedQuarter))
    if (gradeTypeFilter) filtered = filtered.filter(g => g.grade_type === gradeTypeFilter)

    // группировка по ученикам
    const studentMap = {}
    filtered.forEach(g => {
        const k = g.student_id
        if (!studentMap[k]) studentMap[k] = { id: k, name: g.student_name || `#${k}`, class_id: g.class_id, grades: [] }
        studentMap[k].grades.push(g)
    })

    const studentsList = Object.values(studentMap).map(s => {
        const currentVals = s.grades.filter(g => g.grade_type === 'current').map(g => g.grade_value)
        const quarterVals = s.grades.filter(g => g.grade_type === 'quarter').map(g => g.grade_value)
        const baseVals = currentVals.length > 0 ? currentVals : quarterVals
        const avg = baseVals.length > 0 ? (baseVals.reduce((a,b) => a+b, 0) / baseVals.length).toFixed(2) : '—'
        return { ...s, avg, count: s.grades.length }
    })

    // детальные оценки выбранного ученика
    const studentGrades = selectedStudent
        ? filtered.filter(g => g.student_id === selectedStudent.id).sort((a,b) => new Date(b.date) - new Date(a.date))
        : []

    return React.createElement('div', null,
        React.createElement('div', { className: 'page-header', style: { marginBottom: '24px' } },
            React.createElement('div', null,
                React.createElement('h1', { className: 'page-title' }, 'Журнал оценок'),
                React.createElement('p', { className: 'page-subtitle' }, `${filtered.length} оценок`)
            )
        ),

        (userRole === 'admin' || userRole === 'teacher') && React.createElement('div', { className: 'glass-card', style: { marginBottom: '20px', padding: '22px', display: 'grid', gap: '14px' } },
            React.createElement('h3', { className: 'panel-title' },
                userRole === 'admin'
                    ? 'Выставить четвертную оценку'
                    : 'Добавить оценку'
            ),
            gradeMessage && React.createElement('div', { style: { color: gradeMessage.includes('Ошибка') ? '#D32F2F' : '#2E7D32', fontWeight: 600 } }, gradeMessage),
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' } },
                React.createElement('select', {
                    className: 'input',
                    value: gradeForm.student_id,
                    onChange: e => setGradeForm({ ...gradeForm, student_id: e.target.value })
                },
                    React.createElement('option', { value: '' }, 'Выберите ученика'),
                    studentsData.map(s => React.createElement('option', { key: s.id, value: s.id }, `${s.user?.full_name || 'Ученик'} (${s.class_name || s.class_id || 'класс'})`))
                ),
                userRole === 'admin' ? React.createElement(React.Fragment, null,
                    React.createElement('select', {
                        className: 'input',
                        value: gradeForm.subject_id,
                        onChange: e => {
                            const subjectId = e.target.value
                            const nextTeacher = availableTeachers.find(t => String(t.subject_id) === subjectId) || teachersData.find(t => String(t.subject_id) === subjectId)
                            setGradeForm({ ...gradeForm, subject_id: subjectId, teacher_id: nextTeacher?.id || '' })
                        }
                    },
                        React.createElement('option', { value: '' }, 'Выберите предмет'),
                        subjects.map(s => React.createElement('option', { key: s.id, value: s.id }, s.name))
                    ),
                    React.createElement('select', {
                        className: 'input',
                        value: gradeForm.teacher_id,
                        onChange: e => setGradeForm({ ...gradeForm, teacher_id: e.target.value })
                    },
                        React.createElement('option', { value: '' }, 'Выберите учителя'),
                        availableTeachers
                            .map(t => React.createElement('option', { key: t.id, value: t.id }, `${t.user?.full_name || 'Учитель'} (${t.subject_name || t.subject_id})`))
                    )
                ) : React.createElement('div', { style: { display: 'grid', gap: '8px' } },
                    React.createElement('div', { style: { fontSize: '14px', color: 'var(--text-secondary)' } }, `Предмет: ${teacherProfile?.subject_name || 'не определён'}`),
                    React.createElement('div', { style: { fontSize: '14px', color: 'var(--text-secondary)' } }, `Учитель: ${teacherProfile?.user?.full_name || 'вы'}`)
                ),
                React.createElement('input', {
                    className: 'input',
                    type: 'number',
                    min: 2,
                    max: 5,
                    value: gradeForm.grade_value,
                    onChange: e => setGradeForm({ ...gradeForm, grade_value: Number(e.target.value) })
                }),
                userRole === 'admin' ?
                    React.createElement('div', { className: 'input', style: { display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '14px' } }, 'Вид работы: ЧЕТВ')
                    :
                    React.createElement('select', {
                        className: 'input',
                        value: gradeForm.work_type,
                        onChange: e => setGradeForm({ ...gradeForm, work_type: e.target.value })
                    },
                        workTypeOptions.map(wt => React.createElement('option', { key: wt, value: wt }, wt))
                    ),
                React.createElement('select', {
                    className: 'input',
                    value: gradeForm.quarter,
                    onChange: e => setGradeForm({ ...gradeForm, quarter: Number(e.target.value) })
                },
                    [1, 2, 3, 4].map(q => React.createElement('option', { key: q, value: q }, `${q} четверть`))
                ),
                React.createElement('input', {
                    className: 'input',
                    type: 'date',
                    value: gradeForm.date,
                    onChange: e => setGradeForm({ ...gradeForm, date: e.target.value })
                })
            ),
            React.createElement('button', { className: 'btn', onClick: handleAddGrade }, 'Добавить')
        ),

        // фильтры
        React.createElement('div', { className: 'glass-card', style: { marginBottom: '20px', padding: '16px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' } },
            React.createElement('select', { className: 'input', value: gradeTypeFilter, onChange: e => { setGradeTypeFilter(e.target.value); setSelectedStudent(null) }, style: { width: '170px', marginBottom: 0 } },
                React.createElement('option', { value: '' }, 'Все типы'),
                React.createElement('option', { value: 'current' }, 'Текущие'),
                React.createElement('option', { value: 'quarter' }, 'Четвертные')
            ),
            React.createElement('select', { className: 'input', value: selectedClass, onChange: e => { setSelectedClass(e.target.value); setSelectedStudent(null) }, style: { width: '160px', marginBottom: 0 } },
                React.createElement('option', { value: '' }, 'Все классы'),
                classes.map(c => React.createElement('option', { key: c.id, value: c.id }, c.name))
            ),
            React.createElement('select', { className: 'input', value: selectedQuarter, onChange: e => { setSelectedQuarter(e.target.value); setSelectedStudent(null) }, style: { width: '160px', marginBottom: 0 } },
                React.createElement('option', { value: '' }, 'Все четверти'),
                [1,2,3,4].map(q => React.createElement('option', { key: q, value: q }, `${q} четверть`))
            )
        ),

        selectedStudent ?
            // детальный просмотр ученика
            React.createElement('div', null,
                React.createElement('div', { style: { marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' } },
                    React.createElement('button', { className: 'btn', onClick: () => setSelectedStudent(null), style: { background: 'var(--bg-sidebar)', color: 'var(--text-primary)' } }, '← Назад'),
                    React.createElement('h2', { style: { margin: 0, fontSize: '22px' } }, selectedStudent.name)
                ),
                React.createElement('div', { className: 'glass-card', style: { overflow: 'hidden', padding: 0 } },
                    React.createElement('table', null,
                        React.createElement('thead', null,
                            React.createElement('tr', { style: { background: 'var(--bg-main)' } },
                                React.createElement('th', { style: { padding: '12px 16px' } }, 'Дата'),
                                React.createElement('th', { style: { padding: '12px 16px' } }, 'Урок'),
                                React.createElement('th', { style: { padding: '12px 16px', textAlign: 'center' } }, 'Оценка'),
                                React.createElement('th', { style: { padding: '12px 16px', textAlign: 'center' } }, 'Четверть'),
                                React.createElement('th', { style: { padding: '12px 16px' } }, 'Учитель'),
                                React.createElement('th', { style: { padding: '12px 16px', textAlign: 'center' } }, 'Действие')
                            )
                        ),
                        React.createElement('tbody', null,
                            studentGrades.map((g, i) => React.createElement('tr', { key: i },
                                React.createElement('td', { style: { padding: '10px 16px' } }, g.date),
                                React.createElement('td', { style: { padding: '10px 16px' } },
                                    React.createElement('div', { style: { fontWeight: 500 } }, subjectMap[g.subject_id] || g.subject_id),
                                    React.createElement('div', { style: { color: 'var(--text-secondary)', fontSize: '12px' } }, g.work_type)
                                ),
                                React.createElement('td', { style: { padding: '10px 16px', textAlign: 'center' } },
                                    editingGradeId === g.id
                                        ? React.createElement('input', {
                                            className: 'input',
                                            type: 'number',
                                            min: 2,
                                            max: 5,
                                            value: editGradeForm.grade_value,
                                            onChange: e => setEditGradeForm({ ...editGradeForm, grade_value: Number(e.target.value) }),
                                            style: { width: '70px', margin: '0 auto' }
                                        })
                                        : React.createElement('span', { className: `grade-badge grade-${g.grade_value}` }, g.grade_value)
                                ),
                                React.createElement('td', { style: { padding: '10px 16px', textAlign: 'center' } },
                                    editingGradeId === g.id
                                        ? React.createElement('select', {
                                            className: 'input',
                                            value: editGradeForm.quarter,
                                            onChange: e => setEditGradeForm({ ...editGradeForm, quarter: Number(e.target.value) }),
                                            style: { width: '110px', margin: '0 auto' }
                                        }, [1, 2, 3, 4].map(q => React.createElement('option', { key: q, value: q }, `${q} четв.`)))
                                        : g.quarter
                                ),
                                React.createElement('td', { style: { padding: '10px 16px', color: 'var(--text-secondary)' } }, g.teacher_name || '—'),
                                React.createElement('td', { style: { padding: '10px 16px', textAlign: 'center' } },
                                    (userRole === 'admin' || (userRole === 'teacher' && g.grade_type !== 'quarter')) &&
                                    React.createElement('div', { style: { display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' } },
                                        editingGradeId === g.id && userRole !== 'admin' && React.createElement('select', {
                                            className: 'input',
                                            value: editGradeForm.work_type,
                                            onChange: e => setEditGradeForm({ ...editGradeForm, work_type: e.target.value }),
                                            style: { width: '92px', marginBottom: 0 }
                                        }, TEACHER_WORK_TYPES.map(wt => React.createElement('option', { key: wt, value: wt }, wt))),
                                        editingGradeId === g.id ? React.createElement(React.Fragment, null,
                                            React.createElement('input', {
                                                className: 'input',
                                                type: 'date',
                                                value: editGradeForm.date,
                                                onChange: e => setEditGradeForm({ ...editGradeForm, date: e.target.value }),
                                                style: { width: '145px', marginBottom: 0 }
                                            }),
                                            React.createElement('button', { className: 'btn btn--sm', onClick: saveEditedGrade }, 'Сохранить'),
                                            React.createElement('button', { className: 'btn btn--sm btn--ghost', onClick: () => setEditingGradeId(null) }, 'Отмена')
                                        ) : React.createElement(React.Fragment, null,
                                            React.createElement('button', {
                                                className: 'btn btn--sm btn--ghost',
                                                onClick: () => startEditGrade(g)
                                            }, 'Изменить'),
                                            React.createElement('button', {
                                                className: 'btn btn--sm',
                                                style: { fontSize: '14px' },
                                                onClick: () => handleDeleteGrade(g.id)
                                            }, 'Удалить')
                                        )
                                    )
                                )
                            ))
                        )
                    )
                )
            )
            :
            // список учеников
            React.createElement('div', { className: 'glass-card', style: { overflow: 'hidden', padding: 0 } },
                studentsList.length > 0 ?
                    React.createElement('table', null,
                        React.createElement('thead', null,
                            React.createElement('tr', { style: { background: 'var(--bg-main)' } },
                                React.createElement('th', { style: { padding: '14px 20px' } }, 'Ученик'),
                                React.createElement('th', { style: { padding: '14px 20px', textAlign: 'center' } }, 'Оценок'),
                                React.createElement('th', { style: { padding: '14px 20px', textAlign: 'center' } }, 'Средний балл')
                            )
                        ),
                        React.createElement('tbody', null,
                            studentsList.map(s => React.createElement('tr', {
                                key: s.id,
                                onClick: () => setSelectedStudent(s),
                                style: { cursor: 'pointer', transition: 'background 0.15s' },
                                onMouseEnter: (e) => e.currentTarget.style.background = 'var(--hover-bg)',
                                onMouseLeave: (e) => e.currentTarget.style.background = 'none'
                            },
                                React.createElement('td', { style: { padding: '14px 20px', fontWeight: 500 } }, s.name),
                                React.createElement('td', { style: { padding: '14px 20px', textAlign: 'center', color: 'var(--text-secondary)' } }, s.count),
                                React.createElement('td', { style: { padding: '14px 20px', textAlign: 'center', fontWeight: 600 } },
                                    React.createElement('span', {
                                        style: {
                                            padding: '4px 12px', borderRadius: '12px', fontSize: '13px',
                                            background: Number(s.avg) >= 4.5 ? '#E8F5E9' : Number(s.avg) >= 3.5 ? '#FFF8E1' : '#FFEBEE',
                                            color: Number(s.avg) >= 4.5 ? '#2E7D32' : Number(s.avg) >= 3.5 ? '#F57F17' : '#D32F2F'
                                        }
                                    }, s.avg)
                                )
                            ))
                        )
                    )
                    : React.createElement('div', { style: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' } }, 'Нет данных')
            )
    )
}