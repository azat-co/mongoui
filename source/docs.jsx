var {Navbar, NavItem, NavDropdown, Nav, MenuItem, PageHeader, Glyphicon, Badge, Button} = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'
let {Link} = require('react-router')
let Document = require('./document.jsx')
let Query = require('./query.jsx')


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
      qs: query,
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
    this.fetch(null, null, query)

    // let dbName =  this.props.params.dbName
    // let collectionName =this.props.params.collectionName
    // this.context.router.replace({
    //   pathname: `/dbs/${dbName}/collections/${collectionName}`,
    //   query: query,
    //   docs: this.state.docs
    // })
    // this.fetch(query)
  },
  render() {
    // console.log(this.state, this.props.params)
    return <div>
      <PageHeader>Docs </PageHeader>

      <Query applyQuery={this.applyQuery} {...this.props}/>
      <span>[{this.props.params.collectionName}]</span>

        {this.state.docs.map((doc)=>{
          return <Document document={doc} key={doc._id}/>
        })}
        <div>{this.props.children}</div>
    </div>
  }
})

module.exports = Docs
