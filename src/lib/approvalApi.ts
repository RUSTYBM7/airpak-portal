import { ApprovalQueueItem, ApprovalStatus } from '../features/approval/types';

export const fetchApprovalQueue = async (): Promise<ApprovalQueueItem[]> => {
  // In a real app, this would be a Supabase call
  // For now, it relies on Zustand mock data
  return [];
};

export const updateApprovalStatus = async (id: string, status: ApprovalStatus, notes?: string): Promise<void> => {
  // Mock API call
  return new Promise(resolve => setTimeout(resolve, 500));
};
