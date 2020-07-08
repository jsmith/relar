import * as supertest from "supertest";
import { deleteCollection } from "./utils";
import { initTest } from "./test-utils";
import * as admin from "firebase-admin";

initTest();

import { app } from "./auth";

const firestore = admin.firestore();
const auth = admin.auth();

describe("beta signup", () => {
  beforeEach(async () => {
    await deleteCollection(await firestore.collection("beta_signups"));
    try {
      const user = await auth.getUserByEmail("test@user.com");
      await auth.deleteUser(user.uid);
    } catch (e) {
      // An error likely means that the user doesn't exist
    }
  });

  it("can successfully sign up a user by email", (done) => {
    supertest(app).post("/signup").send({ email: "test@user.com" }).expect(
      200,
      {
        type: "success",
      },
      done,
    );
  });

  it("prevents two signups", (done) => {
    supertest(app)
      .post("/signup")
      .send({ email: "test@user.com" })
      .end(() => {
        supertest(app).post("/signup").send({ email: "test@user.com" }).expect(
          200,
          {
            type: "error",
            code: "already-on-list",
          },
          done,
        );
      });
  });

  it("prevents bad emails", (done) => {
    supertest(app).post("/signup").send({ email: "@user.com" }).expect(
      200,
      {
        type: "error",
        code: "invalid-email",
      },
      done,
    );

    supertest(app).post("/signup").expect(
      200,
      {
        type: "error",
        code: "invalid-email",
      },
      done,
    );
  });

  it("prevents a user with an account from signing up", (done) => {
    auth
      .createUser({
        email: "test@user.com",
        password: "123456",
        emailVerified: true,
      })
      .then(() => {
        supertest(app)
          .post("/signup")
          .send({ email: "test@user.com" })
          .expect(200, { type: "error", code: "already-have-account" }, done);
      });
  });

  afterAll(async () => {
    // Turns out we need to do this when running the SDK locally
    // Who knew ¯\_(ツ)_/¯
    // See https://stackoverflow.com/questions/41630485/how-to-properly-exit-firebase-admin-nodejs-script-when-all-transaction-is-comple
    await admin.app().delete();
  });
});
