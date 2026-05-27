// кабинет учителя: свои классы и выставление оценок
const TeacherCabinet = () => {
    // функция для хранения профиля учителя
    const [teacher, setTeacher] = React.useState(null)
    // функция для хранения расписания
    const [schedule, setSchedule] = React.useState([])
    // функция для хранения учеников
    const [students, setStudents] = React.useState([])
    // функция для хранения классов
    const [classes, setClasses] = React.useState([])
    // функция для хранения предметов
    const [subjects, setSubjects] = React.useState([])
    // функция для управления загрузкой
    const [loading, setLoading] = React.useState(true)
    // функция для хранения ошибки
    const [error, setError] = React.useState('')
    // функция для хранения данных формы оценки
    const [gradeData, setGradeData] = React.useState({ 
        student_id: '', 
        grade_value: 5, 
        work_type: 'ДЗ', 
        quarter: 1 
    })
    // функция для хранения сообщения о результате
    const [message, setMessage] = React.useState('')

    // функция для загрузки данных при монтировании
    React.useEffect(() => {
        loadData()
    }, [])

    // функция для загрузки всех данных учителя
    const loadData = () => {
        setLoading(true)
        setError('')
        Promise.all([
            fetch('/api/teachers/me', { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject()),
            fetch('/api/schedule', { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject()),
            fetch('/api/students/my', { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject()),
            fetch('/api/classes', { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject()),
            fetch('/api/subjects', { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject())
        ]).then(([teacherData, scheduleData, studentsData, classesData, subjectsData]) => {
            setTeacher(teacherData)
            setClasses(classesData)
            setSubjects(subjectsData)
            // фильтруем расписание — только уроки этого учителя
            const mySchedule = scheduleData.filter(s => s.teacher_id === teacherData.id)
            setSchedule(mySchedule)
            // получаем уникальные ID классов учителя
            const myClassIds = [...new Set(mySchedule.map(s => s.class_id))]
            // фильтруем учеников по этим классам
            const myStudents = studentsData.filter(s => myClassIds.includes(s.class_id))
            setStudents(myStudents)
            if (myStudents.length > 0) {
                setGradeData(prev => ({ ...prev, student_id: myStudents[0].id }))
            }
            setLoading(false)
        }).catch(() => {
            setError('Не удалось загрузить данные.')
            setLoading(false)
        })
    }

    // функция для выставления оценки
    const handleAddGrade = async (e) => {
        e.preventDefault()
        if (!teacher || !gradeData.student_id) return
        setMessage('')
        try {
            const res = await fetch('/api/grades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    student_id: Number(gradeData.student_id),
                    subject_id: teacher.subject_id,
                    teacher_id: teacher.id,
                    grade_type: 'current',
                    grade_value: Number(gradeData.grade_value),
                    work_type: gradeData.work_type,
                    quarter: Number(gradeData.quarter),
                    date: new Date().toISOString().split('T')[0]
                })
            })
            if (res.ok) {
                setMessage('Оценка успешно выставлена!')
                setGradeData(prev => ({ ...prev, grade_value: 5, work_type: 'ДЗ' }))
                // убираем сообщение через 3 секунды
                setTimeout(() => setMessage(''), 3000)
            } else {
                const errData = await res.json().catch(() => ({}))
                setMessage(errData.detail || 'Ошибка при выставлении оценки')
            }
        } catch (err) {
            setMessage('Ошибка соединения')
        }
    }

    // функция для отображения загрузки
    if (loading) return React.createElement('div', { className: 'spinner' })

    // функция для отображения ошибки
    if (error) return React.createElement('div', { className: 'glass-card', style: { textAlign: 'center', padding: '40px' } },
        React.createElement('p', { style: { color: '#D32F2F', marginBottom: '20px' } }, error),
        React.createElement('button', { className: 'btn', onClick: loadData }, 'Повторить загрузку')
    )

    // маппинг ID классов и предметов в названия
    const classMap = classes.reduce((acc, cls) => {
        acc[cls.id] = cls.name
        return acc
    }, {})
    const subjectMap = subjects.reduce((acc, subject) => {
        acc[subject.id] = subject.name
        return acc
    }, {})

    return React.createElement('div', null,
        // заголовок с информацией об учителе
        React.createElement('div', { className: 'page-header' },
            React.createElement('div', null,
                React.createElement('h1', { className: 'page-title' }, 'Кабинет учителя'),
                teacher && React.createElement('p', { className: 'page-subtitle' },
                    `${teacher.user ? teacher.user.full_name : ''} · ${teacher.subject_name || subjectMap[teacher.subject_id] || 'предмет'} · каб. ${teacher.room_number || '—'}`
                )
            )
        ),

        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' } },
            // список учеников по классам
            React.createElement('div', { className: 'glass-card' },
                React.createElement('h3', { className: 'panel-title' }, 'Мои ученики'),
                students.length > 0 ?
                    React.createElement('div', null,
                        [...new Set(students.map(s => s.class_id))].sort().map(classId =>
                            React.createElement('div', { key: classId, style: { marginBottom: '24px' } },
                                React.createElement('h4', { className: 'schedule-day__title', style: { marginBottom: '12px' } }, `Класс ${classMap[classId] || classId}`),
                                students.filter(s => s.class_id === classId).map(s =>
                                    React.createElement('div', {
                                        key: s.id,
                                        style: {
                                            padding: '10px 12px',
                                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                                            fontSize: '14px',
                                            borderRadius: '6px',
                                            marginBottom: '2px'
                                        }
                                    }, s.user ? s.user.full_name : `Ученик #${s.id}`)
                                )
                            )
                        )
                    ) : React.createElement('p', { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' } }, 
                        'У вас пока нет учеников в расписании. Обратитесь к завучу для добавления уроков.'
                    )
            ),

            // форма выставления оценки
            React.createElement('div', { className: 'glass-card' },
                React.createElement('h3', { className: 'panel-title' }, 'Выставить оценку'),
                message && React.createElement('div', {
                    className: 'msg-banner ' + (message.includes('успешно') ? 'msg-banner--ok' : 'msg-banner--err')
                }, message),
                students.length > 0 ? React.createElement('form', { onSubmit: handleAddGrade },
                    React.createElement('label', { className: 'form-label' }, 'Ученик'),
                    React.createElement('select', {
                        className: 'input',
                        value: gradeData.student_id,
                        onChange: e => setGradeData({ ...gradeData, student_id: e.target.value })
                    },
                        students.map(s => React.createElement('option', { 
                            key: s.id, 
                            value: s.id 
                        }, `${s.user ? s.user.full_name : s.id} (${classMap[s.class_id] || s.class_id})`))
                    ),
                    React.createElement('label', { className: 'form-label' }, 'Оценка'),
                    React.createElement('input', {
                        className: 'input',
                        type: 'number',
                        min: 2,
                        max: 5,
                        value: gradeData.grade_value,
                        onChange: e => setGradeData({ ...gradeData, grade_value: Number(e.target.value) })
                    }),
                    React.createElement('label', { className: 'form-label' }, 'Вид работы'),
                    React.createElement('select', {
                        className: 'input',
                        value: gradeData.work_type,
                        onChange: e => setGradeData({ ...gradeData, work_type: e.target.value })
                    },
                        ['ДЗ', 'КР', 'ОТВ', 'СР', 'ТЕСТ'].map(wt => React.createElement('option', { key: wt, value: wt }, wt))
                    ),
                    React.createElement('label', { className: 'form-label' }, 'Четверть'),
                    React.createElement('select', {
                        className: 'input',
                        value: gradeData.quarter,
                        onChange: e => setGradeData({ ...gradeData, quarter: Number(e.target.value) })
                    },
                        React.createElement('option', { value: 1 }, '1 четверть'),
                        React.createElement('option', { value: 2 }, '2 четверть'),
                        React.createElement('option', { value: 3 }, '3 четверть'),
                        React.createElement('option', { value: 4 }, '4 четверть')
                    ),
                    React.createElement('button', { 
                        className: 'btn', 
                        type: 'submit', 
                        style: { width: '100%', marginTop: '16px' } 
                    }, 'ВЫСТАВИТЬ ОЦЕНКУ')
                ) : React.createElement('p', { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' } },
                    'Нет учеников для выставления оценок.'
                )
            )
        )
    )
}