var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');


app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});
//app.use(require('express').static(path.join(__dirname, 'public')));
var d = new Date();


sentmessages = [];
img = [];



//Einzelner Benutzer
class User{
    constructor(sid){
        this.id = sid;
        this.name = "";
        this.isAdmin = false;
        this.canPing = false;
    }

    MakeAdmin(){
        this.isAdmin = true;
        canPing = true;
    }
    UnmakeAdmin(){
        this.isAdmin = false;
        canPing = false;
    }
    EnablePing(){
        this.canPing = true;
    }
    DisablePing(){
        this.canPing = false;
    }
}

user = [];
//Alle Benutzer
class Users{
    GetIndexByName(name){
        var i=0;
        user.forEach(element => {
            i++;
            if(element.name == name){
                return i;
            }
        });
        return -1;
    }
    GetIndexById(id){
        for(var i = 0; i< user.length;i++){
            if(user[i].id == id){
                return i;
            }
        }
        return -1;
    }
    UserHasName(id){
        for(var i = 0; i< user.length;i++){
            if(user[i].id == id){
                if(user[i].name != ""){
                    return true;
                }
                else{
                    return false;
                }
            }
        }
        return false;
    }
    GetUserIdByName(name){
        user.forEach(u => {
            if(u.name == name){
                return u.id;
            }
        });
    }
    GetUserNameById(id){
        for(var i = 0; i< user.length;i++){
            if(user[i].id == id){
                return user[i].name;
            }
        }
        return false;
    }
    IsNameTaken(name){
        user.forEach(u => {
            if(u.name == name){
                return true;
            }
        });
        return false;
    }

}

var users = new Users();

io.on('connection', function(socket){
    //Benutzer Speichern
    var u = new User(socket.id);
    user.push(u);
    console.log(socket.id + " connected!");

    //Vor dem Connect gesendete Nachrichten nachsenden!
    sentmessages.forEach(element => {
      socket.emit('chat message', element);
    });
    
    //Willkommens Nachticht bei Join
    socket.emit('chat message', "Willkommen im Chat!");
    socket.emit('chat message', "Benutze /help für Hilfe!");
    socket.emit('chat message', "Benutze /name (name) um dir einen Namen zu geben!");
    
    //Verwalte Chat Nachrichten
    socket.on('chat message', function(msg){
        console.log("Incoming Message: "+ msg + " by " + socket.id);
        //User hatt name!
        if(users.UserHasName(socket.id)){    
            if(msg[0] == '/'){
                //Nachricht ist ein Befehl
                //Benutzer ist Admin
                if(user[users.GetIndexById(socket.id)].isAdmin){
                    if(msg == "/help"){
                        socket.emit('chat message', "Admin Tools:");      
                        socket.emit('chat message', "Benutze /list Admins um alle Admins zu zeigen!");      
                        socket.emit('chat message', "Benutze /kick (Name) um einen User zu kicken!");
                        socket.emit('chat message', "Benutze /ping (Name) um einem User das Pingen zu ermöglichen!");
                        socket.emit('chat message', "Benutze /unset Admin um dich selbst als Admin zu entfernen!");
                        socket.emit('chat message', "Benutze /rename (name) (newname) um einen Benutzer umzubenennen!")
                        socket.emit('chat message', "User Tools:");     
                        socket.emit('chat message', "Benutze /name (name) um deinen Namen zu setzen!");
                        socket.emit('chat message', "Benutze /change name um deinen Namen zu ändern!");
                    }
                }
                //Normaler Benutzer
                else{
                    if(msg == "/help"){
                        socket.emit('chat message', "User Tools:");     
                        socket.emit('chat message', "Benutze /name (name) um deinen Namen zu setzen!");
                        socket.emit('chat message', "Benutze /change name um deinen Namen zu ändern!");
                    }
                }
            } 
            //Nachricht ist eine Chatnachricht   
            else{   
                //Nachricht vorbereiten       
                var message = users.GetUserNameById(socket.id) + " " + d.toLocaleTimeString()+ " : " + msg;
                if(user[users.GetIndexById(socket.id)].isAdmin){
                    io.emit('admin message',message);            
                }
                else{
                    io.emit('chat message',message);                                  
                }
            }
        }
        //Kein Name!
        else{
            //Nur Befehle!       
            if(msg[0] == '/' ){
                if(msg == "/help"){
                    socket.emit('chat message', "Benutze /name (name) um dir einen Namen zu geben!");
                }
                if(msg.indexOf("/name") == 0){
                    try {                  
                        var n = msg.split(" ");
                        user[users.GetIndexById(socket.id)].name = n[1];   
                        console.log(socket.id + " set username to " + user[users.GetIndexById(socket.id)].name);
                        socket.emit('chat message', "Du heißt nun "+ user[users.GetIndexById(socket.id)].name+" !");
                    } catch (error) {
                        socket.emit('chat message', "Dieser Nutzername ist nicht verfügbar!");
                    }
                }
            }
        }     
    });
  
  
    //Map Ping
    socket.on('ping map',function(ping){
        if(user[users.GetIndexById(socket.id)].isAdmin || user[users.GetIndexById(socket.id)].canPing){
            io.emit('ping map',ping);
        }
    });
  
    socket.on('disconnect', function(){  
      console.log('user disconnected');
      io.emit('chat message', "Benutzer getrennt");
    });
});
  
http.listen(3000, function(){
  console.log('listening on *:3000');
  console.log('Lets get shit going...');
});
  