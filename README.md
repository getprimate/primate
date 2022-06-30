<div align="center">
    <img src="logo-banner.png" alt="Primate Logo" height="128" />
    <p>Primate (formerly KongDash) is a modern desktop client for Kong Admin API</p>
    <p><a href="https://www.getprimate.xyz">getprimate.xyz</a></p>
    <p><img src="screenshot.png" alt="Primate Screenshot" /></p>
</div>

---

## Download and Install 
---
#### On Windows
Download the [latest](https://github.com/getprimate/primate/releases/latest) setup executable and run it.

#### On Mac OS X
Download and open the [latest](https://github.com/getprimate/primate/releases/latest) .dmg image, move the app to /Applications.

#### On Linux
Primate is available as AppImage for all major Linux distributions. 

- Download the [latest](https://github.com/getprimate/primate/releases/latest) .AppImage.
- Make it executable `$ sudo chmod a+x Primate-v<x.y.z>-x64.AppImage` where x.y.z determines the version number.
- Run Primate `$ ./Primate-v<x.y.z>-x64.AppImage`

_For Ubuntu users:_

Primate can also be installed from the [Snapcraft](https://snapcraft.io/primate)

## Contribute
---

There are several ways to support development:

- Provide feedbacks and suggest improvements
- Contribute to the development with pull requests


### For Developers

- Requires NodeJs (v16.13.2 or higher) and yarn (v1.22.17 or higher).
- Built with [Electron](https://www.electronjs.org/).

Clone the repository
```shell
$ git clone https://github.com/getprimate/primate
```

Install dependencies
```shell
$ yarn install
```

Run the app
```shell
$ yarn start
```

Run ESLint
```shell
$ yarn run lint
```

#### How to package

To package the application for your operating system, run: 

```shell
$ yarn run compile
$ yarn run dist
```

The binaries will be written to `/dist` directory.

_Currently, compiling to non-native binary is disabled._


### License
MIT License. See [LICENSE](LICENSE).
