var uuid = require('node-uuid'),
  q = require('q')

module.exports = {
  deps : ['mail','user','model','bus','rest'],
  models : require('./models'),
  listen : {},
  expand:function( module ){
    var root = this
    if( module.invite.limit && Object.keys(root.listen)==0){
      root.listen = {
        'user.register.before' : function checkInviteCode(params){
          var bus = this
          if( !params.icode ){
            return bus.error(406,'icode missing')
          }else{
            //Notice, we need to return a reject promise in fail to keep the chain failed.
            return root.verify(params.icode).fail(function(){
              return q.reject( bus.error(406,'icode not match').status )
            })
          }
        },
        'user.register.after' : function destroyInviteCode( params){
          var bus = this
          if( params.icode ){
            return root.destroy(params.icode)
          }else{
            console.log("not find icode in params",params)
          }
        }
      }
      root.dep.bus.expand(root)
    }
  },
  //api:
  generate : function( identity ){
    ZERO.mlog("invite", "generating code")
    return this.dep.model.models['icode'].create({code:uuid.v4(),verifying :false})
  },
  pop : function(){
    var root = this
    return q.Promise(function( resolve, reject){
        root.dep.model.models['icode'].find({limit:1,verifying:false}).then(function( codes){
          codes[0] ? root.dep.model.models['icode'].update({id:codes[0].id},{verifying:true}).then(function(){ resolve(codes[0])}).fail(reject) : reject()
        }).fail(reject)
    })
  },
  verify : function( code ){
    var root= this
    return q.Promise(function (resolve, reject) {
      root.dep.model.models['icode'].findOne({code:code}).then(function (codeObj) {
        codeObj ? resolve(codeObj) : reject()
      }).fail(reject)
    })
  },
  destroy : function( code ) {
    var root = this
    return q.Promise(function (resolve, reject) {
      root.dep.model.models['icode'].destroy({code: code}).then(function (codes) {
        console.log("destroing icode!!!!", codes[0] ? " resolve" : "reject")
        codes[0] ? resolve(codes[0]) : reject()
      }).fail(reject)
    })
  }
}