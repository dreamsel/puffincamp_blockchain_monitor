const BASE_URL = 'http://localhost:3000';
const INIT_URL = 'state';
const UPDATE_URL = 'nodes_updates';

let nodes = new vis.DataSet([]);

// create an array with edges
let edges = new vis.DataSet([]);

// create a network
let container = document.getElementById('network-container');

// provide the data in the vis format
let data = {
    nodes: nodes,
    edges: edges
};
let options = {edges:{arrows:"middle"}};

// initialize your network!
let network = new vis.Network(container, data, options);

$.get(`${BASE_URL}/${INIT_URL}`, response => {

   response.nodes.forEach(node=>{
	   $('#node_list tbody').append('<tr id="node_'+node.id+'"><td>'+node.name+'</td><td><b>'+node.url+'</b></td><td><span>'+((node.last_hash)?node.last_hash.substring(0,6):'')+'</span></td></tr>');
   });
   addNodes(response.nodes || []);
   addEdges(response.links || []);
});

setInterval(() => {
   $.get(`${BASE_URL}/${UPDATE_URL}`, processResponse);
}, 5000);

function processResponse(response) {

   if ( response && response.added) {
     response.added.nodes.forEach(node => {
       //TODO fill node with data from global nodes array
       $('#node_list tbody').append('<tr id="node_'+node.id+'"><td>'+node.name+'</td><td><b>'+node.url+'</b></td><td><span>'+(node.hash?node.hash.substring(0,6):'')+'</span></td></tr>');
      });
      addNodes(response.added.nodes || []);
      addEdges(response.added.links || []);

   }
   if (response && response.removed) {
      removeNodes(response.removed.nodes || []);
      removeEdges(response.removed.links || []);
      response.removed.nodes.forEach(node_id => {
        $('#node_'+node_id).remove();
      });
   }
   if (response && response.names) {
      let toUpdateNameNodes = _.map(response.names, _node => convertToNode(_node));
      nodes.update(toUpdateNameNodes);
   }

  if(response && response.hashes && response.hashes.length > 0){
	  let toUpdate = [];
	  response.hashes.forEach(node_hash=>{
	    const hash = node_hash.hash ? node_hash.hash.toString().substring(0,6):'000000';
		  const hash_element = $('#node_'+node_hash.id+' >td>span');
      if(hash_element.length > 0){
        hash_element.text(hash);
      }

		const textcolor = hash2textcolor(hash);
		const bgcolor = hash2bgcolor(hash);

		  toUpdate.push({id:node_hash.id, color:{background:'#'+bgcolor},font:{color:'#'+textcolor,bold:true}});
	  });
	  nodes.update(toUpdate);
  }
}

function addNodes(_nodes) {
   let toAddNodes = _.differenceBy(_.map(_nodes, convertToNode), _.values(nodes._data), 'id');
   _.forEach(toAddNodes, node => nodes.add(node));
}

function addEdges(links) {
   let toAddEdges = _.differenceWith(getPreparedEdges(links), _.values(edges._data), isEqualEdges);
   _.forEach(toAddEdges, edge => edges.add(edge));
}

function removeNodes(_nodesIds) {
   let toRemoveNodes = _.intersectionWith(_.values(nodes._data), _nodesIds, (node1, id) => node1.id == id);
   _.forEach(toRemoveNodes, node => nodes.remove(node));
}

function removeEdges(links) {
   let toRemoveEdges = _.intersectionWith(_.values(edges._data), getPreparedEdges(links), isEqualEdges);
   _.forEach(toRemoveEdges, edge => edges.remove(edge));
}

function getPreparedEdges(links) {
   return _.unionWith(_.map(links, convertToEdge), isEqualEdges);
}

function isEqualEdges(edge1, edge2) {
   return edge1 && edge2
      && (edge1.from == edge2.from && edge1.to == edge2.to
         //|| edge1.from == edge2.to && edge1.to == edge2.from
       );
}

function hash2bgcolor(hash){
    return hash?hash.toString().substring(0,6) :'a0a0fa';
}
function hash2textcolor(hash){
	//const text_color = (parseInt('0xffffff',16) - parseInt('0x'+hash,16)).toString(16);
	const red = parseInt('0x'+ hash.substring(0,2),16);
	const green = parseInt('0x'+ hash.substring(2,4),16);
	const blue = parseInt('0x'+ hash.substring(4,6),16);
	const gray = (0.2125 * red) + (0.7154 * green) + (0.0721 * blue);
	return  gray>128?'000000':'ffffff';
}
function convertToNode(source) {
	const hash = source.last_hash? source.last_hash.toString().substring(0,6) :'a0a0fa';

	const foreground_color = hash2textcolor(hash);
	const background = hash2bgcolor(hash);

   return { id : source.id, label: source.name, color:{background:'#'+background}, font:{color:'#'+foreground_color, bold:true} };
}

function convertToEdge(source) {
   return { from: source.from, to: source.to };
}

// adding new node request
$('#add_btn').click(function(){
  console.log(`${BASE_URL}/add_node_by_url`);
  $.post(`${BASE_URL}/add_node_by_url`,{node_url:$('#url').val()}, response => {
    console.log(response);
    if(response.success){
      $('#url').val('');
    }
    $('#message').text(response.message);
    setTimeout(()=>{$('#message').text('')},3000);
  });
});
