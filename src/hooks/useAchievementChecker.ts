import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Checks and auto-grants achievements.
 * Exposes `recheckAchievements` so any action can trigger a recheck.
 */
export function useAchievementChecker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const checkedRef = useRef(false);

  const checkAndGrant = useCallback(async () => {
    if (!user) return;

    try {
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
              shouldGrant = true;
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

      for (const item of newlyEarned) {
        toast.success(`🏆 Achievement Unlocked: ${item.name}!`, {
          description: `+${item.points} points earned`,
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
  }, [user, queryClient]);

  // Auto-check on first mount
  useEffect(() => {
    if (!user || checkedRef.current) return;
    checkedRef.current = true;
    const timeout = setTimeout(checkAndGrant, 1500);
    return () => clearTimeout(timeout);
  }, [user, checkAndGrant]);

  return { recheckAchievements: checkAndGrant };
}
