import React from 'react';
import classNames from 'classnames';
import { FiDisc } from 'react-icons/fi';

export interface ThumbnailProps {
  thumbnail: string | undefined;
  className?: string;
  style?: React.CSSProperties;
}

export const Thumbnail = ({ thumbnail, className, style }: ThumbnailProps) => {
  return (
    <div
      className={classNames(
        'bg-gray-400 shadow-2xl flex items-center justify-center',
        className,
      )}
      style={style}
    >
      {thumbnail ? (
        <img src={thumbnail} alt="Album Cover" className="w-full h-full"></img>
      ) : (
        <FiDisc className="text-gray-600 w-2/5 h-auto" />
      )}
    </div>
  );
};
