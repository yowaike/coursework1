// кабинет учителя: свои ученики и быстрая оценка
const TeacherCabinet = () => {
    const [students, setStudents] = React.useState([])
    const [gradeData, setGradeData] = React.useState({ student_id: 1, grade_value: 5, work_type: 'ДЗ', quarter: 1 })

    React.useEffect(() => {
        fetch('/api/students').then(r => r.json()).then(data => setStudents(data))
    }, [])

    const handleAddGrade = async (e) => {
        e.preventDefault()
        await fetch('/api/grades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...gradeData,
                subject_id: 1,
                teacher_id: 1,
                grade_type: 'current',
                date: new Date().toISOString().split('T')[0]
            })
        })
        alert('Оценка выставлена!')
    }

    return React.createElement('div', { style: { color: 'white' } },
        React.createElement('h2', null, 'Кабинет учителя'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' } },
            React.createElement('div', { className: 'glass-card' },
                React.createElement('h3', { style: { color: 'white', marginTop: 0 } }, 'Мои ученики'),
                React.createElement('ul', { style: { listStyle: 'none', padding: 0 } },
                    students.map(s => React.createElement('li', { key: s.id, style: { padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' } },
                        s.user ? s.user.full_name : 'Ученик'
                    ))
                )
            ),
            React.createElement('div', { className: 'glass-card' },
                React.createElement('h3', { style: { color: 'white', marginTop: 0 } }, 'Выставить оценку'),
                React.createElement('form', { onSubmit: handleAddGrade },
                    React.createElement('select', { className: 'input', value: gradeData.student_id, onChange: e => setGradeData({...gradeData, student_id: Number(e.target.value)}) },
                        students.map(s => React.createElement('option', { key: s.id, value: s.id, style: { color: 'black' } }, s.user ? s.user.full_name : s.id))
                    ),
                    React.createElement('input', { className: 'input', type: 'number', min: 2, max: 5, placeholder: 'Оценка (2-5)', value: gradeData.grade_value, onChange: e => setGradeData({...gradeData, grade_value: Number(e.target.value)}) }),
                    React.createElement('input', { className: 'input', placeholder: 'Вид работы', value: gradeData.work_type, onChange: e => setGradeData({...gradeData, work_type: e.target.value}) }),
                    React.createElement('button', { className: 'btn', type: 'submit' }, 'Выставить')
                )
            )
        )
    )
}