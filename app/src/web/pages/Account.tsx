import React, { useState, useCallback } from "react";
import { useDefinedUser } from "../../auth";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { ProgressBar } from "../../components/ProgressBar";
import { useUserDataDoc } from "../../queries/user";
import { Button, ButtonProps } from "../../components/Button";
import { BlockAlert } from "../../components/BlockAlert";
import { Result, ok } from "neverthrow";
import { useConfirmPassword } from "../../confirm-password";
import { useConfirmAction } from "../../confirm-actions";
import { resetPassword, changeEmail, deleteAccount } from "../../auth";
import { LOCAL_CACHE_TEXT } from "../../text";
import { resetDB } from "../../db";
import { Input } from "../../components/Input";

export const OverviewSection = ({
  title,
  subtitle,
  actionText,
  action,
  theme,
  children,
}: {
  title: string;
  subtitle: string;
  actionText: string;
  action: () => Promise<Result<string | undefined, string>>;
  children?: React.ReactNode;
  theme?: ButtonProps["theme"];
}) => {
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  return (
    <div>
      <h2 className="font-bold mt-4">{title}</h2>
      <p className="text-xs text-gray-700 dark:text-gray-400">{subtitle}</p>
      {children}
      {(info || error) && (
        <BlockAlert className="mt-2" type={info ? "info" : "error"}>
          {info || error}
        </BlockAlert>
      )}
      <Button
        className="mt-2"
        theme={theme}
        label={`${actionText} →`}
        onClick={async () => {
          const result = await action();
          setError("");
          setInfo("");
          result.match(
            (infoString) => infoString && setInfo(infoString),
            (errorString) => setError(errorString),
          );
        }}
      />
    </div>
  );
};

export const Account = () => {
  const user = useDefinedUser();
  const userData = useUserDataDoc();
  const [email, setEmail] = useState("");
  const { confirmPassword } = useConfirmPassword();
  const { confirmAction } = useConfirmAction();

  // const renderAction = (action: UploadAction) => {
  //   return (
  //     <div className="flex justify-between">
  //       <div>
  //         <div>{action.fileName}</div>
  //         <div>{fmtToDate(action.createdAt)}</div>
  //       </div>

  //       <div>
  //         <div className="">{action.status}</div>
  //         <div className="">{action.message}</div>
  //       </div>
  //     </div>
  //   );
  // };

  return (
    <div className="mx-6">
      <Tabs className="max-w-2xl m-auto my-5 sm:my-10 p-4 rounded bg-white dark:bg-gray-900 shadow-lg flex">
        <TabList className="divide-y dark:divide-gray-800 flex-shrink-0">
          <Tab
            selectedClassName="bg-purple-100 dark:bg-gray-800"
            className="cursor-pointer py-2 px-2 text-gray-800 dark:text-gray-200"
          >
            Account Overview
          </Tab>
          {/* <Tab selectedClassName="bg-purple-100 dark:bg-gray-800" className="cursor-pointer py-2 px-2 text-gray-800 dark:text-gray-200">
            Account History
          </Tab> */}
          <Tab
            selectedClassName="bg-purple-100 dark:bg-gray-800"
            className="cursor-pointer py-2 px-2 text-gray-800 dark:text-gray-200"
          >
            Billing
          </Tab>
          <Tab
            selectedClassName="bg-purple-100 dark:bg-gray-800"
            className="cursor-pointer py-2 px-2 text-gray-800 dark:text-gray-200"
          >
            Invoices
          </Tab>
        </TabList>
        <div className="w-4 flex-shrink-0" />
        <TabPanel className="text-gray-800 dark:text-gray-200" selectedClassName="flex-grow">
          <h1 className="text-2xl">Account Overview</h1>
          <p className="text-xs text-gray-700 dark:text-gray-400">
            You are currently logged in as <span className="font-bold">{user.email}</span>
          </p>
          <OverviewSection
            title="Local Cache"
            // TODO test
            subtitle={LOCAL_CACHE_TEXT.replace(/<br>/g, "")}
            actionText="Clear Local Cache"
            action={async () => {
              resetDB(user.uid);
              return ok("Successfully cleared local cache. Reloading...");
            }}
          />
          <OverviewSection
            title="Change Email"
            subtitle="We'll send you a confirmation email after submission to make sure you didn't make a mistake!"
            actionText="Change Email"
            action={() => changeEmail(user, email, confirmPassword)}
          >
            <div className="flex items-baseline mt-3 flex-col space-y-1">
              {/* TODO test */}
              <Input value={email} onChange={setEmail} />
            </div>
          </OverviewSection>
          <OverviewSection
            title="Reset Your Password"
            subtitle={`After clicking "CHANGE PASSWORD" we'll send you a link by email to reset your password.`}
            actionText="Change Password"
            action={() => resetPassword(user)}
          />
          <OverviewSection
            title="Delete Your Account"
            subtitle={`Want to delete your account and all your music data? This process is irreversible.`}
            actionText="Delete Account"
            theme="red"
            action={async () => {
              const confirmedAction = await confirmAction({
                title: "Delete Account",
                confirmText: "Delete",
                subtitle:
                  "Are you sure you want to deactivate your account? All of your data (including your music) will be permanently removed. This action cannot be undone.",
                confirmEmail: true,
              });

              if (!confirmedAction) {
                return ok(undefined);
              }

              return await deleteAccount(user, confirmPassword);
            }}
          />
        </TabPanel>
        {/* <TabPanel className="text-gray-800 dark:text-gray-200" selectedClassName="flex-grow">
          <List itemHeight={48} itemFn={renderAction} attrList={} />
        </TabPanel> */}
        <TabPanel
          className="text-gray-800 dark:text-gray-200 space-y-2"
          selectedClassName="flex-grow"
        >
          <h1 className="text-2xl">Billing</h1>
          <div className="rounded bg-blue-100 text-blue-700 p-3 text-sm">
            <span className="font-bold">You are currently enjoying the beta service for free.</span>{" "}
            This allows you to upload 500 songs and stream to your devices. Once premium accounts
            are available you will be able to upgrade.
          </div>
          <div className="space-y-1">
            <h2 className="text-xl">Limits</h2>
            <div className="w-full space-y-1">
              <div className="flex items-baseline">
                <h2>Songs</h2>
                <div className="flex-grow" />
                <div className="text-xs">{`${userData?.songCount ?? 0} / ${500} Uploaded`}</div>
              </div>
              <ProgressBar
                value={userData?.songCount ?? 0}
                maxValue={500}
                foregroundClassName="bg-purple-700"
              />
            </div>
          </div>
          {/* <div className="space-y-1">
            <h2 className="text-xl">Plan</h2>
            <div>
              <div className="rounded border-blue-600 border bg-blue-200 w-48 p-2">
                <div className="flex items-center text-blue-700 space-x-2">
                  <FaRegCheckCircle className="w-5 h-5" />
                  <span className="text-xl">Free</span>
                </div>
                <div className="text-xs text-blue-600">
                  500 Songs • Streaming • Automatic Backups • Song Editor • Album Editor
                </div>
              </div>
            </div>
          </div> */}
        </TabPanel>
        <TabPanel className="text-gray-800 dark:text-gray-200" selectedClassName="flex-grow">
          <h1 className="text-2xl">Invoices</h1>
          <h3 className="text-gray-700 dark:text-gray-400 font-bold">No Invoices Found</h3>
          <p className="text-sm text-gray-500">
            If you subscribe to the premium features, your invoices will appear here.
          </p>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default Account;
