var {Label, PageHeader, Col} = require('react-bootstrap')
let React = require('react')
let request = require('request')
const API_URL = require("./base-url").API_URL

module.exports = React.createClass({
  getInitialState(){
    return {databases: []}
  },
  fetch(){
    request({url: `${API_URL}/api/dbs`, json: true, withCredentials: false}, (error, response, body) =>{
      if (!body || !body.databases) {
        return console.error(new Error('No databases'))
      }
      console.log(body)      
      this.setState({databases: body.databases})
    })
  },
  componentDidMount() {
    this.fetch()
  },
  componentWillReceiveProps(nextProps){
    console.log('content')
    this.fetch()
  },
  render() {
    return <div>
      <Col md={2}>
        <PageHeader>Databases</PageHeader>
        {(this.state.databases.length==0)? <div>      Connecting to the database...<br/>
      If nothing happens, check that your database is running and accessible.<br/>
      For example, with the command "mongod" the database will run on localhost:27017.<br/>
      See more instructions at <a href="https://github.com/azat-co/mongoui" target="_blank">https://github.com/azat-co/mongoui</a></div>: ''}
        {this.state.databases.map((database)=>{
          return <p key={database.name}>
          {/*<Link to={`/dbs/${database.name}`}>{database.name}</Link>*/}
            <a href={`#/dbs/${database.name}`}>
              {(database.name == this.props.params.dbName)?<Label>{database.name}</Label>:
                database.name
              }
            </a>
          </p>
        })}
      </Col>
      <Col md={10}>
        <div>{this.props.children}</div>
      </Col>
    </div>
  }
})
