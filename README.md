# create-nts-app

Create Node TypeScript (nts) apps with no build configuration.

Inspired by the simplicity of [Create React App](https://create-react-app.dev/) 👏

## Getting started

```
npx create-nts-app my-node-app
cd my-node-app
npm start
```

## Templates

By default create-nts-app generates the simplest TypeScript app possible. However, you can jump start your next project with various templates; just provide the `--template` argument.

### Supported templates

Any published npm package that is prefixed with `nts-template-*` _should_ work. Just pass it into the `--template` argument without the prefix.

```
// Drop the package's "nts-template-" prefix
npx create-nts-app my-express-app --template express
```

Here are some we've specifically setup:

- [default](https://www.npmjs.com/package/nts-template)
- [Search npm for more](https://www.npmjs.com/search?q=nts-template)

Coming soon:

- npm
- express
- tsoa
- graphql

### Other sources

You can also pull in locally stored templates or templates directly from a git URL. For a locally stored template prefix your `--template` argument with `file:`. To pull a template from a git URL, just pass in it in.

```
// Local template
npx create-nts-app my-app --template file:../nts-template

// Git template
npx create-nts-app my-app --template https://github.com/djdmbrwsk/nts-template.git
```
