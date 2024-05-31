// const mongoClient = require("mongodb").MongoClient;
const { MongoClient } = require("mongodb");
const state = {
  db: null,
};
module.exports.connect = async () => {
  const url = "mongodb+srv://username:username@cluster101.0ktl0i6.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(url);
  // console.log(process.env.MONGO_URL+'MONGO_URL');
  // const url ='mongodb://localhost:27017'
  // const url = process.env.MONGO_URL;
  const dbname = "Homeshoppy";
  // const dbname = "shopping";
  // console.log('connection to db started...');

  await client.connect();
  console.log("Connected successfully to server");
  state.db = client.db(dbname);
  return 'done'
  // client.connect((err, data) => {
  // 	if (err) return done(err);
  // 	state.db = data.db(dbname);
  // 	done();
  // });
};

// connect()
//   .then(console.log)
//   .catch(console.error)
// //   .finally(() => client.close())
module.exports.get = function () {
  return state.db;
};
