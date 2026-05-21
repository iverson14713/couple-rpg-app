import { useMemo } from 'react';
import { useUserPlan } from '../context/UserPlanContext';
import { requireProFeature, type ProFeatureId, type ProFeatureCheck } from '../lib/proFeatures';

export function useProFeature(feature: ProFeatureId): ProFeatureCheck {
  const { isPro } = useUserPlan();
  return useMemo(() => requireProFeature(feature, isPro), [feature, isPro]);
}
