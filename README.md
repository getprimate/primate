# KongDash

> An elegant desktop client for [Kong](https://konghq.com/kong/) admin API

[![](screenshot.png)](https://raw.githubusercontent.com/ajaysreedhar/kongdash/master/screenshot.png)

### How to Install

#### On Linux
_Ubuntu and other Debian distributions:_

- Download the [latest](https://github.com/ajaysreedhar/kongdash/releases) .deb package. 
- Run `dpkg -i kongdash-x.y.z-arch.deb`


_Fedora and other Linux distributions:_

- Download the [latest](https://github.com/ajaysreedhar/kongdash/releases) .tar.gz archive.
- Extract the archive and run install.sh script.

```shell
tar -xvf kongdash-x.y.z-linux-arch.tar.gz
cd kongdash-x.y.z-linux-arch
./install.sh
```

_x.y.z refers to the version number and arch refers to the architecture (ia32 or x64)._

#### On Windows
Simply download the [latest](https://github.com/ajaysreedhar/kongdash/releases) .exe installer and run it.

#### On Mac OS X
Download and open the [latest](https://github.com/ajaysreedhar/kongdash/releases) .dmg image, move the app to /Applications to start using it.

### For Developers
All kinds of contributions are welcome.

- Requires NodeJs (v16.13.2 or higher) and yarn (v1.22.17 or higher).
- Built with [Electron](https://www.electronjs.org/).

Clone the repository
```shell
git clone https://github.com/ajaysreedhar/kongdash
```

Install dependencies
```shell
yarn install
```

Run the app
```shell
yarn start
```

Run ESLint
```yarn test``` or ```yarn run lint```

### Make a release

Linux 64-bit:
```shell
yarn run pack:linux64
```

Mac OS X (64-bit only):
```shell
yarn run pack:osx
```

Windows 64-bit:
```shell
yarn run pack:windows64
```

The packaged application will be moved to release/ directory.

### License
MIT License. See [LICENSE](LICENSE).
