import { Contact, Activity, Deal } from "@shared/schema";

export interface LeadScoringResult {
  score: number;
  reasoning: string;
  recommendations: string[];
  triggers: AutomationTrigger[];
}

export interface AutomationTrigger {
  type: 'email' | 'sms' | 'whatsapp' | 'task' | 'alert';
  priority: 'high' | 'medium' | 'low';
  delay: number; // minutes
  content: string;
  assignedTo?: string;
}

export class AdvancedLeadScoring {
  
  // Main scoring function: Fit × Engagement model as per task specs
  static calculateLeadScore(contact: Contact, activities: Activity[], deals: Deal[]): LeadScoringResult {
    const fitScore = this.calculateFitScore(contact);
    const engagementScore = this.calculateEngagementScore(activities);
    const dealPotentialScore = this.calculateDealPotentialScore(deals);
    
    // Weighted scoring: Fit (40%) + Engagement (40%) + Deal Potential (20%)
    const finalScore = Math.round((fitScore * 0.4) + (engagementScore * 0.4) + (dealPotentialScore * 0.2));
    const clampedScore = Math.min(100, Math.max(0, finalScore));
    
    const reasoning = `Lead score: Profile Fit (${fitScore}/100, 40%), Engagement (${engagementScore}/100, 40%), Deal Potential (${dealPotentialScore}/100, 20%) = ${clampedScore}/100`;
    
    const recommendations = this.generateRecommendations(clampedScore, contact, activities);
    const triggers = this.generateAutomationTriggers(clampedScore, contact, activities);
    
    return {
      score: clampedScore,
      reasoning,
      recommendations,
      triggers
    };
  }

  // Profile Fit Scoring - Company size, position, source quality
  private static calculateFitScore(contact: Contact): number {
    let score = 0;
    
    // Company assessment (0-30 points)
    if (contact.company) {
      const company = contact.company.toLowerCase();
      if (company.includes('corp') || company.includes('inc') || company.includes('ltd') || 
          company.includes('enterprise') || company.includes('group')) {
        score += 30; // Enterprise indicators
      } else if (company.includes('startup') || company.includes('tech') || company.includes('digital')) {
        score += 25; // High-growth potential
      } else if (company.includes('llc') || company.includes('co') || company.includes('company')) {
        score += 20; // Established business
      } else {
        score += 15; // Basic company presence
      }
    } else {
      score += 5; // Individual/missing company
    }
    
    // Position/Decision-making power (0-35 points)
    if (contact.position) {
      const position = contact.position.toLowerCase();
      if (position.includes('ceo') || position.includes('founder') || position.includes('owner') || 
          position.includes('president') || position.includes('chief')) {
        score += 35; // C-level/founder
      } else if (position.includes('vp') || position.includes('vice president') || 
                 position.includes('director') || position.includes('head of')) {
        score += 30; // VP/Director level
      } else if (position.includes('manager') || position.includes('lead') || 
                 position.includes('senior') || position.includes('principal')) {
        score += 25; // Senior management
      } else if (position.includes('coordinator') || position.includes('specialist') || 
                 position.includes('analyst')) {
        score += 15; // Mid-level
      } else {
        score += 10; // Entry level
      }
    } else {
      score += 5; // Missing position
    }
    
    // Source quality (0-25 points)
    if (contact.source) {
      const source = contact.source.toLowerCase();
      if (source.includes('referral') || source.includes('partner') || source.includes('direct')) {
        score += 25; // Highest quality sources
      } else if (source.includes('organic') || source.includes('search') || source.includes('seo')) {
        score += 20; // High intent sources
      } else if (source.includes('content') || source.includes('webinar') || source.includes('demo')) {
        score += 18; // Content engagement
      } else if (source.includes('social') || source.includes('linkedin') || source.includes('facebook')) {
        score += 15; // Social sources
      } else if (source.includes('ad') || source.includes('campaign') || source.includes('paid')) {
        score += 12; // Paid sources
      } else {
        score += 8; // Other sources
      }
    }
    
    // Lead status progression (0-10 points)
    switch (contact.leadStatus) {
      case 'qualified':
        score += 10;
        break;
      case 'contacted':
        score += 8;
        break;
      case 'new':
        score += 5;
        break;
      default:
        score += 3;
    }
    
    return Math.min(100, score);
  }

