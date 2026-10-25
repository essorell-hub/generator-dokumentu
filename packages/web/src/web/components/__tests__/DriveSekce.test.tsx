import { expect, test } from "bun:test";
import DriveSekce from "../DriveSekce";

test("DriveSekce module loads", () => {
  expect(typeof DriveSekce).toBe("function");
});
