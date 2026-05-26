import { useState, useEffect } from 'react';
import { supabase } from './supabase.js';

const TIERS = { BASE: 'base', PRO: 'pro', ENTERPRISE: 'enterprise' };

/**
 * Fail-closed feature gate. Defaults to base tier unless Supabase
 * confirms a paid subscription. Never trusts user_metadata or localStorage.
 */
export function useFeatureGate(bookId) {
  const [tier, setTier] = useState(TIERS.BASE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTier = async () => {
      try {
        if (!supabase) return;

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return;

        const { data, error: subError } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (!subError && data?.tier && (data.tier === TIERS.PRO || data.tier === TIERS.ENTERPRISE)) {
          setTier(data.tier);
        }
      } catch {
        console.warn('[FeatureGate] Tier check failed, defaulting to base.');
      } finally {
        setLoading(false);
      }
    };

    checkTier();
  }, [bookId]);

  return {
    tier,
    loading,
    isPro: tier === TIERS.PRO || tier === TIERS.ENTERPRISE,
    isEnterprise: tier === TIERS.ENTERPRISE,
    isBase: tier === TIERS.BASE
  };
}

export function canAccess(section, gate) {
  if (!section?.premium) return true;
  return gate.isPro || gate.isEnterprise;
}

export { TIERS };
