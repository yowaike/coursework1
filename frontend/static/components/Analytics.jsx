// компонент аналитики с карточками статистики
const Analytics = () => {
    const [stats, setStats] = React.useState({
        failing: 0,
        bestClass: null,
        worstClass: null,
        classesAvg: []
    })

    React.useEffect(() => {
        //функция для загрузки аналитики
        const loadStats = async () => {
            const failing = await fetch('/api/analytics/failing').then(r => r.json())
            const extreme = await fetch('/api/analytics/best_worst_class').then(r => r.json())
            const classes = await fetch('/api/analytics/classes_avg').then(r => r.json())
            
            setStats({
                failing: failing.failing_count,
                bestClass: extreme.best,
                worstClass: extreme.worst,
                classesAvg: classes
            })
        }
        loadStats()
    }, [])

    //функция для рендера карточки
    const StatCard = ({ title, value, color }) => 
        React.createElement('div', { 
            className: 'glass-card', 
            style: { flex: 1, minWidth: '200px', background: color || 'rgba(255,255,255,0.1)' } 
        },
            React.createElement('h4', { style: { margin: '0 0 10px 0', color: 'white', opacity: 0.9 } }, title),
            React.createElement('div', { style: { fontSize: '32px', fontWeight: 'bold', color: 'white' } }, value)
        )

    return React.createElement('div', { style: { color: 'white' } },
        React.createElement(ExportButton, { data: stats.classesAvg, filename: 'analitika_klassy.csv' }),
        React.createElement('h2', { style: { color: 'white', marginBottom: '20px' } }, 'Аналитика успеваемости'),
        
        // верхний ряд карточек
        React.createElement('div', { style: { display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' } },
            React.createElement(StatCard, { title: 'Неуспевающих (2)', value: stats.failing, color: 'rgba(231, 76, 60, 0.3)' }),
            stats.bestClass && React.createElement(StatCard, { title: 'Лучший класс', value: `${stats.bestClass.class} (${stats.bestClass.avg})`, color: 'rgba(46, 204, 113, 0.3)' }),
            stats.worstClass && React.createElement(StatCard, { title: 'Худший класс', value: `${stats.worstClass.class} (${stats.worstClass.avg})`, color: 'rgba(231, 76, 60, 0.3)' })
        ),

        // таблица средних оценок по классам
        React.createElement('div', { className: 'glass-card' },
            React.createElement('h3', { style: { color: 'white', marginTop: 0 } }, 'Средняя успеваемость по классам'),
            React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', color: 'white' } },
                React.createElement('thead', null,
                    React.createElement('tr', { style: { borderBottom: '2px solid rgba(255,255,255,0.3)' } },
                        React.createElement('th', { style: { textAlign: 'left', padding: '10px' } }, 'Класс'),
                        React.createElement('th', { style: { textAlign: 'left', padding: '10px' } }, 'Средний балл')
                    )
                ),
                React.createElement('tbody', null,
                    stats.classesAvg.map(c => 
                        React.createElement('tr', { key: c.class, style: { borderBottom: '1px solid rgba(255,255,255,0.1)' } },
                            React.createElement('td', { style: { padding: '10px' } }, c.class),
                            React.createElement('td', { style: { padding: '10px' } }, c.avg)
                        )
                    )
                )
            )
        )
    )
}