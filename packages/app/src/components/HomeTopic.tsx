import React from "react";
import { ThumbnailCard, ThumbnailCardProps } from "/@/components/ThumbnailCard";

export interface HomeTopicProps {
  title: string;
  subTitle?: string;
  children?: React.ReactNode;
}

export const HomeTopic = ({ title, subTitle, children }: HomeTopicProps) => {
  return (
    <div>
      <div className="text-gray-800 text-2xl">{title}</div>
      <div className="text-gray-600 text-xs">{subTitle}</div>
      <div
        className="overflow-hidden grid grid-rows-1 gap-4"
        style={{
          gridAutoRows: 0,
          gridTemplateColumns: `repeat(auto-fill,minmax(164px,1fr))`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
