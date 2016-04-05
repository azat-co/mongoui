let React = require('react')
module.exports = React.createClass({
  render: ()=> {
    return <ul class="dropdown-menu" role="menu">                  <li><a href="#">Action</a></li>
                      <li><a href="#">Another action</a></li>
                      <li><a href="#">Something else here</a></li>
                      <li className="divider"></li>
                      <li><a href="#">Separated link</a></li>
                      <li className="divider"></li>
                      <li><a href="#">One more separated link</a></li>
</ul>
  }
})
//
// <ul class="nav">
//   <li class="active"><a href="/">Host: {{dbHostName}}</a></li>
//   <li class="dropdown">
//     <a href="#" class="dropdown-toggle" data-toggle="dropdown">Databases: {dbName}&nbsp;<b class="caret"></b>
//     </a>
//     <ul class="dropdown-menu" name="dbs" >
//       {#each dbs.databases}
//         <li><a href="/host/localhost/dbs/{name}" data-value="{name}"> {name} — {sizeOnDisk}</a></li>
//       {/each}
//     </ul>
//   </li>
//
//   <li class="dropdown">
//     <a href="#" class="dropdown-toggle" data-toggle="dropdown">Collections: {collectionName}&nbsp;<b class="caret"></b>
//     </a>
//     <ul class="dropdown-menu" name="dbs">
//       {#each collections}
//         <li ><a href="/host/localhost/dbs/{dbName}/collections/{.name}" data-value="{{.name}}"> {.name}</a></li>
//       {/each}
//     </ul>
//   </li>
//
// </ul>
