# KongDash

> An elegant desktop client for [Kong](https://getkong.org/) admin API

[![](screenshot.png)](https://raw.githubusercontent.com/ajaysreedhar/kongdash/master/screenshot.png)

### How to Install

#### On Windows
Simply download the [latest](https://github.com/ajaysreedhar/kongdash/releases) .exe installer and run it.

#### On Linux
_Ubuntu and other debian distributions:_

- Download the [latest](https://github.com/ajaysreedhar/kongdash/releases) .deb package. 
- Run `dpkg -i kongdash-x.y.z-arch.deb`


_Fedora and other Linux distributions:_

- Download the [latest](https://github.com/ajaysreedhar/kongdash/releases) kongdash-x.y.z-linux-arch.tar.gz archive.
- Extract the archive and run install.sh script.

```shell
tar -xvf kongdash-x.y.z-linux-arch.tar.gz
cd kongdash-x.y.z-linux-arch
./install.sh
```

_x.y.z refers to the version number and arch refers to the architecture (ia32 or x64)._

### For Developers
All kinds of contributions are welcome.

- Requires nodejs (v4.4.7 or higher) and npm (v2.15.8 or higher).
- Built with [Electron](http://electron.atom.io/).

Clone the repository
```shell
git clone https://github.com/ajaysreedhar/kongdash
```

Install dependencies
```shell
npm install
```

Run the app
```shell
npm start
```

### Make a release

For Linux 32-bit:
```shell
npm run pack:linux32
```

For Linux 64-bit:
```shell
npm run pack:linux64
```

For Windows-32-bit:
```shell
npm run pack:windows32
```

For Windows 64-bit:
```shell
npm run pack:windows64
```

The packaaged application will be moved to releases/ directory.

### License
MIT License. See [LICENSE](LICENSE).
