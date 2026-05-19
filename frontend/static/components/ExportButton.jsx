// компонент кнопки экспорта данных в csv
const ExportButton = ({ data, filename }) => {
    const handleExport = () => {
        if (!data || data.length === 0) return
        
        const headers = Object.keys(data[0])
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n')
        
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename
        link.click()
    }

    return React.createElement('button', { 
        className: 'btn', 
        onClick: handleExport,
        style: { background: '#27ae60', marginBottom: '15px', marginRight: '10px' }
    }, 'Экспорт в CSV')
}