  // Behavioral Engagement Scoring - Activity frequency, recency, type
  private static calculateEngagementScore(activities: Activity[]): number {
    if (!activities.length) return 10; // Base score for new contacts
    
    let score = 0;
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    // Activity frequency scoring (0-40 points)
    const recent7Days = activities.filter(a => a.createdAt && new Date(a.createdAt) >= last7Days).length;
    const recent30Days = activities.filter(a => a.createdAt && new Date(a.createdAt) >= last30Days).length;
    const recent90Days = activities.filter(a => a.createdAt && new Date(a.createdAt) >= last90Days).length;
    
    if (recent7Days >= 3) {
      score += 40; // Very high engagement
    } else if (recent7Days >= 1) {
      score += 30; // High recent engagement
    } else if (recent30Days >= 5) {
      score += 25; // High monthly engagement
    } else if (recent30Days >= 2) {
      score += 20; // Moderate engagement
    } else if (recent90Days >= 3) {
      score += 15; // Some engagement
    } else if (recent90Days >= 1) {
      score += 10; // Minimal engagement
    }
    
    // Activity type quality scoring (0-30 points)
    let typeScore = 0;
    const typeWeights = {
      'meeting': 15,
      'demo': 12,
      'call': 10,
      'email': 6,
      'proposal': 8,
      'contract': 10,
      'note': 3,
      'other': 2
    };
    
    activities.forEach(activity => {
      const weight = typeWeights[activity.type as keyof typeof typeWeights] || typeWeights.other;
      typeScore += weight;
    });
    
    score += Math.min(30, typeScore);
    
    // Recency bonus (0-20 points)
    const sortedActivities = activities.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    
    if (sortedActivities.length > 0 && sortedActivities[0].createdAt) {
      const daysSinceLastActivity = (now.getTime() - new Date(sortedActivities[0].createdAt).getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastActivity <= 1) {
        score += 20; // Very recent
      } else if (daysSinceLastActivity <= 3) {
        score += 15; // Recent
      } else if (daysSinceLastActivity <= 7) {
        score += 12; // Week
      } else if (daysSinceLastActivity <= 14) {
        score += 8; // Two weeks
      } else if (daysSinceLastActivity <= 30) {
        score += 5; // Month
      }
    }
    
    // Engagement consistency (0-10 points)
    const activityDates = activities
      .filter(a => a.createdAt)
      .map(a => new Date(a.createdAt!))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (activityDates.length >= 3) {
      const timeSpan = activityDates[activityDates.length - 1].getTime() - activityDates[0].getTime();
      const daySpan = timeSpan / (1000 * 60 * 60 * 24);
      const avgDaysBetween = daySpan / (activityDates.length - 1);
      
      if (avgDaysBetween <= 7) {
        score += 10; // Very consistent
      } else if (avgDaysBetween <= 14) {
        score += 8; // Consistent
      } else if (avgDaysBetween <= 30) {
        score += 5; // Somewhat consistent
      }
    }
    
    return Math.min(100, score);
  }

  // Deal Pipeline Assessment
  private static calculateDealPotentialScore(deals: Deal[]): number {
    if (!deals.length) return 30; // Base score for prospects
    
    let totalScore = 0;
    
    deals.forEach(deal => {
      let dealScore = 0;
      
      // Deal value scoring (0-40 points)
      const value = parseFloat(deal.value || '0');
      if (value >= 100000) {
        dealScore += 40; // Enterprise deal
      } else if (value >= 50000) {
        dealScore += 35; // Large deal
      } else if (value >= 25000) {
        dealScore += 30; // Medium deal
      } else if (value >= 10000) {
        dealScore += 25; // Small deal
      } else if (value >= 1000) {
        dealScore += 15; // Micro deal
      } else {
        dealScore += 5; // Minimal value
      }
      
      // Stage progression (0-35 points)
      switch (deal.stage?.toLowerCase()) {
        case 'closed-won':
          dealScore += 35; // Proven buyer
          break;
        case 'contract':
        case 'negotiation':
          dealScore += 30; // Advanced stage
          break;
        case 'proposal':
          dealScore += 25; // Proposal stage
          break;
        case 'demo':
        case 'discovery':
          dealScore += 20; // Mid-stage
          break;
        case 'qualification':
          dealScore += 15; // Qualified
          break;
        case 'prospecting':
        default:
          dealScore += 10; // Early stage
      }
      
      // Probability weighting (0-25 points)
      if (deal.probability) {
        dealScore += (deal.probability / 100) * 25;
      } else {
        dealScore += 10; // Default probability
      }
      
      totalScore += dealScore;
    });
    
    // Average score across all deals, with bonus for multiple deals
    const avgScore = totalScore / deals.length;
    const multiDealBonus = Math.min(20, (deals.length - 1) * 5);
    
    return Math.min(100, avgScore + multiDealBonus);
  }

