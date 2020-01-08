var Discord = require("discord.io");
const http = require("http");
const express = require("express");
const app = express();
const fs = require("fs");
const schedule = require('node-schedule');

var settings = JSON.parse(fs.readFileSync("settings.json"));
console.log("Loaded settings:");
console.log(settings)

const dailyMessage = "Calling all @Dev Foxes! Post your daily updates here: what did you do last, what will you do next, until when will you be available?\nHave a Foxy™️ day!";

var pingTimeout;
var reminderSchedule;

selfPing();

// Initialize Discord Bot
var bot = new Discord.Client({
  token: process.env.TOKEN,
  autorun: true
});

process.on("exit", function() {
  console.log("Exiting...");
  if (typeof pingTimeout !== "undefined") pingTimeout.unref();
  if (typeof reminderSchedule !== "undefined") reminderSchedule.cancel();
});

bot.on("disconnect", function(errMsg, code) {
  console.log("Disconnecting..." + errMsg + code);
  if (typeof pingTimeout !== "undefined") pingTimeout.unref();
  if (typeof reminderSchedule !== "undefined") reminderSchedule.cancel();
});

bot.on("ready", function(evt) {
  console.log("Connected");
  console.log("Logged in as: ");
  console.log(bot.username + " - (" + bot.id + ")");
      
  var rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = new schedule.Range(1, 5);
  rule.hour = 11;
  rule.minute = 0;
  rule.second = 0;
  
  reminderSchedule = schedule.scheduleJob(rule, function(){
    sendReminder();
  });
  
});

bot.on("message", function(user, userID, channelID, message, evt) {
  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (message.substring(0, 1) == "!") {
    var args = message.substring(1).split(" ");
    var cmd = args[0];

    args = args.splice(1);
    switch (cmd) {
      case "pause":
        settings.shouldSend = false;
                
        console.log("Paused");
        bot.sendMessage({
          to: channelID,
          message: "Reminders are paused"
        });
        break;
      case "resume":
        settings.shouldSend = true;
                
        console.log("Resumed");
        bot.sendMessage({
          to: channelID,
          message: "Reminders are resumed"
        });
        break;
      case "set":
        settings.channelID = channelID;
        console.log("Reminder set on: " + bot.channels[channelID].name);
        bot.sendMessage({
          to: channelID,
          message: "Reminder set on channel: " + bot.channels[channelID].name
        });
        break;
      case "reminder":
        sendReminder();
        break;
      case "nextDate":
        var date = reminderSchedule.nextInvocation();
        bot.sendMessage({
          to: channelID,
          message: "Next reminder on: " + date
        });
        break;
    }
    
    fs.writeFile("settings.json",JSON.stringify(settings),"utf8",err => {
            if (err)
              console.log(err);
            else
              console.log("The file has been saved!");
          }
        );
  }
});

function sendReminder() {
  if (settings.shouldSend === false) {
    console.log("shouldSend was false");
    return;
  }

  var date = new Date();
  date = date.toISOString();
  
  bot.sendMessage({
      to: settings.channelID,
      message: dailyMessage
  });

  console.log("Sent reminder on" + date);
}

function selfPing() {
  app.get("/", (request, response) => {
    console.log("Ping Received");
    response.sendStatus(200);
  });
  app.listen(process.env.PORT);
  pingTimeout = setInterval(() => {
    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
  }, 280000);
}
