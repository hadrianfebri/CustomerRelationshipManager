import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Brain, TrendingUp, MessageSquare, Mail, Calendar, AlertCircle, Loader2, Copy, Edit, Send, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmailComposeModal from "@/components/email/email-compose-modal";
import type { Contact } from "@shared/schema";

interface AIContactInsightsProps {
  contact: Contact;
  onScoreUpdate?: (newScore: number) => void;
}

interface AIInsight {
  score: number;
  reasoning: string;
  recommendations: string[];
}

interface FollowUpRecommendation {
  urgency: 'high' | 'medium' | 'low';
  suggestedActions: string[];
  emailSubject: string;
  emailTemplate: string;
}

export default function AIContactInsights({ contact, onScoreUpdate }: AIContactInsightsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGettingRecommendations, setIsGettingRecommendations] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [followUpRec, setFollowUpRec] = useState<FollowUpRecommendation | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<{subject: string; body: string} | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedEmail, setEditedEmail] = useState({ subject: '', body: '' });
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const { toast } = useToast();

  // Load cached AI results when contact changes
  useEffect(() => {
    const loadCachedResults = async () => {
      if (!contact?.id) return;

      try {
        // Load cached analysis
        const analysisResponse = await fetch(`/api/ai/lead-score/${contact.id}`, { method: "POST" });
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          setInsights(analysisData);
        }

        // Load cached recommendations
        const recResponse = await fetch(`/api/ai/follow-up-recommendations/${contact.id}`, { method: "POST" });
        if (recResponse.ok) {
          const recData = await recResponse.json();
          setFollowUpRec(recData);
        }

        // Load cached email
        const emailResponse = await fetch('/api/ai/generate-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: contact.id, type: 'follow-up' })
        });
        if (emailResponse.ok) {
          const emailData = await emailResponse.json();
          setGeneratedEmail(emailData);
        }
      } catch (error) {
        // Silently fail - cached results are optional
      }
    };

    loadCachedResults();
  }, [contact?.id]);

  const analyzeContact = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/ai/lead-score/${contact.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data);
        onScoreUpdate?.(data.score);
        
        toast({
          title: "AI Analysis Complete",
          description: `Lead score updated to ${data.score}`,
        });
      } else {
        throw new Error("AI service unavailable");
      }
    } catch (error) {
      toast({
        title: "AI Service Required",
        description: "Configure DeepSeek API key to enable AI features",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFollowUpRecommendations = async () => {
    setIsGettingRecommendations(true);
    try {
      const response = await fetch(`/api/ai/follow-up-recommendations/${contact.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        setFollowUpRec(data);
        
        toast({
          title: "AI Recommendations Ready",
          description: "Follow-up recommendations generated successfully",
        });
      } else {
        throw new Error("AI service unavailable");
      }
    } catch (error) {
      toast({
        title: "Service Unavailable",
        description: "AI recommendations temporarily unavailable",
        variant: "destructive",
      });
    } finally {
      setIsGettingRecommendations(false);
    }
  };

  const generateEmail = async (purpose: string) => {
    setIsGeneratingEmail(true);
    try {
      const response = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          purpose,
          context: `Lead status: ${contact.leadStatus}, Score: ${contact.leadScore}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedEmail(data);
        
        toast({
          title: "Email Generated",
          description: "AI-generated email content ready",
        });
      } else {
        throw new Error("AI service unavailable");
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Email generation temporarily unavailable",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleCopyEmail = () => {
    if (!generatedEmail) return;
    
    const emailText = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
    navigator.clipboard.writeText(emailText);
    toast({
      title: "Email Copied",
      description: "Email content has been copied to clipboard"
    });
  };

  const handleEditEmail = () => {
    if (!generatedEmail) return;
    
    setEditedEmail({
      subject: generatedEmail.subject,
      body: generatedEmail.body
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditedEmail = () => {
    setGeneratedEmail(editedEmail);
    setIsEditModalOpen(false);
    toast({
      title: "Email Updated",
      description: "Your email changes have been saved"
    });
  };

  const handleScheduleEmail = () => {
    if (!generatedEmail) return;
    setIsEmailModalOpen(true);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-purple-600" />
            AI Contact Analysis
          </CardTitle>
          <CardDescription>
            AI-powered insights for {contact.firstName} {contact.lastName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Score:</span>
                <span className={`text-lg font-bold ${getScoreColor(contact.leadScore || 0)}`}>
                  {contact.leadScore}/100
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {contact.company} • {contact.position}
              </p>
            </div>
            {!insights && (
              <Button 
                onClick={analyzeContact}
                disabled={isAnalyzing}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    AI Analysis
                  </>
                )}
              </Button>
            )}
          </div>

          {insights && (
            <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Recommended Score:</span>
                <span className={`text-lg font-bold ${getScoreColor(insights.score)}`}>
                  {insights.score}/100
                </span>
              </div>
              <p className="text-sm text-gray-700">{insights.reasoning}</p>
              
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-600">AI Recommendations:</span>
                {insights.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                    <span className="text-xs text-gray-600">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Follow-up Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!followUpRec && (
            <Button 
              onClick={getFollowUpRecommendations}
              disabled={isGettingRecommendations}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              {isGettingRecommendations ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting Recommendations...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Get AI Recommendations
                </>
              )}
            </Button>
          )}

          {followUpRec && (
            <div className="space-y-3 p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Badge variant={getUrgencyColor(followUpRec.urgency)}>
                  {followUpRec.urgency.toUpperCase()} Priority
                </Badge>
                {followUpRec.urgency === 'high' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-600">Suggested Actions:</span>
                {followUpRec.suggestedActions.map((action, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    <span className="text-xs text-gray-600">{action}</span>
                  </div>
                ))}
              </div>

              {!generatedEmail && (
                <div className="pt-2 border-t">
                  <Button 
                    onClick={() => generateEmail("follow-up")}
                    disabled={isGeneratingEmail}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    {isGeneratingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Email...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Generate Follow-up Email
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {generatedEmail && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-green-600" />
              AI Generated Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-gray-600">Subject:</span>
                <p className="text-sm font-medium">{generatedEmail.subject}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600">Body:</span>
                <div className="text-sm text-gray-700 whitespace-pre-wrap p-2 border rounded bg-gray-50">
                  {generatedEmail.body}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" onClick={handleScheduleEmail} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopyEmail}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button size="sm" variant="outline" onClick={handleEditEmail}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Email Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit AI Generated Email</DialogTitle>
            <DialogDescription>
              Customize the email content before sending
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <input
                type="text"
                value={editedEmail.subject}
                onChange={(e) => setEditedEmail({ ...editedEmail, subject: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email Content</label>
              <Textarea
                value={editedEmail.body}
                onChange={(e) => setEditedEmail({ ...editedEmail, body: e.target.value })}
                className="mt-1 min-h-[200px] resize-none"
                placeholder="Edit your email content..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedEmail} className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Compose Modal */}
      <EmailComposeModal
        contact={contact}
        contacts={[contact]}
        open={isEmailModalOpen}
        onOpenChange={setIsEmailModalOpen}
        mode="single"
      />
    </div>
  );
}