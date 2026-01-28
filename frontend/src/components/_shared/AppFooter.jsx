/**
 * App Footer Component
 *
 * Minimal sticky footer for displaying metadata and status information.
 * Designed to complement the app header with consistent styling.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Footer content (typically metadata text)
 */
export default function AppFooter({ children }) {
  return (
    <footer className="app-footer">
      {children}
    </footer>
  );
}
