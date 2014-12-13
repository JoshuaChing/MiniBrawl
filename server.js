var express=require('express');
var app=express();

require('./router/main')(app);

app.set('view engine', 'ejs');
app.engine('html',require('ejs').renderFile);

var port = process.env.PORT || 3000;
var server=app.listen(port,function(){
	console.log("We have started our server on port 3000");
});
