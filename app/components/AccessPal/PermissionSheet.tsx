'use client';

import { useT } from '../../hooks/useT';
import type { PermissionRequest } from '../../lib/phone/types';

export function PermissionSheet({
  permission,
  onAllow,
  onCancel,
}: {
  permission: PermissionRequest;
  onAllow: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="w-full rounded-3xl bg-[#1c1c1e] p-5 text-center text-white shadow-2xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#e4b56a]">
          AccessPal
        </p>
        <h3 className="mt-2 text-lg font-semibold">{permission.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          {permission.body}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-white/10 py-2.5 text-sm"
          >
            {t('permission.cancel')}
          </button>
          <button
            type="button"
            onClick={onAllow}
            className="rounded-full bg-[#e4b56a] py-2.5 text-sm font-medium text-[#1a140c]"
          >
            {t('permission.allow')}
          </button>
        </div>
      </div>
    </div>
  );
}
