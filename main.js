var app = require('derby').createApp(module);


app.ready(function(model) {

  // model.on('set', '*', function(path, object) {
      // console.log('!***', path, object)
  // });
  model.on('set','dbName',function(path,object){
    // console.log(object)
    // console.log(app);
    // app.emit('changeDatabase')
    // app.page.render();
    // app.page.render('main',{dbName:'object'});
  });

  model.on('set','collections',function(path,object){
    console.log('!',model.get('collections'));
    app.page.render();
  });

  app.changeDatabase = function(e, element, next) {
    app.model.set('dbName', element.value);
    // element.select();
    console.log(app.model.get('dbName'));
    next();
  };

});

// app.get('/main', function(page, model,params,next) {
//   model.subscribe('dbs', function() {
//     model.subscribe('collections', function() {
//       model.subscribe('dbName', function(e, dbName) {
//         // page.render({dbName:'test'});
//         page.render();
//         // return next();
//       });
//     });
//   });
// });
