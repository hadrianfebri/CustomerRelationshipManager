import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, MessageSquare, Mail, Target, Zap, CheckCircle } from "lucide-react";

export default function AIDemoPanel() {
  return (
    <Card className="w-full border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <Brain className="h-5 w-5" />
          AI Automation System - DeepSeek Integration
        </CardTitle>
        <CardDescription>
          Advanced AI capabilities using DeepSeek API for intelligent CRM automation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                <TrendingUp className="h-4 w-4" />
                AI Lead Scoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Automated lead analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Score calculation (0-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Detailed reasoning</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Ready to use
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                <MessageSquare className="h-4 w-4" />
                Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Communication analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Positive/negative detection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Confidence scoring</span>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Ready to use
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
                <Mail className="h-4 w-4" />
                Email Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Context-aware emails</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Professional templates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Personalized content</span>
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Ready to use
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                <Target className="h-4 w-4" />
                Smart Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Follow-up suggestions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Priority assessment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Action planning</span>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Ready to use
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">System Status</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">AI Service Integration</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">Connected</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Database Integration</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">DeepSeek API Key</span>
              </div>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Configure to activate</Badge>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            How to Activate AI Features
          </h4>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>1. Sign up for DeepSeek API at api.deepseek.com</li>
            <li>2. Get your API key from the dashboard</li>
            <li>3. Add DEEPSEEK_API_KEY to environment variables</li>
            <li>4. Restart the application</li>
            <li>5. Start using AI automation features</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}