import React, { useState } from 'react';
import { 
  Target, Trophy, Plus, CheckCircle2, Circle, Sparkles, 
  TrendingUp, Users, ShoppingCart, Bell, FileText, Zap, Upload, Trash2
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAchievementRecheck } from '@/components/layout/DashboardLayout';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { recheckAchievements } = useAchievementRecheck();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', targetValue: 100, unit: '%', category: 'general' });

  // Fetch goals from Supabase
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch achievements from Supabase
  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user earned achievements
  const { data: earnedAchievements = [] } = useQuery({
    queryKey: ['user_achievements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const earnedIds = new Set(earnedAchievements.map((ea: any) => ea.achievement_id));

  // Create goal mutation
  const createGoal = useMutation({
    mutationFn: async (goal: typeof newGoal) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        title: goal.title,
        description: goal.description || null,
        target_value: goal.targetValue,
        current_value: 0,
        unit: goal.unit,
        category: goal.category,
        completed: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setDialogOpen(false);
      setNewGoal({ title: '', description: '', targetValue: 100, unit: '%', category: 'general' });
      toast.success('Goal created!');
      recheckAchievements();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Update goal progress mutation
  const updateGoalProgress = useMutation({
    mutationFn: async ({ id, currentValue, targetValue }: { id: string; currentValue: number; targetValue: number }) => {
      const completed = currentValue >= targetValue;
      const { error } = await supabase
        .from('goals')
        .update({ 
          current_value: currentValue, 
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      recheckAchievements();
    },
  });

  // Toggle goal complete
  const toggleGoal = useMutation({
    mutationFn: async ({ id, completed, targetValue }: { id: string; completed: boolean; targetValue: number }) => {
      const { error } = await supabase
        .from('goals')
        .update({ 
          completed: !completed,
          current_value: !completed ? targetValue : 0,
          completed_at: !completed ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (!vars.completed) toast.success('🎉 Goal completed!');
      recheckAchievements();
    },
  });

  // Delete goal mutation
  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted');
    },
  });

  const totalPoints = earnedAchievements.reduce((sum: number, ea: any) => {
    const ach = achievements.find((a: any) => a.id === ea.achievement_id);
    return sum + (ach?.points || 0);
  }, 0);
  const earnedCount = earnedAchievements.length;
  const completedGoals = goals.filter((g: any) => g.completed).length;

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
                <p className="text-2xl font-bold text-foreground">{completedGoals}/{goals.length}</p>
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
                    placeholder="e.g., Increase monthly revenue by 20%"
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
                      placeholder="e.g., %, ₹, uploads"
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
                <Button 
                  onClick={() => createGoal.mutate(newGoal)} 
                  className="w-full"
                  disabled={createGoal.isPending || !newGoal.title.trim()}
                >
                  {createGoal.isPending ? 'Creating...' : 'Create Goal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {goalsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-border animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-muted mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-muted rounded" />
                      <div className="h-3 w-64 bg-muted rounded" />
                      <div className="h-2 w-full bg-muted rounded-full mt-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No goals yet</p>
              <p className="text-sm text-muted-foreground">Create your first goal to start tracking progress</p>
            </div>
          ) : (
            goals.map((goal: any) => {
              const progress = goal.target_value > 0 ? (Number(goal.current_value) / Number(goal.target_value)) * 100 : 0;
              return (
                <div 
                  key={goal.id}
                  className={`p-4 rounded-lg border transition-all ${goal.completed ? 'bg-success/5 border-success/30' : 'border-border hover:border-primary/30'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      <button onClick={() => toggleGoal.mutate({ id: goal.id, completed: goal.completed, targetValue: Number(goal.target_value) })}>
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{goal.category}</Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive"
                        onClick={() => { if (confirm('Delete this goal?')) deleteGoal.mutate(goal.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="ml-8">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <div className="flex items-center gap-2">
                        {!goal.completed && (
                          <Input
                            type="number"
                            className="h-6 w-16 text-xs text-center"
                            value={Number(goal.current_value)}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              updateGoalProgress.mutate({ id: goal.id, currentValue: val, targetValue: Number(goal.target_value) });
                            }}
                          />
                        )}
                        <span className="font-medium">{Number(goal.current_value)}/{Number(goal.target_value)} {goal.unit}</span>
                      </div>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>
                </div>
              );
            })
          )}
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
          {achievements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p>No achievements configured yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {achievements.map((achievement: any) => {
                const isEarned = earnedIds.has(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`relative p-4 rounded-xl border text-center transition-all ${
                      isEarned 
                        ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' 
                        : 'bg-muted/30 border-border opacity-60'
                    }`}
                  >
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                      isEarned ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {iconMap[achievement.icon] || <Trophy className="h-5 w-5" />}
                    </div>
                    <p className="font-medium text-sm text-foreground">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                    <Badge className="mt-2" variant={isEarned ? "default" : "secondary"}>
                      {achievement.points} pts
                    </Badge>
                    {isEarned && (
                      <div className="absolute -top-1 -right-1">
                        <CheckCircle2 className="h-5 w-5 text-success fill-success/20" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoalsAchievements;
