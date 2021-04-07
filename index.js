/**
 * Node App for Labeling and Sending Acknowledge to WhatsApp using Turn.io API
 * 
 * @author akashdeepb<akashdeep20nov@gmail.com>
 */
const express = require('express');
const https = require('https');
require('dotenv').config();
const app = express();

const TURN_TOKEN = process.env.TURN_TOKEN;

/**
 * Function to Label Message
 * @param {String} messageID 
 */
function labelMessage(messageID) {
    let data = JSON.stringify({
        "labels" : [
            "compliment",
            "other",
            {
                "label": "Voice",
                "confidence":0.9
            }
        ]
    });
    let options = {
        hostname : 'whatsapp.turn.io',
        port : 443,
        path : '/v1/messages/'+messageID+'/labels',
        method : 'POST',
        headers : {
            'Authorization' : 'Bearer ' + TURN_TOKEN,
            'Accept' : 'application/vnd.v1+json',
            'Content-Type' : 'application/json'
        }
    }

    let req = https.request(options,res => {
        res.on('data',d => {
            process.stdout.write(d);
        });
    }).on('error',err=>{
        console.log(err);
    });

    req.write(data);
    req.end();
}

/**
 * Function to Send Text Message to User
 * @param {String} to 
 * @param {String} text 
 */
function sendAck(to,text) {
    let options = {
        hostname : 'whatsapp.turn.io',
        port : 443,
        path : '/v1/messages',
        method : 'POST',
        headers :{
            'Authorization' : 'Bearer ' + TURN_TOKEN,
            'Content-Type' : 'application/json'
        }
    }

    let data = JSON.stringify({
        "preview_url" : false,
        "recipient_type":"individual",
        "to":to,
        "type":"text",
        "text":{
            "body":text
        }
    });

    let req = https.request(options,res => {
        res.on('data',d=>{
            process.stdout.write(d);
        });
    }).on('error',err=> {
        console.log(err);
    });

    req.write(data);
    req.end();
}

app.use(express.urlencoded({extended:false}));
app.use(express.json());

/**
 * Request Receiver
 */
app.use('/hook',(req,res)=>{
    try{
        // If vocie message, Label and Send Voice message Acknowledgement
        if(req.body.messages[0].type == 'voice') {
            labelMessage(req.body.messages[0].id);
            sendAck(req.body.messages[0].from,process.env.VOICE_ACK);
        }
        else 
        sendAck(req.body.messages[0].from,process.env.CATCH_ALL_MSG);   // If not voice, send Catch All Message
    }catch{
        //ignore
    }
    return res.status(200).json({message : "Ok"});
});

// Listen APP on defined PORT
app.listen(process.env.PORT,()=>{
    console.log("Turn Labeler Application Running @",process.env.PORT);
});