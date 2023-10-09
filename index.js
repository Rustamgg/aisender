import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

// Вставьте свой токен Telegram бота
const token = "6479083693:AAFU9j9HeR4qK6QFURQmtSIxj41SZfFnwns";
const bot = new TelegramBot(token, { polling: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const userFilePath = path.join(__dirname, 'users.json');

async function sendVideoToUser(chatId, videoName, callback = "", buttonTitle) {
  try {
    // Используем относительный путь к видео-файлу в текущей папке
    const videoPath = path.join(__dirname, "videos", videoName);
    const videoData = await fs.promises.readFile(videoPath);
    // Отправка видео
    await bot.sendVideo(chatId, videoData, {
      filename: videoName,
      reply_markup: {
        inline_keyboard: [[{ text: buttonTitle, callback_data: callback }]],
      },
    });
  } catch (error) {
    console.error("Ошибка отправки видео:", error);
  }
}

async function sendToChannel(messageText) {
    const channelName = '@autoaicheck';  // Имя канала, замените на свое
    const messageOptions = {
        parse_mode: 'HTML'  // Вы можете изменить форматирование сообщения
    };

    try {
        // Получаем информацию о канале
        const channelInfo = await bot.getChat(channelName);
        const channelId = channelInfo.id;

        // Отправляем сообщение в канал
        await bot.sendMessage(channelId, messageText, messageOptions);
    } catch (error) {
        console.error('Ошибка отправки сообщения в канал:', error);
    }
}

// Функция для чтения текущего списка пользователей из файла
function readUsernamesFromFile() {
    try {
        const data = fs.readFileSync(userFilePath);
        return JSON.parse(data);
    } catch (error) {
        // Если файл не существует или произошла ошибка при чтении, вернем пустой массив
        console.error('Ошибка чтения файла users.json:', error);
        return [];
    }
}

// Функция для записи уникального username в файл
function writeUsernameToFile(username, status) {
    const users = readUsernamesFromFile();

    // Проверим, есть ли пользователь с таким именем
    const existingUserIndex = users.findIndex(user => user.username === username);

    if (existingUserIndex !== -1) {
        // Если пользователь существует, обновим его статус
        users[existingUserIndex].status = status;
    } else {
        // Если пользователя нет, добавим его
        users.push({ username, status });
    }

    try {
        fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Ошибка записи в файл users.json:', error);
    }
}

function writeUserToFile(users) {
    try {
        fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Ошибка записи в файл user.json:', error);
    }
}

function changeUserStatus(username, newStatus) {
    const users = readUsernamesFromFile();

    const updatedUsers = users.map(existingUser => {
        if (existingUser.username == username) {
            existingUser.status = newStatus;
        }
        return existingUser;
    });

    writeUserToFile(updatedUsers);
}


// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id,
    userFirstName = msg.chat.first_name;

    writeUsernameToFile(msg.chat.username, 'started');

  bot.sendMessage(
    chatId,
    `Привет, ${userFirstName}!

Начнем наш диалог со знакомства
Приятного просмотра.`
  );
  sendVideoToUser(chatId, "one.mp4", "second", "Следующее видео");
  sendToChannel(`✅ Запустил бота:
Имя пользователя: ${msg.chat.first_name} ${msg.chat.last_name};
Ссылка на пользователя: @${msg.chat.username}`);
});

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const videoName = callbackQuery.data;

  try {
    if (videoName == "second") {
      bot.sendMessage(
        chatId,
        `Приятно познакомиться, давай дальше!

В этом видео вы узнаете, как мы заменили менеджеров нашего отдела продаж искусственным интеллектом`
      );

      bot.editMessageReplyMarkup(
        {
          inline_keyboard: [],
        },
        {
          chat_id: chatId,
          message_id: messageId,
        }
      );
      await sendVideoToUser(chatId, "second.mp4", "third", "Следующее видео");
      await changeUserStatus(callbackQuery.message.chat.username, "second_video")
    } else if (videoName == "third") {
      bot.sendMessage(
        chatId,
        `А вот и результат!

Переходим к финальному видео - применению AISender в проектах наших заказчиков`
      );

      bot.editMessageReplyMarkup(
        {
          inline_keyboard: [],
        },
        {
          chat_id: chatId,
          message_id: messageId,
        }
      );

      await sendVideoToUser(
        chatId,
        "third.mp4",
        "final",
        "🎁 Получить бесплатный разбор"
      );
      await changeUserStatus(callbackQuery.message.chat.username, "third_video")
    } else if (videoName == "final") {
      bot.sendMessage(
        chatId,
        `Спасибо за то, что познакомились с нами!

Я передал ваш контакт старшему специалисту по работе с клиентами, скоро он свяжется с вами и предоставит всю необходимую информацию для разбора индивидуального кейса по применению AISender в вашей компании.
            
Кроме того, вас ожидает приятный бонус. 🎁 Если хотите ускорить процесс, просто напишите слово "Разбор" старшему специалисту @nazar_mlc. 😉`
      );

      bot.editMessageReplyMarkup(
        {
          inline_keyboard: [],
        },
        {
          chat_id: chatId,
          message_id: messageId,
        }
      );

      sendToChannel(`🎁 Достиг целевого действия:
Имя пользователя: ${callbackQuery.message.chat.first_name} ${callbackQuery.message.chat.last_name};
Ссылка на пользователя: @${callbackQuery.message.chat.username}`);
await changeUserStatus(callbackQuery.message.chat.username, "finished")
    }
  } catch (error) {
    console.error("Ошибка отправки:", error);
  }
});

// Обработчик всех текстовых сообщений
bot.on("text", (msg) => {
  if (msg.text != "/start") {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      `Прощу прощения, но я не могу ответить на ваш запрос "${msg.text}". Смотрите видео, наш сотрудник скоро свяжется с вами!`
    );
  }
});
