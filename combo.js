/* nodejs-combo 0.2.0
 * kavenyan@gmail.com
 * thanks to devglass
 */
var sys = require('sys'),
    url  = require('url'),
    fs = require('fs'),
    path = require('path'),
    http = require('http'),
    filesCache = {};

http.createServer(function(req,res){
  var COMBO_SERVER = 'nodejs-combo',
      COMBO_FLAG = '/combo=',
      COMBO_SEPARATOR = '&',
      NEW_LINE = '\n',
      pathname = req.url,
      files = [],
      filenames,
      filesCount = 0, //set filesCount is number so that filesCount ++ is right
      cacheFile,
      getPath = function(pathname){
        if(pathname.slice(0,1) !== '/'){
          pathname = '/' + pathname;
        }
	return path.join(__dirname,pathname);
      },
      setCache = function(pathname,data){
        if(pathname.slice(0,1) === '/'){
           pathname = pathname.slice(1);
        }
        filesCache[pathname] = data;
        console.log('Setting cache pathname is ' + pathname);
      },
      getCache = function(pathname){
        if(pathname.slice(0,1) === '/'){
           pathname = pathname.slice(1);
        }
        console.log('Getting cache pathname is ' + pathname);
        return filesCache[pathname];
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
      },
      sendComboReq = function(){
        if(filesCount === filenames.length){
          fileData = files.join(NEW_LINE);
          sendReq(fileData);
          setCache(pathname,fileData);
        }
      };

  if(pathname === '/favicon.ico'){
    return;
  }

  console.log('Serving:' + pathname);
 
  cacheFile = getCache(pathname);
  if(cacheFile){
    console.log(pathname + ' comes from nodejs-combo cache!');
    sendReq(cacheFile);
  }else{
    if(pathname.slice(0,COMBO_FLAG.length) === COMBO_FLAG){
      console.log('combo is here');
      filenames = pathname.slice(7).split(COMBO_SEPARATOR); 
      for(var i=0,n=filenames.length;i<n;i++){
        cacheFile = getCache(filenames[i]);
        if(cacheFile){
          filesCount ++;
          files[i] = cacheFile;
          sendComboReq()
        }else{
          fs.readFile(getPath(filenames[i]),(function(i){
            return function(){
              var err = arguments[0],
                  data = arguments[1],
                  fileData;
              //console.log('i = ' + i);
              if(err){
                throwErr(err,filenames[i]);
              }else{
      	      files[i] = data;
                setCache(filenames[i],data);
              } 
              filesCount ++;
              //use filesCount rather than files.length,
              //because fs.readFile() is async, file[n] maybe is finished first, 
              //so that files.length === filesnames.length cause an error. 
              sendComboReq();
            }
          })(i));//pass i to fs.readFile's callback, see more at Y.rbind of YUI3  
        }
      }
    }else{
      console.log('return the file directly');
      fs.readFile(getPath(pathname),function(err,data){
        if(err){
  	throwErr(err,pathname);
        }else{
          sendReq(data);
          setCache(pathname,data);
        }
      });
    }
  }
}).listen(8037);
console.log('nodejs-combo is running!');
