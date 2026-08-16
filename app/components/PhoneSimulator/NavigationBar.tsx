'use client';

export function NavigationBar({
  onHome,
  immersive = false,
}: {
  onHome: () => void;
  immersive?: boolean;
}) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-30 flex items-center justify-center ${
        immersive ? 'h-8 pb-[env(safe-area-inset-bottom)]' : 'h-6'
      }`}
    >
      <button
        type="button"
        aria-label="Go home"
        onClick={onHome}
        className="h-1.5 w-28 rounded-full bg-white/35 transition-colors hover:bg-white/55"
      />
    </div>
  );
}
