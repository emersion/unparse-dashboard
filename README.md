# unparse-dashboard

A dashboard for [Unparse](https://github.com/unparse/node-unparse).

## What is it?

Usually, web apps follow a 3-tier structure: a database is managed from a web server, which talks with the web browser. But setting up a dynamic web server and a database is often complicated and boring: it is almost always the same models and API endpoints which are set up.

[Parse](http://parse.com) tries to solve this problem by removing the dynamic web server and replacing it by a static web server. The database is directly managed from the browser. Thus, it's a lot more easier to build and host a web app.

But Parse is not open-source. Unparse is an open-source clone of Parse which can be installed on your server. As it behaves like Parse, Parse SDKs can be used.

Use cases:
* You want to build a web app without worrying about the backend
* You have written a Parse app and you want to stop using Parse

For more information, [see Parse website](https://parse.com/products/core).

## Installation

First, clone this repo and install dependencies:

```bash
git clone https://github.com/unparse/unparse-dashboard.git
cd unparse-dashboard
npm install
```

Then, init the database:

```bash
npm run init
```

This will add default classes and objects. A `root` user will be created.

You can now start the server:

```bash
npm run start
```

## Configuration

You can edit `config.json` to change Unparse config.