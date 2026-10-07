import React, { useState } from 'react';

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  className: string;
  fallbackClassName?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt,
  className,
  fallbackClassName = ''
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasImage = Boolean(src) && failedSrc !== src;

  if (hasImage) {
    return (
      <img
        src={src!}
        alt={alt}
        className={className}
        onError={() => setFailedSrc(src || null)}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={alt}
      className={`${className} flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-100 font-bold`}
    >
      <span className={fallbackClassName}>{alt.trim().charAt(0).toUpperCase() || 'U'}</span>
    </span>
  );
};
