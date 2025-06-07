// AI Service using DeepSeek API for CRM automation
import { Contact, Activity, Deal } from "@shared/schema";

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class AIService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.deepseek.com/v1";

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  }

  private async makeRequest(messages: Array<{ role: string; content: string }>, temperature = 0.7): Promise<string> {
    if (!this.apiKey) {
      throw new Error("DeepSeek API key is required for AI features");
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages,
          temperature,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data: DeepSeekResponse = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("DeepSeek API request failed:", error);
      throw error;
    }
  }

  // AI Lead Scoring based on contact profile and activities
  async calculateAILeadScore(contact: Contact, activities: Activity[], deals: Deal[]): Promise<{
    score: number;
    reasoning: string;
    recommendations: string[];
  }> {
    const prompt = `Analyze this contact for lead scoring (0-100):

Contact Info:
- Name: ${contact.firstName} ${contact.lastName}
- Company: ${contact.company} 
- Position: ${contact.position}
- Source: ${contact.source}
- Current Score: ${contact.leadScore}
- Status: ${contact.leadStatus}

Recent Activities (${activities.length} total):
${activities.slice(0, 5).map(a => `- ${a.type}: ${a.title} (${a.description})`).join('\n')}

Deals (${deals.length} total):
${deals.map(d => `- ${d.title}: $${d.value} (${d.stage}, ${d.probability}% probability)`).join('\n')}

Provide JSON response with:
{
  "score": number (0-100),
  "reasoning": "detailed explanation",
  "recommendations": ["action1", "action2", "action3"]
}`;

    const response = await this.makeRequest([
      { role: "system", content: "You are an expert sales AI analyzing leads. Always respond with valid JSON." },
      { role: "user", content: prompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        score: contact.leadScore || 50,
        reasoning: "AI analysis temporarily unavailable",
        recommendations: ["Schedule follow-up call", "Send product information", "Check decision timeline"]
      };
    }
  }

  // Sentiment Analysis for activities and communications
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    insights: string;
  }> {
    const prompt = `Analyze the sentiment of this business communication:

"${text}"

Provide JSON response with:
{
  "sentiment": "positive|neutral|negative",
  "confidence": number (0-1),
  "insights": "brief explanation of the sentiment and key indicators"
}`;

    const response = await this.makeRequest([
      { role: "system", content: "You are a sentiment analysis expert for business communications. Always respond with valid JSON." },
      { role: "user", content: prompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        sentiment: 'neutral' as const,
        confidence: 0.5,
        insights: "Sentiment analysis temporarily unavailable"
      };
    }
  }

  // Generate automated follow-up recommendations
  async generateFollowUpRecommendations(contact: Contact, recentActivities: Activity[]): Promise<{
    urgency: 'high' | 'medium' | 'low';
    suggestedActions: string[];
    emailSubject: string;
    emailTemplate: string;
  }> {
    const lastActivity = recentActivities[0];
    const daysSinceLastContact = lastActivity 
      ? Math.floor((Date.now() - new Date(lastActivity.createdAt || 0).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const prompt = `Generate follow-up recommendations for this contact:

Contact: ${contact.firstName} ${contact.lastName} (${contact.company})
Position: ${contact.position}
Lead Status: ${contact.leadStatus}
Lead Score: ${contact.leadScore}
Days since last contact: ${daysSinceLastContact}

Recent Activities:
${recentActivities.slice(0, 3).map(a => `- ${a.type}: ${a.title} - ${a.description}`).join('\n')}

Provide JSON response with:
{
  "urgency": "high|medium|low",
  "suggestedActions": ["action1", "action2", "action3"],
  "emailSubject": "Professional email subject line",
  "emailTemplate": "Professional email template with {{firstName}} placeholder"
}`;

    const response = await this.makeRequest([
      { role: "system", content: "You are a sales automation expert. Generate professional business follow-up recommendations. Always respond with valid JSON." },
      { role: "user", content: prompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        urgency: 'medium' as const,
        suggestedActions: ["Send follow-up email", "Schedule call", "Share relevant resources"],
        emailSubject: "Following up on our conversation",
        emailTemplate: "Hi {{firstName}},\n\nI wanted to follow up on our recent conversation. Is there anything I can help you with?\n\nBest regards"
      };
    }
  }

  // Generate email content based on context
  async generateEmailContent(
    contact: Contact, 
    purpose: string, 
    context?: string
  ): Promise<{
    subject: string;
    body: string;
  }> {
    const prompt = `Generate a professional email for this contact:

Contact: ${contact.firstName} ${contact.lastName}
Company: ${contact.company}
Position: ${contact.position}
Purpose: ${purpose}
${context ? `Context: ${context}` : ''}

Generate a professional business email with:
{
  "subject": "Professional subject line",
  "body": "Professional email body with {{firstName}} and {{company}} placeholders"
}`;

    const response = await this.makeRequest([
      { role: "system", content: "You are a professional business email writer. Always respond with valid JSON." },
      { role: "user", content: prompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        subject: "Following up with you",
        body: "Dear {{firstName}},\n\nI hope this email finds you well. I wanted to reach out regarding {{company}}'s needs.\n\nBest regards"
      };
    }
  }

  // Analyze deal probability and provide insights
  async analyzeDealProbability(deal: Deal, contact: Contact, activities: Activity[]): Promise<{
    suggestedProbability: number;
    insights: string[];
    nextSteps: string[];
  }> {
    const prompt = `Analyze this deal probability:

Deal: ${deal.title}
Current Value: $${deal.value}
Current Probability: ${deal.probability}%
Stage: ${deal.stage}
Expected Close: ${deal.expectedCloseDate}

Contact: ${contact.firstName} ${contact.lastName} (${contact.position} at ${contact.company})
Lead Score: ${contact.leadScore}

Recent Activities:
${activities.slice(0, 3).map(a => `- ${a.type}: ${a.title}`).join('\n')}

Provide JSON response with:
{
  "suggestedProbability": number (0-100),
  "insights": ["insight1", "insight2", "insight3"],
  "nextSteps": ["step1", "step2", "step3"]
}`;

    const response = await this.makeRequest([
      { role: "system", content: "You are a sales deal analysis expert. Always respond with valid JSON." },
      { role: "user", content: prompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        suggestedProbability: deal.probability || 50,
        insights: ["Deal analysis temporarily unavailable"],
        nextSteps: ["Continue regular follow-up", "Schedule next meeting", "Prepare proposal"]
      };
    }
  }
}

export const aiService = new AIService();