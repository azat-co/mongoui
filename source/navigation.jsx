var {Navbar, NavItem, NavDropdown, Nav, MenuItem} = require('react-bootstrap')
let React = require('react')
const navbarInstance = (
  <Navbar inverse>
    <Navbar.Header>
      <Navbar.Brand>
        <a class="brand" href="/">mongoui <b class="badge badge-success">b1eta</b></a>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <NavItem eventKey={1} href="#">Link</NavItem>
        <NavItem eventKey={2} href="#">Link</NavItem>
        <NavDropdown eventKey={3} title="Dropdown" id="basic-nav-dropdown">
          <MenuItem eventKey={3.1}>Action</MenuItem>
          <MenuItem eventKey={3.2}>Another action</MenuItem>
          <MenuItem eventKey={3.3}>Something else here</MenuItem>
          <MenuItem divider />
          <MenuItem eventKey={3.3}>Separated link</MenuItem>
        </NavDropdown>
      </Nav>
      <Nav pullRight>
        <NavItem eventKey={1} href="https://github.com/azat-co/mongoui">GitHub</NavItem>
        <NavItem eventKey={2} href="http://twitter.com/azat_co">Twitter</NavItem>
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);

module.exports = navbarInstance
