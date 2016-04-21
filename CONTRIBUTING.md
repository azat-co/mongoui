## Contributing

Pull requests are always welcome as long as an accompanying test case is
associated.

This project is configured to use [git
flow](https://github.com/nvie/gitflow/) and the following conventions
are used:

* ``develop`` - represents current active development and can possibly be
  unstable.

* ``master`` - pristine copy of repository, represents the currently
  stable release found in the npm index.

* ``feature/**`` - represents a new feature being worked on

If you wish to contribute, the only requirement is to:

- branch a new feature branch from develop (if you're working on an
  issue, prefix it with the issue number)
- make the changes, with accompanying test cases
- issue a pull request against develop branch

Although I use git flow and prefix feature branches with "feature/" I
don't require this for pull requests... all I care is that the feature
branch name makes sense.

Pulls requests against master or pull requests branched from master will
be rejected.


#### Examples

Examples of good branch names:

* 12-amd-support
* feature/12-amd-support


## Branches

* Master — major releases, main branch
* Develop — current development branch (make your pull requests here)