  // Generate actionable recommendations based on score
  private static generateRecommendations(score: number, contact: Contact, activities: Activity[]): string[] {
    const recommendations: string[] = [];
    
    // Score-based recommendations
    if (score >= 85) {
      recommendations.push("🔥 Hot lead: Immediate sales intervention required");
      recommendations.push("Schedule C-level meeting within 24 hours");
      recommendations.push("Prepare custom proposal with premium pricing");
      recommendations.push("Assign senior account executive");
    } else if (score >= 70) {
      recommendations.push("⭐ High-priority qualified lead");
      recommendations.push("Schedule product demo within 48 hours");
      recommendations.push("Send personalized value proposition");
      recommendations.push("Begin formal qualification process");
    } else if (score >= 55) {
      recommendations.push("✅ Marketing qualified lead (MQL)");
      recommendations.push("Initiate nurture sequence with targeted content");
      recommendations.push("Schedule discovery call within 1 week");
      recommendations.push("Share relevant case studies and ROI calculators");
    } else if (score >= 40) {
      recommendations.push("📈 Developing prospect");
      recommendations.push("Continue education-focused engagement");
      recommendations.push("Add to monthly newsletter and content series");
      recommendations.push("Monitor for engagement score improvements");
    } else if (score >= 25) {
      recommendations.push("🌱 Early-stage lead");
      recommendations.push("Focus on awareness and education content");
      recommendations.push("Include in automated drip campaigns");
      recommendations.push("Gather additional qualification data");
    } else {
      recommendations.push("❄️ Cold prospect");
      recommendations.push("Minimal touch approach with quarterly check-ins");
      recommendations.push("Re-evaluate lead quality and sources");
      recommendations.push("Consider lead disqualification if no improvement");
    }
    
    // Activity-based recommendations
    const lastActivityDate = activities.length > 0 ? 
      new Date(Math.max(...activities.map(a => new Date(a.createdAt || 0).getTime()))) : null;
    
    if (!lastActivityDate || (Date.now() - lastActivityDate.getTime()) > 14 * 24 * 60 * 60 * 1000) {
      recommendations.push("⚠️ No recent activity: Immediate outreach required");
    }
    
    // Profile completeness recommendations
    if (!contact.company) {
      recommendations.push("📝 Research and update company information");
    }
    if (!contact.position) {
      recommendations.push("👔 Identify contact's role and decision-making authority");
    }
    
    return recommendations.slice(0, 6); // Limit to top 6 recommendations
  }

  // Generate automation triggers for lifecycle management
  private static generateAutomationTriggers(score: number, contact: Contact, activities: Activity[]): AutomationTrigger[] {
    const triggers: AutomationTrigger[] = [];
    
    // Score-based automation triggers
    if (score >= 80) {
      triggers.push({
        type: 'alert',
        priority: 'high',
        delay: 0,
        content: `🚨 HOT LEAD ALERT: ${contact.firstName} ${contact.lastName} scored ${score}/100`,
        assignedTo: 'sales-manager'
      });
      
      triggers.push({
        type: 'task',
        priority: 'high',
        delay: 5,
        content: `Call ${contact.firstName} ${contact.lastName} immediately - Hot lead (${score}/100)`,
        assignedTo: 'senior-sales-rep'
      });
      
      triggers.push({
        type: 'email',
        priority: 'high',
        delay: 15,
        content: `Priority follow-up email with calendar booking link`
      });
      
    } else if (score >= 60) {
      triggers.push({
        type: 'task',
        priority: 'medium',
        delay: 30,
        content: `Schedule demo call with ${contact.firstName} ${contact.lastName} - Qualified lead (${score}/100)`
      });
      
      triggers.push({
        type: 'email',
        priority: 'medium',
        delay: 60,
        content: `Send qualification questionnaire and value proposition`
      });
      
    } else if (score >= 40) {
      triggers.push({
        type: 'email',
        priority: 'medium',
        delay: 120,
        content: `Add to nurture sequence - educational content series`
      });
      
      triggers.push({
        type: 'task',
        priority: 'low',
        delay: 1440, // 24 hours
        content: `Review lead progress and engagement for ${contact.firstName} ${contact.lastName}`
      });
      
    } else if (score >= 20) {
      triggers.push({
        type: 'email',
        priority: 'low',
        delay: 240,
        content: `Add to drip campaign - awareness stage content`
      });
    }
    
    // Activity-based triggers
    const lastActivity = activities.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )[0];
    
    if (!lastActivity || (Date.now() - new Date(lastActivity.createdAt || 0).getTime()) > 7 * 24 * 60 * 60 * 1000) {
      triggers.push({
        type: 'email',
        priority: 'medium',
        delay: 60,
        content: `Re-engagement email - check-in and value reminder`
      });
    }
    
    return triggers;
  }
}