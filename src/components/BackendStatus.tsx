import React from 'react';
import { Server, ServerOff } from 'lucide-react';
import { useHealthCheck } from '@/hooks/useApiData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BackendStatus: React.FC = () => {
  const { data: health, isLoading } = useHealthCheck();
  
  const isConnected = health?.status === 'ok';
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
        <span className="text-xs text-muted-foreground">Checking...</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-help ${
              isConnected 
                ? 'bg-success/10 text-success' 
                : 'bg-muted/50 text-muted-foreground'
            }`}
          >
            {isConnected ? (
              <Server className="w-3.5 h-3.5" />
            ) : (
              <ServerOff className="w-3.5 h-3.5" />
            )}
            <span className="text-xs font-medium">
              {isConnected ? 'Backend Connected' : 'Backend Offline'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {isConnected ? (
            <div className="space-y-1">
              <p className="font-medium">Flask Backend Connected</p>
              <p className="text-xs text-muted-foreground">
                Database: {health?.database ? '✓' : '✗'} | 
                Models: {health?.models_loaded ? '✓' : '✗'}
              </p>
              {health?.version && (
                <p className="text-xs text-muted-foreground">Version: {health.version}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-medium">Backend Offline</p>
              <p className="text-xs text-muted-foreground">
                Flask backend not detected.
              </p>
              <p className="text-xs text-muted-foreground">
                Start Flask server at localhost:5000 to connect.
              </p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BackendStatus;
