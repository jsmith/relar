import React from "react";
import { ThumbnailCard, ThumbnailCardProps } from "../components/ThumbnailCard";
import { Link } from "./Link";
import { RouteType, RouterStateType } from "react-tiniest-router/dist/types";

export interface HomeTopicProps {
  title: string;
  subTitle?: string;
  children: JSX.Element[];
  route: RouteType;
  params?: RouterStateType["params"];
  queryParams?: RouterStateType["queryParams"];
}

export const HomeTopic = ({
  title,
  subTitle,
  children,
  route,
  params,
  queryParams,
}: HomeTopicProps) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-gray-800 text-2xl leading-tight">{title}</div>
          <div className="text-gray-600 text-xs">{subTitle}</div>
        </div>
        <Link
          label="See All →"
          className="uppercase text-gray-700 hover:text-purple-700 focus:text-purple-700"
          route={route}
          params={params}
          queryParams={queryParams}
        />
      </div>

      <div className="flex space-x-3 overflow-x-auto">
        {children.length === 0 ? <div>NOTHING</div> : children}
      </div>
    </div>
  );
};
