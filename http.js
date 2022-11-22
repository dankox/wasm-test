var http = require('http');

// //The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
// var options = {
//   host: 'www.random.org',
//   path: '/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
// };


/**
 * 
 * @param {http.IncomingMessage} response 
 */
function callback(response) {
  var str = '';

  //another chunk of data has been received, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
    // console.log("obtained", chunk)
  });

  //the whole response has been received, so we just print it out here
  response.on('end', function () {
    console.log(str);
    console.log("end")
  });
}

async function getStuff(stuff) {
  // http.request(options, callback).end();
  console.log("calling...")
  new Promise(function (resolve, reject) {
    var options = {
      host: stuff,
      path: '/'
    };
    http.request(options, function (/** @type {http.IncomingMessage} */response) {
      var str = '';

      //another chunk of data has been received, so append it to `str`
      response.on('data', function (chunk) {
        str += chunk;
      });

      //the whole response has been received, so we just print it out here
      response.on('end', function () {
        resolve(str);
        // console.log(str);
        // console.log("end")
      });

      response.on('error', function (err) {
        reject(err)
      })
    });


    //   function (error, response, body) {
    //   // in addition to parsing the value, deal with possible errors
    //   if (err) return reject(err);
    //   try {
    //     // JSON.parse() can throw an exception if not valid JSON
    //     resolve(JSON.parse(body).data.available_balance);
    //   } catch (e) {
    //     reject(e);
    //   }
    // });
  });
}


module.exports = {
  request: getStuff,
}