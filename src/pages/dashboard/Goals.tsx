import React from 'react';
import GoalsAchievements from '@/components/GoalsAchievements';
import ScheduledReports from '@/components/ScheduledReports';

const Goals: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Goals & Achievements</h1>
        <p className="text-muted-foreground mt-1">Track your progress and unlock rewards</p>
      </div>

      <GoalsAchievements />
      
      <ScheduledReports />
    </div>
  );
};

export default Goals;
