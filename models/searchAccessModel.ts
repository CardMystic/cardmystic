export interface SearchAccess {
  enabled: boolean;
  authenticated: boolean;
  tier: 'normal' | 'enhanced';
  enhancedRemaining: number;
  enhancedTopUpRemaining: number;
  resetsAt: string;
}
export interface BillingStatus {
  enabled: boolean;
  status: string;
  tier: 'normal' | 'enhanced';
  canManage: boolean;
  hasSubscription: boolean;
  trialEligible: boolean;
  trialEndsAt?: string | null;
  enhancedAvailable?: boolean;
  enhancedTopUpAvailable?: boolean;
}
