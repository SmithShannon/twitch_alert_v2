import dotenv from 'dotenv';
dotenv.config();
import tmi from 'tmi.js';
import fetch from 'node-fetch';
import express from 'express';
import http from 'http';
import {Server,Socket} from "socket.io";
import fs from 'fs';
import path from 'path';
import money from 'money';
import bodyParser from 'body-parser';

let app = express();
let router = express.Router();
let server = http.createServer(app);
let io = new Server(server);
let __dirname = path.resolve();

let opts = {
	identity: {
		username:'servbot_1988',
		password: process.env.BOT_AUTH
	},
	channels: [
		'mikodite_yvette'
	]
};

let client = new tmi.client(opts);

client.on('message',onMessageHandler);
client.on('connected',onConnectedHandler);

let counter = 0;

function getEmojis(msg,emotes){
	if (!emotes) return msg;
	
	let emojis = []
	
	Object.entries(emotes).map(function (e){
		let range = e[1][0].split('-');
		let s = parseInt(range[0],10);
		let f = parseInt(range[1],10)+1;
		emojis.push([msg.substring(s,f),'<img src="https://static-cdn.jtvnw.net/emoticons/v1/'+e[0]+'/3.0">']);
	});
	
	emojis.map(function (e){
		console.log(e);
		msg = msg.replaceAll(e[0],e[1]);
	});
	
	console.log(msg);
	
	return msg;
}

function onMessageHandler(target,context,msg,self){
	if (self || msg=="") {return;}
	
	//console.log(target);
	console.log(context);
	///console.log(msg);
	//console.log(self);
	
	let commandName = msg.trim();
	
	if (commandName == '!discord'){
		client.say(target,"Join the discord at: https://discord.gg/2er2ss6pTg and hang with Mikodite and co after stream!");
	} else if (commandName == '!donate'){
		client.say(target,"Support the stream at any of the following tiers:"
		+ "\nBuy me a tea: https://buy.stripe.com/3cs28x1980wz5MYaEE"
		+ "\nBuy me a beer: https://buy.stripe.com/28oeVj8BAa79fnydQR"
		+ "\nBuy me dinner: https://buy.stripe.com/8wMbJ70540wzfny5km"
		+ "\nBuy me a Switch Game: https://buy.stripe.com/3cs28x6ts0wz8Za149"
		+ "\nCustom amount: https://ko-fi.com/mikoditeyvette");
	} else if (commandName == '!lurk'){
		context['type'] = "chat.lurk";
		fetch("http://localhost:8080/webhooks", {
			method:"POST",
			headers: {'Content-Type':'application/json'},
			body:JSON.stringify(context)
		});
		client.say(target,context['display-name']+" is lurking.  Their view is as good as anyones.")
	} else if (commandName == '!unlurk'){
		context['type'] = "chat.unlurk";
		fetch("http://localhost:8080/webhooks", {
			method:"POST",
			headers: {'Content-Type':'application/json'},
			body:JSON.stringify(context)
		});
		client.say(target,context['display-name']+" has returned.  Praise them!")	
	} else if (commandName == '!time'){
		let time = new Date();
		client.say(target,"It is "+time.getHours()+":"+time.getMinutes()+" Where Mikodite is.  Timezone is Eastern Standard Time (GMT-5).  Daylight savings is observed when applicable.");
	} else if (commandName=='!command'){
		client.say(target,"!discord - displays the link to the discord server.  !donate - brings up the links for donating.  !time - displays what time it is for Mikodite.  !lurk/!unlurk - sets that you are lurking/stopped lurking in chat.")
	} else {
		counter++;

		io.emit('chat',"<span class='name'>"+context['display-name']+":</span> "+getEmojis(msg,context['emotes']));
		fs.writeFile('/home/mikodite/Documents/chat_data.csv', context['user-id']+","+msg+'\n', { flag: 'a+' }, err => {})

	}
	


}

function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
  client.say("#mikodite_yvette","Hello and welcome to the chat.  Type !command to learn the chat commands.  Mikodite does read chat so don't be afriad to say hello if you are not lurking.  Thank you and have fun!");
  setInterval(function (){
  	counter ++;
		switch (counter%6){
			case 0:
				client.say ('#mikodite_yvette',"Hello and welcome to the chat.  Type !command to learn the chat commands.  Mikodite does read chat so don't be afriad to say hello if you are not lurking.  Thank you and have fun!");
			break;
			case 1:
				client.say('#mikodite_yvette',"Neurdivergent is tagged on this stream as Mikodite is a high-functioning autistic.  I know some wonder but are too afraid to ask.");
			break;
			case 2:
				client.say('#mikodite_yvette',"Gentle reminder that Twitch is not a dating site.  While compliments are welcome, Mikodite won't date you.");
			break;
			case 3:
				client.say('#mikodite_yvette',"Mikodite is not a cam-whore.  There are creators, even on Twitch, that provide sexual or fetishistic content, or take such requests.");
			case 4:
				client.say('#mikodite_yvette',"Mikodite is a cis-gendered, heterosexual woman.  Pronouns are she/her.");
			break;
			case 5:
				client.say('#mikodite_yvette',"If you like what you are watching remember to give a follow if you haven't already.  Follows are free.");
			break;
		}
	},900000);
 };


