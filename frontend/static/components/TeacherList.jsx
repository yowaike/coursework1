const TeacherList = () => {
    const [teachers, setTeachers] = React.useState([])
    const [subjects, setSubjects] = React.useState([])
    const [showForm, setShowForm] = React.useState(false)
    const [editingTeacher, setEditingTeacher] = React.useState(null)
    const [editFormData, setEditFormData] = React.useState({ full_name: '', email: '', subject_id: 1, room_number: '' })
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState('')
    const [formData, setFormData] = React.useState({ full_name: '', email: '', password: 'teacher123', subject_id: 1, room_number: '' })
    const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, id: null, name: '' })

    React.useEffect(() => {
        Promise.all([
            fetch('/api/teachers', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/subjects', { credentials: 'include' }).then(r => r.json())
        ]).then(([teachersData, subjectsData]) => {
            setTeachers(teachersData)
            setSubjects(subjectsData)
            if (subjectsData.length > 0) {
                setFormData(prev => ({ ...prev, subject_id: subjectsData[0].id }))
            }
            setLoading(false)
        }).catch(err => {
            setError(err.message)
            setLoading(false)
        })
    }, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        setError('')
        if (!formData.full_name || !formData.email) {
            setError('Обязательно заполните ФИО и Email')
            return
        }
        try {
            const res = await fetch('/api/teachers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.detail || 'Не удалось сохранить')
            }
            setShowForm(false)
            setFormData({ full_name: '', email: '', password: 'teacher123', subject_id: subjects[0]?.id || 1, room_number: '' })
            const updated = await fetch('/api/teachers', { credentials: 'include' }).then(r => r.json())
            setTeachers(updated)
        } catch (err) {
            setError(err.message)
        }
    }

    const openEditTeacher = (teacher) => {
        setEditingTeacher(teacher)
        setEditFormData({
            full_name: teacher.user?.full_name || '',
            email: teacher.user?.email || '',
            subject_id: teacher.subject_id || subjects[0]?.id || 1,
            room_number: teacher.room_number || ''
        })
        setError('')
    }

    const handleUpdateTeacher = async (e) => {
        e.preventDefault()
        if (!editingTeacher) return
        try {
            const res = await fetch(`/api/teachers/${editingTeacher.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editFormData)
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.detail || 'Не удалось обновить')
            }
            setEditingTeacher(null)
            const updated = await fetch('/api/teachers', { credentials: 'include' }).then(r => r.json())
            setTeachers(updated)
        } catch (err) {
            setError(err.message)
        }
    }

    const openConfirmModal = (id, name) => setConfirmModal({ isOpen: true, id, name })

    const confirmDelete = async () => {
        try {
            const res = await fetch(`/api/teachers/${confirmModal.id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (!res.ok) throw new Error('Не удалось удалить')
            setConfirmModal({ isOpen: false, id: null, name: '' })
            const updated = await fetch('/api/teachers', { credentials: 'include' }).then(r => r.json())
            setTeachers(updated)
        } catch (err) {
            setError(err.message)
            setConfirmModal({ isOpen: false, id: null, name: '' })
        }
    }

    if (loading) return React.createElement('div', { className: 'spinner' })

    return React.createElement('div', null,
        React.createElement('div', { className: 'page-header' },
            React.createElement('div', null,
                React.createElement('h1', { className: 'page-title' }, 'Учителя'),
                React.createElement('p', { className: 'page-subtitle' }, `${teachers.length} в штате`)
            ),
            React.createElement('button', {
                className: 'btn btn--compact',
                onClick: () => { setShowForm(!showForm); setError('') }
            }, showForm ? 'Отмена' : 'Добавить')
        ),

        error && React.createElement('div', { className: 'error-msg' }, error),

        showForm && React.createElement('div', { className: 'glass-card', style: { marginBottom: '20px' } },
            React.createElement('h3', { className: 'panel-title' }, 'Новый учитель'),
            React.createElement('form', {
                onSubmit: handleAdd,
                style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }
            },
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'ФИО'),
                    React.createElement('input', { className: 'input', placeholder: 'Иванова Анна Петровна', value: formData.full_name, onChange: (e) => setFormData({ ...formData, full_name: e.target.value }) })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'Email (логин)'),
                    React.createElement('input', { className: 'input', type: 'email', placeholder: 'teacher@school.ru', value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }) })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'Предмет'),
                    React.createElement('select', { className: 'input', value: formData.subject_id, onChange: (e) => setFormData({ ...formData, subject_id: Number(e.target.value) }) },
                        subjects.map(s => React.createElement('option', { key: s.id, value: s.id }, s.name))
                    )
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'Кабинет'),
                    React.createElement('input', { className: 'input', placeholder: '301', value: formData.room_number, onChange: (e) => setFormData({ ...formData, room_number: e.target.value }) })
                ),
                React.createElement('div', { style: { gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' } },
                    React.createElement('button', { className: 'btn', type: 'button', onClick: () => setShowForm(false), style: { background: 'var(--bg-sidebar)', color: 'var(--text-primary)' } }, 'Отмена'),
                    React.createElement('button', { className: 'btn', type: 'submit' }, 'Добавить')
                )
            )
        ),

        editingTeacher && React.createElement('div', { className: 'glass-card', style: { marginBottom: '20px' } },
            React.createElement('h3', { className: 'panel-title' }, 'Редактировать учителя'),
            React.createElement('form', {
                onSubmit: handleUpdateTeacher,
                style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }
            },
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'ФИО'),
                    React.createElement('input', { className: 'input', placeholder: 'Иванова Анна Петровна', value: editFormData.full_name, onChange: (e) => setEditFormData({ ...editFormData, full_name: e.target.value }) })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'Email (логин)'),
                    React.createElement('input', { className: 'input', type: 'email', placeholder: 'teacher@school.ru', value: editFormData.email, onChange: (e) => setEditFormData({ ...editFormData, email: e.target.value }) })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'Предмет'),
                    React.createElement('select', { className: 'input', value: editFormData.subject_id, onChange: (e) => setEditFormData({ ...editFormData, subject_id: Number(e.target.value) }) },
                        subjects.map(s => React.createElement('option', { key: s.id, value: s.id }, s.name))
                    )
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'form-label' }, 'Кабинет'),
                    React.createElement('input', { className: 'input', placeholder: '301', value: editFormData.room_number, onChange: (e) => setEditFormData({ ...editFormData, room_number: e.target.value }) })
                ),
                React.createElement('div', { style: { gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' } },
                    React.createElement('button', { className: 'btn', type: 'button', onClick: () => setEditingTeacher(null), style: { background: 'var(--bg-sidebar)', color: 'var(--text-primary)' } }, 'Отмена'),
                    React.createElement('button', { className: 'btn', type: 'submit' }, 'Обновить')
                )
            )
        ),

        React.createElement('div', { className: 'glass-card table-wrap' },
            React.createElement('table', { style: { marginBottom: 0 } },
                React.createElement('thead', null,
                    React.createElement('tr', { style: { background: 'var(--bg-main)' } },
                        React.createElement('th', { style: { padding: '16px 20px' } }, 'ФИО'),
                        React.createElement('th', { style: { padding: '16px 20px' } }, 'Предмет'),
                        React.createElement('th', { style: { padding: '16px 20px' } }, 'Кабинет'),
                        React.createElement('th', { style: { padding: '16px 20px', textAlign: 'right' } }, '')
                    )
                ),
                React.createElement('tbody', null,
                    teachers.length > 0 ? teachers.map(t =>
                        React.createElement('tr', { key: t.id },
                            React.createElement('td', { style: { padding: '14px 20px', fontWeight: 500 } }, t.user ? t.user.full_name : '—'),
                            React.createElement('td', { style: { padding: '14px 20px', color: 'var(--text-secondary)' } }, t.subject_name || `Предмет ${t.subject_id}`),
                            React.createElement('td', { style: { padding: '14px 20px', color: 'var(--text-secondary)' } }, t.room_number || '—'),
                            React.createElement('td', { style: { padding: '14px 20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' } },
                                React.createElement('button', { className: 'btn btn--sm btn--ghost', onClick: () => openEditTeacher(t), style: { marginRight: '6px' } }, 'Изменить'),
                                React.createElement('button', { className: 'btn btn--sm btn--danger', onClick: () => openConfirmModal(t.id, t.user ? t.user.full_name : t.id) }, 'Удалить')
                            )
                        )
                    ) : React.createElement('tr', null,
                        React.createElement('td', { colSpan: 4, style: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' } }, 'Учителя не найдены')
                    )
                )
            )
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
                React.createElement('h3', { style: { marginBottom: '12px', color: 'var(--text-primary)' } }, 'Подтверждение удаления'),
                React.createElement('p', { style: { color: 'var(--text-secondary)', marginBottom: '24px' } },
                    `Вы действительно хотите удалить учителя "${confirmModal.name}"?`
                ),
                React.createElement('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center' } },
                    React.createElement('button', {
                        className: 'btn',
                        style: { background: 'var(--bg-sidebar)', color: 'var(--text-primary)' },
                        onClick: () => setConfirmModal({ isOpen: false, id: null, name: '' })
                    }, 'Отмена'),
                    React.createElement('button', {
                        className: 'btn',
                        style: { background: '#D32F2F' },
                        onClick: confirmDelete
                    }, 'Удалить')
                )
            )
        )
    )
}