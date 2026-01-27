import { useState, useEffect } from 'react';

/**
 * Hook to fetch authenticated user information from Azure Static Web Apps
 * Extracts user email and name from Azure AD claims
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAuthUser() {
      try {
        if (import.meta.env.DEV) {
          setUser(null);
          setLoading(false);
          return;
        }

        const response = await fetch('/.auth/me', { credentials: 'include' });

        if (!response.ok) {
          throw new Error(`Failed to fetch auth info: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          setUser(null);
          setLoading(false);
          return;
        }

        const data = await response.json();

        // Azure Static Web Apps returns clientPrincipal in the response
        const principal = data.clientPrincipal;

        if (!principal) {
          // Not authenticated
          setUser(null);
          setLoading(false);
          return;
        }

        // Extract email from claims (try multiple claim types)
        const email = extractEmailFromClaims(principal.claims);
        const name = extractNameFromClaims(principal.claims);

        setUser({
          email: normalizeEmail(email),
          name: name || principal.userDetails || 'Unknown User',
          userId: principal.userId,
          claims: principal.claims
        });

      } catch (err) {
        console.error('Error fetching auth user:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAuthUser();
  }, []);

  return { user, loading, error };
}

/**
 * Extract email from Azure AD claims
 * Tries multiple claim types to handle different Azure AD configurations
 */
function extractEmailFromClaims(claims) {
  if (!claims || claims.length === 0) return null;

  // Try common email claim types in order of preference
  const emailClaimTypes = [
    'email',
    'emails',
    'preferred_username',
    'upn',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn'
  ];

  for (const claimType of emailClaimTypes) {
    const claim = claims.find(c => c.typ === claimType);
    if (claim?.val) {
      // Handle array values (emails claim can be an array)
      if (Array.isArray(claim.val)) {
        return claim.val[0];
      }
      return claim.val;
    }
  }

  return null;
}

/**
 * Extract name from Azure AD claims
 */
function extractNameFromClaims(claims) {
  if (!claims || claims.length === 0) return null;

  const nameClaimTypes = [
    'name',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
  ];

  for (const claimType of nameClaimTypes) {
    const claim = claims.find(c => c.typ === claimType);
    if (claim?.val) {
      return claim.val;
    }
  }

  return null;
}

/**
 * Normalize email to lowercase for consistent matching
 */
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}
