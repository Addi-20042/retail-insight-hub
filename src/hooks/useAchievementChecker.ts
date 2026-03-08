import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Checks and auto-grants achievements on login and key actions.
 * Runs once per session mount.
 */
export function useAchievementChecker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!user || checkedRef.current) return;
    checkedRef.current = true;

    const checkAndGrant = async () => {
      try {
        // Fetch all achievements and user's earned ones
        const [{ data: achievements }, { data: earned }, { data: uploads }, { data: goals }] = await Promise.all([
          supabase.from('achievements').select('*'),
          supabase.from('user_achievements').select('achievement_id'),
          supabase.from('upload_history').select('id').eq('user_id', user.id),
          supabase.from('goals').select('id, completed').eq('user_id', user.id),
        ]);

        if (!achievements) return;
        const earnedIds = new Set((earned || []).map(e => e.achievement_id));
        const completedGoals = (goals || []).filter(g => g.completed).length;
        const uploadCount = (uploads || []).length;

        const newlyEarned: Array<{ name: string; points: number }> = [];

        for (const ach of achievements) {
          if (earnedIds.has(ach.id)) continue;

          let shouldGrant = false;

          switch (ach.requirement_type) {
            case 'count':
              if (ach.category === 'onboarding' && ach.name === 'First Login') {
                shouldGrant = true; // They're logged in right now
              }
              if (ach.category === 'data' && ach.name === 'Data Pioneer') {
                shouldGrant = uploadCount >= ach.requirement_value;
              }
              if (ach.category === 'goals' && ach.name === 'Goal Setter') {
                shouldGrant = (goals || []).length >= ach.requirement_value;
              }
              if (ach.category === 'goals' && ach.name === 'Goal Crusher') {
                shouldGrant = completedGoals >= ach.requirement_value;
              }
              break;
          }

          if (shouldGrant) {
            const { error } = await supabase.from('user_achievements').insert({
              user_id: user.id,
              achievement_id: ach.id,
            });
            if (!error) {
              newlyEarned.push({ name: ach.name, points: ach.points });
            }
          }
        }

        // Show toast popups for newly earned achievements
        for (const earned of newlyEarned) {
          toast.success(`🏆 Achievement Unlocked: ${earned.name}!`, {
            description: `+${earned.points} points earned`,
            duration: 5000,
          });
        }

        if (newlyEarned.length > 0) {
          queryClient.invalidateQueries({ queryKey: ['user_achievements'] });
          queryClient.invalidateQueries({ queryKey: ['achievements'] });
        }
      } catch (err) {
        console.error('Achievement check failed:', err);
      }
    };

    // Small delay to let the session settle
    const timeout = setTimeout(checkAndGrant, 1500);
    return () => clearTimeout(timeout);
  }, [user, queryClient]);
}
