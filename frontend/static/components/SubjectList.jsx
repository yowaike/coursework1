// компонент справочника предметов
const SubjectList = () => {
    const [subjects, setSubjects] = React.useState([])
    const [showForm, setShowForm] = React.useState(false)
    const [formData, setFormData] = React.useState({ name: '', description: '' })
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState('')
    const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, id: null, name: '' })

    React.useEffect(() => {
        fetch('/api/subjects', { credentials: 'include' })
            .then(res => res.json())
            .then(data => { setSubjects(data); setLoading(false) })
            .catch(err => { setError(err.message); setLoading(false) })
    }, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        setError('')
        if (!formData.name) { setError('Введите название предмета'); return }
        try {
            const res = await fetch('/api/subjects', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                credentials: 'include', body: JSON.stringify(formData)
            })
            if (!res.ok) throw new Error('Не удалось сохранить')
            setShowForm(false); setFormData({ name: '', description: '' })
            const updated = await fetch('/api/subjects', { credentials: 'include' }).then(r => r.json())
            setSubjects(updated)
        } catch (err) { setError(err.message) }
    }

    const confirmDelete = async () => {
        try {
            const res = await fetch(`/api/subjects/${confirmModal.id}`, { method: 'DELETE', credentials: 'include' })
            if (!res.ok) throw new Error('Не удалось удалить')
            setConfirmModal({ isOpen: false, id: null, name: '' })
            const updated = await fetch('/api/subjects', { credentials: 'include' }).then(r => r.json())
            setSubjects(updated)
        } catch (err) { setError(err.message); setConfirmModal({ isOpen: false, id: null, name: '' }) }
    }

    if (loading) return React.createElement('div', { className: 'spinner' })

    return React.createElement('div', null,
        React.createElement('div', { className: 'page-header' },
            React.createElement('div', null,
                React.createElement('h1', { className: 'page-title' }, 'Предметы'),
                React.createElement('p', { className: 'page-subtitle' }, `${subjects.length} в учебном плане`)
            ),
            React.createElement('button', {
                className: 'btn btn--compact',
                onClick: () => { setShowForm(!showForm); setError('') }
            }, showForm ? 'Отмена' : 'Добавить предмет')
        ),

        error && React.createElement('div', { className: 'error-msg' }, error),

        showForm && React.createElement('div', { className: 'glass-card', style: { marginBottom: '24px' } },
            React.createElement('h3', { className: 'panel-title' }, 'Новый предмет'),
            React.createElement('form', { onSubmit: handleAdd },
                React.createElement('label', { className: 'form-label' }, 'Название'),
                React.createElement('input', { className: 'input', placeholder: 'Математика', value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }) }),
                React.createElement('label', { className: 'form-label' }, 'Описание'),
                React.createElement('textarea', { className: 'input', placeholder: 'Краткое описание...', value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), rows: 2, style: { marginBottom: 0 } }),
                React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' } },
                    React.createElement('button', { className: 'btn btn--ghost', type: 'button', onClick: () => setShowForm(false) }, 'Отмена'),
                    React.createElement('button', { className: 'btn btn--compact', type: 'submit' }, 'Сохранить')
                )
            )
        ),

        React.createElement('div', { className: 'card-grid' },
            subjects.map(s =>
                React.createElement('article', { key: s.id, className: 'item-card' },
                    React.createElement('div', { className: 'item-card__head' },
                        React.createElement('div', null,
                            React.createElement('h2', { className: 'item-card__title' }, s.name),
                            React.createElement('p', { className: 'item-card__desc' }, s.description || 'Описание не указано')
                        ),
                        React.createElement('div', { className: 'item-card__actions' },
                            React.createElement('button', {
                                type: 'button',
                                className: 'item-card__icon-btn item-card__icon-btn--danger',
                                onClick: () => setConfirmModal({ isOpen: true, id: s.id, name: s.name }),
                                title: 'Удалить'
                            }, 'Удалить')
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
                React.createElement('h3', { className: 'panel-title', style: { textAlign: 'center' } }, 'Удалить предмет'),
                React.createElement('p', { style: { color: 'var(--text-secondary)', marginBottom: '24px' } }, `Удалить предмет «${confirmModal.name}»?`),
                React.createElement('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center' } },
                    React.createElement('button', { className: 'btn btn--ghost', onClick: () => setConfirmModal({ isOpen: false, id: null, name: '' }) }, 'Отмена'),
                    React.createElement('button', { className: 'btn btn--danger', onClick: confirmDelete }, 'Удалить')
                )
            )
        )
    )
}
