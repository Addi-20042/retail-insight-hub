import React, { useState } from 'react';
import { 
  Target, Trophy, Plus, CheckCircle2, Circle, Sparkles, 
  TrendingUp, Users, ShoppingCart, Bell, FileText, Zap, Upload
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Goal {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: string;
  dueDate?: Date;
  completed: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned: boolean;
  earnedAt?: Date;
}

const iconMap: Record<string, React.ReactNode> = {
  'sparkles': <Sparkles className="h-5 w-5" />,
  'upload': <Upload className="h-5 w-5" />,
  'trending-up': <TrendingUp className="h-5 w-5" />,
  'users': <Users className="h-5 w-5" />,
  'shopping-cart': <ShoppingCart className="h-5 w-5" />,
  'bell': <Bell className="h-5 w-5" />,
  'file-text': <FileText className="h-5 w-5" />,
  'target': <Target className="h-5 w-5" />,
  'trophy': <Trophy className="h-5 w-5" />,
  'zap': <Zap className="h-5 w-5" />,
};

const GoalsAchievements: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const stored = localStorage.getItem('retailmind_goals');
    return stored ? JSON.parse(stored) : [
      { id: '1', title: 'Generate 5 Forecasts', description: 'Create sales forecasts to unlock insights', targetValue: 5, currentValue: 2, unit: 'forecasts', category: 'analytics', completed: false },
      { id: '2', title: 'Upload First Dataset', description: 'Import your sales data for analysis', targetValue: 1, currentValue: 0, unit: 'uploads', category: 'data', completed: false },
      { id: '3', title: 'Resolve 3 Alerts', description: 'Address smart alerts in your dashboard', targetValue: 3, currentValue: 1, unit: 'alerts', category: 'operations', completed: false },
    ];
  });

  const [achievements] = useState<Achievement[]>([
    { id: '1', name: 'First Login', description: 'Complete your first login', icon: 'sparkles', category: 'onboarding', points: 10, earned: true, earnedAt: new Date() },
    { id: '2', name: 'Data Pioneer', description: 'Upload your first dataset', icon: 'upload', category: 'data', points: 25, earned: false },
    { id: '3', name: 'Forecast Master', description: 'Generate 10 sales forecasts', icon: 'trending-up', category: 'analytics', points: 50, earned: false },
    { id: '4', name: 'Segment Explorer', description: 'Analyze 5 customer segments', icon: 'users', category: 'analytics', points: 40, earned: false },
    { id: '5', name: 'Basket Analyst', description: 'Run 3 market basket analyses', icon: 'shopping-cart', category: 'analytics', points: 30, earned: false },
    { id: '6', name: 'Alert Guardian', description: 'Resolve 10 smart alerts', icon: 'bell', category: 'operations', points: 35, earned: false },
    { id: '7', name: 'Report Builder', description: 'Export 5 PDF reports', icon: 'file-text', category: 'reporting', points: 25, earned: false },
    { id: '8', name: 'Goal Setter', description: 'Create your first goal', icon: 'target', category: 'goals', points: 15, earned: true, earnedAt: new Date() },
    { id: '9', name: 'Goal Crusher', description: 'Complete 5 goals', icon: 'trophy', category: 'goals', points: 75, earned: false },
    { id: '10', name: 'Power User', description: 'Use the app for 7 consecutive days', icon: 'zap', category: 'engagement', points: 100, earned: false },
  ]);

  const [newGoal, setNewGoal] = useState({ title: '', description: '', targetValue: 100, unit: '%', category: 'general' });
  const [dialogOpen, setDialogOpen] = useState(false);

  const totalPoints = achievements.filter(a => a.earned).reduce((sum, a) => sum + a.points, 0);
  const earnedCount = achievements.filter(a => a.earned).length;

  const handleAddGoal = () => {
    if (!newGoal.title.trim()) return;
    
    const goal: Goal = {
      id: `goal_${Date.now()}`,
      ...newGoal,
      currentValue: 0,
      completed: false,
    };
    
    const updated = [...goals, goal];
    setGoals(updated);
    localStorage.setItem('retailmind_goals', JSON.stringify(updated));
    setNewGoal({ title: '', description: '', targetValue: 100, unit: '%', category: 'general' });
    setDialogOpen(false);
    toast.success('Goal created!');
  };

  const toggleGoalComplete = (id: string) => {
    const updated = goals.map(g => {
      if (g.id === id) {
        const completed = !g.completed;
        if (completed) toast.success('🎉 Goal completed!');
        return { ...g, completed, currentValue: completed ? g.targetValue : g.currentValue };
      }
      return g;
    });
    setGoals(updated);
    localStorage.setItem('retailmind_goals', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalPoints}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card bg-gradient-to-br from-success/10 to-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success/20">
                <Sparkles className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{earnedCount}/{achievements.length}</p>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card bg-gradient-to-br from-warning/10 to-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-warning/20">
                <Target className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{goals.filter(g => g.completed).length}/{goals.length}</p>
                <p className="text-sm text-muted-foreground">Goals Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Section */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Active Goals
            </CardTitle>
            <CardDescription>Track your progress and stay motivated</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Goal Title</Label>
                  <Input 
                    value={newGoal.title} 
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="e.g., Generate 10 forecasts"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input 
                    value={newGoal.description} 
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Add more details..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Value</Label>
                    <Input 
                      type="number"
                      value={newGoal.targetValue} 
                      onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input 
                      value={newGoal.unit} 
                      onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                      placeholder="e.g., %, forecasts, uploads"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newGoal.category} onValueChange={(v) => setNewGoal({ ...newGoal, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="data">Data</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="reporting">Reporting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddGoal} className="w-full">Create Goal</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map((goal) => (
            <div 
              key={goal.id}
              className={`p-4 rounded-lg border transition-all ${goal.completed ? 'bg-success/5 border-success/30' : 'border-border hover:border-primary/30'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleGoalComplete(goal.id)}>
                    {goal.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    )}
                  </button>
                  <div>
                    <p className={`font-medium ${goal.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {goal.title}
                    </p>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline">{goal.category}</Badge>
              </div>
              <div className="ml-8">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{goal.currentValue}/{goal.targetValue} {goal.unit}</span>
                </div>
                <Progress value={(goal.currentValue / goal.targetValue) * 100} className="h-2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
          <CardDescription>Unlock badges as you explore RetailMind</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`relative p-4 rounded-xl border text-center transition-all ${
                  achievement.earned 
                    ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' 
                    : 'bg-muted/30 border-border opacity-60'
                }`}
              >
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  achievement.earned ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {iconMap[achievement.icon] || <Trophy className="h-5 w-5" />}
                </div>
                <p className="font-medium text-sm text-foreground">{achievement.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                <Badge className="mt-2" variant={achievement.earned ? "default" : "secondary"}>
                  {achievement.points} pts
                </Badge>
                {achievement.earned && (
                  <div className="absolute -top-1 -right-1">
                    <CheckCircle2 className="h-5 w-5 text-success fill-success/20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoalsAchievements;
