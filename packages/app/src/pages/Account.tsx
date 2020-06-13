import React from "react";
import { useDefinedUser } from "/@/auth";

export const Account = () => {
  const user = useDefinedUser();

  return (
    <div>
      <h1>Account Overview</h1>
      <div className="flex">
        <div className="flex">
          <label>Email</label>
          <div className="flex-grow" />
          <input></input>
        </div>
      </div>
    </div>
  );
};
