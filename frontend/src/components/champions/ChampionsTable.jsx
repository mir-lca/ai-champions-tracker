import { useState, useMemo } from 'react'

function ChampionsTable({ championsData, onChampionClick }) {
  const [divisionFilter, setDivisionFilter] = useState('all')
  const [statusFilters, setStatusFilters] = useState(['confirmed', 'pending', 'unassigned'])
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
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

    // Apply status filters (multi-select)
    if (statusFilters.length > 0) {
      filtered = filtered.filter(c => statusFilters.includes(c.status))
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
  }, [championsData.champions, divisionFilter, statusFilters, sortField, sortDirection])

  const handleStatusFilterToggle = (status) => {
    setStatusFilters(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }

  const getStatusLabel = () => {
    if (statusFilters.length === 0) return 'None selected'
    if (statusFilters.length === 3) return 'All'
    return statusFilters.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
  }

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

        <div className="filter-group" style={{ position: 'relative' }}>
          <label className="filter-label" htmlFor="status-filter">Status:</label>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              id="status-filter"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              onBlur={() => setTimeout(() => setStatusDropdownOpen(false), 200)}
              style={{
                padding: '8px 32px 8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: 'var(--card-background)',
                color: 'var(--text)',
                cursor: 'pointer',
                minWidth: '200px',
                textAlign: 'left',
                position: 'relative'
              }}
            >
              {getStatusLabel()}
              <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                {statusDropdownOpen ? '▲' : '▼'}
              </span>
            </button>
            {statusDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: 'var(--card-background)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  minWidth: '200px'
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text)'
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <input
                    type="checkbox"
                    checked={statusFilters.includes('confirmed')}
                    onChange={() => handleStatusFilterToggle('confirmed')}
                  />
                  <span>Confirmed</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text)'
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <input
                    type="checkbox"
                    checked={statusFilters.includes('pending')}
                    onChange={() => handleStatusFilterToggle('pending')}
                  />
                  <span>Pending</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    color: 'var(--text)'
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <input
                    type="checkbox"
                    checked={statusFilters.includes('unassigned')}
                    onChange={() => handleStatusFilterToggle('unassigned')}
                  />
                  <span>Unassigned</span>
                </label>
              </div>
            )}
          </div>
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
            filteredChampions.map((champion) => {
              const isUnassigned = champion.status === 'unassigned';
              return (
                <tr
                  key={champion.id}
                  className={isUnassigned ? '' : 'clickable'}
                  onClick={isUnassigned ? undefined : () => onChampionClick(champion)}
                  style={isUnassigned ? { cursor: 'default' } : {}}
                >
                  <td>{champion.name}</td>
                  <td>{champion.division}</td>
                  <td>{champion.focusArea}</td>
                  <td className="text-right">{champion.headcountCovered.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${champion.status}`}>
                      {champion.status === 'confirmed' ? '✅ Confirmed'
                        : champion.status === 'pending' ? '⏳ Pending'
                        : '○ Unassigned'}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ChampionsTable
