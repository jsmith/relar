import supertest from "supertest";
import { deleteCollection } from "./utils";
import { betaSignups } from "./shared/node/utils";
import { testFunctions } from "./configure-tests";
import { noOp } from "./test-utils";
import { admin } from "./admin";

import { app } from "./auth";
import { BetaAPI, BetaSignup } from "./shared/universal/types";
import { test } from "uvu";
import assert from "uvu/assert";

const firestore = admin.firestore();
const auth = admin.auth();
noOp(testFunctions);

test.before.each(async () => {
  await deleteCollection(await firestore.collection("beta_signups"));
  try {
    const user = await auth.getUserByEmail("test@user.com");
    await auth.deleteUser(user.uid);
  } catch (e) {
    // An error likely means that the user doesn't exist
  }
});

const createBody = (
  body?: Partial<BetaAPI["/beta-signup"]["POST"]["body"]>,
): BetaAPI["/beta-signup"]["POST"]["body"] => {
  return {
    firstName: body?.firstName ?? "Tester",
    email: body?.email ?? "test@user.com",
    device: body?.device ?? "ios",
  };
};

// describe.only("auth", () => {
test("can successfully sign up a user by email", async () => {
  await supertest(app).post("/beta-signup").send(createBody()).expect(200, {
    type: "success",
  });

  await betaSignups(firestore)
    .doc("test@user.com")
    .get()
    .then((data) =>
      assert.equal(data.data(), {
        firstName: "Tester",
        email: "test@user.com",
        createdAt: data.data().createdAt,
        device: "ios",
      }),
    );
});

test("prevents two signups", async () => {
  await supertest(app).post("/beta-signup").send(createBody());
  await supertest(app).post("/beta-signup").send(createBody()).expect(200, {
    type: "error",
    code: "already-on-list",
  });
});

test("prevents bad emails", async () => {
  await supertest(app)
    .post("/beta-signup")
    .send(createBody({ email: "@user.com" }))
    .expect(200, {
      type: "error",
      code: "invalid-email",
    });

  await supertest(app)
    .post("/beta-signup")
    .send(createBody({ email: "" }))
    .expect(200, {
      type: "error",
      code: "invalid-email",
    });
});

test("prevents bad names", async () => {
  await supertest(app)
    .post("/beta-signup")
    .send(createBody({ firstName: "" }))
    .expect(200, {
      type: "error",
      code: "invalid-name",
    });
});

test("prevents bad devices", async () => {
  await supertest(app)
    .post("/beta-signup")
    // @ts-expect-error
    .send(createBody({ device: "sldsks" }))
    .expect(200, {
      type: "error",
      code: "invalid-device",
    });
});

test("prevents a user with an account from signing up", async () => {
  await auth.createUser({
    email: "test@user.com",
    password: "123456",
    emailVerified: true,
  });

  await supertest(app)
    .post("/beta-signup")
    .send(createBody())
    .expect(200, { type: "error", code: "already-have-account" });
});

test("can create an account", async () => {
  const data: BetaSignup = {
    email: "test@user.com",
    token: "1234",
    firstName: "Tester",
    device: "android",
    createdAt: 0 as any,
  };
  await betaSignups(firestore).doc("test@user.com").set(data);

  await supertest(app)
    .post("/create-account")
    .send({ password: "123456aA", token: "1234" })
    .expect(200, { type: "success" });

  await betaSignups(firestore)
    .doc("test@user.com")
    .get()
    .then((data) => assert.not(data.exists));
});

test("disallows two short passwords", async () => {
  await supertest(app)
    .post("/create-account")
    .send({ password: "12345aA", token: "1234" })
    .expect(200, { type: "error", code: "invalid-password" });
});

test("disallows passwords with no lowercase", async () => {
  await supertest(app)
    .post("/create-account")
    .send({ password: "123456AA", token: "1234" })
    .expect(200, { type: "error", code: "invalid-password" });
});

test("disallows passwords with no uppercase", async () => {
  await supertest(app)
    .post("/create-account")
    .send({ password: "123456aa", token: "1234" })
    .expect(200, { type: "error", code: "invalid-password" });
});

test("disallows tokens that don't exist", async () => {
  await supertest(app)
    .post("/create-account")
    .send({ password: "123456aA", token: "1234" })
    .expect(200, { type: "error", code: "invalid-token" });
});

test("disallows users who already have accounts", async () => {
  const data: BetaSignup = {
    email: "test@user.com",
    token: "1234",
    device: "ios",
    firstName: "Tester",
    createdAt: 0 as any,
  };
  await betaSignups(firestore).doc("test@user.com").set(data);

  await auth.createUser({
    email: "test@user.com",
    password: "123456",
    emailVerified: true,
  });

  await supertest(app)
    .post("/create-account")
    .send({ password: "123456aA", token: "1234" })
    .expect(200, { type: "error", code: "already-have-account" });
});

test.after(async () => {
  // Turns out we need to do this when running the SDK locally
  // Who knew ¯\_(ツ)_/¯
  // See https://stackoverflow.com/questions/41630485/how-to-properly-exit-firebase-admin-nodejs-script-when-all-transaction-is-comple
  await admin.app().delete();
});

test.run();
