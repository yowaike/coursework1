const TEACHER_WORK_TYPES = ['ДЗ', 'КР', 'ОТВ', 'СР', 'ТЕСТ']
const ADMIN_WORK_TYPES = ['ЧЕТВ']

const GradeBook = () => {
    const [grades, setGrades] = React.useState([])
    const [classes, setClasses] = React.useState([])
    const [subjects, setSubjects] = React.useState([])
    const [selectedClass, setSelectedClass] = React.useState('')
    const [selectedQuarter, setSelectedQuarter] = React.useState('')
    const [selectedStudent, setSelectedStudent] = React.useState(null)
    const [userRole, setUserRole] = React.useState(null)
    const [studentsData, setStudentsData] = React.useState([])
    const [teachersData, setTeachersData] = React.useState([])
    const [teacherProfile, setTeacherProfile] = React.useState(null)
    const [gradeMessage, setGradeMessage] = React.useState('')
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
                } else if (auth.role === 'teacher') {
                    tasks.push(fetch('/api/students/my', { credentials: 'include' }).then(r => r.ok ? r.json() : []))
                    tasks.push(fetch('/api/teachers/me', { credentials: 'include' }).then(r => r.ok ? r.json() : null))
                }
                return Promise.all(tasks).then(results => ({ auth, results }))
            })
            .then(({ auth, results }) => {
                const [g, c, s, students = [], teachersOrProfile = []] = results
                setGrades(g)
                setClasses(c)
                setSubjects(s)
                setStudentsData(students)
                if (auth.role === 'admin') {
                    setTeachersData(teachersOrProfile)
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
                    work_type: userRole === 'admin' ? 'ЧЕТВ' : gradeForm.work_type,
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

    if (loading) return React.createElement('div', { className: 'spinner' })

    const subjectMap = subjects.reduce((a, s) => { a[s.id] = s.name; return a }, {})
    const workTypeOptions = userRole === 'admin' ? ADMIN_WORK_TYPES : TEACHER_WORK_TYPES

    let filtered = grades
    if (selectedClass) filtered = filtered.filter(g => g.class_id === Number(selectedClass))
    if (selectedQuarter) filtered = filtered.filter(g => g.quarter === Number(selectedQuarter))

    // группировка по ученикам
    const studentMap = {}
    filtered.forEach(g => {
        const k = g.student_id
        if (!studentMap[k]) studentMap[k] = { id: k, name: g.student_name || `#${k}`, class_id: g.class_id, grades: [] }
        studentMap[k].grades.push(g)
    })

    const studentsList = Object.values(studentMap).map(s => {
        const vals = s.grades.filter(g => g.grade_type !== 'quarter').map(g => g.grade_value)
        const avg = vals.length > 0 ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(2) : '—'
        return { ...s, avg, count: vals.length }
    })

    // детальные оценки выбранного ученика
    const studentGrades = selectedStudent ? grades.filter(g => g.student_id === selectedStudent.id).sort((a,b) => new Date(b.date) - new Date(a.date)) : []

    return React.createElement('div', null,
        React.createElement('div', { className: 'page-header', style: { marginBottom: '24px' } },
            React.createElement('div', null,
                React.createElement('h1', { className: 'page-title' }, 'Журнал оценок'),
                React.createElement('p', { className: 'page-subtitle' }, `${filtered.length} оценок`)
            )
        ),

        (userRole === 'admin' || userRole === 'teacher') && React.createElement('div', { className: 'glass-card', style: { marginBottom: '20px', padding: '22px', display: 'grid', gap: '14px' } },
            React.createElement('h3', { className: 'panel-title' },
                userRole === 'admin' ? 'Добавить четвертную оценку' : 'Добавить оценку'
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
                            const nextTeacher = teachersData.find(t => String(t.subject_id) === subjectId)
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
                        teachersData
                            .filter(t => !gradeForm.subject_id || String(t.subject_id) === String(gradeForm.subject_id))
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
                                React.createElement('th', { style: { padding: '12px 16px' } }, 'Предмет'),
                                React.createElement('th', { style: { padding: '12px 16px', textAlign: 'center' } }, 'Оценка'),
                                React.createElement('th', { style: { padding: '12px 16px' } }, 'Тип работы'),
                                React.createElement('th', { style: { padding: '12px 16px', textAlign: 'center' } }, 'Четверть'),
                        React.createElement('th', { style: { padding: '12px 16px', textAlign: 'center' } }, 'Действие')
                            )
                        ),
                        React.createElement('tbody', null,
                            studentGrades.map((g, i) => React.createElement('tr', { key: i },
                                React.createElement('td', { style: { padding: '10px 16px' } }, g.date),
                                React.createElement('td', { style: { padding: '10px 16px' } }, subjectMap[g.subject_id] || g.subject_id),
                                React.createElement('td', { style: { padding: '10px 16px', textAlign: 'center' } },
                                    React.createElement('span', { className: `grade-badge grade-${g.grade_value}` }, g.grade_value)
                                ),
                                React.createElement('td', { style: { padding: '10px 16px', color: 'var(--text-secondary)' } }, g.work_type),
                                React.createElement('td', { style: { padding: '10px 16px', textAlign: 'center' } }, g.quarter),
                                React.createElement('td', { style: { padding: '10px 16px', textAlign: 'center' } },
                                    (userRole === 'admin' || (userRole === 'teacher' && g.grade_type !== 'quarter')) &&
                                    React.createElement('button', {
                                        className: 'btn',
                                        style: { padding: '6px 12px', fontSize: '14px' },
                                        onClick: () => handleDeleteGrade(g.id)
                                    }, 'Удалить')
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