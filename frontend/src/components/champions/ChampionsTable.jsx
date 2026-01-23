import { useState, useMemo } from 'react'

function ChampionsTable({ championsData, onChampionClick }) {
  const [divisionFilter, setDivisionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')

  // Get unique divisions
  const divisions = useMemo(() => {
    const uniqueDivisions = [...new Set(championsData.champions.map(c => c.division))]
    return uniqueDivisions.sort()
  }, [championsData.champions])

  // Filter champions
  const filteredChampions = useMemo(() => {
    let filtered = [...championsData.champions]

    // Apply division filter
    if (divisionFilter !== 'all') {
      filtered = filtered.filter(c => c.division === divisionFilter)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'headcount':
          aVal = a.headcountCovered
          bVal = b.headcountCovered
          break
        case 'division':
          aVal = a.division.toLowerCase()
          bVal = b.division.toLowerCase()
          break
        case 'focusArea':
          aVal = a.focusArea.toLowerCase()
          bVal = b.focusArea.toLowerCase()
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })

    return filtered
  }, [championsData.champions, divisionFilter, statusFilter, sortField, sortDirection])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIndicator = (field) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <div className="table-title">Champion Roster</div>
        <div className="table-description">
          All appointed champions across the organization ({filteredChampions.length} of {championsData.champions.length})
        </div>
      </div>

      {/* Filters */}
      <div className="filters" style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--border)' }}>
        <div className="filter-group">
          <label className="filter-label" htmlFor="division-filter">Division:</label>
          <select
            id="division-filter"
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
          >
            <option value="all">All Divisions</option>
            {divisions.map(div => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
              Name{getSortIndicator('name')}
            </th>
            <th onClick={() => handleSort('division')} style={{ cursor: 'pointer' }}>
              Division{getSortIndicator('division')}
            </th>
            <th onClick={() => handleSort('focusArea')} style={{ cursor: 'pointer' }}>
              Focus Area{getSortIndicator('focusArea')}
            </th>
            <th className="text-right" onClick={() => handleSort('headcount')} style={{ cursor: 'pointer' }}>
              Headcount{getSortIndicator('headcount')}
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredChampions.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--muted)' }}>
                No champions match the selected filters
              </td>
            </tr>
          ) : (
            filteredChampions.map((champion) => (
              <tr
                key={champion.id}
                className="clickable"
                onClick={() => onChampionClick(champion)}
              >
                <td>{champion.name}</td>
                <td>{champion.division}</td>
                <td>{champion.focusArea}</td>
                <td className="text-right">{champion.headcountCovered.toLocaleString()}</td>
                <td>
                  <span className={`status-badge status-${champion.status}`}>
                    {champion.status === 'confirmed' ? '✅ Confirmed' : '⏳ Pending'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ChampionsTable
