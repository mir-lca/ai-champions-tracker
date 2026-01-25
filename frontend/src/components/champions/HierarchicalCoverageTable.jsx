import { useState } from 'react'
import { getChampionForFunction } from '../../utils/computeCoverage'

function HierarchicalCoverageTable({ orgHierarchy, championsData }) {
  const [expandedDivisions, setExpandedDivisions] = useState({})

  const toggleDivision = (divisionId) => {
    setExpandedDivisions(prev => ({
      ...prev,
      [divisionId]: !prev[divisionId]
    }))
  }

  const getCoverageIndicator = (coverage) => {
    if (coverage === 'full') return { text: 'Full', class: 'coverage-full' }
    if (coverage === 'partial') return { text: 'Partial', class: 'coverage-partial' }
    return { text: 'Gap', class: 'coverage-gap' }
  }

  // Calculate totals
  const totalHeadcount = orgHierarchy.totalEmployees
  const totalCovered = orgHierarchy.divisions.reduce((sum, div) => sum + div.covered, 0) +
    (orgHierarchy.corporate?.reduce((sum, corp) => sum + corp.covered, 0) || 0)
  const totalCoverage = ((totalCovered / totalHeadcount) * 100).toFixed(1)
  const totalChampions = championsData.champions.filter(c => c.status === 'confirmed').length

  return (
    <div className="smart-heatmap">
      {/* Header Row */}
      <div className="heatmap-row header">
        <div className="heatmap-cell header">Organization</div>
        <div className="heatmap-cell header text-right">Headcount</div>
        <div className="heatmap-cell header text-right">Covered</div>
        <div className="heatmap-cell header text-right">Coverage %</div>
        <div className="heatmap-cell header">Indicator</div>
        <div className="heatmap-cell header">Champion</div>
      </div>

      {/* Divisions */}
      {orgHierarchy.divisions.map(division => {
        const isExpanded = expandedDivisions[division.id]
        const coveragePercent = division.headcount > 0
          ? ((division.covered / division.headcount) * 100).toFixed(1)
          : '0.0'

        return (
          <div key={division.id}>
            {/* Division Row */}
            <div
              className="heatmap-row division"
              onClick={() => toggleDivision(division.id)}
            >
              <div className="heatmap-cell">
                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
                <strong>{division.name}</strong>
              </div>
              <div className="heatmap-cell text-right">{division.headcount.toLocaleString()}</div>
              <div className="heatmap-cell text-right">{division.covered.toLocaleString()}</div>
              <div className="heatmap-cell text-right">{coveragePercent}%</div>
              <div className="heatmap-cell">
                <span className={`coverage-indicator coverage-${division.coverage}`}>
                  {division.coverage === 'full' ? '✅ Full' : division.coverage === 'partial' ? '⏳ Partial' : '❌ Gap'}
                </span>
              </div>
              <div className="heatmap-cell">-</div>
            </div>

            {/* Division Children */}
            <div className={`division-children ${isExpanded ? 'expanded' : ''}`}>
              {/* Division-level Functions */}
              {division.divisionFunctions?.map((func, idx) => {
                const indicator = getCoverageIndicator(func.coverage)
                const champion = getChampionForFunction(func.name, division.name, null, championsData)
                const coveragePercent = func.headcount > 0
                  ? ((func.covered / func.headcount) * 100).toFixed(1)
                  : '0.0'

                return (
                  <div key={`div-func-${idx}`} className="heatmap-row">
                    <div className="heatmap-cell indent-1">{func.name}</div>
                    <div className="heatmap-cell text-right">{func.headcount.toLocaleString()}</div>
                    <div className="heatmap-cell text-right">{func.covered.toLocaleString()}</div>
                    <div className="heatmap-cell text-right">{coveragePercent}%</div>
                    <div className="heatmap-cell">
                      <span className={`coverage-indicator ${indicator.class}`}>
                        {func.hasChampion ? '✅' : '❌'} {indicator.text}
                      </span>
                    </div>
                    <div className="heatmap-cell">
                      {champion ? (
                        <span>
                          {champion.name}
                          {champion.status === 'pending' && (
                            <span style={{ color: 'var(--pending)', marginLeft: '4px' }}>(Pending)</span>
                          )}
                        </span>
                      ) : '-'}
                    </div>
                  </div>
                )
              })}

              {/* Business Units */}
              {division.businessUnits?.map(bu => {
                const buCoveragePercent = bu.headcount > 0
                  ? ((bu.covered / bu.headcount) * 100).toFixed(1)
                  : '0.0'

                return (
                  <div key={bu.id}>
                    {/* BU Row */}
                    <div className="heatmap-row">
                      <div className="heatmap-cell indent-1">
                        <strong>{bu.name}</strong>
                      </div>
                      <div className="heatmap-cell text-right">{bu.headcount.toLocaleString()}</div>
                      <div className="heatmap-cell text-right">{bu.covered.toLocaleString()}</div>
                      <div className="heatmap-cell text-right">{buCoveragePercent}%</div>
                      <div className="heatmap-cell">
                        <span className={`coverage-indicator coverage-${bu.coverage}`}>
                          {bu.coverage === 'full' ? '✅ Full' : bu.coverage === 'partial' ? '⏳ Partial' : '❌ Gap'}
                        </span>
                      </div>
                      <div className="heatmap-cell">-</div>
                    </div>

                    {/* BU Functions */}
                    {bu.functions?.map((func, idx) => {
                      const indicator = getCoverageIndicator(func.coverage)
                      const champion = getChampionForFunction(func.name, division.name, bu.id, championsData)
                      const coveragePercent = func.headcount > 0
                        ? ((func.covered / func.headcount) * 100).toFixed(1)
                        : '0.0'

                      return (
                        <div key={`bu-func-${idx}`} className="heatmap-row">
                          <div className="heatmap-cell indent-2">{func.name}</div>
                          <div className="heatmap-cell text-right">{func.headcount.toLocaleString()}</div>
                          <div className="heatmap-cell text-right">{func.covered.toLocaleString()}</div>
                          <div className="heatmap-cell text-right">{coveragePercent}%</div>
                          <div className="heatmap-cell">
                            <span className={`coverage-indicator ${indicator.class}`}>
                              {func.hasChampion ? '✅' : '❌'} {indicator.text}
                            </span>
                          </div>
                          <div className="heatmap-cell">
                            {champion ? (
                              <span>
                                {champion.name}
                                {champion.status === 'pending' && (
                                  <span style={{ color: 'var(--pending)', marginLeft: '4px' }}>(Pending)</span>
                                )}
                              </span>
                            ) : '-'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Corporate Functions */}
      {orgHierarchy.corporate?.map(corp => (
        <div key={corp.id}>
          {/* Corporate Row */}
          <div className="heatmap-row">
            <div className="heatmap-cell">
              <strong>{corp.name}</strong>
            </div>
            <div className="heatmap-cell text-right">{corp.headcount.toLocaleString()}</div>
            <div className="heatmap-cell text-right">{corp.covered.toLocaleString()}</div>
            <div className="heatmap-cell text-right">
              {corp.headcount > 0 ? ((corp.covered / corp.headcount) * 100).toFixed(1) : '0.0'}%
            </div>
            <div className="heatmap-cell">
              <span className={`coverage-indicator coverage-${corp.coverage}`}>
                {corp.coverage === 'full' ? '✅ Full' : corp.coverage === 'partial' ? '⏳ Partial' : '❌ Gap'}
              </span>
            </div>
            <div className="heatmap-cell">-</div>
          </div>

          {/* Corporate Sub-functions */}
          {corp.subFunctions?.map((subFunc, idx) => (
            <div key={`corp-subfunc-${idx}`} className="heatmap-row">
              <div className="heatmap-cell indent-1">{subFunc}</div>
              <div className="heatmap-cell text-right">-</div>
              <div className="heatmap-cell text-right">-</div>
              <div className="heatmap-cell text-right">-</div>
              <div className="heatmap-cell">
                <span className="coverage-indicator coverage-gap">❌ Gap</span>
              </div>
              <div className="heatmap-cell">-</div>
            </div>
          ))}
        </div>
      ))}

      {/* Totals Row */}
      <div className="heatmap-row totals-row">
        <div className="heatmap-cell">
          <strong>Total</strong>
        </div>
        <div className="heatmap-cell text-right">
          <strong>{totalHeadcount.toLocaleString()}</strong>
        </div>
        <div className="heatmap-cell text-right">
          <strong>{totalCovered.toLocaleString()}</strong>
        </div>
        <div className="heatmap-cell text-right">
          <strong>{totalCoverage}%</strong>
        </div>
        <div className="heatmap-cell">
          <strong>{totalChampions} champions</strong>
        </div>
        <div className="heatmap-cell">-</div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <span className="coverage-indicator coverage-full">✅ Full</span>
          <span style={{ color: 'var(--muted)' }}>- All functions covered</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <span className="coverage-indicator coverage-partial">⏳ Partial</span>
          <span style={{ color: 'var(--muted)' }}>- Some functions covered</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <span className="coverage-indicator coverage-gap">❌ Gap</span>
          <span style={{ color: 'var(--muted)' }}>- No coverage</span>
        </div>
      </div>
    </div>
  )
}

export default HierarchicalCoverageTable
