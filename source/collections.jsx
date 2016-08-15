var {Label, PageHeader, Col} = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'

module.exports = React.createClass({
  getInitialState(){
    console.log('hey')
    return {collections: []}
  },
  fetch(dbName){
    dbName = dbName || this.props.params.dbName
    request({url: `${baseUrl}/api/dbs/${dbName}/collections`, json: true, withCredentials: false}, (error, response, body) =>{
      console.log(body);
      this.setState({collections: body.collections})
    })
  },
  componentDidMount() {
    this.fetch()
  },
  componentWillReceiveProps(nextProps){
    // console.log('coll', nextProps)
    if (this.props.params.dbName != nextProps.params.dbName) this.fetch(nextProps.params.dbName)
  },
  render() {
    // console.log(this.state, this.props.params);
    return <div>
      <Col md={3}>
      <PageHeader>Collections</PageHeader>{this.state.collections.filter((collection)=>{
        return collection.name != 'system.indexes'
      }).map((collection)=>{
        console.log(collection.name, collection.name == this.props.params.collectionName);
        return <p key={collection.name} >
          {/*<Link bsStyle='success' className="success btn" to={`/dbs/${this.props.params.dbName}/collections/${collection.name}`}>
            {(collection.name == this.props.params.collectionName)?<Label>{collection.name}</Label>:
            <Label>collection.name</Label>
            }
          </Link>*/}
          <a href={`#/dbs/${this.props.params.dbName}/collections/${collection.name}`}>
          {(collection.name == this.props.params.collectionName)?<Label>{collection.name}</Label>:
          collection.name
          }
          </a>
        </p>
    })}</Col>
      <Col md={6}>
        <div>{this.props.children}</div>
      </Col>
    </div>
  }
})
