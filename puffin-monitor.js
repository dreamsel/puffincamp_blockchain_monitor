const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const sha256 = require('sha256');
const fs = require('fs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors({credentials: true, origin: true}));

let state = {nodes:[], links:[]};
/*{
id:1,
name:'vasya',
last_hash:sha256('vasya')
},{id:2, name:'petya', last_hash:sha256('petya')},{id:3,name:'nastya', last_hash:sha256('nastya')}
*/
fs.readFile('state.json','utf8',(err,data)=>{
if(err || !data){
    if(err) {console.log('err reading state file',err.name, err.message);}
state.nodes = [];
state.links = [];
state.added = {nodes:[], links:[]};
state.removed = {nodes:[], links:[]};
state.names = [];
state.hashes = [];
state.candidates = [];
}
else{
    state= JSON.parse(data);
}

const worker = require('./app/worker.js');
const wrapper = function(){

  worker(state)
    .then(() => {
      setTimeout(wrapper,5000);
    })
    .catch(err => {
      console.log('error on iteration;',err.name,err.message);
      setTimeout(wrapper,5000);
    });
};
wrapper();

  require('./app/routes.js')(app,state);

app.listen(port);
console.log('started on port',port);
});