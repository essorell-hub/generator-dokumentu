import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { stavZalohy, zalohujNaDisk } from "../lib/zaloha";

export const zalohaRouter = {
  stav: base.handler(() => stavZalohy()),

  naDisk: base.handler(async () => {
    try {
      return await zalohujNaDisk();
    } catch (e) {
      throw new ORPCError("BAD_REQUEST", { message: e instanceof Error ? e.message : String(e) });
    }
  }),
};
