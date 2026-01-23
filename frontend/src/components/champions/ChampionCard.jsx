function ChampionCard({ champion, onBack }) {
  return (
    <div className="detail-view">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <a onClick={onBack}>← Back to Champions</a>
      </div>

      {/* Champion Name & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
          {champion.name}
        </h2>
        <span className={`status-badge status-${champion.status}`}>
          {champion.status === 'confirmed' ? '✅ Confirmed' : '⏳ Pending'}
        </span>
      </div>

      {/* Details Grid */}
      <div className="champion-detail">
        <div className="detail-item">
          <div className="detail-label">Email</div>
          <div className="detail-value">
            <a href={`mailto:${champion.email}`} style={{ color: 'var(--confirmed)' }}>
              {champion.email}
            </a>
          </div>
        </div>

        <div className="detail-item">
          <div className="detail-label">Division</div>
          <div className="detail-value">{champion.division}</div>
        </div>

        <div className="detail-item">
          <div className="detail-label">Focus Area</div>
          <div className="detail-value">{champion.focusArea}</div>
        </div>

        <div className="detail-item">
          <div className="detail-label">Headcount Covered</div>
          <div className="detail-value">{champion.headcountCovered.toLocaleString()} employees</div>
        </div>

        {champion.businessUnits && champion.businessUnits.length > 0 && (
          <div className="detail-item">
            <div className="detail-label">Business Units</div>
            <div className="detail-value">
              {champion.businessUnits.join(', ')}
            </div>
          </div>
        )}

        {champion.timeCommitmentPct && (
          <div className="detail-item">
            <div className="detail-label">Time Commitment</div>
            <div className="detail-value">{champion.timeCommitmentPct}%</div>
          </div>
        )}

        {champion.appointmentDate && (
          <div className="detail-item">
            <div className="detail-label">Appointment Date</div>
            <div className="detail-value">
              {new Date(champion.appointmentDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        )}

        {champion.productLines && champion.productLines.length > 0 && (
          <div className="detail-item">
            <div className="detail-label">Product Lines</div>
            <div className="detail-value">
              {champion.productLines.join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* Notes Section */}
      {champion.notes && (
        <div style={{ marginTop: 'var(--space-xl)' }}>
          <div className="detail-label" style={{ marginBottom: 'var(--space-sm)' }}>Notes</div>
          <div style={{
            padding: 'var(--space-md)',
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--muted)',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            {champion.notes}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChampionCard
