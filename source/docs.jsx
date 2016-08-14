var { PageHeader } = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'
let Doc = require('./doc.jsx')
let Query = require('./query.jsx')
let AddDoc = require('./add-doc.jsx')

require('../public/css/docs.css')

let Docs = React.createClass({
  getInitialState(){
    console.log('hey')
    return {docs: [], query: {}}
  },
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  fetch(dbName, collectionName, query) {
    dbName = dbName || this.props.params.dbName
    collectionName = collectionName || this.props.params.collectionName
    query = query || this.props.location.query || {}
    request({url: `${baseUrl}/api/dbs/${dbName}/collections/${collectionName}`,
      json: true,
      qs: {query: JSON.stringify(query)},
      withCredentials: false},
      (error, response, body) =>{
        console.log(body)
        this.props.location.query = query
        this.setState({docs: body.docs, query: query})
    })
  },
  componentDidMount() {
    this.fetch()
  },
  componentWillReceiveProps(nextProps){
    if (this.props.params.dbName != nextProps.params.dbName ||
      this.props.params.collectionName != nextProps.params.collectionName) this.fetch(nextProps.params.dbName, nextProps.params.collectionName)
  },
  applyQuery(query){
    console.log(query);
    this.setState({query: query}, ()=>{
      this.fetch(null, null, query)
    })
  },
  addDoc(doc, ops, callback){
    request({
      method: 'POST',
      url: `${baseUrl}/api/dbs/${this.props.params.dbName}/collections/${this.props.params.collectionName}/`,
      json: doc,
      withCredentials: false},
      (error, response, body) =>{
        console.log(body)
        if (body.insertedCount >= 1) {
          if (ops && ops.show)
            this.setState({query: {_id: {'$in': body.insertedIds}}}, ()=>{
              this.applyQuery(this.state.query)
            })

          // let docs = this.state.docs
          // docs[index] = doc
          // this.setState({docs: docs})
          // apply query or not?
          return callback('Document%s added', (body.insertedCount==1)? '': 's')
        }
        callback('Error adding')
    })
  },
  applyEditDoc(doc, index, callback){
    request({
      method: 'PATCH',
      url: `${baseUrl}/api/dbs/${this.props.params.dbName}/collections/${this.props.params.collectionName}/${doc._id}`,
      json: doc,
      withCredentials: false},
      (error, response, body) =>{
        // console.log(body)
        if (body.ok = 1) {
          let docs = this.state.docs
          docs[index] = doc
          this.setState({docs: docs})
          // apply query or not?
          return callback('Document updated')
        }
        callback('Error updating')
    })
  },
  deleteDoc(doc, index, callback){
     console.log("got to deleteDoc within docs.jsx")
     request({
       method: 'DELETE',
       url: `${baseUrl}/api/dbs/${this.props.params.dbName}/collections/${this.props.params.collectionName}/${doc._id}`,
       json: doc,
       withCredentials: false},
       (error, response, body) =>{
         if  (body.ok === 1){ //(body.ok = 1)
           let docs = this.state.docs;
           docs.splice(index, 1);
           this.setState({docs: docs});
           return callback('Document Deleted');
         }
         callback('Error Deleting updating')
     })
   },
  render() {
    return <div>
      <PageHeader>Docs: <small>{this.props.params.collectionName}</small>
        <span className="docs-btns">
          <AddDoc {...this.props} addDoc={this.addDoc}/><Query applyQuery={this.applyQuery} {...this.props} query={this.state.query}/>
        </span>
      </PageHeader>
      {/*<span>[{this.props.params.collectionName}]</span>*/}

      {this.state.docs.map((doc, index)=>{
        return <Doc doc={doc} key={doc._id} index={index} applyEditDoc={this.applyEditDoc} deleteDoc={this.deleteDoc}/>
      })}
      <div>{this.props.children}</div>
    </div>
  }
})

module.exports = Docs
