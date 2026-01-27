import { useState, useMemo } from 'react'
import championsDataJson from './data/championsData.json'
import { getDivisionSummary } from './utils/getDivisionSummary'
import { enhanceWithCoverage, getChampionHeadcount } from './utils/computeCoverage'
import HierarchicalCoverageTable from './components/champions/HierarchicalCoverageTable'
import ChampionsTable from './components/champions/ChampionsTable'
import ChampionCard from './components/champions/ChampionCard'
import { useOrgHierarchy, isOrgDataStale, formatLastUpdate } from './api/orgDataClient'

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedChampion, setSelectedChampion] = useState(null)
  const [championsData] = useState(championsDataJson)

  // Fetch org hierarchy from CDN
  const { data: orgHierarchyData, isLoading: isLoadingOrg, isError: isOrgError } = useOrgHierarchy()
  const orgHierarchy = orgHierarchyData || {}

  // Enhance org hierarchy with coverage data (app-specific)
  const enhancedOrgHierarchy = orgHierarchy.summary
    ? enhanceWithCoverage(orgHierarchy, championsData)
    : orgHierarchy

  // Check if data is stale (>7 days old)
  const dataIsStale = isOrgDataStale(orgHierarchy.version)

  const divisionSummary = getDivisionSummary(enhancedOrgHierarchy, championsData)

  // Enhance champions with computed headcount for display components
  const enhancedChampions = useMemo(() => {
    return championsData.champions.map(champion => ({
      ...champion,
      headcountCovered: getChampionHeadcount(champion, enhancedOrgHierarchy)
    }));
  }, [championsData.champions, enhancedOrgHierarchy]);

  const enhancedChampionsData = {
    ...championsData,
    champions: enhancedChampions
  };

  const confirmedChampions = championsData.champions.filter(c => c.status === 'confirmed').length
  const pendingChampions = championsData.champions.filter(c => c.status === 'pending').length
  const totalChampions = confirmedChampions + pendingChampions

  // Calculate coverage using live org data from CDN
  const totalOrgEmployees = orgHierarchy.totalEmployees || 0

  // Calculate confirmed coverage from enhanced org hierarchy
  const totalCoveredEmployees = enhancedOrgHierarchy.divisions
    ? (
      enhancedOrgHierarchy.divisions.reduce((sum, div) => sum + div.covered, 0) +
      (enhancedOrgHierarchy.corporate?.reduce((sum, corp) => sum + corp.covered, 0) || 0)
    )
    : 0

  const coveragePercentage = totalOrgEmployees > 0
    ? ((totalCoveredEmployees / totalOrgEmployees) * 100).toFixed(1)
    : '0.0'

  // Calculate potential coverage (including pending champions)
  // Use getChampionHeadcount helper for consistency
  const pendingCoverage = championsData.champions
    .filter(c => c.status === 'pending')
    .reduce((sum, champion) => {
      return sum + getChampionHeadcount(champion, enhancedOrgHierarchy);
    }, 0);

  const potentialCoverage = totalOrgEmployees > 0
    ? (((totalCoveredEmployees + pendingCoverage) / totalOrgEmployees) * 100).toFixed(1)
    : '0.0'

  const handleChampionClick = (champion) => {
    // Champion already has computed headcount from enhancedChampionsData
    setSelectedChampion(champion)
  }

  const handleBackToRoster = () => {
    setSelectedChampion(null)
  }

  // Show loading state while fetching org data
  if (isLoadingOrg) {
    return (
      <div className="container">
        <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p>Loading organizational data...</p>
        </div>
      </div>
    )
  }

  // Show error state if CDN fetch fails
  if (isOrgError || !orgHierarchy.totalEmployees) {
    return (
      <div className="container">
        <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-error)' }}>
            Failed to load organizational data from CDN. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Stale Data Warning */}
      {dataIsStale && (
        <div style={{
          background: 'var(--color-warning-bg, #fff3cd)',
          border: '1px solid var(--color-warning-border, #ffc107)',
          color: 'var(--color-warning-text, #856404)',
          padding: 'var(--space-md)',
          borderRadius: 'var(--radius-md, 8px)',
          marginBottom: 'var(--space-lg)'
        }}>
          ⚠️ Organizational data is more than 7 days old. Last updated: {formatLastUpdate(orgHierarchy.version)}
        </div>
      )}

      <header>
        <h1>AI Champions Coverage Tracker</h1>
        <p className="subtitle">
          Organizational coverage across Teradyne's {orgHierarchy.totalEmployees.toLocaleString()} employees
        </p>
        <p className="last-updated">
          Champions data: {new Date(championsData.metadata.lastUpdated).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
          {' • '}
          Org data: {orgHierarchy.version ? formatLastUpdate(orgHierarchy.version) : 'Unknown'}
        </p>
      </header>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('overview')
            setSelectedChampion(null)
          }}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'champions' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('champions')
            setSelectedChampion(null)
          }}
        >
          Champions
        </button>
        <button
          className={`tab ${activeTab === 'coverage' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('coverage')
            setSelectedChampion(null)
          }}
        >
          Coverage Analysis
        </button>
      </div>

      {/* Overview Tab */}
      <div className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`}>
        {/* Metric Cards */}
        <div className="metric-cards">
          <div className="metric-card">
            <div className="metric-label">Total Champions</div>
            <div className="metric-value">{totalChampions}</div>
            <div className="metric-subtext">
              {confirmedChampions} confirmed, {pendingChampions} pending
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Organizational Coverage</div>
            <div className="metric-value">{coveragePercentage}%</div>
            <div className="metric-subtext">
              {totalCoveredEmployees.toLocaleString()} of {totalOrgEmployees.toLocaleString()} employees
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Potential Coverage</div>
            <div className="metric-value">{potentialCoverage}%</div>
            <div className="metric-subtext">If pending champions confirmed</div>
          </div>
        </div>

        {/* Coverage Gauge */}
        <div className="gauge-container">
          <h3 className="table-title" style={{ marginBottom: 'var(--space-lg)' }}>Current Coverage</h3>
          <div className="gauge">
            <svg viewBox="0 0 200 200" className="gauge-circle">
              <circle
                className="gauge-bg"
                cx="100"
                cy="100"
                r="80"
              />
              <circle
                className="gauge-progress"
                cx="100"
                cy="100"
                r="80"
                strokeDasharray={`${2 * Math.PI * 80 * (coveragePercentage / 100)} ${2 * Math.PI * 80}`}
                strokeDashoffset="0"
              />
            </svg>
            <div className="gauge-text">
              <div className="gauge-percentage">{coveragePercentage}%</div>
              <div className="gauge-label">Coverage</div>
            </div>
          </div>
        </div>

        {/* Division Breakdown Table */}
        <div className="table-container">
          <div className="table-header">
            <div className="table-title">Division Breakdown</div>
            <div className="table-description">Coverage summary by division</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Division</th>
                <th className="text-right">Champions</th>
                <th className="text-right">Covered</th>
                <th className="text-right">Total</th>
                <th className="text-right">Coverage %</th>
              </tr>
            </thead>
            <tbody>
              {divisionSummary.map((div, index) => (
                <tr key={index}>
                  <td>{div.division}</td>
                  <td className="text-right">{div.champions}</td>
                  <td className="text-right">{div.covered.toLocaleString()}</td>
                  <td className="text-right">{div.total.toLocaleString()}</td>
                  <td className="text-right">{div.coverage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Champions Tab */}
      <div className={`tab-content ${activeTab === 'champions' ? 'active' : ''}`}>
        {selectedChampion ? (
          <ChampionCard
            champion={selectedChampion}
            onBack={handleBackToRoster}
          />
        ) : (
          <ChampionsTable
            championsData={enhancedChampionsData}
            onChampionClick={handleChampionClick}
          />
        )}
      </div>

      {/* Coverage Analysis Tab */}
      <div className={`tab-content ${activeTab === 'coverage' ? 'active' : ''}`}>
        <div className="table-container">
          <div className="table-header">
            <div className="table-title">Hierarchical Coverage Analysis</div>
            <div className="table-description">
              Detailed view of organizational coverage by division, business unit, and function
            </div>
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-md)' }}>
          <HierarchicalCoverageTable
            orgHierarchy={enhancedOrgHierarchy}
            championsData={championsData}
          />
        </div>
      </div>
    </div>
  )
}

export default App
/* Trigger redeploy */
