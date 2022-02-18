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

const args = await parse(Deno.args);
const PORT: number = args.p;
const DB: string = args.d;

const app = new Application();
const router = new Router();

const connector = new SQLite3Connector({ filepath: DB });

class Paste extends Model {
  static table = "pastes";
  static timestamps = true;

  static fields = {
    id: { primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: true },
    body: DataTypes.string(150000000),
    flags: DataTypes.INTEGER,
  };

  static defaults = {
    flags: 0,
  };
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
    await Paste.create({
      title: `${formData.fields.title}`,
      body: `${formData.fields.body}`,
    });
    let res = await Paste.where({
      title: `${formData.fields.title}`,
      body: `${formData.fields.body}`,
    }).first();
    ctx.response.redirect(`/${res.id}`);
  })
  .get("/:id", async (ctx, next) => {
    let res = await Paste.select("body", "title").find(ctx.params.id);
    ctx.response.body = `<h1>${res.title}</h1>\n<pre>${res.body}</pre>\n`;
    ctx.response.type = "html";
    ctx.response.status = Status.OK;
  })
  .post("/:id/flag", async (ctx, next) => {
    let res = await Paste.select("flags").find(ctx.params.id);
    let newflag: number = await parseInt(`${res.flags}`) + 1; // `parseint` because type issues.
    await Paste.where("id", ctx.params.id).update("flags", newflag);
    ctx.response.body = "<h1>Flagging successful.</h1>";
    ctx.response.type = "html";
    ctx.response.status = Status.OK;
  });

app.use(router.routes());
app.use(router.allowedMethods());
await app.listen({ port: PORT });
