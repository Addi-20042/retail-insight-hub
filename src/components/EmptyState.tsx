import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  showUploadAction?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, showUploadAction = true }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        {icon || <Database className="w-8 h-8 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {showUploadAction && (
        <Button onClick={() => navigate('/dashboard/upload')} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Sales Data
        </Button>
      )}
    </div>
  );
};
