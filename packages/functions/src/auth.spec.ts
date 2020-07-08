import * as supertest from "supertest";
import { deleteCollection } from "./utils";
import { initTest } from "./test-utils";
import * as admin from "firebase-admin";

initTest();

import { app } from "./auth";
import { betaSignups } from "./shared/utils";
import { BetaSignup } from "./shared/types";

const firestore = admin.firestore();
const auth = admin.auth();

describe.only("auth", () => {
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
    supertest(app).post("/beta-signup").send({ email: "test@user.com" }).expect(
      200,
      {
        type: "success",
      },
      done,
    );
  });

  it("prevents two signups", (done) => {
    supertest(app)
      .post("/beta-signup")
      .send({ email: "test@user.com" })
      .end(() => {
        supertest(app).post("/beta-signup").send({ email: "test@user.com" }).expect(
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
    supertest(app).post("/beta-signup").send({ email: "@user.com" }).expect(
      200,
      {
        type: "error",
        code: "invalid-email",
      },
      done,
    );

    supertest(app).post("/beta-signup").expect(
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
          .post("/beta-signup")
          .send({ email: "test@user.com" })
          .expect(200, { type: "error", code: "already-have-account" }, done);
      });
  });

  it("can create an account", (done) => {
    const data: BetaSignup = { email: "test@user.com", token: "1234" };
    betaSignups(firestore)
      .doc("test@user.com")
      .set(data)
      .then(() => {
        supertest(app)
          .post("/create-account")
          .send({ password: "123456aA", token: "1234" })
          .expect(200, { type: "success" }, () => {
            betaSignups(firestore)
              .doc("test@user.com")
              .get()
              .then((data) => {
                expect(data.exists).toBe(false);
                done();
              });
          });
      });
  });

  it("disallows two short passwords", (done) => {
    supertest(app)
      .post("/create-account")
      .send({ password: "12345aA", token: "1234" })
      .expect(200, { type: "error", code: "invalid-password" }, done);
  });

  it("disallows passwords with no lowercase", (done) => {
    supertest(app)
      .post("/create-account")
      .send({ password: "123456AA", token: "1234" })
      .expect(200, { type: "error", code: "invalid-password" }, done);
  });

  it("disallows passwords with no uppercase", (done) => {
    supertest(app)
      .post("/create-account")
      .send({ password: "123456aa", token: "1234" })
      .expect(200, { type: "error", code: "invalid-password" }, done);
  });

  it("disallows tokens that don't exist", (done) => {
    supertest(app)
      .post("/create-account")
      .send({ password: "123456aA", token: "1234" })
      .expect(200, { type: "error", code: "invalid-token" }, done);
  });

  it("disallows users who already have accounts", (done) => {
    const data: BetaSignup = { email: "test@user.com", token: "1234" };
    betaSignups(firestore)
      .doc("test@user.com")
      .set(data)
      .then(() => {
        auth
          .createUser({
            email: "test@user.com",
            password: "123456",
            emailVerified: true,
          })
          .then(() => {
            supertest(app)
              .post("/create-account")
              .send({ password: "123456aA", token: "1234" })
              .expect(200, { type: "error", code: "already-have-account" }, done);
          });
      });
  });

  // TODO test bad passwords

  afterAll(async () => {
    // Turns out we need to do this when running the SDK locally
    // Who knew ¯\_(ツ)_/¯
    // See https://stackoverflow.com/questions/41630485/how-to-properly-exit-firebase-admin-nodejs-script-when-all-transaction-is-comple
    await admin.app().delete();
  });
});
