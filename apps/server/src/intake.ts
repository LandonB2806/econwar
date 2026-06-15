/**
 * Boundary validation: every raw client message is parsed with Zod before the
 * Room trusts it (golden rule: validate every external input at the boundary).
 * Malformed messages are rejected, never crash the room.
 */
import { z } from "zod";
import { schema } from "@econwar/shared";
import type { ClientMsg } from "./protocol.js";

const region = schema.regionIdSchema;
const dept = schema.departmentIdSchema;
const ability = schema.abilityIdSchema;
const satangNumber = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);

const joinSchema = z.object({
  t: z.literal("join"),
  joinCode: z.string().min(1).max(16),
  nickname: z.string().min(1).max(20),
  department: dept,
});

const voteSchema = z.object({
  t: z.literal("vote"),
  candidatePlayerId: z.string().min(1),
});

const tiltSchema = z.object({
  t: z.literal("tilt"),
  boostRegion: region.nullable(),
  magnitudeBp: z.number().int().nonnegative().max(100000),
});

const allocateSchema = z.object({
  t: z.literal("allocate"),
  amounts: z.object({
    central: satangNumber,
    north: satangNumber,
    south: satangNumber,
    northeast: satangNumber,
  }),
});

const abilitySchema = z.object({
  t: z.literal("ability"),
  abilityId: ability.nullable(),
  targetPlayerId: z.string().min(1).optional(),
  targetRegion: region.optional(),
});

const clientMsgSchema = z.discriminatedUnion("t", [
  joinSchema,
  voteSchema,
  tiltSchema,
  allocateSchema,
  abilitySchema,
]);

export interface ParseOk {
  ok: true;
  msg: ClientMsg;
}
export interface ParseErr {
  ok: false;
  error: string;
}

/** Parse an untrusted wire payload into a typed ClientMsg, or an error. */
export function parseClientMessage(raw: unknown): ParseOk | ParseErr {
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return { ok: false, error: "invalid JSON" };
    }
  }
  const result = clientMsgSchema.safeParse(data);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "invalid message" };
  }
  return { ok: true, msg: result.data as ClientMsg };
}
