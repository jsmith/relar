import React, { useEffect } from "react";
import { navigateTo } from "../routes";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { sleep } from "../utils";

export const Invite = () => {
  useEffect(() => {
    // Artificially delay so that it's clear to the users they're being redirected
    sleep(2000).then(() => navigateTo("signup", {}, { fromInvite: "true" }));
  }, []);

  return <LoadingSpinner className="flex-grow" text="Redirecting..." />;
};

export default Invite;
