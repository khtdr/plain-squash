
const Koa = require('koa');
const router = require('koa-router')();

const {
  selectRecentTweets, getLastTweetId, tweetsSince, toSpanish, saveTweet, postTweet
} = require('./lib');

router.get('/', async ctx => {
  ctx.body = `
    <a href="https://twitter.com/donald_espanol">https://twitter.com/donald_espanol</a>
  `;
});

router.get(process.env.STATUS_ROUTE, async ctx => {
  let tweets = await selectRecentTweets();
  ctx.body = `${JSON.stringify(tweets, null, 8)}`;
});

router.get(process.env.UPDATE_ROUTE, async ctx => {
  let seed = await getLastTweetId();
  let tweets = await tweetsSince(seed);
  for (let i=0; i<tweets.length; i++) {
    let {text, created_at, id} = tweets[i];
    let translation = await toSpanish(text);
    await saveTweet({text, created_at, id, spanish:translation });
    await postTweet(translation);
  }
  ctx.body = 'OK';
});


let app = new Koa();
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(3000);

