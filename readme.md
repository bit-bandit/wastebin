Wastebin - Minimalist Pastebin Clone.
=====================================
Wastebin is a minimalist (>100 SLOC) PasteBin clone for Deno, and SQLite.

Usage
-----
```sh
deno run --allow-read --allow-write --allow-net wastebin.ts -p 8000 -d './database.sqlite'
```

API
---
* `GET  /` - Home page.
* `GET  /:id` - Retrive a paste.
* `POST /` - Upload a new paste.
* `POST /:id/flag` - Flag a paste.

CLI Flags
-----------
* `-p` - Which **p**ort to listen to.
* `-d` - Location of **d**atabase.

Dependancies
------------
Wastebin is built off DenoDB, `std`'s flag library, and Oak. Nothing else!

License
-------
0BSD. Do whatever you want with this. We don't care.
