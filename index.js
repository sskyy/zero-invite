var uuid = require('node-uuid'),
  Promise = require('bluebird')

module.exports = {
  models : require('./models'),
  listen : {},
  expand:function( module ){
    var root = this
    if( module.invite.limit && Object.keys(root.listen)==0){
      root.listen = {
        'user.register.before' : function checkInviteCode(params){
          var bus = this
          if( !params.inviteCode ){
            return bus.error(406,'icode missing')
          }else{
            //Notice, we need to return a reject promise in fail to keep the chain failed.
            return root.verify(params.inviteCode,params.inviteIdentity).catch(function(){
              return Promise.reject( bus.error(406,'icode not match').status )
            })
          }
        },
        'user.register.after' : function destroyInviteCode( params){
          var bus = this
          ZERO.mlog("invite","user register succes", params)
          if( params.inviteCode ){
            return root.destroy(params.inviteCode)
          }else{
            console.log("not find icode in params",params)
          }
        }
      }
      root.dep.bus.expand(root)
    }
  },
  //api:
  generate : function(){
    ZERO.mlog("invite", "generating code for")
    return this.dep.model.models['icode'].create({code:uuid.v4(),verifying :false})
  },
  pop : function( identity ){
    var root = this
    return  new Promise(function( resolve, reject){
        root.dep.model.models['icode'].find({limit:1,verifying:false}).then(function( codes){
          codes[0] ? root.dep.model.models['icode'].update({id:codes[0].id},{verifying:true,identity:identity}).then(function(){ resolve(codes[0])}).catch(reject) : reject()
        }).catch(reject)
    })
  },
  verify : function( code, identity ){
    var root= this
    return new Promise(function (resolve, reject) {
      root.dep.model.models['icode'].findOne({code:code,identity:identity}).then(function (codeObj) {
        console.log( "verifing", code, identity, codeObj )

        codeObj ? resolve(codeObj) : reject()
      }).catch(reject)
    })
  },
  destroy : function( code ) {
    var root = this
    return new Promise(function (resolve, reject) {
      root.dep.model.models['icode'].destroy({code: code}).then(function (codes) {
        codes[0] ? resolve(codes[0]) : reject()
      }).catch(reject)
    })
  }
}