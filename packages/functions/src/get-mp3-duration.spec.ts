import { test } from "uvu";
import fs from "fs";
import path from "path";
import { getMp3Duration } from "./get-mp3-duration";
import assert from "uvu/assert";

const assetsPath = path.join(__dirname, "..", "assets");
const vbrPath = path.join(assetsPath, "vbr.mp3");
const cbrPath = path.join(assetsPath, "cbr.mp3");
const vbr = fs.readFileSync(vbrPath);
const cbr = fs.readFileSync(cbrPath);

test("vbr duration", async () => {
  const duration = getMp3Duration(vbr);
  assert.equal(duration, 285727);
});

test("cbr duration", async () => {
  const duration = getMp3Duration(cbr);
  assert.equal(duration, 285780);
});

test.run();
