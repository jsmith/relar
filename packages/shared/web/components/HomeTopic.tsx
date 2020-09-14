import React from "react";
import { Link } from "./Link";
import type { RouteType, RouterStateType } from "@graywolfai/react-tiniest-router";
import classNames from "classnames";

export interface HomeTopicProps {
  title: string;
  subTitle?: string;
  children: JSX.Element[];
  route: RouteType;
  params?: RouterStateType["params"];
  queryParams?: RouterStateType["queryParams"];
  wrapperClassName?: string;
}

export const HomeTopic = ({
  title,
  subTitle,
  children,
  route,
  params,
  queryParams,
  wrapperClassName,
}: HomeTopicProps) => {
  return (
    <div className="space-y-1 lg:space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-gray-800 text-xl md:text-2xl leading-tight">{title}</div>
          <div className="text-gray-600 text-xs">{subTitle}</div>
        </div>
        <Link
          label="See All →"
          className="uppercase text-gray-700 text-sm md:text-base hover:text-purple-700 focus:text-purple-700"
          route={route}
          params={params}
          queryParams={queryParams}
        />
      </div>

      <div className={classNames("flex space-x-3 overflow-x-auto", wrapperClassName)}>
        {children.length === 0 ? <div>NOTHING</div> : children}
      </div>
    </div>
  );
};
