import * as supertest from "supertest";
import { deleteCollection, initTest } from "./utils";
import * as admin from "firebase-admin";

// TODO really make this use the test firebase project
initTest();

import { app } from "./beta";

const firestore = admin.firestore();

describe("beta signup", () => {
  beforeEach(async () => {
    await deleteCollection(await firestore.collection("beta_signups"));
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
});
