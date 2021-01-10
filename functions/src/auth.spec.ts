import supertest from "supertest";
import { adminDb, deleteCollection } from "./shared/node/utils";
import { admin } from "./admin";

import { app } from "./auth";
import { BetaAPI } from "./shared/universal/types";
import { test } from "uvu";
import assert from "uvu/assert";

const firestore = admin.firestore();
const auth = admin.auth();

test.before.each(async () => {
  await deleteCollection(await firestore.collection("beta_signups"));
  try {
    const user = await getUser();
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
    password: body.password ?? "123456aA",
  };
};

const getUser = () => auth.getUserByEmail("test@user.com");

const getUserId = () => getUser().then(({ uid }) => uid);

test("can successfully sign up a user by email", async () => {
  await supertest(app).post("/beta-signup").send(createBody()).expect(200, {
    type: "success",
  });

  await adminDb(await getUserId())
    .doc()
    .get()
    .then((data) =>
      assert.equal(data.data(), {
        firstName: "Tester",
        songCount: 0,
        device: "ios",
      }),
    );
});

test("prevents two signups", async () => {
  await supertest(app).post("/beta-signup").send(createBody());
  await supertest(app).post("/beta-signup").send(createBody()).expect(200, {
    type: "error",
    code: "already-have-account",
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

test("disallows two short passwords", async () => {
  await supertest(app)
    .post("/beta-signup")
    .send({ password: "12345aA", token: "1234" })
    .expect(200, { type: "error", code: "invalid-password" });
});

test("disallows passwords with no lowercase", async () => {
  await supertest(app)
    .post("/beta-signup")
    .send({ password: "123456AA", token: "1234" })
    .expect(200, { type: "error", code: "invalid-password" });
});

test("disallows passwords with no uppercase", async () => {
  await supertest(app)
    .post("/beta-signup")
    .send({ password: "123456aa", token: "1234" })
    .expect(200, { type: "error", code: "invalid-password" });
});

test.after(async () => {
  // Turns out we need to do this when running the SDK locally
  // Who knew ¯\_(ツ)_/¯
  // See https://stackoverflow.com/questions/41630485/how-to-properly-exit-firebase-admin-nodejs-script-when-all-transaction-is-comple
  await admin.app().delete();
});

test.run();
