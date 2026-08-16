'use client';

export function Waveform({
  active,
  speaking = false,
}: {
  active: boolean;
  speaking?: boolean;
}) {
  const bars = [8, 16, 24, 18, 12, 20, 10, 22, 14];

  return (
    <div className="flex h-8 items-end justify-center gap-1" aria-hidden="true">
      {bars.map((height, index) => (
        <span
          key={index}
          className="w-1 rounded-full bg-[#e4b56a]"
          style={{
            height: active ? height : 6,
            animation: active
              ? `ap-wave ${speaking ? 0.7 : 1.1}s ease-in-out ${index * 0.08}s infinite`
              : 'none',
            opacity: active ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
}
