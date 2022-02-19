Wastebin - Minimalist Pastebin Clone.
=====================================
Wastebin is a minimalist (>200 SLOC) PasteBin clone for Deno, and SQLite.

Usage
-----
```sh
deno run --allow-read --allow-write --allow-net wastebin.ts [-sq] [-p 80] [-d './wastebin.sqlite]'
```

API
---
* `GET  /` - Home page.
* `GET  /:id` - Retrive a paste.
* `POST /` - Upload a new paste.
* `POST /:id/flag` - Flag a paste.

CLI Flags
-----------
* `-p` - Which **p**ort to listen to. (default `80`)
* `-d` - Location of **d**atabase. (default `./wastebin.sqlite`)
* `-q` - Suppresses logs and warnings; **q**uiet mode.
* `-s` - **S**ilences or **s**uppresses warnings and errors; tells wastebin to **s**hut up.

Dependancies
------------
Wastebin is built off DenoDB, `std`'s flag library, and Oak. Nothing else!

License
-------
0BSD. Do whatever you want with this. We don't care.
