# Librextjs

Librextjs is open source javascript framework.

This is a fork of Extjs 4.2.1 built using `node.js`, `compass`, and `jsduck`.

## Build

### Requirements

List of softwares used to build librextjs,

- `ruby` version 2.1.2
- `compass` version 0.12.6
- `grunt-cli` version 0.1.13
- `grunt` version 0.4.5
- `jsduck` version 5.3.4

Greater version maybe work.

### Compiling

- Install `compass` using `gem`

        $ gem install compass

- Change your directory to clone of this repository
- Install `npm` modules dependencies to generate source files,

        $ npm install

- Execute `grunt` to generate single javascript files,

        $ grunt

- To generate documentation, install `jsduck` using `gem`.

        $ gem install jsduck
        $ jsduck

**Note:**
- Documentation currently can be viewed using web server only.
- If you already installed `sass` before, uninstalled it, and reinstalled
`compass` again, because the `sass` version that only work is the `sass` from
`compass` dependencies.

## TODO

- [x] Built css
- [ ] Include guide in docs
- [ ] Include example in docs
