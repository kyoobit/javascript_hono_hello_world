# JavaScript Hono Hello World!

A simple example of a JavaScript app using the Hono framework to create an endpoint using the Cloudflare Workers and R2 object storage platform services.

See Also:

* https://hono.dev/docs/getting-started/cloudflare-workers
* https://developers.cloudflare.com/workers/wrangler/


Create the project root directory:

```shell
npm create hono@latest javascript-hono-hello-world
```

Configuration options used:

* Ok to proceed? (y) y
* ? Which template do you want to use? cloudflare-workers
* ? Do you want to install project dependencies? yes
* ? Which package manager do you want to use? npm

Install the dependencies:

```shell
cd javascript-hono-hello-world
npm install
```

Create the request handler:

```shell
cat > src/index.ts << xxEOFxx
import { Hono } from 'hono'
import { html, raw } from 'hono/html'
const app = new Hono()

app.get('/img/:key', async (c) => {
    const key = `img/${c.req.param("key")}`;
    const object = await c.env.R2_BUCKET.get(key);

    if (!object) return c.notFound();

    const data = await object.arrayBuffer();
    const contentType = object.httpMetadata?.contentType || '';

    return c.body(data, 200, {
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
        'Cache-Control': 'max-age=31536000', // 1 year
        'Content-Type': contentType,
        'ETag': object.httpEtag,
    });
});

app.get('/', (c) => {
    // https://hono.dev/docs/helpers/html
    return c.html(
        html`<!doctype html>
<html>
<head>
    <style>
        .container {
          height: 40rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item {
          width: 20rem;
          text-align: center;
        }

        img {
            max-width: 20rem;
        }
    </style>
<head>
<body>
    <div class="container">
        <div class="item">
            <h1>Hello from Hono!</h1>
            <p>Running on Cloudflare workers with R2 storage.</p>
            <img src="/img/pork-stamp.jpg?v=1">
        </div>
    </div>
</body>
</html>`
    )
});

export default app
xxEOFxx
```

Configure the wrangler worker configuration:

```shell
cat > wrangler.toml << xxEOFxx
# https://developers.cloudflare.com/workers/wrangler/configuration/
name = "javascript-hono-hello-world"
main = "src/index.ts"
compatibility_date = "2024-11-09"

# https://developers.cloudflare.com/workers/wrangler/configuration/#types-of-routes
routes = [
    { pattern = "javascript-hono-hello-world.nateroyer.com", custom_domain = true },
]

# https://developers.cloudflare.com/workers/wrangler/configuration/#r2-buckets
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "<YOUR PROD BUCKET>"
preview_bucket_name = "public"
xxEOFxx
```

Add the assets to the local development bucket:

```shell
npx wrangler r2 object put public/img/pork-stamp.jpg --file public/img/pork-stamp.jpg --local
```

This creates and uses a local R2 storage bucket (.wrangler/state/v3/r2/public)

Run the development server:

```shell
npm run dev
```

Test requests:

```shell
curl -i http://localhost:8787/
curl -i http://localhost:8787/img/pork-stamp.jpg
```

Replace the production bucket name with a real value:

```shell
sed -i 's|<PROD_BUCKET_NAME>|YOUR-BUCKET-NAME|' wrangler.toml
```

Deploy the service to Cloudflare:

```shell
npm run deploy
```
