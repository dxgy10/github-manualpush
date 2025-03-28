require('dotenv').config();
require('colors');
const { CronJob } = require('cron');
const Discord = require('discord-simple-api');
const fs = require('fs');

if (!process.env.DISCORD_TOKEN) {
  console.error('The DISCORD_TOKEN is not set in .env file.'.red);
  process.exit(1);
}

const bot = new Discord(process.env.DISCORD_TOKEN);

const getChannelIDs = (fileName) => {
  try {
    if (!fs.existsSync(fileName)) {
      throw new Error(`${fileName} file does not exist.`);
    }
    return fs
      .readFileSync(fileName, 'utf-8')
      .split('\n')
      .map(line => line.trim()) // Trim whitespace
      .filter(Boolean); // Remove empty lines
  } catch (error) {
    console.error(error.message.red);
    process.exit(1);
  }
};

const getMotivationalPhrases = (fileName) => {
  try {
    if (!fs.existsSync(fileName)) {
      throw new Error(`${fileName} file does not exist.`);
    }
    return fs
      .readFileSync(fileName, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  } catch (error) {
    console.error(error.message.red);
    process.exit(1);
  }
};

const phrases = getMotivationalPhrases('text.txt');

const generateMotivationalPhrase = () => {
  if (phrases.length === 0) {
    return "Stay positive and keep going!";
  }
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
};

const sendCronMessage = (time, color, channelIDs) => {
  return new CronJob(
    time,
    () => {
      const message = generateMotivationalPhrase();
      const sendMessageSequentially = (index = 0) => {
        if (index >= channelIDs.length) return;

        const channelId = channelIDs[index];
        if (!channelId.match(/^\d+$/)) {
          console.error(`Invalid channel ID "${channelId}" found in file.`.red);
          return sendMessageSequentially(index + 1);
        }

        bot
          .sendMessageToChannel(channelId, message)
          .then((res) => {
            const logMessage = `Channel ID : ${channelId} | Message : ${
              res.content
            } | Date : ${new Date().toUTCString()}`;
            console.log(logMessage[color]);
            fs.appendFile('logs.txt', logMessage + '\n', (err) => {
              if (err) console.error('Failed to write to logs.txt'.red, err);
            });
          })
          .catch((err) => {
            const errorLog = `Failed to send message to channel ${channelId} | Date : ${new Date().toUTCString()} | Error : ${
              err.response?.data?.message || err.message
            }`;
            console.error(errorLog.red);
            fs.appendFile('logs.txt', errorLog + '\n', (err) => {
              if (err) console.error('Failed to write to logs.txt'.red, err);
            });
          })
          .finally(() => {
            setTimeout(() => sendMessageSequentially(index + 1), 1000);
          });
      };

      sendMessageSequentially();
    },
    null,
    true,
    'UTC'
  );
};

const collectChannelIDs = getChannelIDs('channels.txt');

// Initialize the cron job
const collectJob = sendCronMessage(`*/10 * * * *`, 'blue', collectChannelIDs);

collectJob.start();

console.log('Cron jobs started.'.yellow);