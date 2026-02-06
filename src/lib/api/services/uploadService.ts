import { uploadClient } from '../client';
import { ENDPOINTS } from '../config';
import type { UploadResponse } from '../types';

export const uploadService = {
  // Upload CSV file to backend
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return await uploadClient<UploadResponse>(ENDPOINTS.upload, formData);
  },
};
