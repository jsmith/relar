import React, { useState, useEffect } from "react";
import { Button } from "../components/Button";
import { auth } from "../firebase";
import { useRouter } from "react-tiniest-router";
import { routes } from "../routes";
import { useUser } from "/@/auth";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const { goTo } = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      goTo(routes.songs);
    }
  }, []);

  const login = async () => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      goTo(routes.songs);
    } catch (e) {
      console.error(e);
      setError("Invalid credentials. Please try again!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <header>
        <h1 className="text-4xl">Relar</h1>
      </header>
      <div className="shadow-xl rounded p-4 bg-white mt-5">
        <form>
          <label className="block">
            <span className="text-gray-700">Email</span>
            <input
              type="email"
              className="form-input mt-1 block w-full"
              placeholder="john@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block mt-3">
            <span className="text-gray-700">Password</span>
            <input
              type="password"
              className="form-input mt-1 block w-full"
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <div className="bg-red-300 text-red-700 text-center p-4 my-2">{error}</div>}
          <Button
            label="Login"
            className="w-full mt-5"
            onClick={(e) => {
              e.preventDefault();
              login();
            }}
          />
        </form>
      </div>
    </div>
  );
};
