// компонент справочника классов
const ClassList = () => {
    const [classes, setClasses] = React.useState([])
    const [showForm, setShowForm] = React.useState(false)
    const [formData, setFormData] = React.useState({ name: '', year: 2024, max_students: 30, lessons_per_week: 30 })
    const [editingClass, setEditingClass] = React.useState(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState('')
    const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, id: null, name: '' })

    const emptyForm = { name: '', year: 2024, max_students: 30, lessons_per_week: 30 }
    const sanitizeNumericInput = (value) => String(value ?? '').replace(/[^\d]/g, '')
    const toPositiveInt = (value) => {
        const digits = sanitizeNumericInput(value)
        if (!digits) return null
        const parsed = parseInt(digits, 10)
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null
    }

    const parseClassName = (name = '') => {
        const normalized = String(name).trim().toUpperCase()
        const match = normalized.match(/^(\d+)\s*([A-ZА-ЯЁ]?)/)
        if (!match) return { grade: Number.MAX_SAFE_INTEGER, letter: normalized }
        return { grade: Number(match[1]), letter: match[2] || '' }
    }

    const sortedClasses = React.useMemo(() => {
        return [...classes].sort((a, b) => {
            const pa = parseClassName(a.name)
            const pb = parseClassName(b.name)
            if (pa.grade !== pb.grade) return pa.grade - pb.grade
            const letterCmp = pa.letter.localeCompare(pb.letter, 'ru', { sensitivity: 'base' })
            if (letterCmp !== 0) return letterCmp
            const nameCmp = String(a.name || '').localeCompare(String(b.name || ''), 'ru', { numeric: true, sensitivity: 'base' })
            if (nameCmp !== 0) return nameCmp
            return (a.id || 0) - (b.id || 0)
        })
    }, [classes])

    const loadClasses = () =>
        fetch('/api/classes', { credentials: 'include' })
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Не удалось загрузить')))
            .then(data => setClasses(data))

    React.useEffect(() => {
        loadClasses()
            .then(() => setLoading(false))
            .catch(err => { setError(err.message); setLoading(false) })
    }, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        setError('')
        if (!formData.name) { setError('Введите название класса'); return }
        const maxStudents = toPositiveInt(formData.max_students)
        const lessonsPerWeek = toPositiveInt(formData.lessons_per_week)
        if (!maxStudents || !lessonsPerWeek) { setError('Введите корректные значения (больше 0)'); return }
        try {
            const res = await fetch('/api/classes', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                credentials: 'include', body: JSON.stringify({
                    ...formData,
                    max_students: maxStudents,
                    lessons_per_week: lessonsPerWeek
                })
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                const detail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail || err)
                throw new Error(detail || 'Не удалось сохранить')
            }
            setShowForm(false)
            setFormData(emptyForm)
            await loadClasses()
        } catch (err) { setError(err.message) }
    }

    const handleUpdate = async (e) => {
        e.preventDefault()
        setError('')
        const maxStudents = toPositiveInt(editingClass.max_students)
        const lessonsPerWeek = toPositiveInt(editingClass.lessons_per_week)
        if (!maxStudents || !lessonsPerWeek) {
            setError('Введите корректные значения (больше 0)')
            return
        }
        try {
            const res = await fetch(`/api/classes/${editingClass.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: editingClass.name,
                    year: Number(editingClass.year),
                    max_students: maxStudents,
                    lessons_per_week: lessonsPerWeek
                })
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || 'Не удалось обновить')
            }
            setEditingClass(null)
            await loadClasses()
        } catch (err) { setError(err.message) }
    }

    const confirmDelete = async () => {
        try {
            const res = await fetch(`/api/classes/${confirmModal.id}`, { method: 'DELETE', credentials: 'include' })
            if (!res.ok) throw new Error('Не удалось удалить')
            setConfirmModal({ isOpen: false, id: null, name: '' })
            await loadClasses()
        } catch (err) { setError(err.message); setConfirmModal({ isOpen: false, id: null, name: '' }) }
    }

    const renderClassFields = (data, onChange, isEdit) =>
        React.createElement(React.Fragment, null,
            React.createElement('div', null,
                React.createElement('label', { className: 'form-label' }, 'Название'),
                React.createElement('input', { className: 'input', placeholder: '9А', value: data.name, onChange: (e) => onChange({ ...data, name: e.target.value }) })
            ),
            React.createElement('div', null,
                React.createElement('label', { className: 'form-label' }, 'Год обучения'),
                React.createElement('input', { className: 'input', type: 'number', value: data.year, onChange: (e) => onChange({ ...data, year: Number(e.target.value) }) })
            ),
            React.createElement('div', null,
                React.createElement('label', { className: 'form-label' }, 'Макс. учеников'),
                React.createElement('input', {
                    className: 'input',
                    type: 'text',
                    inputMode: 'numeric',
                    value: String(data.max_students ?? ''),
                    placeholder: '30',
                    onChange: (e) => onChange({ ...data, max_students: sanitizeNumericInput(e.target.value) })
                })
            ),
            React.createElement('div', null,
                React.createElement('label', { className: 'form-label' }, 'Уроков в неделю'),
                React.createElement('input', {
                    className: 'input',
                    type: 'text',
                    inputMode: 'numeric',
                    value: String(data.lessons_per_week ?? ''),
                    placeholder: '30',
                    onChange: (e) => onChange({ ...data, lessons_per_week: sanitizeNumericInput(e.target.value) })
                })
            ),
            React.createElement('div', { style: { gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px' } },
                React.createElement('button', {
                    className: 'btn', type: 'button',
                    onClick: () => isEdit ? setEditingClass(null) : setShowForm(false),
                    style: { background: 'var(--bg-sidebar)', color: 'var(--text-primary)' }
                }, 'Отмена'),
                React.createElement('button', { className: 'btn', type: 'submit' }, 'Сохранить')
            )
        )

    if (loading) return React.createElement('div', { className: 'spinner' })

    return React.createElement('div', null,
        React.createElement('div', { className: 'page-header' },
            React.createElement('div', null,
                React.createElement('h1', { className: 'page-title' }, 'Классы'),
                React.createElement('p', { className: 'page-subtitle' }, `${classes.length} ${classes.length === 1 ? 'класс' : classes.length < 5 ? 'класса' : 'классов'} · 2024/2025`)
            ),
            React.createElement('button', {
                className: 'btn btn--compact',
                onClick: () => { setShowForm(!showForm); setEditingClass(null); setError('') }
            }, showForm ? 'Отмена' : 'Добавить класс')
        ),

        error && React.createElement('div', { className: 'error-msg' }, error),

        showForm && React.createElement('div', { className: 'glass-card', style: { marginBottom: '24px' } },
            React.createElement('h3', { className: 'panel-title' }, 'Новый класс'),
            React.createElement('form', { onSubmit: handleAdd, style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' } },
                renderClassFields(formData, setFormData, false)
            )
        ),

        editingClass && React.createElement('div', { className: 'glass-card', style: { marginBottom: '24px' } },
            React.createElement('h3', { className: 'panel-title' }, `Редактировать: ${editingClass.name}`),
            React.createElement('form', { onSubmit: handleUpdate, style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' } },
                renderClassFields(editingClass, setEditingClass, true)
            )
        ),

        React.createElement('div', { className: 'class-grid' },
            sortedClasses.map(c =>
                React.createElement('article', { key: c.id, className: 'class-card' },
                    React.createElement('div', { className: 'class-card__head' },
                        React.createElement('div', null,
                            React.createElement('h2', { className: 'class-card__title' }, c.name),
                            React.createElement('span', { className: 'class-card__year' }, `${c.year} год обучения`)
                        ),
                        React.createElement('div', { className: 'class-card__actions' },
                            React.createElement('button', {
                                type: 'button',
                                className: 'class-card__icon-btn',
                                onClick: () => { setEditingClass({ ...c }); setShowForm(false) },
                                title: 'Редактировать'
                            }, 'Изменить'),
                            React.createElement('button', {
                                type: 'button',
                                className: 'class-card__icon-btn class-card__icon-btn--danger',
                                onClick: () => setConfirmModal({ isOpen: true, id: c.id, name: c.name }),
                                title: 'Удалить'
                            }, 'Удалить')
                        )
                    ),
                    React.createElement('div', { className: 'class-card__stats' },
                        React.createElement('div', { className: 'class-card__stat' },
                            React.createElement('span', { className: 'class-card__stat-value' }, c.max_students ?? 30),
                            React.createElement('span', { className: 'class-card__stat-label' }, 'Макс. учеников')
                        ),
                        React.createElement('div', { className: 'class-card__stat' },
                            React.createElement('span', { className: 'class-card__stat-value' }, c.lessons_per_week ?? 30),
                            React.createElement('span', { className: 'class-card__stat-label' }, 'Уроков в неделю')
                        )
                    )
                )
            )
        ),

        confirmModal.isOpen && React.createElement('div', {
            style: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
            onClick: () => setConfirmModal({ isOpen: false, id: null, name: '' })
        },
            React.createElement('div', { className: 'glass-card', style: { width: '400px', padding: '32px', textAlign: 'center' }, onClick: (e) => e.stopPropagation() },
                React.createElement('h3', { style: { marginBottom: '12px', color: 'var(--text-primary)' } }, 'Удалить класс'),
                React.createElement('p', { style: { color: 'var(--text-secondary)', marginBottom: '24px' } }, `Вы уверены, что хотите удалить класс "${confirmModal.name}"? Все ученики будут откреплены.`),
                React.createElement('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center' } },
                    React.createElement('button', { className: 'btn', style: { background: 'var(--bg-sidebar)', color: 'var(--text-primary)' }, onClick: () => setConfirmModal({ isOpen: false, id: null, name: '' }) }, 'Отмена'),
                    React.createElement('button', { className: 'btn', style: { background: '#D32F2F' }, onClick: confirmDelete }, 'Удалить')
                )
            )
        )
    )
}

