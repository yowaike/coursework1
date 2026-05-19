// компонент аналитики в премиальном стиле
const Analytics = () => {
    const [stats, setStats] = React.useState({
        failing: 0,
        bestClass: null,
        worstClass: null,
        classesAvg: []
    })
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        //функция для загрузки аналитики
        Promise.all([
            fetch('/api/analytics/failing'),
            fetch('/api/analytics/best_worst_class'),
            fetch('/api/analytics/classes_avg')
        ])
        .then(responses => Promise.all(responses.map(r => r.json())))
        .then(([failingData, extremeData, classesData]) => {
            setStats({
                failing: failingData.failing_count,
                bestClass: extremeData.best,
                worstClass: extremeData.worst,
                classesAvg: classesData || []
            })
            setLoading(false)
        })
        .catch(() => setLoading(false))
    }, [])

    if (loading) return React.createElement('div', { className: 'spinner' })

    return React.createElement('div', null,
        // заголовок
        React.createElement('div', { style: { marginBottom: '32px' } },
            React.createElement('h1', { style: { fontSize: '36px', marginBottom: '8px' } }, 'АНАЛИТИКА'),
            React.createElement('p', { style: { color: 'var(--text-secondary)', margin: 0 } }, 'Сводные данные по школе')
        ),

        // карточки со статистикой
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' } },
            // Лучший класс
            React.createElement('div', { className: 'glass-card' },
                React.createElement('span', { style: { display: 'block', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' } }, 'Лучший класс'),
                React.createElement('h2', { style: { fontSize: '48px', margin: '10px 0', color: 'var(--accent-color)' } }, stats.bestClass ? stats.bestClass.class : '—'),
                stats.bestClass && React.createElement('span', { style: { fontSize: '14px', color: '#2E7D32', fontWeight: 600 } }, `Средний балл: ${stats.bestClass.avg}`)
            ),
            
            // Худший класс
            React.createElement('div', { className: 'glass-card' },
                React.createElement('span', { style: { display: 'block', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' } }, 'Требует внимания'),
                React.createElement('h2', { style: { fontSize: '48px', margin: '10px 0', color: '#D32F2F' } }, stats.worstClass ? stats.worstClass.class : '—'),
                stats.worstClass && React.createElement('span', { style: { fontSize: '14px', color: '#7A7A7A' } }, `Средний балл: ${stats.worstClass.avg}`)
            ),

            // Неуспевающие
            React.createElement('div', { className: 'glass-card' },
                React.createElement('span', { style: { display: 'block', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' } }, 'Неуспевающих (2)'),
                React.createElement('h2', { style: { fontSize: '48px', margin: '10px 0', color: 'var(--text-primary)' } }, stats.failing),
                React.createElement('span', { style: { fontSize: '14px', color: '#7A7A7A' } }, 'учеников по школе')
            )
        ),

        // таблица успеваемости по классам
        React.createElement('div', { className: 'glass-card' },
            React.createElement('h3', { style: { fontSize: '20px', marginBottom: '24px' } }, 'Средняя успеваемость по классам'),
            React.createElement('table', null,
                React.createElement('thead', null,
                    React.createElement('tr', null,
                        React.createElement('th', null, 'Класс'),
                        React.createElement('th', { style: { textAlign: 'right' } }, 'Средний балл'),
                        React.createElement('th', { style: { textAlign: 'center' } }, 'Статус')
                    )
                ),
                React.createElement('tbody', null,
                    stats.classesAvg.map(c => 
                        React.createElement('tr', { key: c.class },
                            React.createElement('td', { style: { fontWeight: 500 } }, c.class),
                            React.createElement('td', { style: { textAlign: 'right' } }, c.avg),
                            React.createElement('td', { style: { textAlign: 'center' } }, 
                                React.createElement('span', { 
                                    style: { 
                                        padding: '6px 12px', 
                                        borderRadius: '20px', 
                                        fontSize: '12px',
                                        background: c.avg >= 4 ? '#E8F5E9' : '#FFF3E0',
                                        color: c.avg >= 4 ? '#2E7D32' : '#F57C00'
                                    } 
                                }, c.avg >= 4 ? 'Отлично' : 'Внимание')
                            )
                        )
                    )
                )
            )
        )
    )
}