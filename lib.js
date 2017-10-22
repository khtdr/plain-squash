// sets up a twitter client with the correct credentials
let twitter = new require('twit')({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// sets up a google translate client with the right creds
let google = require('@google-cloud/translate')({
  projectId: process.env.GOOGLE_PROJECT_ID,
  key: process.env.GOOGLE_API_KEY,
});

// create an ORM wrapper to the sqlite3 database
const Sequelize = require('sequelize');
let sequelize = new Sequelize('database', process.env.DB_USER, process.env.DB_PASS, {
  host: '0.0.0.0',
  dialect: 'sqlite',
  pool: { max: 5, min: 0, idle: 10000 },
  storage: '.data/database.sqlite'
});

// define the simple "Tweet" schema
let Tweet;
sequelize.authenticate().then(() => {
  Tweet = sequelize.define('tweets', {
    text: { type: Sequelize.STRING },
    spanish: { type: Sequelize.STRING },
    id: { type: Sequelize.STRING, primaryKey:true },
    created_at: { type: Sequelize.DATE },
  });
  Tweet.sync();
}).catch(err => console.error(err));

// export functions
module.exports = {
  selectRecentTweets: async (limit=10) => Tweet.findAll({
    order:[['created_at','DESC']], limit
  }),
  
  getLastTweetId: async () => {
    let latest = (await module.exports.selectRecentTweets(1)).shift();
    return latest? latest.id:process.env.SEED_TWEET_ID;
  },
  
  tweetsSince: async (since_tweet_id) => (await twitter.get('statuses/user_timeline', {
    screen_name:"realDonaldTrump",
    include_rts:false,
    since_id:since_tweet_id
  })).data.map(row => ({id:row.id_str, text:row.text, created_at:row.created_at})),
  
  postTweet: async text => await twitter.post('statuses/update', { status: text.substr(0,140) }),
  toSpanish: async text => (await google.translate(text, 'es'))[0],
  saveTweet: async tweet => await Tweet.create(tweet),
};