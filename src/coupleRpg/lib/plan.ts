/** 方案與 Pro 功能（情侶共享 + local fallback，尚未接金流） */
export {
  getUserPlan,
  setUserPlan,
  isProUser,
  loadUserPlan,
  saveUserPlan,
  type UserPlan,
} from '../storage/planStore';
export {
  getCouplePlan,
  isCouplePro,
  isCoupleProSubscription,
  activateCoupleProTrial,
  setCouplePlanForTesting,
  shouldUseCoupleSubscription,
  type CouplePlanSnapshot,
  type CoupleSubscriptionRow,
} from '../services/couplePlanService';
export { requireProFeature, PRO_FEATURE_LABELS, type ProFeatureId, type ProFeatureCheck } from './proFeatures';
