import React from "react";
import { ThumbnailCard, ThumbnailCardProps } from "../components/ThumbnailCard";

export interface HomeTopicProps {
  title: string;
  subTitle?: string;
  children: JSX.Element[];
}

export const HomeTopic = ({ title, subTitle, children }: HomeTopicProps) => {
  return (
    <div>
      <div className="text-gray-800 text-2xl">{title}</div>
      <div className="text-gray-600 text-xs">{subTitle}</div>
      <div className="flex space-x-3">{children.length === 0 ? <div>NOTHING</div> : children}</div>
    </div>
  );
};
