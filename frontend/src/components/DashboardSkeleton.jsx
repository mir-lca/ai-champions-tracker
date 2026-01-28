export function DashboardSkeleton() {
  return (
    <div className="page-container">
      <div className="loading-skeleton">
        {/* Metric Cards - 3 cards */}
        <div className="skeleton-row">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>

        {/* Coverage Gauge */}
        <div className="skeleton-chart"></div>

        {/* Division Breakdown Table */}
        <div className="skeleton-table"></div>
      </div>
    </div>
  );
}
