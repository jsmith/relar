import React from "react";
import { Link } from "./Link";
import type { RouteType, RouterStateType } from "@graywolfai/react-tiniest-router";
import classNames from "classnames";

export interface HomeTopicProps {
  title: string;
  subTitle?: string;
  children: JSX.Element;
  route: RouteType;
  params?: RouterStateType["params"];
  queryParams?: RouterStateType["queryParams"];
  wrapperClassName?: string;
  textClassName?: string;
  emptyText?: React.ReactNode;
}

export const HomeTopic = ({
  title,
  subTitle,
  children,
  route,
  params,
  queryParams,
  wrapperClassName,
  textClassName,
  emptyText,
}: HomeTopicProps) => {
  return (
    <div className="space-y-2 lg:space-y-3">
      <div className={classNames("flex justify-between items-center", textClassName)}>
        <div>
          <div className="text-gray-800 text-xl md:text-2xl leading-tight">{title}</div>
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

      <div className={wrapperClassName} style={{ minHeight: "10px" }}>
        {children}
      </div>
    </div>
  );
};
