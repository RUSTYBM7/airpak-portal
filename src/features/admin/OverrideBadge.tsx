/**
 * Override Badge - Shows when content has admin override
 */

import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { useAdminOverrides } from '../../hooks/useAdminOverrides';

interface OverrideBadgeProps {
  targetType: string;
  targetId: string;
  showReason?: boolean;
  children: React.ReactNode;
}

export const OverrideBadge: React.FC<OverrideBadgeProps> = ({ targetType, targetId, showReason = false, children }) => {
  const { overrides, hasOverride } = useAdminOverrides(targetType, targetId);

  if (!hasOverride()) {
    return <>{children}</>;
  }

  const override = overrides[0];

  return (
    <div className="relative">
      {children}
      <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 bg-yellow-500 text-black rounded-full text-xs font-medium shadow-lg">
        <Shield size={12} />
        Override
      </div>
      {showReason && override?.reason && (
        <div className="mt-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-400">
          <AlertTriangle size={12} className="inline mr-1" />
          {override.reason}
        </div>
      )}
    </div>
  );
};

export default OverrideBadge;
