// компонент аналитики
const Analytics = () => {
    const [stats, setStats] = React.useState({
        failing: 0, bestClass: null, worstClass: null, worstTeacher: null, classesAvg: []
    })
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        Promise.all([
            fetch('/api/analytics/failing', { credentials: 'include' }).then(r => r.ok ? r.json() : { failing_count: 0 }),
            fetch('/api/analytics/best_worst_class', { credentials: 'include' }).then(r => r.ok ? r.json() : { best: null, worst: null }),
            fetch('/api/analytics/worst_teacher', { credentials: 'include' }).then(r => r.ok ? r.json() : { teacher: null, avg_grade: null }),
            fetch('/api/analytics/classes_avg', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
        ]).then(([f, e, t, c]) => {
            setStats({
                failing: f.failing_count || 0,
                bestClass: e.best,
                worstClass: e.worst,
                worstTeacher: t,
                classesAvg: c || []
            })
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    if (loading) return React.createElement('div', { className: 'spinner' })

    return React.createElement('div', null,
        React.createElement('div', { className: 'page-header' },
            React.createElement('div', null,
                React.createElement('h1', { className: 'page-title' }, 'Аналитика'),
                React.createElement('p', { className: 'page-subtitle' }, 'Сводные показатели успеваемости')
            )
        ),

        React.createElement('div', { className: 'stat-grid' },
            React.createElement('div', { className: 'stat-card' },
                React.createElement('div', { className: 'stat-card__label' }, 'Лучший класс'),
                React.createElement('div', { className: 'stat-card__value stat-card__value--good' }, stats.bestClass?.class || '—'),
                stats.bestClass && React.createElement('div', { className: 'stat-card__hint' }, `Средний балл ${stats.bestClass.avg}`)
            ),
            React.createElement('div', { className: 'stat-card' },
                React.createElement('div', { className: 'stat-card__label' }, 'Требует внимания'),
                React.createElement('div', { className: 'stat-card__value stat-card__value--warn' }, stats.worstClass?.class || '—'),
                stats.worstClass && React.createElement('div', { className: 'stat-card__hint' }, `Средний балл ${stats.worstClass.avg}`)
            ),
            React.createElement('div', { className: 'stat-card' },
                React.createElement('div', { className: 'stat-card__label' }, 'Неуспевающих'),
                React.createElement('div', { className: 'stat-card__value' }, stats.failing),
                React.createElement('div', { className: 'stat-card__hint' }, 'учеников с двойками')
            ),
            React.createElement('div', { className: 'stat-card' },
                React.createElement('div', { className: 'stat-card__label' }, 'Низкая успеваемость'),
                React.createElement('div', { className: 'stat-card__value stat-card__value--name stat-card__value--warn' }, stats.worstTeacher?.teacher || '—'),
                stats.worstTeacher?.avg_grade && React.createElement('div', { className: 'stat-card__hint' }, `Средний балл ${stats.worstTeacher.avg_grade}`)
            )
        ),

        React.createElement('div', { className: 'glass-card' },
            React.createElement('h3', { className: 'panel-title' }, 'Успеваемость по классам'),
            stats.classesAvg.length > 0 ?
                React.createElement('div', null,
                    React.createElement('div', { style: { display: 'flex', alignItems: 'flex-end', gap: '12px', height: '170px', marginTop: '14px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' } },
                        stats.classesAvg.map(c => {
                            const maxAvg = Math.max(...stats.classesAvg.map(x => x.avg), 5)
                            const height = (c.avg / maxAvg) * 126
                            const color = c.avg >= 4.5 ? '#2E7D32' : c.avg >= 3.5 ? '#F57F17' : '#D32F2F'
                            const bg = c.avg >= 4.5 ? '#E8F5E9' : c.avg >= 3.5 ? '#FFF8E1' : '#FFEBEE'
                            return React.createElement('div', { key: c.class, style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' } },
                                React.createElement('div', { style: { fontSize: '13px', fontWeight: 600 } }, c.avg),
                                React.createElement('div', { style: { width: '100%', maxWidth: '48px', height: `${height}px`, background: bg, borderRadius: '8px 8px 0 0', border: `2px solid ${color}`, borderBottom: 'none' } }),
                                React.createElement('div', { style: { fontSize: '12px', color: 'var(--text-secondary)' } }, c.class)
                            )
                        })
                    ),
                    React.createElement('div', { className: 'table-wrap glass-card', style: { marginBottom: 0 } },
                        React.createElement('table', null,
                            React.createElement('thead', null,
                                React.createElement('tr', null,
                                    React.createElement('th', null, 'Класс'),
                                    React.createElement('th', { style: { textAlign: 'center' } }, 'Средний балл'),
                                    React.createElement('th', { style: { textAlign: 'center' } }, 'Статус')
                                )
                            ),
                            React.createElement('tbody', null,
                                stats.classesAvg.map(c =>
                                    React.createElement('tr', { key: c.class },
                                        React.createElement('td', { style: { fontWeight: 500 } }, c.class),
                                        React.createElement('td', { style: { textAlign: 'center', fontWeight: 600 } }, c.avg),
                                        React.createElement('td', { style: { textAlign: 'center' } },
                                            React.createElement('span', {
                                                style: {
                                                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                                                    background: c.avg >= 4.5 ? '#E8F5E9' : c.avg >= 3.5 ? '#FFF8E1' : '#FFEBEE',
                                                    color: c.avg >= 4.5 ? '#2E7D32' : c.avg >= 3.5 ? '#F57F17' : '#D32F2F'
                                                }
                                            }, c.avg >= 4.5 ? 'Отлично' : c.avg >= 3.5 ? 'Хорошо' : 'Слабо')
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
                : React.createElement('div', { style: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' } }, 'Нет данных')
        )
    )
}
