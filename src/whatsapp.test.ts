import assert from "node:assert/strict";
import { test } from "node:test";
import { trimHistory } from "./store.js";
import { parseWebhook } from "./whatsapp.js";

test("parseWebhook extracts text and button replies with profile names", () => {
  const body = {
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [{ wa_id: "60123456789", profile: { name: "Aisyah" } }],
              messages: [
                { id: "m1", from: "60123456789", type: "text", text: { body: "Hi, nak tanya laddoo" } },
                { id: "m2", from: "60123456789", type: "button", button: { text: "500 pcs" } },
                { id: "m3", from: "60123456789", type: "audio", audio: { id: "a" } },
              ],
            },
          },
        ],
      },
      { changes: [{ value: { statuses: [{ id: "s1", status: "read" }] } }] },
    ],
  };
  assert.deepEqual(parseWebhook(body), [
    { id: "m1", from: "60123456789", name: "Aisyah", type: "text", text: "Hi, nak tanya laddoo" },
    { id: "m2", from: "60123456789", name: "Aisyah", type: "button", text: "500 pcs" },
    { id: "m3", from: "60123456789", name: "Aisyah", type: "audio", text: undefined },
  ]);
});

test("parseWebhook ignores junk", () => {
  assert.deepEqual(parseWebhook(null), []);
  assert.deepEqual(parseWebhook({ entry: [{}] }), []);
});

test("trimHistory keeps the newest turns and starts on a user turn", () => {
  const turns = [
    { role: "user" as const, text: "1" },
    { role: "assistant" as const, text: "2" },
    { role: "user" as const, text: "3" },
    { role: "assistant" as const, text: "4" },
  ];
  assert.deepEqual(trimHistory(turns, 3).map((t) => t.text), ["3", "4"]);
  assert.deepEqual(trimHistory(turns, 10).map((t) => t.text), ["1", "2", "3", "4"]);
});

test("toContents maps roles and merges back-to-back turns", async () => {
  process.env.GEMINI_API_KEY ||= "test";
  const { toContents } = await import("./agent.js");
  assert.deepEqual(
    toContents([
      { role: "user", text: "a" },
      { role: "user", text: "b" },
      { role: "assistant", text: "c" },
    ]),
    [
      { role: "user", parts: [{ text: "a" }, { text: "b" }] },
      { role: "model", parts: [{ text: "c" }] },
    ],
  );
});
