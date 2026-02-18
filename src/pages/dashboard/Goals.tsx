import React from 'react';
import { motion } from 'framer-motion';
import GoalsAchievements from '@/components/GoalsAchievements';
import ScheduledReports from '@/components/ScheduledReports';
import { PageHeader } from '@/components/ui/animated-container';

const Goals: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Goals & Achievements" description="Track your progress and unlock rewards" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <GoalsAchievements />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <ScheduledReports />
      </motion.div>
    </div>
  );
};

export default Goals;
