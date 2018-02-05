import express from 'express';
import {createServer} from 'http';
import socket from 'socket.io';
import path from 'path';
import debug from 'debug';

const d = debug('app');

const app = express();
const server = createServer(app);
const io = socket(server);

app.use(express.static(path.resolve('./public')));
app.use(express.static(path.resolve('./node_modules')));

const port = 3000;

server.listen(port, () => {
  d('listening on *:%d', port);
  d('Lets get shit going...');
});

const sentmessages = [];
// const img = [];
const users = [];

/**
 * Einzelner Benutzer
 */
class User {
  constructor(sid) {
    this.id = sid;
    this.name = '';
    this.isAdmin = false;
    this.canPing = false;
  }

  makeAdmin() {
    this.isAdmin = true;
    this.canPing = true;
  }

  unmakeAdmin() {
    this.isAdmin = false;
    this.canPing = false;
  }

  enablePing() {
    this.canPing = true;
  }

  disablePing() {
    this.canPing = false;
  }
}

/**
 * Alle Benutzer
 */
const userUtils = {
  getUserById: (id) => {
    return users[userUtils.getIndexById(id)];
  },

  getIndexByName: (name) => {
    let i=0;
    users.forEach((element) => {
      i++;
      if (element.name == name) {
        return i;
      }
    });
    return -1;
  },

  getIndexById: (id) => {
    for (let i = 0; i< users.length; i++) {
      if (users[i].id == id) {
        return i;
      }
    }
    return -1;
  },

  userHasName: (id) => {
    for (let i = 0; i < users.length; i++) {
      if (users[i].id == id) {
        if (users[i].name != '') {
          return true;
        } else {
          return false;
        }
      }
    }
    return false;
  },

  getUserIdByName: (name) => {
    let res;
    users.some((u) => {
      if (u.name === name) {
        res = u.id;
        return true;
      }
    });
    return res;
  },

  getUserNameById: (id) => {
    for (let i = 0; i< users.length; i++) {
      if (users[i].id == id) {
        return users[i].name;
      }
    }
    return false;
  },

  isNameTaken: (name) => {
    users.forEach((u) => {
      if (u.name == name) {
        return true;
      }
    });
    return false;
  },
};

io.on('connection', (socket) => {
  // Benutzer Speichern
  users.push(new User(socket.id));
  d('%s connected!', socket.id);

  // Vor dem Connect gesendete Nachrichten nachsenden!
  sentmessages.forEach((element) => {
    socket.emit('chat message', element);
  });

  // Willkommens Nachticht bei Join
  socket.emit('chat message', 'Willkommen im Chat!');
  socket.emit('chat message', 'Benutze /help für Hilfe!');
  socket.emit('chat message', 'Benutze /name (name) um dir einen Namen zu geben!');

  // Verwalte Chat Nachrichten
  socket.on('chat message', (msg) => {
    d('Incoming Message: %s by %s', msg, socket.id);

    let hasName = false;
    let isAdmin = false;

    // User hat name!
    if (userUtils.userHasName(socket.id)) hasName = true;
    // Benutzer ist Admin
    if (userUtils.getUserById(socket.id).isAdmin) isAdmin = true;

    // Kommandos abfangen
    switch (msg.split(' ')[0]) {
    case '/help':
      if (isAdmin) {
        socket.emit('chat message', 'Admin Tools:');
        socket.emit('chat message', 'Benutze /list Admins um alle Admins zu zeigen!');
        socket.emit('chat message', 'Benutze /kick (Name) um einen User zu kicken!');
        socket.emit('chat message', 'Benutze /ping (Name) um einem User das Pingen zu ermöglichen!');
        socket.emit('chat message', 'Benutze /unset Admin um dich selbst als Admin zu entfernen!');
        socket.emit('chat message', 'Benutze /rename (name) (newname) um einen Benutzer umzubenennen!');
      }

      if (hasName) {
        socket.emit('chat message', 'User Tools:');
        socket.emit('chat message', 'Benutze /name (name) um deinen Namen zu setzen!');
      }

      socket.emit('chat message', 'Benutze /change name um deinen Namen zu ändern!');
      return;

    case '/name':
      if (userUtils.userExists(msg.split(' ')[1])) {
        socket.emit('chat message', 'Dieser Nutzername ist nicht verfügbar!');
        return;
      }

      userUtils.getUserById(socket.id).name = msg.split(' ')[1];

      d('%s set username to %s', socket.id, userUtils.getUserById(socket.id).name);
      socket.emit('chat message', 'Du heißt nun ' + userUtils.getUserById(socket.id).name+' !');
      return;
    }

    if (msg.charAt(0) === '/') {
      socket.emit('chat message', 'Befehl gibts nicht.');
    }

    if (!hasName) {
      socket.emit('chat message', 'Benutze /name (name) um deinen Namen zu setzen!');
      return;
    }

    const message =
      userUtils.getUserNameById(socket.id) +
      ' ' +
      (new Date).toLocaleTimeString() +
      ' : ' +
      msg;

    let event = 'chat message';
    if (isAdmin) event = 'admin message';

    io.emit(event, message);
  });

  // Map Ping
  socket.on('ping map', (ping) => {
    if (userUtils.getUserById(socket.id).isAdmin ||
        userUtils.getUserById(socket.id).canPing) {
      io.emit('ping map', ping);
    }
  });

  socket.on('disconnect', () => {
    d('user disconnected');
    io.emit('chat message', 'Benutzer getrennt');
  });
});
