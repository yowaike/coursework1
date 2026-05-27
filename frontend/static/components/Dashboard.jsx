const Dashboard = () => {
    const [activeTab, setActiveTab] = React.useState('profile')
    const [userRole, setUserRole] = React.useState(null)
    const [userEmail, setUserEmail] = React.useState('')
    const [userName, setUserName] = React.useState('')
    const [loading, setLoading] = React.useState(true)
    const [editing, setEditing] = React.useState(false)
    const [editName, setEditName] = React.useState('')
    const [editMessage, setEditMessage] = React.useState('')
    const saveTimeouts = React.useRef({})
    const [editSchool, setEditSchool] = React.useState('')
    const [editCity, setEditCity] = React.useState('')
    const [editYear, setEditYear] = React.useState('')
    const [editPosition, setEditPosition] = React.useState('')
    const [editSubject, setEditSubject] = React.useState('')
    const [infoEditing, setInfoEditing] = React.useState(false)
    const infoBackup = React.useRef({})

    React.useEffect(() => {
        fetch('/api/auth/me', { credentials: 'include' })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => {
                setUserRole(data.role)
                setUserEmail(data.email)
                setUserName(data.full_name || 'Пользователь')
                setEditName(data.full_name || '')
                setEditSchool(data.school || '')
                setEditCity(data.city || '')
                setEditYear(data.academic_year || '')
                setEditPosition(data.position || '')
                setEditSubject(data.subject_name || '')
                setLoading(false)
            })
            .catch(() => { setLoading(false); window.location.href = '/' })
    }, [])

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        window.location.href = '/'
    }

    const handleSaveProfile = async (fields = {}, closeEditor = true) => {
        setEditMessage('')
        try {
            const res = await fetch('/api/auth/update-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(fields)
            })
            if (res.ok) {
                if (fields.full_name) setUserName(fields.full_name)
                if (closeEditor) setEditing(false)
                setEditMessage('Сохранено')
                setTimeout(() => setEditMessage(''), 2000)
            } else {
                setEditMessage('Ошибка')
            }
        } catch { setEditMessage('Ошибка') }
    }

    const debounceSave = (key, value, fieldObj) => {
        if (saveTimeouts.current[key]) clearTimeout(saveTimeouts.current[key])
        saveTimeouts.current[key] = setTimeout(() => handleSaveProfile(fieldObj, false), 1000)
    }

    const handleChangeName = (value) => { setEditName(value); debounceSave('name', value, { full_name: value }) }
    const handleChangeSchool = (value) => { setEditSchool(value); debounceSave('school', value, { school: value }) }
    const handleChangeCity = (value) => { setEditCity(value); debounceSave('city', value, { city: value }) }
    const handleChangeYear = (value) => { setEditYear(value); debounceSave('year', value, { academic_year: value }) }
    const handleChangePosition = (value) => { setEditPosition(value); debounceSave('position', value, { position: value }) }

    const allMenuItems = [
        { id: 'profile', label: 'Профиль', roles: ['admin', 'teacher', 'student'] },
        { id: 'classes', label: 'Классы', roles: ['admin'] },
        { id: 'subjects', label: 'Предметы', roles: ['admin'] },
        { id: 'students', label: 'Ученики', roles: ['admin'] },
        { id: 'teachers', label: 'Учителя', roles: ['admin'] },
        { id: 'schedule', label: 'Расписание', roles: ['admin', 'teacher'] },
        { id: 'grades', label: 'Оценки', roles: ['admin', 'teacher'] },
        { id: 'analytics', label: 'Аналитика', roles: ['admin'] },
        { id: 'notes', label: 'Заметки', roles: ['admin', 'teacher', 'student'] },
        { id: 'teacher_cab', label: 'Мой кабинет', roles: ['teacher'] },
        { id: 'student_cab', label: 'Мой дневник', roles: ['student'] }
    ]

    const menuItems = allMenuItems.filter(item => userRole && item.roles.includes(userRole))
    const roleLabels = { admin: 'Завуч', teacher: 'Учитель', student: 'Ученик' }

    // Профиль
    const renderProfile = () => {
        return React.createElement('div', null,
            React.createElement('h1', { style: { fontSize: '36px', marginBottom: '24px' } }, 'ПРОФИЛЬ'),
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' } },
                React.createElement('div', { className: 'glass-card', style: { textAlign: 'center', padding: '32px' } },
                    React.createElement('div', { style: { width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-color)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700, margin: '0 auto 16px' } }, userName.charAt(0)),
                    editing ?
                        React.createElement('div', null,
                            React.createElement('input', { className: 'input', value: editName, onChange: e => handleChangeName(e.target.value), style: { textAlign: 'center' } }),
                            React.createElement('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' } },
                                React.createElement('button', { className: 'btn', onClick: () => { handleSaveProfile({ full_name: editName }); setEditing(false) }, style: { fontSize: '12px', padding: '8px 16px' } }, 'Сохранить'),
                                React.createElement('button', { className: 'btn', onClick: () => setEditing(false), style: { background: 'var(--bg-sidebar)', color: 'var(--text-primary)', fontSize: '12px', padding: '8px 16px' } }, 'Отмена')
                            ),
                            editMessage && React.createElement('div', { style: { marginTop: '8px', fontSize: '12px', color: '#2E7D32' } }, editMessage)
                        )
                        :
                        React.createElement('div', null,
                            React.createElement('h2', { style: { fontSize: '22px', marginBottom: '8px' } }, userName),
                            React.createElement('div', { style: { display: 'inline-block', padding: '4px 16px', borderRadius: '20px', background: 'var(--accent-color)', color: '#FFF', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' } }, roleLabels[userRole] || userRole),
                            React.createElement('div', null,
                                React.createElement('button', { className: 'btn', onClick: () => { setEditName(userName); setEditing(true) }, style: { background: 'var(--bg-sidebar)', color: 'var(--text-primary)', fontSize: '12px', padding: '8px 16px' } }, 'Редактировать')
                            )
                        ),
                    React.createElement('p', { style: { color: 'var(--text-secondary)', fontSize: '14px', marginTop: '12px' } }, userEmail)
                ),
                React.createElement('div', { className: 'glass-card', style: { padding: '24px', position: 'relative' } },
                    React.createElement('h3', { style: { marginTop: 0, marginBottom: '16px', fontSize: '18px' } }, 'Информация'),
                    (userRole === 'admin' || userRole === 'teacher') && !infoEditing ?
                        React.createElement('button', { className: 'btn', onClick: () => { infoBackup.current = { editSchool, editCity, editYear, editPosition }; setInfoEditing(true) }, style: { position: 'absolute', right: '16px', top: '16px', fontSize: '12px', padding: '6px 10px' } }, 'Ред.')
                        : null,
                    (userRole === 'admin' || userRole === 'teacher') && infoEditing ?
                        React.createElement('div', { style: { position: 'absolute', right: '12px', top: '12px', display: 'flex', gap: '8px' } },
                            React.createElement('button', { className: 'btn', onClick: async () => { await handleSaveProfile({ school: editSchool, city: editCity, academic_year: editYear, position: editPosition }); setInfoEditing(false) }, style: { fontSize: '12px', padding: '6px 10px' } }, 'Сохр.'),
                            React.createElement('button', { className: 'btn', onClick: () => { setEditSchool(infoBackup.current.editSchool); setEditCity(infoBackup.current.editCity); setEditYear(infoBackup.current.editYear); setEditPosition(infoBackup.current.editPosition); setInfoEditing(false) }, style: { background: 'var(--bg-sidebar)', color: 'var(--text-primary)', fontSize: '12px', padding: '6px 10px' } }, 'Отм.')
                        ) : null,
                    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
                        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' } },
                            React.createElement('span', { style: { color: 'var(--text-secondary)', fontSize: '13px' } }, 'Школа'),
                            React.createElement('input', { className: 'input', value: editSchool, onChange: e => handleChangeSchool(e.target.value), style: { width: '60%', textAlign: 'right' }, disabled: !infoEditing })
                        ),
                        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' } },
                            React.createElement('span', { style: { color: 'var(--text-secondary)', fontSize: '13px' } }, 'Город'),
                            React.createElement('input', { className: 'input', value: editCity, onChange: e => handleChangeCity(e.target.value), style: { width: '60%', textAlign: 'right' }, disabled: !infoEditing })
                        ),
                        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' } },
                            React.createElement('span', { style: { color: 'var(--text-secondary)', fontSize: '13px' } }, 'Учебный год'),
                            React.createElement('input', { className: 'input', value: editYear, onChange: e => handleChangeYear(e.target.value), style: { width: '60%', textAlign: 'right' }, disabled: !infoEditing })
                        ),
                        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between' } },
                            React.createElement('span', { style: { color: 'var(--text-secondary)', fontSize: '13px' } }, 'Должность'),
                            React.createElement('input', { className: 'input', value: editPosition, onChange: e => handleChangePosition(e.target.value), style: { width: '60%', textAlign: 'right' }, disabled: !infoEditing })
                        ),
                        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between' } },
                            React.createElement('span', { style: { color: 'var(--text-secondary)', fontSize: '13px' } }, 'Предмет'),
                            React.createElement('span', { style: { fontWeight: 500, fontSize: '13px' } }, editSubject || '-'))
                    )
                )
            )
        )
    }

    // Список учеников
    const StudentsListView = () => {
        const [students, setStudents] = React.useState([])
        const [classes, setClasses] = React.useState([])
        const [loading, setLoading] = React.useState(true)
        const [showAdd, setShowAdd] = React.useState(false)
        const [editingStudent, setEditingStudent] = React.useState(null)
        const [formData, setFormData] = React.useState({ full_name: '', email: '', password: '', class_id: 1 })
        const [deleteConfirm, setDeleteConfirm] = React.useState(null)
        const [message, setMessage] = React.useState('')

        const loadStudents = () => {
            setLoading(true)
            Promise.all([
                fetch('/api/students', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
                fetch('/api/classes', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
            ]).then(([s, c]) => {
                setStudents(s)
                setClasses(c)
                if (c.length > 0) setFormData(prev => ({ ...prev, class_id: c[0].id }))
                setLoading(false)
            }).catch(() => setLoading(false))
        }

        React.useEffect(() => { loadStudents() }, [])

        const classMap = classes.reduce((acc, c) => { acc[c.id] = c.name; return acc }, {})

        const handleAdd = async (e) => {
            e.preventDefault()
            setMessage('')
            const res = await fetch('/api/students', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowAdd(false)
                setFormData({ full_name: '', email: '', password: '', class_id: classes[0]?.id || 1 })
                setMessage('Ученик добавлен')
                loadStudents()
            } else {
                const err = await res.json().catch(() => ({}))
                setMessage('Ошибка: ' + (err.detail || ''))
            }
        }

        const handleEdit = async (e) => {
            e.preventDefault()
            setMessage('')
            const res = await fetch(`/api/students/${editingStudent.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify(editingStudent)
            })
            if (res.ok) {
                setEditingStudent(null)
                setMessage('Ученик обновлён')
                loadStudents()
            } else {
                const err = await res.json().catch(() => ({}))
                setMessage('Ошибка: ' + (err.detail || ''))
            }
        }

        const handleDelete = async () => {
            await fetch(`/api/students/${deleteConfirm}`, { method: 'DELETE', credentials: 'include' })
            setDeleteConfirm(null)
            setMessage('Ученик удалён')
            loadStudents()
        }

        if (loading) return React.createElement('div', { className: 'spinner' })

        return React.createElement('div', null,
            React.createElement('div', { className: 'page-header' },
                React.createElement('div', null,
                    React.createElement('h1', { className: 'page-title' }, 'Ученики')
                ),
                React.createElement('button', { className: 'btn btn--compact', onClick: () => { setShowAdd(!showAdd); setEditingStudent(null) } },
                    showAdd ? 'Отмена' : 'Добавить')
            ),
            message && React.createElement('div', { className: 'msg-banner ' + (message.includes('Ошибка') ? 'msg-banner--err' : 'msg-banner--ok') }, message),
            showAdd && React.createElement('div', { className: 'glass-card', style: { marginBottom: '20px' } },
                React.createElement('h3', { className: 'panel-title' }, 'Новый ученик'),
                React.createElement('form', { onSubmit: handleAdd, style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } },
                    React.createElement('input', { className: 'input', placeholder: 'ФИО', value: formData.full_name, onChange: e => setFormData({ ...formData, full_name: e.target.value }), required: true }),
                    React.createElement('input', { className: 'input', type: 'email', placeholder: 'Email', value: formData.email, onChange: e => setFormData({ ...formData, email: e.target.value }), required: true }),
                    React.createElement('input', { className: 'input', type: 'password', placeholder: 'Пароль', value: formData.password, onChange: e => setFormData({ ...formData, password: e.target.value }), required: true }),
                    React.createElement('select', { className: 'input', value: formData.class_id, onChange: e => setFormData({ ...formData, class_id: Number(e.target.value) }) },
                        classes.map(c => React.createElement('option', { key: c.id, value: c.id }, c.name))
                    ),
                    React.createElement('div', { style: { gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end' } },
    React.createElement('button', { className: 'btn btn--ghost', type: 'button', onClick: () => setShowAdd(false) }, 'Отмена'),
    React.createElement('button', { className: 'btn btn--compact', type: 'submit' }, 'Добавить')
)
                )
            ),
            editingStudent && React.createElement('div', { className: 'glass-card', style: { marginBottom: '20px' } },
                React.createElement('h3', { className: 'panel-title' }, 'Редактировать'),
                React.createElement('form', { onSubmit: handleEdit, style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } },
                    React.createElement('input', { className: 'input', value: editingStudent.full_name, onChange: e => setEditingStudent({ ...editingStudent, full_name: e.target.value }) }),
                    React.createElement('input', { className: 'input', type: 'email', value: editingStudent.email, onChange: e => setEditingStudent({ ...editingStudent, email: e.target.value }) }),
                    React.createElement('input', { className: 'input', type: 'password', placeholder: 'Новый пароль', onChange: e => setEditingStudent({ ...editingStudent, password: e.target.value }) }),
                    React.createElement('select', { className: 'input', value: editingStudent.class_id, onChange: e => setEditingStudent({ ...editingStudent, class_id: Number(e.target.value) }) },
                        classes.map(c => React.createElement('option', { key: c.id, value: c.id }, c.name))
                    ),
                    React.createElement('div', { style: { gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end' } },
    React.createElement('button', { className: 'btn btn--ghost', type: 'button', onClick: () => setEditingStudent(null) }, 'Отмена'),
    React.createElement('button', { className: 'btn btn--compact', type: 'submit' }, 'Сохранить')
)
                )
            ),
            React.createElement('div', { className: 'glass-card table-wrap' },
                students.length > 0 ?
                    React.createElement('table', null,
                        React.createElement('thead', null,
                            React.createElement('tr', null,
                                React.createElement('th', null, 'ФИО'),
                                React.createElement('th', null, 'Email'),
                                React.createElement('th', null, 'Класс'),
                                React.createElement('th', { style: { textAlign: 'center' } }, 'Действия')
                            )
                        ),
                        React.createElement('tbody', null,
                            students.map(s => React.createElement('tr', { key: s.id },
                                React.createElement('td', { style: { fontWeight: 500 } }, s.user?.full_name || '—'),
                                React.createElement('td', { style: { color: 'var(--text-secondary)' } }, s.user?.email || '—'),
                                React.createElement('td', null, s.class_name || classMap[s.class_id] || '—'),
                                React.createElement('td', { style: { textAlign: 'center' } },
                                    React.createElement('button', { className: 'btn btn--sm btn--ghost', onClick: () => setEditingStudent({ id: s.id, full_name: s.user?.full_name || '', email: s.user?.email || '', password: '', class_id: s.class_id }), style: { marginRight: '6px' } }, 'Изменить'),
                                    React.createElement('button', { className: 'btn btn--sm btn--danger', onClick: () => setDeleteConfirm(s.id) }, 'Удалить')
                                )
                            ))
                        )
                    ) : React.createElement('p', { style: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' } }, 'Нет учеников')
            ),
            deleteConfirm && React.createElement('div', { style: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }, onClick: () => setDeleteConfirm(null) },
                React.createElement('div', { className: 'glass-card', style: { width: '400px', padding: '32px', textAlign: 'center' }, onClick: e => e.stopPropagation() },
                    React.createElement('h3', { style: { marginBottom: '12px' } }, 'Удалить ученика?'),
                    React.createElement('p', { style: { color: 'var(--text-secondary)', marginBottom: '24px' } }, 'Оценки и заметки будут удалены.'),
                    React.createElement('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center' } },
                        React.createElement('button', { className: 'btn', onClick: () => setDeleteConfirm(null), style: { background: 'var(--bg-sidebar)', color: 'var(--text-primary)' } }, 'Отмена'),
                        React.createElement('button', { className: 'btn', onClick: handleDelete, style: { background: '#D32F2F' } }, 'Удалить')
                    )
                )
            )
        )
    }

    // Заметки
    const NotesListView = () => {
        const [notes, setNotes] = React.useState([])
        const [loading, setLoading] = React.useState(true)
        const [noteText, setNoteText] = React.useState('')
        const [studentId, setStudentId] = React.useState('')
        const [students, setStudents] = React.useState([])
        const [message, setMessage] = React.useState('')
        const [editingNote, setEditingNote] = React.useState(null)

        const loadNotes = () => {
            setLoading(true)
            Promise.all([
                fetch('/api/notes', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
                fetch('/api/students/my', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
            ]).then(([n, s]) => {
                const list = Array.isArray(s) ? s : []
                setNotes(n)
                setStudents(list)
                if (userRole === 'student' && list.length > 0) {
                    setStudentId(String(list[0].id))
                }
                setLoading(false)
            }).catch(() => setLoading(false))
        }

        React.useEffect(() => { loadNotes() }, [])

        const canManageNote = (note) => note.can_edit || userRole === 'admin'

        const handleAdd = async (e) => {
            e.preventDefault()
            if (!noteText.trim() || !studentId) return
            setMessage('')
            const res = await fetch('/api/notes', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify({ student_id: Number(studentId), text: noteText.trim(), date: new Date().toISOString().split('T')[0] })
            })
            if (res.ok) {
                setNoteText('')
                setMessage('Заметка добавлена')
                setTimeout(() => setMessage(''), 2000)
                loadNotes()
            } else {
                const err = await res.json().catch(() => ({}))
                setMessage('Ошибка: ' + (err.detail || ''))
            }
        }

        const handleUpdate = async (e) => {
            e.preventDefault()
            if (!editingNote || !editingNote.text.trim()) return
            setMessage('')
            const res = await fetch(`/api/notes/${editingNote.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify({ text: editingNote.text.trim() })
            })
            if (res.ok) {
                setEditingNote(null)
                setMessage('Заметка обновлена')
                setTimeout(() => setMessage(''), 2000)
                loadNotes()
            } else {
                const err = await res.json().catch(() => ({}))
                setMessage('Ошибка: ' + (err.detail || ''))
            }
        }

        const handleDelete = async (noteId) => {
            setMessage('')
            const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE', credentials: 'include' })
            if (res.ok) {
                setMessage('Заметка удалена')
                setTimeout(() => setMessage(''), 2000)
                loadNotes()
            } else {
                const err = await res.json().catch(() => ({}))
                setMessage('Ошибка: ' + (err.detail || ''))
            }
        }

        if (loading) return React.createElement('div', { className: 'spinner' })

        return React.createElement('div', null,
            React.createElement('div', { className: 'page-header', style: { marginBottom: '20px' } },
                React.createElement('div', null,
                    React.createElement('h1', { className: 'page-title' }, 'Заметки'),
                    React.createElement('p', { className: 'page-subtitle' }, `${notes.length} ${notes.length === 1 ? 'запись' : notes.length < 5 ? 'записи' : 'записей'}`)
                )
            ),
            message && React.createElement('div', { className: 'msg-banner ' + (message.includes('Ошибка') ? 'msg-banner--err' : 'msg-banner--ok') }, message),
            React.createElement('div', { className: 'glass-card', style: { marginBottom: '24px' } },
                React.createElement('form', { onSubmit: handleAdd, style: { display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'wrap' } },
                    userRole !== 'student' && React.createElement('select', {
                        className: 'input',
                        value: studentId,
                        onChange: e => setStudentId(e.target.value),
                        style: { flex: '2 1 200px', height: '44px' }
                    },
                        React.createElement('option', { value: '' }, 'Ученик'),
                        students.map(s => React.createElement('option', { key: s.id, value: s.id }, s.user?.full_name || s.id))
                    ),
                    React.createElement('input', {
                        className: 'input',
                        placeholder: userRole === 'student' ? 'Личное напоминание...' : 'Текст заметки',
                        value: noteText,
                        onChange: e => setNoteText(e.target.value),
                        style: { flex: '3 1 240px', height: '44px' }
                    }),
                    React.createElement('button', { className: 'btn btn--compact', type: 'submit', style: { height: '44px', padding: '0 20px' } }, 'Добавить')
                )
            ),
            editingNote && React.createElement('div', { className: 'glass-card', style: { marginBottom: '24px' } },
                React.createElement('h3', { className: 'panel-title' }, 'Редактировать заметку'),
                React.createElement('form', { onSubmit: handleUpdate, style: { display: 'flex', gap: '10px', alignItems: 'stretch' } },
                    React.createElement('input', {
                        className: 'input',
                        value: editingNote.text,
                        onChange: e => setEditingNote({ ...editingNote, text: e.target.value }),
                        style: { flex: 1, height: '44px' }
                    }),
                    React.createElement('button', { className: 'btn btn--compact', type: 'submit', style: { height: '44px' } }, 'Сохранить'),
                    React.createElement('button', {
                        className: 'btn btn--ghost', type: 'button',
                        onClick: () => setEditingNote(null),
                        style: { height: '44px' }
                    }, 'Отмена')
                )
            ),
            notes.length > 0 ?
                React.createElement('div', { className: 'note-list' },
                    notes.map(note => React.createElement('article', { key: note.id, className: 'note-card' },
                        React.createElement('div', { className: 'note-card__head' },
                            React.createElement('div', null,
                                React.createElement('div', { className: 'note-card__student' }, note.student_name || `Ученик #${note.student_id}`),
                                note.author_name && React.createElement('div', { className: 'note-card__author' }, note.author_name)
                            ),
                            React.createElement('span', { className: 'note-card__date' }, note.date)
                        ),
                        React.createElement('p', { className: 'note-card__text' }, note.text),
                        canManageNote(note) && React.createElement('div', { className: 'note-card__actions' },
                            React.createElement('button', {
                                className: 'btn btn--sm btn--ghost',
                                onClick: () => setEditingNote({ id: note.id, text: note.text })
                            }, 'Изменить'),
                            React.createElement('button', {
                                className: 'btn btn--sm btn--danger',
                                onClick: () => handleDelete(note.id)
                            }, 'Удалить')
                        )
                    ))
                ) : React.createElement('p', { style: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' } }, 'Нет заметок')
        )
    }

    const renderContent = () => {
        if (loading) return React.createElement('div', { className: 'spinner' })
        if (activeTab === 'profile') return renderProfile()
        if (activeTab === 'students') return React.createElement(StudentsListView)
        if (activeTab === 'teachers' && typeof TeacherList !== 'undefined') return React.createElement(TeacherList)
        if (activeTab === 'schedule' && typeof ScheduleList !== 'undefined') return React.createElement(ScheduleList)
        if (activeTab === 'grades' && typeof GradeBook !== 'undefined') return React.createElement(GradeBook)
        if (activeTab === 'analytics' && typeof Analytics !== 'undefined') return React.createElement(Analytics)
        if (activeTab === 'teacher_cab' && typeof TeacherCabinet !== 'undefined') return React.createElement(TeacherCabinet)
        if (activeTab === 'student_cab' && typeof StudentCabinet !== 'undefined') return React.createElement(StudentCabinet)
        if (activeTab === 'classes' && typeof ClassList !== 'undefined') return React.createElement(ClassList)
        if (activeTab === 'subjects' && typeof SubjectList !== 'undefined') return React.createElement(SubjectList)
        if (activeTab === 'notes') return React.createElement(NotesListView)
        return renderProfile()
    }

    // ====== ИТОГОВЫЙ РЕНДЕР ======
    return React.createElement('div', { style: { display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' } },
        // Боковая панель
        React.createElement('div', {
            style: { width: '260px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '24px 16px 80px 16px', position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 1000 }
        },
            // Аватарка и имя
            React.createElement('div', { style: { textAlign: 'center', marginBottom: '24px' } },
                React.createElement('div', { style: { width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-color)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, margin: '0 auto 8px' } }, userName.charAt(0)),
                React.createElement('div', { style: { fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' } }, userName),
                React.createElement('div', { style: { fontSize: '11px', color: 'var(--text-secondary)' } }, roleLabels[userRole] || userRole)
            ),
            // Пункты меню
            React.createElement('div', { style: { flex: 1, overflowY: 'auto' } },
                menuItems.map(item =>
                    React.createElement('div', {
                        key: item.id, onClick: () => setActiveTab(item.id),
                        style: { padding: '12px 16px', cursor: 'pointer', borderRadius: '8px', marginBottom: '2px', fontWeight: activeTab === item.id ? 500 : 400, color: activeTab === item.id ? '#FFFFFF' : 'var(--text-primary)', background: activeTab === item.id ? 'var(--accent-color)' : 'transparent', transition: 'all 0.2s', fontSize: '14px' }
                    }, item.label)
                )
            ),
            // Кнопка Выйти
            React.createElement('div', {
                onClick: handleLogout,
                style: {
                    padding: '14px 16px',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    borderTop: '1px solid var(--border-color)',
                    marginBottom: '20px',
                    transition: 'color 0.2s'
                },
                onMouseEnter: (e) => { e.currentTarget.style.color = '#D32F2F' },
                onMouseLeave: (e) => { e.currentTarget.style.color = 'var(--text-secondary)' }
            }, 'Выйти')
        ),
        // Основной контент
        React.createElement('div', { style: { flex: 1, padding: '40px', marginLeft: '260px', overflowY: 'auto', minHeight: '100vh' } }, renderContent())
    )
}

const root = ReactDOM.createRoot(document.getElementById('dashboard-root'))
root.render(React.createElement(Dashboard))