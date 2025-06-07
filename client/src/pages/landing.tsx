import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Users, 
  TrendingUp, 
  Mail, 
  Calendar, 
  Target, 
  BarChart3, 
  Zap,
  CheckCircle,
  ArrowRight 
} from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CRM Pro</span>
          </div>
          <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
            AI-Powered CRM Platform
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your Customer Relationships with 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> AI Intelligence</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Complete CRM solution with automated lead scoring, sentiment analysis, 
            and intelligent follow-up recommendations powered by advanced AI.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={handleLogin} 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need to grow your business
          </h2>
          <p className="text-gray-600 text-lg">
            Powerful features designed for modern sales teams
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>AI Lead Scoring</CardTitle>
              <CardDescription>
                Automatically analyze and score leads based on behavior, engagement, and profile data
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Real-time insights, conversion funnels, and performance metrics to drive decisions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Smart Email Generation</CardTitle>
              <CardDescription>
                AI-powered email templates and automated follow-up sequences
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Task Automation</CardTitle>
              <CardDescription>
                Intelligent task creation and scheduling based on customer behavior
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>
                Visual pipeline management with AI-powered probability predictions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>Performance Reports</CardTitle>
              <CardDescription>
                Comprehensive reporting with actionable insights and recommendations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* AI Features Highlight */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-6">
              Powered by Advanced AI Technology
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Our AI engine processes customer data, predicts behavior, and automates routine tasks
              so your team can focus on closing deals and building relationships.
            </p>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Sentiment Analysis</h3>
                  <p className="text-blue-100">Understand customer emotions and engagement levels</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Predictive Insights</h3>
                  <p className="text-blue-100">Forecast deal outcomes and identify opportunities</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Automated Workflows</h3>
                  <p className="text-blue-100">Streamline processes with intelligent automation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to revolutionize your sales process?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Join thousands of sales teams already using AI to close more deals
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 CRM Pro. Powered by advanced AI technology.</p>
        </div>
      </footer>
    </div>
  );
}