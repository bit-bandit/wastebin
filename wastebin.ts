/**
 * @copyright BitBandit, 2022
 * @license 0BSD
 */

import { Application, Router, Status } from "https://deno.land/x/oak/mod.ts";

import {
  Database,
  DataTypes,
  Model,
  SQLite3Connector,
} from "https://deno.land/x/denodb/mod.ts";

import { parse } from "https://deno.land/std@0.126.0/flags/mod.ts";

/* wastebin config */
// should i figure out how to load a JSON? maybe later.
const idLength = 7; // generated paste ID length
// generated paste ID number base (selects [0-9a-zA-Z])
const idRadix = 62;

/* other constants */
const args = await parse(Deno.args);
const PORT: number = args.p ?? 80;
const DB: string = args.d ?? "./wastebin.sqlite";

if (args.q) {
  console.log = console.warn = () => {};
}

if (args.s) {
  console.error = console.warn = () => {};
}

if (!args.p) {
  console.warn(
    `WARN: A port wasn't given, so I'm using port ${PORT}. Cry about it.`,
  );
}

if (!args.d) {
  console.warn(
    `WARN: A database wasn't given, so I'm using '${DB}'. Deal with it.`,
  );
}

const app = new Application();
const router = new Router();

const connector = new SQLite3Connector({ filepath: DB });

class Paste extends Model {
  static table = "pastes";
  static timestamps = true;

  static fields = {
    id: DataTypes.string(7),
    title: { type: DataTypes.STRING, allowNull: true },
    body: DataTypes.string(150000000),
    flags: DataTypes.INTEGER,
  };

  static defaults = {
    flags: 0,
  };
}

const defSource: string =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/|\\-_,.;:!?'\"`~@#$%^&*<>()[]{}";

function randomID(length: number, radix: number, source?: string) {
  length = length ?? 8;
  radix = radix ?? 64;
  source = source ?? defSource;

  if (radix > source.length) {
    throw RangeError(
      `Source string does not support radices over ${source.length}.`,
    );
  } else if (radix < 0) {
    throw RangeError(`Negative radices are unsupported.`);
  }

  if (length < 0) {
    throw RangeError(`Negative lengths do not make sense.`);
  }

  let overflow: number = 0;
  let random: Uint8Array = crypto.getRandomValues(new Uint8Array(length));

  let id: string = "";

  for (let val of random) {
    let nval = val + overflow;
    overflow = 0;

    if (val - radix > 0) {
      overflow = val - radix;
    }

    id += source.charAt(nval % radix);
  }

  return id;
}

const db = new Database(connector);

db.link([Paste]);
await db.sync();

router
  .get("/", async (ctx, next) => {
    let page = await Deno.readTextFile("./form.html");

    ctx.response.body = page;
    ctx.response.type = "html";
    ctx.response.status = Status.OK;
  })
  .post("/", async (ctx, next) => {
    const body = ctx.request.body();
    const value = await body.value;
    const formData = await value.read();

    let newURL: string;
    let res;

    do {
      newURL = randomID(idLength, idRadix);
      res = await Paste.where("id", `${newURL}`).first();
    } while (res);

    await Paste.create({
      id: `${newURL}`,
      title: `${formData.fields.title}`,
      body: `${formData.fields.body}`,
    });

    res = await Paste.where("id", `${newURL}`).first();

    ctx.response.redirect(`/${res.id}`);
  })
  .get("/:id", async (ctx, next) => {
    let res = await Paste.where("id", ctx.params.id).first();

    ctx.response.type = "html";

    ctx.response.body = `<a href="/">Home</a>`;

    if (!res) {
      ctx.response.body += `<h1>'${ctx.params.id}' doesn't exist, man`;
      ctx.response.status = Status.NotFound;
    } else {
      ctx.response.body += `<h1>${res.title}</h1>\n<pre>${res.body}</pre>\n`;
      ctx.response.status = Status.OK;
    }
  })
  .post("/:id/flag", async (ctx, next) => {
    let res = await Paste.where("id", ctx.params.id).first();
    let newflag: number = await parseInt(`${res.flags}`) + 1; // `parseint` because type issues.

    await Paste.where("id", ctx.params.id).update("flags", newflag);

    ctx.response.body = "<h1>Flagging successful.</h1>";
    ctx.response.type = "html";
    ctx.response.status = Status.OK;
  });

app.use(router.routes());
app.use(router.allowedMethods());

console.log(
  `Ready to recieve waste from whoever prances by (on port ${PORT}, specifically)...`,
);

try {
  await app.listen({ port: PORT });
} catch (err) {
  if (err.name === "PermissionDenied") {
    console.error(`\nLooks to me like someone's already taken port ${PORT}!`);
    console.error(`Can't exactly host anything without access to the port!`);
    console.error(
      `Fix it, or tell me a different port to try connecting to, using '-p'.\n`,
    );
  }

  throw err;
}
