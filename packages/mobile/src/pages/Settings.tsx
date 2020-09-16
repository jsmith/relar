import React from "react";
import firebase from "firebase/app";
import { useDefinedUser } from "../shared/web/auth";
import { Button } from "../shared/web/components/Button";

export const Settings = () => {
  const user = useDefinedUser();
  return (
    <div className="mx-5">
      <div className="text-sm">{`Signed in as ${user.email}`}</div>
      <Button className="w-full" label="Logout" invert onClick={() => firebase.auth().signOut()} />
    </div>
  );
};
