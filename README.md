<div align="center">
    <img src="logo-banner.png" alt="Primate Logo" height="128" />
    <p>Primate (formerly KongDash) is a desktop client for Kong Admin API</p>
    <p><a href="https://www.getprimate.xyz">getprimate.xyz</a></p>
    <p><img src="screenshot.png" alt="Primate Screenshot" /></p>
</div>

---

## Version Compatibility

| Primate Version | Kong Admin API Version |
|-----------------|------------------------|
| 1.0.0           | `2.6.x` `2.7.x`        |

## :package: Download and Install 

Builds are available for major desktop operating systems.

#### On Windows
Download the [latest](https://github.com/getprimate/primate/releases/latest) executable setup file and run it.

#### On Mac OS X
Download and open the [latest](https://github.com/getprimate/primate/releases/latest) .dmg image, move the app to /Applications.

#### On Linux
Primate is available as AppImage and tar.gz archive for all popular Linux distributions. 

- Download the [latest](https://github.com/getprimate/primate/releases/latest) .AppImage.
- Make it executable `$ sudo chmod a+x Primate-version-x64.AppImage`.
- Run Primate `$ ./Primate-version-x64.AppImage`.

_For Ubuntu users:_

Primate can also be installed from the [Snap store](https://snapcraft.io/primate).

```shell
$ sudo snap install primate
```

## :thumbsup: Contribute
There are several ways to support development:

- Provide feedbacks and suggest improvements.
- Contribute to the development with pull requests.

For a complete overview, see the [contributing](CONTRIBUTING.md) guide.


### For Developers
- Requires NodeJs (v16.13.2 or higher) and yarn (v1.22.17 or higher).
- Built with [Electron](https://www.electronjs.org/).

#### Build and Run

Clone the repository, install dependencies and start.
```shell
$ git clone https://github.com/getprimate/primate
$ cd primate
$ yarn install
$ yarn start
```

#### Package the Application

To package the application for your operating system, run: 

```shell
$ yarn run compile
$ yarn run dist
```

The binaries will be written to `/dist` directory.

Run `$ yarn run clean` to clean the output directories.

_Currently, compiling to non-native binary is disabled._

## :spiral_notepad: License
MIT License. See [LICENSE](LICENSE).

## :raised_hands: Supporters

<a href="https://www.gitbook.com" target="_blank">
    <img src="https://2775338190-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FNkEGS7hzeqa35sMXQZ4X%2Flogo%2FuSFZ1Ridsvf6xSX9vTQ1%2FLockup-PrimaryBlue%20-%20Spaced.svg?alt=media" height="64">
</a>

<a href="https://www.jetbrains.com/community/opensource/#support" target="_blank">
    <img src="https://resources.jetbrains.com/storage/products/company/brand/logos/jb_square.png" alt="JetBrains Black Box Logo logo." height="64">
</a>