app.use(bodyParser.json());

fs.readdir(__dirname+"/media",function(err,files){
	if (!err){
		files.forEach(file => {
			app.get("/media/"+file,(req,res)=>{
				console.log("MEDIA");
				res.sendFile(__dirname+"/media/"+file);
			});
		});
	}
});

let radio_list = [];

fs.readdir(__dirname+"/radio",function(err,folders){
	if (!err){
		folders.forEach(folder =>{
			fs.readdir(__dirname+"/radio/"+folder,function(err,files){
				if(!err){
					files.forEach(file => {
						radio_list.push("/radio/"+folder+"/"+file);
						console.log(__dirname+"/radio/"+folder+"/"+file);
						app.get("/radio/"+folder+"/"+file,(req,res)=>{
							console.log(file);
							console.log('SONG');
							res.sendFile(__dirname+"/radio/"+folder+"/"+file);
						});
					});
				}
			});
		});
	}
});

app.get('/', (req, res) => {
	console.log("INDEX");
	console.log(req.url);
	res.sendFile(__dirname + '/index.html');
});

app.get('/chat',(req,res) =>{
	console.log("CHAT");
	console.log(req.url);
	res.sendFile(__dirname + '/chat.html')
});

app.get('/radio',(req,res) =>{
	console.log("RADIO");
	console.log(req.url);
	res.sendFile(__dirname + '/radio.html');
});

