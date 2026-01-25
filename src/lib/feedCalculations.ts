/**
 * WHO-based recommended daily milk intake for infants
 * Source: WHO/UNICEF guidelines for infant feeding
 * 
 * Guidelines:
 * - 0-1 week: 30-60ml per feed, ~8-12 feeds = 300-600ml/day
 * - 1-2 weeks: 60-90ml per feed = 480-720ml/day
 * - 2-4 weeks: 90-120ml per feed = 600-900ml/day
 * - 1-2 months: 120-150ml per feed = 750-900ml/day
 * - 2-4 months: 150-180ml per feed = 750-1050ml/day
 * - 4-6 months: 180-210ml per feed = 900-1200ml/day
 * - 6-12 months: 600-900ml (as solids introduced)
 */

export interface FeedTarget {
  minMl: number;
  maxMl: number;
  targetMl: number; // recommended target (middle of range)
  description: string;
}

export function calculateWHOFeedTarget(ageInDays: number): FeedTarget {
  // Week 1 (0-7 days)
  if (ageInDays <= 7) {
    return {
      minMl: 300,
      maxMl: 600,
      targetMl: 450,
      description: "Week 1: Building up feeds gradually"
    };
  }
  
  // Week 2 (8-14 days)
  if (ageInDays <= 14) {
    return {
      minMl: 480,
      maxMl: 720,
      targetMl: 600,
      description: "Week 2: Increasing intake"
    };
  }
  
  // Week 3-4 (15-30 days)
  if (ageInDays <= 30) {
    return {
      minMl: 600,
      maxMl: 900,
      targetMl: 750,
      description: "Weeks 3-4: Establishing routine"
    };
  }
  
  // Month 2 (31-60 days)
  if (ageInDays <= 60) {
    return {
      minMl: 750,
      maxMl: 900,
      targetMl: 825,
      description: "Month 2: 120-150ml per feed"
    };
  }
  
  // Months 2-4 (61-120 days)
  if (ageInDays <= 120) {
    return {
      minMl: 750,
      maxMl: 1050,
      targetMl: 900,
      description: "Months 2-4: Peak intake period"
    };
  }
  
  // Months 4-6 (121-180 days)
  if (ageInDays <= 180) {
    return {
      minMl: 900,
      maxMl: 1200,
      targetMl: 1050,
      description: "Months 4-6: Maximum milk intake"
    };
  }
  
  // Months 6-12 (181-365 days) - solids introduced
  if (ageInDays <= 365) {
    return {
      minMl: 600,
      maxMl: 900,
      targetMl: 750,
      description: "Months 6-12: Milk + solids"
    };
  }
  
  // Over 1 year
  return {
    minMl: 400,
    maxMl: 600,
    targetMl: 500,
    description: "12+ months: Transitioning to whole milk"
  };
}

export function getFeedStatus(
  actualMl: number, 
  target: FeedTarget
): { status: 'low' | 'good' | 'high'; color: string; message: string } {
  const percentage = (actualMl / target.targetMl) * 100;
  
  if (actualMl < target.minMl) {
    return {
      status: 'low',
      color: 'red',
      message: `Below minimum (${target.minMl}ml)`
    };
  }
  
  if (percentage < 90) {
    return {
      status: 'low',
      color: 'amber',
      message: 'Below recommended target'
    };
  }
  
  if (actualMl > target.maxMl) {
    return {
      status: 'high',
      color: 'amber',
      message: `Above recommended (${target.maxMl}ml)`
    };
  }
  
  return {
    status: 'good',
    color: 'green',
    message: 'On target'
  };
}
