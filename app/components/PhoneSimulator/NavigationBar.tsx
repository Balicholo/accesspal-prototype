'use client';

export function NavigationBar({ onHome }: { onHome: () => void }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex h-6 items-center justify-center">
      <button
        type="button"
        aria-label="Go home"
        onClick={onHome}
        className="h-1.5 w-28 rounded-full bg-white/35 transition-colors hover:bg-white/55"
      />
    </div>
  );
}
