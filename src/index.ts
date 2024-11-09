import { Hono } from 'hono'
import { html, raw } from 'hono/html'
const app = new Hono()

app.get('/img/:key', async (c) => {
    const key = `img/${c.req.param('key')}`;
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
