
const express = require("express")
const app= express();
const path = require('path');
const portNumber=  process.env.PORT || 3000;
require("dotenv").config({ path: path.resolve(__dirname, '.env') })
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection:process.env.MONGO_COLLECTION };
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_DB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(express.urlencoded({extended:false}));
let kanyeAPI="https://api.kanye.rest/"
app.get("/", (request, response) => { 
    response.render("index");
});

app.get("/generate", (request, response) => { 
    response.render("generate");
});

app.post("/generate", (request, response) => { 
    let requestNo;
    getRequestNumber().then(requestNumberResponse=>{requestNo=requestNumberResponse})
    .then(()=>{ return generateTweet()})
    .then(tweetResult=>{
        return parameters={ textColor: request.body.textColor,
        fontSize : request.body.size,
        backgroundColor : request.body.backgroundColor,
        borderColor : request.body.borderColor,
        borderStyle : request.body.borderStyle,
        borderSize : request.body.borderSize,
        tweet: tweetResult,
        requestNumber:requestNo
      };
    }).then(parameters=>{insertTweet(parameters);return parameters})
    .then((parameters)=>{response.render("tweet",parameters)});
    
});

app.get("/retrieve", (request, response) => { 
    response.render("retrieve");
});

app.post("/retrieve", (request, response) => { 
    lookupTweet(request.body.requestNumber).then(tweetInfo=>{
        if(tweetInfo){     
             const parameters={ textColor: tweetInfo.textColor,
                fontSize : tweetInfo.fontSize,
                backgroundColor : tweetInfo.backgroundColor,
                borderColor : tweetInfo.borderColor,
                borderStyle : tweetInfo.borderStyle,
                borderSize : tweetInfo.borderSize,
                tweet: tweetInfo.tweet,
                requestNumber:tweetInfo.requestNumber
            };
            response.render("tweet",parameters);
        }else{
            response.writeHead(200, {'Content-type': 'text/html'});
            response.write(`<h2>Error: Request Number not found!</h2><br><br> It is likely the case that a tweet with this request
            number has not been created yet.<br> `);
            response.write(`<br><br><a href="/"> HOME</a>`);
            response.end();
        }
    });
});

async function generateTweet(){
    let tweetResult= await fetch(kanyeAPI);
    let tweet= await tweetResult.json();
    return tweet.quote;
}
async function insertTweet(tweetInfo){
    try{
        await client.connect();
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(tweetInfo);
    } catch (e) {
        console.error(e);
    }

}

async function getRequestNumber(){
    try{
        await client.connect();
        return await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).countDocuments({});
    } catch (e) {
        console.error(e);
    }
}

async function lookupTweet(number){
    try{
    await client.connect();
    let filter = {requestNumber: Number(number)};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);
    return result; 
    } catch (e) {
        console.error(e);
    }
}


app.listen(portNumber); 
console.log(`Web server started and running at http://localhost:${portNumber}`);
//console.log("Stop to shutdown the server:");
process.stdin.setEncoding("utf8");
/*
process.stdin.on('readable', () => { 
	let dataInput = process.stdin.read();
	if (dataInput !== null) {
		let command = dataInput.trim();
		if (command === "stop") {
			console.log("Shutting down the server");
            process.exit(0);  
        } else {
			console.log(`Invalid command: ${command}`);
		}
    }
    
    //process.stdin.resume();
    console.log("Stop to shutdown the server:");
});
*/