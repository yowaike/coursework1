// кабинет ученика: дневник и заметки
const StudentCabinet = () => {
    const [grades, setGrades] = React.useState([])
    const [notes, setNotes] = React.useState([])
    const [noteText, setNoteText] = React.useState('')

    React.useEffect(() => {
        Promise.all([
            fetch('/api/grades').then(r => r.json()),
            fetch('/api/notes').then(r => r.json())
        ]).then(([g, n]) => {
            setGrades(g)
            setNotes(n)
        })
    }, [])

    const handleAddNote = async (e) => {
        e.preventDefault()
        await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: 1, text: noteText, date: new Date().toISOString().split('T')[0] })
        })
        setNoteText('')
        window.location.reload()
    }

    return React.createElement('div', { style: { color: 'white' } },
        React.createElement('h2', null, 'Мой дневник'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' } },
            React.createElement('div', { className: 'glass-card' },
                React.createElement('h3', { style: { color: 'white', marginTop: 0 } }, 'Табель'),
                React.createElement('table', { style: { width: '100%', color: 'white', borderCollapse: 'collapse' } },
                    React.createElement('thead', null, React.createElement('tr', { style: { borderBottom: '1px solid rgba(255,255,255,0.3)' } },
                        React.createElement('th', { style: { padding: '8px', textAlign: 'left' } }, 'Предмет'),
                        React.createElement('th', { style: { padding: '8px', textAlign: 'left' } }, 'Оценка'),
                        React.createElement('th', { style: { padding: '8px', textAlign: 'left' } }, 'Четверть')
                    )),
                    React.createElement('tbody', null, grades.map(g =>
                        React.createElement('tr', { key: g.id, style: { borderBottom: '1px solid rgba(255,255,255,0.1)' } },
                            React.createElement('td', { style: { padding: '8px' } }, g.subject_id),
                            React.createElement('td', { style: { padding: '8px', fontWeight: 'bold' } }, g.grade_value),
                            React.createElement('td', { style: { padding: '8px' } }, g.quarter)
                        )
                    ))
                )
            ),
            React.createElement('div', { className: 'glass-card' },
                React.createElement('h3', { style: { color: 'white', marginTop: 0 } }, 'Заметки'),
                React.createElement('form', { onSubmit: handleAddNote, style: { marginBottom: '15px' } },
                    React.createElement('textarea', { className: 'input', rows: 3, placeholder: 'Добавить заметку...', value: noteText, onChange: e => setNoteText(e.target.value) }),
                    React.createElement('button', { className: 'btn', type: 'submit' }, 'Сохранить')
                ),
                React.createElement('div', { style: { maxHeight: '200px', overflowY: 'auto' } },
                    notes.map(n => React.createElement('div', { key: n.id, style: { background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '8px' } },
                        React.createElement('div', { style: { fontSize: '12px', opacity: 0.7 } }, n.date),
                        React.createElement('p', { style: { margin: '5px 0 0 0' } }, n.text)
                    ))
                )
            )
        )
    )
}