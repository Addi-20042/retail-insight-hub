import { apiClient } from '../client';
import { ENDPOINTS } from '../config';
import type { SegmentationResponse } from '../types';

export const segmentationService = {
  // Get customer segments from backend
  getSegments: async (): Promise<SegmentationResponse> => {
    return await apiClient<SegmentationResponse>(ENDPOINTS.segments);
  },
};
