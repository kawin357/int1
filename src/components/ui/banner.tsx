import React from 'react';

interface BannerProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
}

export function Banner({ title, subtitle, backgroundImage }: BannerProps) {
  return (
    <div className="relative w-full h-[300px] mb-8">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-orange-600/80 via-orange-500/70 to-orange-400/60" /> {/* Overlay */}
      <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">{title}</h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-center max-w-2xl text-white drop-shadow-md">{subtitle}</p>
        )}
      </div>
    </div>
  );
}