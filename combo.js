/* nodejs-combo 0.1.0
 * kavenyan@gmail.com
 * thanks to devglass
 */
var sys = require('sys'),
    url  = require('url'),
    fs = require('fs'),
    path = require('path'),
    http = require('http');

http.createServer(function(req,res){
  var COMBO_SERVER = 'nodejs-combo',
      COMBO_FLAG = '/combo=',
      COMBO_SEPARATOR = '&',
      NEW_LINE = '\n\n',
      pathname = req.url,
      files = [],
      filenames,
      filesCount = 0, //set filesCount is number so that filesCount ++ is right
      getPath = function(pathname){
        if(pathname.slice(0,1) !== '/'){
          pathname = '/' + pathname;
        }
	return path.join(__dirname,pathname);
      },
      throwErr = function(err,pathname){
	console.log(err.message);
        console.log(getPath(pathname));
        var body = err.message.replace(getPath(pathname),pathname);
        console.log('err = ' + err);
        res.writeHead(500,{
       	  'Content-Type':'text/plain',
          'Content-Length':body.length,
          'Date': new Date(),
          'Connection':'close',
          'Server':COMBO_SERVER 
        });
        res.write(body);
        res.end();
      },
      sendReq = function(data){
	console.log('start to send request! data.length = ' + data.length);
        res.writeHead(200, {
            //'Content-Type': 'application/x-javascript',
            'Content-Type': 'text/plain',
            'Content-Length': data.length,
            'Cache-Control': 'max-age=315360000',
            'Vary': 'Accept-Encoding',
            'Date': new Date(),
            'Expires': new Date((new Date()).getTime() + (60 * 60 * 1000 * 365 * 10)),
            'Age': '300',
            'Connection': 'close',
            'Accept-Ranges': 'bytes',
            'Server':COMBO_SERVER 
        });
        res.write(data);
        res.end();
      };
  console.log('Serving:' + pathname);
  if(pathname.slice(0,COMBO_FLAG.length) === COMBO_FLAG){
    console.log('combo is here');
    filenames = pathname.slice(7).split(COMBO_SEPARATOR); 
    for(var i=0,n=filenames.length;i<n;i++){
      fs.readFile(getPath(filenames[i]),(function(i){
        return function(){
          var err = arguments[0],
              data = arguments[1];
          //console.log('i = ' + i);
          if(err){
            throwErr(err,filenames[i]);
          }else{
  	    files[i] = data;
          } 
          filesCount ++;
          //use filesCount rather than files.length,
          //because fs.readFile() is async, file[n] maybe is finished first, 
          //so that files.length === filesnames.length cause an error. 
          if(filesCount === filenames.length){
            sendReq(files.join(NEW_LINE));
          }
        }
      })(i));//pass i to fs.readFile's callback, see more at Y.rbind of YUI3  
    }
  }else{
    console.log('return the file directly');
    fs.readFile(getPath(pathname),function(err,data){
      if(err){
	throwErr(err,pathname);
      }else{
        sendReq(data);
      }
    });
  }
}).listen(8037);
console.log('nodejs-combo is running!');
