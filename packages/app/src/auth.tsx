import React, { createContext, useEffect, useState, useContext } from "react";
import { auth } from "~/firebase";

export const UserContext = createContext<{
  user: firebase.User | undefined;
  loading: boolean;
}>({ user: undefined, loading: true });

export const UserProvider = (props: React.Props<{}>) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<firebase.User>();

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      console.log("user", user);
      setUser(user ?? undefined);

      if (loading) {
        setLoading(false);
      }
    });
  }, [loading]);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {props.children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};

export const useDefinedUser = () => {
  const { user } = useUser();

  if (!user) {
    throw Error("User is undefined! This should not happen.");
  }

  return user;
};
