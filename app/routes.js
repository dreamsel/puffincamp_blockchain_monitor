const sha256 = require('sha256');
module.exports = function(app, state){


  app.get('/',function(req,res){
    res.sendFile('views/index.html', { root: __dirname+'/../' });
  });
    //read data
    app.get('/nodes_initial',function(req,res){
      res.send({
	       nodes:state.nodes,
	       links:state.links
	    });
    });
    app.get('/state',function(req,res){
        res.send(state);
    });
    app.get('/nodes_updates',function(req,res){
	const added = Object.assign({},state.added);
	const removed = Object.assign({},state.removed);
	const names = state.names.slice(0);
  const hashes = state.hashes.slice(0);
	state.added.nodes = [];
	state.added.links = [];
	state.removed.nodes = [];
	state.removed.links = [];
	//state.names = [];
  //state.hashes = [];
	res.send({
	    added:added,
	    removed:removed,
	    names:names,
      hashes:hashes,
	});
    });
    app.post('/add_node_by_url',function(req,res){
      state.candidates.push(req.body.node_url);
      res.send({success:true,message:'Node added successfully'})
    });
    /*
    app.get('/add_node',function(req,res){
	const id = req.query.id;
	const name = req.query.name
	state.nodes.push({id:id,name:name});
	state.added.nodes.push({id:id,name:name});
	res.send({success:true});
    });
    app.get('/add_link',function(req,res){
	const id1 = req.query.id1;
	const id2 = req.query.id2;
	state.links.push([id1,id2]);
	state.added.links.push([id1,id2]);
	res.send({success:true});
    });

    app.get('/remove_node',function(req,res){
	const id = req.query.id;
	//state.nodes.push(id);
	const index = state.nodes.findIndex(node=>node.id==id);

	if(index >= 0){
	state.nodes.splice(index,1);
	let has_links = true;
	while(has_links){
	    has_links = false;
	    for(let i = 0; i < state.links.length; i++){
		if(state.links[i][0] == id || state.links[i][1] == id){
		    state.removed.links.push(state.links[i]);
		    state.links.splice(i,1);
		    has_links = true;
		    break;
		}
	    }
	}
	state.removed.nodes.push(id);
	}
	res.send({success:true});
    });
    app.get('/remove_link',function(req,res){
	const id1 = req.query.id1;
	const id2 = req.query.id2;
	//state.links.push([id1,id2]);

	for(let i = 0; i < state.links.length; i++){
	    if(state.links[i][0] == id1 && state.links[i][1] == id2){
		state.links.splice(i,1);
		break;
	    }
	}
	state.removed.links.push([id1,id2]);
	res.send({success:true});
    });
    */
}
