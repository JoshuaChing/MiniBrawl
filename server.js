var express=require('express');
var app=express();

require('./router/main')(app);

app.set('view engine', 'ejs');
app.engine('html',require('ejs').renderFile);

var server=app.listen(3000,function(){
	console.log("We have started our server on port 3000");
});
