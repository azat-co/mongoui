var { Navbar, NavItem, Nav } = require('react-bootstrap')
let React = require('react')
const navbarInstance = ()=>{
  return <Navbar inverse>
    <Navbar.Header>
      <Navbar.Brand >
        <a className="brand" href="/" style={{paddingTop: 6.5, marginLeft: -73}}>
          <img src="img/mongoui-linux.png" alt-text="mongoui" style={{width: 50, display: 'inline'}}/>
          mongoui&nbsp;
          <b className="badge badge-success">beta</b>
        </a>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      {/*<Nav>
        <NavItem eventKey={1} href="#">Link</NavItem>
        <NavItem eventKey={2} href="#">Link</NavItem>
        <NavDropdown eventKey={3} title="Dropdown" id="basic-nav-dropdown">
          <MenuItem eventKey={3.1}>Action</MenuItem>
          <MenuItem eventKey={3.2}>Another action</MenuItem>
          <MenuItem eventKey={3.3}>Something else here</MenuItem>
          <MenuItem divider />
          <MenuItem eventKey={3.3}>Sseparated link</MenuItem>
        </NavDropdown>
      </Nav>*/}
      <Nav pullRight>
        <NavItem eventKey={1} href="https://github.com/azat-co/mongoui">GitHub</NavItem>
        <NavItem eventKey={2} href="http://twitter.com/azat_co">Twitter</NavItem>
      </Nav>
    </Navbar.Collapse>
  </Navbar>
}
module.exports = navbarInstance
