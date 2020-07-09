import React from "react";
import SVGLoadersReact from "svg-loaders-react";

const { Bars } = SVGLoadersReact;

export const LoadingSpinner = () => {
  return (
    <div className="text-purple-600 flex flex-col items-center justify-center h-full">
      <Bars className="w-12 h-16" />
    </div>
  );
};
