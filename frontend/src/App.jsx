import { useState } from 'react'
import orgHierarchyData from './data/orgHierarchy.json'
import championsDataJson from './data/championsData.json'
import { getDivisionSummary } from './utils/getDivisionSummary'
import HierarchicalCoverageTable from './components/champions/HierarchicalCoverageTable'
import ChampionsTable from './components/champions/ChampionsTable'
import ChampionCard from './components/champions/ChampionCard'

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedChampion, setSelectedChampion] = useState(null)
  const [orgHierarchy] = useState(orgHierarchyData)
  const [championsData] = useState(championsDataJson)

  const divisionSummary = getDivisionSummary(orgHierarchy, championsData)

  const confirmedChampions = championsData.champions.filter(c => c.status === 'confirmed').length
  const pendingChampions = championsData.champions.filter(c => c.status === 'pending').length
  const totalChampions = confirmedChampions + pendingChampions

  const coveragePercentage = championsData.metadata.coveragePercentage
  const potentialCoverage = (
    (championsData.metadata.totalCovered +
      championsData.champions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.headcountCovered, 0)) /
    championsData.metadata.totalOrg * 100
  ).toFixed(1)

  const handleChampionClick = (champion) => {
    setSelectedChampion(champion)
  }

  const handleBackToRoster = () => {
    setSelectedChampion(null)
  }

  return (
    <div className="container">
      <header>
        <h1>AI Champions Coverage Tracker</h1>
        <p className="subtitle">
          Organizational coverage across Teradyne's {orgHierarchy.totalEmployees.toLocaleString()} employees
        </p>
        <p className="last-updated">
          Last updated: {new Date(championsData.metadata.lastUpdated).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
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
              {championsData.metadata.totalCovered.toLocaleString()} of {championsData.metadata.totalOrg.toLocaleString()} employees
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
            championsData={championsData}
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
            orgHierarchy={orgHierarchy}
            championsData={championsData}
          />
        </div>
      </div>
    </div>
  )
}

export default App
