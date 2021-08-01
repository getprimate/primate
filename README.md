# KongDash

> An elegant desktop client for [Kong](https://konghq.com/kong/) admin API

[![](screenshot.png)](https://raw.githubusercontent.com/ajaysreedhar/KongDash/master/screenshot.png)

### How to Install

#### On Linux
_Ubuntu and other Debian distributions:_

- Download the [latest](https://github.com/ajaysreedhar/KongDash/releases) .deb package. 
- Run `dpkg -i kongdash-x.y.z-arch.deb`


_Fedora and other Linux distributions:_

- Download the [latest](https://github.com/ajaysreedhar/KongDash/releases) .tar.gz archive.
- Extract the archive and run install.sh script.

```shell
tar -xvf kongdash-x.y.z-linux-arch.tar.gz
cd kongdash-x.y.z-linux-arch
./install.sh
```

_x.y.z refers to the version number and arch refers to the architecture (ia32 or x64)._

#### On Windows
Simply download the [latest](https://github.com/ajaysreedhar/KongDash/releases) .exe installer and run it.

#### On Mac OS X
Download and open the [latest](https://github.com/ajaysreedhar/KongDash/releases) .dmg image, move the app to /Applications to start using it.

### For Developers
All kinds of contributions are welcome.

- Requires NodeJs (v4.4.7 or higher) and npm (v2.15.8 or higher).
- Built with [Electron](https://www.electronjs.org/).

Clone the repository
```shell
git clone https://github.com/ajaysreedhar/KongDash
```

Install dependencies
```shell
npm install
```

Run the app
```shell
npm start
```

Run ESLint
```npm test``` or ```npm run lint```

### Make a release

Linux 32-bit:
```shell
npm run pack:linux32
```

Linux 64-bit:
```shell
npm run pack:linux64
```

Mac OS X (64-bit only):
```shell
npm run pack:osx
```

Windows 32-bit:
```shell
npm run pack:windows32
```

Windows 64-bit:
```shell
npm run pack:windows64
```

The packaged application will be moved to release/ directory.

### License
MIT License. See [LICENSE](LICENSE).
