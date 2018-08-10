const axios = require('axios');
const _ = require('lodash');
const fs = require('fs');

function check_candidates(state)
{
  console.log('check candidates');
  return new Promise((resolve,reject) => {
    if(state.candidates && state.candidates.length > 0){
      let requests = state.candidates.map(url => axios.get(url+'/management/state').catch(err=>{
          console.log('error getting candidate', err.name, err.message, node.url);
          return false;
      }));

      axios.all(requests).then(results =>{
        results.forEach(result => {
          const node = {id:result.data.id, name:result.data.name,
                      url:result.data.url, last_hash: result.data.last_hash,
                      neighbours: result.data.neighbours
                    };
            state.added.nodes.push(node);
            state.nodes.push(node);
            //refresh all links which existed but were pointing to yet absent node
            state.links.forEach(link => {
              if(link.from == node.id || link.to==node.id){
                state.added.links.push(link);
              }
            });
            //add links of this node to others
            node.neighbours.forEach(neighbour => {
              const link = {from:node.id, to:neighbour.id};
              state.added.links.push(link);
              if(state.links.findIndex(el => el.from == link.from && el.to == link.to) <0 ){
                  state.links.push(link);
              }
            });
        });

        state.candidates = [];

        resolve();
      })
      .catch(error=>{
        console.log('axios error when checking candidates',error.name, error.message);
        state.candidates = [];
        reject(error);
      });
    }
    else{
      resolve();
    }
  });
}
function check_states(state){
  console.log('check states');
  return new Promise((resolve,reject) => {
    //check all nodes and remove non-accessible
    fs.writeFile('state.json',JSON.stringify(state),'utf8',()=>{});
    if(state.nodes && state.nodes.length > 0){
      const requests = state.nodes.map(node => axios.get(node.url+'/management/state').catch(err=>{
          console.log('error getting state', err.name, err.message, node.url);
          return false;
      }));
      let fresh_nodes = [];
      let old_nodes = {};
      state.hashes = [];
      state.nodes.forEach(node => {old_nodes[node.id] = node});
      axios.all(requests)
      .then(results => {
        results.forEach(result => {
          if(result){
            //const node = result.data;
            const node = {id:result.data.id, name:result.data.name,
                          url:result.data.url, last_hash:result.data.last_hash,
                          neighbours: result.data.neighbours
                        };
            fresh_nodes.push(node);
            state.hashes.push({id:node.id, hash:node.last_hash});

            const removed_neighbours = _.differenceBy(old_nodes[node.id].neighbours, node.neighbours,'id');
            removed_neighbours.forEach(n => {
              state.removed.links.push({from:node.id, to:n.id});
	      const index_to_remove = state.links.findIndex(l => l.from == node.id && l.to == n.id);
	      if(index_to_remove >= 0){
		state.links.splice(index_to_remove,1);
	      }
            });
            const added_neighbours = _.differenceBy(node.neighbours, old_nodes[node.id].neighbours,'id');
            added_neighbours.forEach(n =>{
              state.added.links.push({from:node.id, to:n.id});
	      state.links.push({from:node.id, to:n.id});
            });
            delete old_nodes[node.id];
          }
        });
        state.removed.nodes = Object.keys(old_nodes);
        state.nodes = fresh_nodes;
        resolve();
      })
      .catch(error => {
        console.log('error getting nodes state ', error.name, error.message);
        reject(error);
      });
    }
    else{
      resolve();
    }
  });
}
module.exports = async function (state){
  await check_candidates(state);
  await check_states(state);
}