app.post('/webhooks',(req,res) => {
	console.log("WEBHOOK");
	let username = "";
	let media = "";
	let type = "";
	let message = "";
	let data = req.body;
	
	if (req.headers['user-agent'].includes("Stripe/1.0")){
		console.log('Stripe');
		type = data.type;
	} else if (req.headers['twitch-eventsub-message-id']!= null){
		console.log('Twitch');
		type = data.subscription.type;
	} else if (req.headers['x-hookdeck-source-name']=='ko-fi') {
		console.log('Ko-fi');
		type=req.data['type'];
	}
	else {
		console.log('Bot');
		type = data.type;
	}
	//console.log(data);
	switch (type) {
		case 'channel.follow':
			console.log('follow!')
			username = data.event.user_name;
			media = "\"<audio "
				+ "id='alert' "
				+ "src='/media/follow_overlay.mp3' "
				+ "type='audio/mp3' "
				+ "></audio>"
				+ "<p>Welcome to the family "+username+".</p>\"";
			message = "Welcome "+username+" to the family!  They are following Mikodite now.";
		break;
	    	case 'channel.raid':
	    		console.log('raid!');
	    		username = data.event.from_broadcaster_user_name;
	    	   	let raiders = data.event.viewers;
	    	   	if (raiders==1){
	    	   		media = "\"<video "
		    	   	    + "id='alert' "
		    	   	    + "width='480' " 
		    	   	    + "height='270' "
		    	   	    + "src='/media/host.webm' "
		    	   	    + "type='video/webm' "
		    	   	    + "></video>"
		    	   	    + "<p>"+username+" is hosting!  Spread the love while offline!</p>\"";
		    	   	message = username+" is hosting.  Thank you!";
	    	   	} else {
		    	   	media = "\"<video "
		    	   	    + "id='alert' "
		    	   	    + "width='480' " 
		    	   	    + "height='270' "
		    	   	    + "src='/media/raid_clip.webm' "
		    	   	    + "type='video/webm'"
		    	   	    + "></video>"
		    	   	    + "<p>"+username+" has raided us with "+raiders+".  Praise these pilgrams!</p>\"";
		    	   	message = username+" is raiding with a party of "+raiders+".  It's ok "+username+" if your just raiding and running.  Take care of yourself and thank you for the viewers.  Praise the pilgrams!";
	    	   	}
	    	break;
	    	case 'channel.goal.progress':
	    		console.log('goal progress!');
	    		process.env.GOAL_CURRENT = data.event.current_amount;
	    		process.env.GOAL_TARGET = data.event.target_amount;
	    		process.env.GOAL_TITLE = data.event.description;
	    	break;
	    	case 'channel.goal.end':
	    		media = "\"<video "
	    			+ "id='alert' "
	    			+ "width='1080' "
	    			+ "height='720' "
	    			+ "src'/media/fireworks.webm' "
	    			+ "type='video/webm' " 
	    			+ "></video>\""
	    	break;
	    	case 'chat.lurk':
	    		console.log('lurk!');
			username = data['display-name'];
			media = "\"<audio "
				+ "id='alert' "
				+ "src='/media/lurk.mp3' "
				+ "type='audio/mp3' "
				+ "> </audio>"
				+ "<p>"+username+" is lurking.</p>\"";
	    	break;
	    	case 'chat.unlurk':
	    		console.log('unlurk');
			username = data['display-name'];
			media = "\"<audio "
				+ "id='alert' "
				+ "src='/media/unlurk.mp3' "
				+ "type='audio/mp3' "
				+ "> </audio>"
				+ "<p>"+username+" has returned.</p>\"";
	    	break;
	    	case 'checkout.session.completed':
	    		console.log('stripe donation!');
	    		//let number = money.convert(data.object.amount_total,{from:data.object.currency,to:"CAD"});
	    		let tier = data.data.object.payment_link;
	    		console.log(data.data.object);
	    		username = "One of you";
	    		switch (tier){
	    			case "plink_1KOpWiFE7WkntxDLz6fH9vHL":
		    			media = "\"<video "
			    	   	    + "id='alert' "
			    	   	    + "width='480' " 
			    	   	    + "height='270' "
			    	   	    + "src='/media/tea.webm' "
			    	   	    + "type='video/webm'"
			    	   	    + "></video>"
			    	   	    + "<p>"+username+" bought me a tea!  Thanks!</p>\"";
			    	   	message = "Someone bought Mikodite a tea.  Thanks for the support.";
	    			break;
	    			case "plink_1KOph3FE7WkntxDLN1YNYYC7":
		    			media = "\"<video "
			    	   	    + "id='alert' "
			    	   	    + "width='480' " 
			    	   	    + "height='270' "
			    	   	    + "src='/media/beer_dono_tier.webm' "
			    	   	    + "type='video/webm'"
			    	   	    + "></video>"
			    	   	    + "<p>"+username+" bought me a beer at the bar!  Thank you for the alcolhol.</p>\"";
			    	   	message = "Someone bought Mikodite a beer at a bar.  The alcohol shall be enjoyed.";
	    			break;
	    			case "plink_1KPW4SFE7WkntxDL5UpGMUct":
		    			media = "\"<video "
			    	   	    + "id='alert' "
			    	   	    + "width='480' " 
			    	   	    + "height='270' "
			    	   	    + "src='/media/dinner.webm' "
			    	   	    + "type='video/webm'"
			    	   	    + "></video>"
			    	   	    + "<p>"+username+" bought me a prime meat dinner. So tasty!  Will enjoy!  Thank you!</p>\"";
			    	   	message = "Someone bought Mikodite dinner.  Very Fance.  Thank you indeed.";
	    			break;
	    			case "plink_1KWWIJFE7WkntxDLPe5N3UPb":
		    			media = "\"<video "
			    	   	    + "id='alert' "
			    	   	    + "width='480' " 
			    	   	    + "height='270' "
			    	   	    + "src='/media/switch.webm' "
			    	   	    + "type='video/webm'"
			    	   	    + "></video>"
			    	   	    + "<p>"+username+" bought me a Nintendo Switch game.  New and exciting things are on my way.  Thank you so much!</p>\"";
			    	   	message = "Someone bought Mikodite a Nintendo Switch game.  This will further her ability to play new, and exciting games for this channel.  Priase them be!  Praise them be!";
	    			break;
	    			case "plink_1KPWBsFE7WkntxDLDoIZHkM7":
	    				let number = data.data.object.amount_total/100;
	    				media = "\"<audio "
						+ "id='alert' "
						+ "src='/media/money.mp3' "
						+ "type='audio/mp3' "
						+ "></audio>"
						+ "<p>"+username+" donated $CAD"+number+".  Thank you for your support.</p>";
					message = "Someone gave Mikodite $CAD"+number+".  Thank you so very much for the support.";
	    			break;
	    		}
	    	break;
	    	case "Donation":
	    		let number = data.data.object.amount_total/100;
	    		media = "\"<audio "
				+ "id='alert' "
				+ "src='/media/money.mp3' "
				+ "type='audio/mp3' "
				+ "></audio>"
				+ "<p>"+username+" donated $CAD"+number+".  Thank you for your support.</p>";
			message = "Someone gave Mikodite $CAD"+number+".  Thank you so very much for the support.";
	    	break;
	}
	io.emit('alert',media);
	client.say("#mikodite_yvette",message);
	res.send("");
	
});


io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('request_song',()=>{
	console.log("Song Request");
	let next = Math.floor(Math.random()*radio_list.length);
	io.emit('receive_song',"<p>"+radio_list[next]+"</p><audio id='music' src='"+radio_list[next]+"' type='audio/mp3' />");
});
});

server.listen(8080, () => {
  console.log('listening on *:8080');
});

client.connect();
